//
// Enigmize メインプログラム
//

// emailはpage.erbで設定している

// Webpackでまとめるnodeライブラリ
$ = require('jquery')
forge = require('node-forge') // 全部入り暗号化ライブラリ
JSZip = require('jszip')

var privateKeyPem = '';
var publicKeyPem = '';

function timestamp(){
    var dt = new Date();
    return dt.getFullYear() +
        ("00" + (dt.getMonth()+1)).slice(-2) +
        ("00" + dt.getDate()).slice(-2) +
        ("00" + (dt.getHours())).slice(-2) +
        ("00" + (dt.getMinutes())).slice(-2) +
        ("00" + (dt.getSeconds())).slice(-2);
}

function saveAs(data,filename,type){ // ダイアログを開いてデータをローカルファイルにセーブ
    let blob = new Blob([ data ], { type: type });
    let url = URL.createObjectURL(blob);
    const a = $('<a>')
    a.attr('href',url)
    a.attr('download',filename)
    a[0].click(); // jQueryの場合こういう処理が必要
}

//
// 鍵生成ボタンを押したときの処理
//
$('#generatekeys').on('click',function(e){
 
    // 公開鍵/秘密鍵ペア生成
    // (時間がかかるが生成されるまで待つ)
    var pki = forge.pki;
    var keypair = pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
    privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
    publicKeyPem = pki.publicKeyToPem(keypair.publicKey);

    // 公開鍵を表示
    $('#publickey').text(publicKeyPem);

    // 公開鍵をアップロード (サーバのMongoDBに格納)
    const data = new FormData();
    data.set('key', encodeURIComponent(publicKeyPem))
    const param = {
        method: 'POST',
        body: data
    }
    fetch("/__save_public_key", param)
    
    //
    // 秘密鍵をユーザにダウンロードさせる
    //
    saveAs(privateKeyPem, `${email}.${timestamp()}.secretkey`, "text/plain");
})

function readBinaryFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => { resolve(reader.result); };
        reader.onerror = () => { reject(reader.error); };
        reader.readAsBinaryString(file);
    });
}

async function encodeFile(file){
    //
    // Drag&Dropされたファイルを公開鍵で暗号化してユーザにダウンロードさせる
    //
    
    let data = await readBinaryFile(file)
    
    // 公開鍵PEMファイルから公開鍵オブジェクトを生成
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)

    // ランダム文字列を作ってRSA暗号化
    const pw = forge.random.getBytesSync(32);
    const iv = forge.random.getBytesSync(16);
    const encPw = publicKey.encrypt(pw, "RSA-OAEP", {
	md: forge.md.sha256.create()
    });
    
    // AES暗号化
    // https://ja.wikipedia.org/wiki/暗号利用モード
    //   CBCとは何か、などの説明あり
    //
    // let data = event.target.result // ファイル内容
    const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
    aes.update(forge.util.createBuffer(forge.util.encode64(data)))
    aes.finish();
    
    let enigma_data= aes.output.data;
    
    // AESで暗号化されたデータ(enigma_data)と関連情報をZipにまとめてダウンロードさせる
    // 関連情報はJSONにする (enigma.json)
    // JsonにはIVとか暗号化の方式とかを格納
    //   IVはAES-CBCで使われるものだが、AES以外だとまた別の情報が必要だと思う
    //   いろんな暗号化に対応できるようにするために情報をJSONに書いておく
    //   暗号化/復号の方法のドキュメントを含めておいてもいいかも
    let ts = timestamp()
    let enigma_json = {}
    enigma_json.name = file.name
    enigma_json.pw = forge.util.encode64(encPw) // AESパスワード
    enigma_json.iv = forge.util.encode64(iv)    // Initial Vector
    enigma_json.info = "RSA+AESで暗号化したもの"
    enigma_json.timestamp = ts // 暗号化した日時を記録しておく
    enigma_json.publickey = publicKeyPem // 公開鍵も記録
    
    let zip = new JSZip();
    zip.file("enigma.data", forge.util.encode64(enigma_data)) // 文字列にしておかないとうまくいかない?
    zip.file("enigma.json", JSON.stringify(enigma_json))
    //let sendmail = confirm(`暗号化したデータを${email}に送りますか? \n送らない場合はローカルにセーブします。`)
    let sendmail = prompt(`暗号化したデータを${email}に送りますか? \n送らない場合はローカルにセーブします。\n\nメッセージ:`)
    if(sendmail != null){
	zip.generateAsync({type:"binarystring"}).then(function(content) {
	    // メールを送る
	    const data = new FormData();
	    data.set('body', forge.util.encode64(content))
	    data.set('filename',`${file.name}.${ts}.enigma`)
	    data.set('message',sendmail)
	    const param = {
		method: 'POST',
		body: data
	    }
	    fetch("/__send_mail", param)
	})
    }
    else {
	zip.generateAsync({type:"blob"}).then(function(content) {
	    // データをローカルにセーブ
	    saveAs(content, `${file.name}.${ts}.enigma`, "application/octet-stream")
	})
    }
}
    
