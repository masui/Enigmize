// Webpackでまとめる

//
// npmのライブラリ
//
$ = require('jquery')
forge = require('node-forge')

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
	publicKeyPem = data.replace(/[\r\n]+/g,"\r\n")
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

	    /*
	    var pki = forge.pki;
	    var keypair = pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
	    privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
	    publicKeyPem = pki.publicKeyToPem(keypair.publicKey);


	    publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj6MNA0K3nK6k737gV50c\n" +
		"9hVHS8GprSpdEJUiGYhLZTiLYqmvcPy7EdR8BueerjPGpmeRLQGoJDaFnaK28WX1\n" +
		"ZNn8N4TlNCLrSF+zk0MCygIRB7IcPe1sBkvyIHTu/Lkt1ZEsylYnGmMM2aZ3gdEg\n" +
		"QraIIkRv3wn2A9k5hpVQJ/2aIwF3DJYU9EpCTp5fp7Q76paaXQesxjaZqQEWIlCY\n" +
		"kw39n2vTk6zThK7pGM1Mtz7kV6d469l434KtO3iSz0MMNB1c4I9S37QOPE7dPCGH\n" +
		"7PaOGz6KpC1Ct7S+1iOwSklwayCwY1VAHVRiJHhE0aste0PL7Gj1yf+aNHvpgiLp\n" +
		"FQIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"
	    console.log(publicKeyPem.split('').map(function(b){ return ("0" + b.charCodeAt(0).toString(16)).slice(-2) }).join(''))
	    */

	    console.log(publicKeyPem.length)
	    //const s = publicKeyPem.replace(/[\r\n]+/g,"\n")
	    //const s = publicKeyPem
	    //console.log(`s.length = ${s.length}`)
	    //const key = forge.pki.publicKeyFromPem(s)
	    //const key = forge.pki.publicKeyFromPem(publicKeyPem)
	    const key = forge.pki.publicKeyFromPem(publicKeyPem.replace(/[\r\n]+/g,"\r\n"))
	    alert(key)
	    // ランダム文字列を作ってRSA暗号化
	    const pw = forge.random.getBytesSync(32);
	    alert(pw)
	    const encPw = key.encrypt(pw, "RSA-OAEP", {
		md: forge.md.sha256.create()
	    });
	    console.log(forge.util.encode64(encPw))

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


