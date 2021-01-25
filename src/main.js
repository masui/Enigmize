// Webpackでまとめる

//
// npmのライブラリ
//
$ = require('jquery')
forge = require('node-forge')
JSZip = require('jszip')

//
// ローカルのライブラリ
//
// require('./enigmize.js')

var privateKeyPem = '';
var publicKeyPem = '';

function saveAs(data,filename,type){
    var blob = new Blob([ data ], { type: type });
    var url = URL.createObjectURL(blob);
    const a = $('<a>')
    a.attr('href',url)
    a.attr('download',filename)
    a.css('display','none')
    $('body').append(a)
    a[0].click(); // jQueryの場合こういう処理が必要
    $('body').remove(a)
}

//
// 鍵生成ボタンを押したとき
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

    // 公開鍵をMongoDBに格納
    $.ajax({
        type: "POST",
        async: true,
        url: "/__save_public_key",
        data: "key=" + encodeURIComponent(publicKeyPem) // これが重要: 「+」が「%2B」になる
    });

    //
    // 秘密鍵のPEMをユーザにダウンロードさせる
    //
    saveAs(privateKeyPem, `${email}.secretkey`, "text/plain");
    /*
    var blob = new Blob([ privateKeyPem ], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    const a = $('<a>')
    a.attr('href',url)
    a.attr('download',`${email}.secretkey`)
    a.css('display','none')
    $('body').append(a)
    a[0].click(); // jQueryの場合こういう処理が必要
    $('body').remove(a)
    */
})

async function getZipData(file){
    const zip = await JSZip.loadAsync(file); // ZIP の読み込み
    const text = await zip.files['enigma.json'].async('text'); // テキストファイルの読み込み
    alert(text)
}

function handleDDFile(file){
    if(file.name.match(/\.enigma$/)){ // 暗号化されたファイルがDrag&Dropされたとき
	alert(`${file.name}を復号する秘密鍵を指定してください`)
	fileReader = new FileReader();
	fileReader.onload = function(event){
	    let zipdata = event.target.result // ファイル内容 (zipデータ)
	    var jszip = new JSZip

	    jszip.loadAsync(zipdata)
		.then(function(zip) {
		    // you now have every files contained in the loaded zip
		    jszip.file("enigma.json").async("string").then(function (data) {
			var json = JSON.parse(data)
			var pw = forge.util.decode64(json.pw)
			var iv = forge.util.decode64(json.iv)

			var reader = new FileReader();
			reader.onload = function(event) {
			    privateKeyPem = event.target.result;
			    //alert(privateKeyPem);
			    pw = forge.util.decode64(json.pw)

			    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
			    const decPw = privateKey.decrypt(pw, "RSA-OAEP", {
				md: forge.md.sha256.create()
			    });
			    //xxx jszip.file("enigma.data").async("base64").then(function (dat) {
			    jszip.file("enigma.data").async("text").then(function (dat) {
				//alert(dat)
				const aes = forge.aes.startDecrypting(decPw, iv, null, "CBC");
				aes.update(forge.util.createBuffer(forge.util.decode64(dat)))
				aes.finish();
				//alert(aes.output.data)
				alert(forge.util.decode64(aes.output.data))
			    })
			}
			$('<input type="file" accept=".secretkey, text/plain">').on('change', function(event) {
			    reader.readAsText(event.target.files[0]);
			})[0].click();
		    })
		})
	}
	fileReader.readAsBinaryString(file)
    }
    else { // 暗号化したいファイルがDrag&Dropされたとき
	fileReader = new FileReader();
	fileReader.onload = function(event){
	    //
	    // DDされたファイルを公開鍵で暗号化してダウンロードさせる
	    //

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
	    let data = event.target.result // ファイル内容
	    const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
	    //aes.update(forge.util.createBuffer(forge.util.decode64(data)));
	    //aes.update(forge.util.createBuffer(data))
	    aes.update(forge.util.createBuffer(forge.util.encode64(data)))
	    aes.finish();

	    var enigma_data= aes.output.data;

	    // AESで暗号化されたデータ(enigma_data)と関連情報をZipにまとめてダウンロードさせる
	    // 関連情報はJSONにする (enigma.json)
	    // JsonにはIVとか暗号化の方式とかを格納
	    //   IVはAES-CBCで使われるものだが、AES以外だとまた別の情報が必要だと思う
	    //   いろんな暗号化に対応できるようにするために情報をJSONに書いておく
	    //   暗号化/復号の方法のドキュメントを含めておいてもいいかも
	    let enigma_json = {}
	    enigma_json.name = file.name
	    enigma_json.pw = forge.util.encode64(encPw) // AESパスワード
	    enigma_json.iv = forge.util.encode64(iv)    // Initial Vector
	    enigma_json.info = "RSA+AESで暗号化したもの"

	    var zip = new JSZip();
	    //xxx zip.file("enigma.data", enigma_data)
	    zip.file("enigma.data", forge.util.encode64(enigma_data))
	    zip.file("enigma.json", JSON.stringify(enigma_json))
	    zip.generateAsync({type:"blob"}).then(function(content) {
		saveAs(content, `${file.name}.enigma`, "application/octet-stream")
		/*
		var blob = new Blob([ content ], { type: "application/octet-stream" });
		var url = URL.createObjectURL(blob);
		const a = $('<a>')
		a.attr('href',url)
		a.attr('download',`${file.name}.enigma`)
		a.css('display','none')
		$('body').append(a)
		a[0].click();
		$('body').remove(a)
		*/
	    });
	}
	fileReader.readAsBinaryString(file)
    }
}

$(function(){
    // 公開鍵をDBから取得
    // getPEM(email)

    fetch(`/${email}.ink`).then((res) => {
	return res.text()
    }).then((data) => {
	if(!data || data == ''){
	    publicKeyPem = ''
	    $('#publickey').text("(公開鍵が設定されていません)")
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
	    