async function decodeFile(file){
    //
    // DDされたファイルを秘密鍵で復号してダウンロードさせる
    //
    alert(`${file.name}を復号する秘密鍵を指定してください`)

    let zipdata = await readBinaryFile(file)

    let jszip = new JSZip
    jszip.loadAsync(zipdata)
	.then(function(zip) {
	    jszip.file("enigma.json").async("string").then(function (data) {
		var json = JSON.parse(data)
		var pw = forge.util.decode64(json.pw)
		var iv = forge.util.decode64(json.iv)
		
		var reader = new FileReader();
		reader.onload = function(event) {
		    privateKeyPem = event.target.result;
		    pw = forge.util.decode64(json.pw)
		    
		    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
		    let success = true
		    let decPw = ''
		    try {
			decPw = privateKey.decrypt(pw, "RSA-OAEP", {
			    md: forge.md.sha256.create()
			})
		    }
		    catch(e){
			alert("復号できません")
			success = false
		    }
		    if(success){
			jszip.file("enigma.data").async("binarystring").then(function (dat) {
			    // エラー処理が必要 ★
			    const aes = forge.aes.startDecrypting(decPw, iv, null, "CBC");
			    aes.update(forge.util.createBuffer(forge.util.decode64(dat)))
			    aes.finish();
			    var data = forge.util.decode64(aes.output.data)
			    
			    // 復号したバイナリデータをファイルにセーブするための工夫
			    // dataをsaveすると0x80以上のバイトが2バイトになってしまうのでUint8Arrayに変換
			    // なんでこんなのが必要なのか全く不明
			    var int8 = Uint8Array.from(data.split('').map((v) => v.charCodeAt(0)))
			    
			    let origname = file.name.replace(/\.\d{14}\.enigma$/,'') // タイムスタンプ.enigma を除去
			    saveAs(int8, origname, "application/octet-stream")
			})
		    }
		}
		// 秘密鍵ファイルをユーザに指定させる
		var input = $('<input>')
		input.attr('type','file')
		input.attr('accept','.secretkey, text/plain')
		input.on('change',function(event){
		    reader.readAsBinaryString(event.target.files[0]);
		})
		input[0].click()
	    })
	})
}

function handleDDFile(file){
    if(file.name.match(/\.enigma$/)){ // 暗号化されたファイルがDrag&Dropされたとき
	// DDされたファイルを秘密鍵で復号してダウンロードさせる
	decodeFile(file)
    }
    else { // 暗号化したいファイルがDrag&Dropされたとき
	// DDされたファイルを公開鍵で暗号化してダウンロードさせる
	encodeFile(file)
    }
}

$(function(){
    // 公開鍵をDBから取得
    fetch(`/${email}.ink`).then((res) => {
	return res.text()
    }).then((data) => {
	if(!data || data == ''){
	    publicKeyPem = ''
	    $('#publickey').text("(公開鍵が設定されていません - 下の鍵生成ボタンで生成できます)")
	}
	else {
	    publicKeyPem = data
	    $('#publickey').text(publicKeyPem)
	}
    })

    // Drag&Dropされたファイルの処理
    $('body').bind("dragover", function(e){
	return false;
    }).bind("dragend", function(e){
	return false;
    }).bind("drop", function(e){
	e.preventDefault();  //  デフォルトは「ファイルを開く」
	files = e.originalEvent.dataTransfer.files;
	handleDDFile(files[0]);
    })
})

// 16進ダンプ
// console.log(publicKeyPem.split('').map(function(b){ return ("0" + b.charCodeAt(0).toString(16)).slice(-2) }).join(''))
	    
