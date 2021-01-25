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
require('./enigmize.js')

var privateKeyPem = '';
var publicKeyPem = '';

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
    console.log(publicKeyPem);

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
    var blob = new Blob([ privateKeyPem ], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    const a = $('<a>')
    a.attr('href',url)
    a.attr('download','秘密のインク消し.txt');
    a.css('display','none')
    $('body').append(a)
    a[0].click(); // jQueryの場合こういう処理が必要
    $('body').remove(a)
})

async function getPEM(email) { // emailから公開鍵を取得
    const res = await fetch(`/${email}.ink`);
    let data = await res.text();
    if(!data || data == ''){
	publicKeyPem = ''
	$('#publickey').text("(公開鍵が設定されていません)")
    }
    else {
	//publicKeyPem = data.replace(/[\r\n]+/g,"\r\n")
	publicKeyPem = data
	$('#publickey').text(publicKeyPem)
    }
}

function handleDDFile(file){
    if(file.name.match(/\.enigma$/)){ // 暗号化されたファイルがDrag&Dropされたとき
    }
    else { // 暗号化したいファイルがDrag&Dropされたとき
	fileReader = new FileReader();
	fileReader.onload = function(event){
	    //
	    // DDされたファイルを公開鍵で暗号化してダウンロードさせる
	    //

	    //alert(publicKeyPem)
	    //console.log(publicKeyPem.split('').map(function(b){ return ("0" + b.charCodeAt(0).toString(16)).slice(-2) }).join(''))
	    
	    // 公開鍵PEMファイルから公開鍵オブジェクトを生成
	    const key = forge.pki.publicKeyFromPem(publicKeyPem)

	    // ランダム文字列を作ってRSA暗号化
	    const pw = forge.random.getBytesSync(32);
	    const iv = forge.random.getBytesSync(16);
	    const encPw = key.encrypt(pw, "RSA-OAEP", {
		md: forge.md.sha256.create()
	    });
	    console.log(`パスワード = ${forge.util.encode64(encPw)}`)

	    // AES暗号化
	    // https://ja.wikipedia.org/wiki/暗号利用モード
	    //   CBCとは何か、などの説明あり
	    //
	    let data = event.target.result // ファイル内容
	    console.log(data)
	    const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
	    aes.update(forge.util.createBuffer(forge.util.decode64(data)));
	    aes.finish();

	    var enigma_data= aes.output.data;

	    // outputs encrypted hex
	    // alert(enigma_data.toHex());

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
	    zip.file("enigma.data", enigma_data)
	    zip.file("enigma.json", JSON.stringify(enigma_json))
	    zip.generateAsync({type:"blob"}).then(function(content) {
		var blob = new Blob([ content ], { type: "application/octet-stream" });
		var url = URL.createObjectURL(blob);
		const a = $('<a>')
		a.attr('href',url)
		a.attr('download',`${file.name}.enigma`)
		a.css('display','none')
		$('body').append(a)
		a[0].click();
		$('body').remove(a)
	    });

	    /*
	      var img = zip.folder("images");
	      img.file("smile.gif", imgData, {base64: true});
 
	      zip.generateAsync({type:"blob"}).then(function(content) {
	      // see FileSaver.js
	      saveAs(content, "example.zip");
	      });

	      Results in a zip containing
	      Hello.txt
	      images/
	      smile.gif
	    */

	    /*
            // ZIPオブジェクトにBibary化したAES暗号化データ・RSA暗号化キー・AES初期ベクトルを追加して圧縮
            return [["enc.bin", aes.output.data], ["key.bin", encPw], ["iv.bin", iv]].reduce((zip, [name, bin])=>{
		return zip.file(name, forge.util.encode64(bin), {
                    base64: true
		});
            }, new JSZip())
		.generateAsync({
		    type: "blob",
		    compression: "DEFLATE",
		    compressionOptions: {
			level: 9
		    }
		});
	    */

	    /*
	    // 暗号化されたデータのダウンロード
	    
            var blob = new Blob([ encrypted.toHex() ], { type: "application/octet-stream" });
            var url = URL.createObjectURL(blob);
            const a = $('<a>')
            a.attr('href',url)
            a.attr('download',`${file.name}.enigma`)
            a.css('display','none')
            $('body').append(a)
            a[0].click();
            $('body').remove(a)
	    */
	    
	    /*
              data = event.target.result //  読んだファイルの内容
              console.log(data)  
	      // crypt = new JSEncrypt({default_key_size: 2048});
              var enc = crypt.encrypt(data)
	      alert("enc")
              alert(enc)
              var blob = new Blob([ enc ], { type: "application/octet-stream" });
              var url = URL.createObjectURL(blob);
              const a = $('<a>')
              a.attr('href',url)
              a.attr('download','output.bin');
              a.css('display','none')
              $('body').append(a)
              a[0].click();
              $('body').remove(a)
	    */
	}
	fileReader.readAsBinaryString(file)
    }
}

$(function(){
    // 公開鍵をDBから取得
    getPEM(email)

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

/*
function encrypt(){
    const key = forge.pki.publicKeyFromPem(publicKeyPem)
    console.log(key);

    // RSA暗号化
    const pw = forge.random.getBytesSync(32);
    const encPw = key.encrypt(pw, "RSA-OAEP", {
        md: forge.md.sha256.create()
    });
    console.log(forge.util.encode64(encPw))
}
*/
    
/*    
    const pem = "-----BEGIN RSA PUBLIC KEY-----\n" +
"MIIBCgKCAQEAw2EGtjkb7aPIA10nra7wTRnNUr7+a89z/ONOMKkcF4DChstNpv8S\n" +
"blngFglS8KUjVED/B+um3CNRHjdio28Jq03U+75QOH1Iav3WKagQz6RYi5jAxjr7\n" +
"MBTnKFpvCyMtYEzMkrC37OKQOwFATld65kEjJp7uViLphsWZOjrgksML+W67t4D3\n" +
"SVtzam1UUmZh3y/SIv6hIpnlF9UGFub5UufLhAxDHh9PISXQIE2A913Gs6Wt10AE\n" +
"OeVL1LfVMHNN67yUnRdvLE3Y9/e4CGguTMQ7TxCwtWqyIx8iuln4KJtac7bhWnY+\n" +
"weWpuKvspfUF8HFQ99tICP0P27f+rv+v8wIDAQAB\n" +
"-----END RSA PUBLIC KEY-----\n"

// PEMファイルから公開鍵オブジェクトを生成
    const key = forge.pki.publicKeyFromPem(pem)

    const pw = forge.random.getBytesSync(32);
    const iv = forge.random.getBytesSync(16);

    base = "1234500000000000000000000000000"

    // AES暗号化
    // https://ja.wikipedia.org/wiki/暗号利用モード
    //  CBCとは何か書いてある
    //
    const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
    aes.update(forge.util.createBuffer(forge.util.decode64(base)));
    aes.finish();

    var encrypted = aes.output;
    // outputs encrypted hex
    alert(encrypted.toHex());
*/


