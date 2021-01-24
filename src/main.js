// Webpackでまとめる

//
// npmのライブラリ
//
$ = require('jquery')
// require('jsencrypt')

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

    // 公開鍵を表示
    $('#publickey').text(publicKeyPem);

    // 公開鍵をMongoDBに格納
    $.ajax({
        type: "POST",
        async: true,
        url: "/__save_public_key",
        data: "key=" + publicKeyPem
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

async function getPEM(email) {
    const res = await fetch(`/${email}.ink`);
    let data = await res.text();
    if(!data || data == ''){
	publicKeyPem = ''
	$('#publickey').text("(公開鍵が設定されていません)")
    }
    else {
	publicKeyPem = data
	$('#publickey').text(publicKeyPem)
    }
}

$(function(){
    // 公開鍵をDBから取得
    getPEM(email)

    $('body').bind("dragover", function(e){
	return false;
    }).bind("dragend", function(e){
	return false;
    }).bind("drop", function(e){
	e.preventDefault();  //  デフォルトは「ファイルを開く」
	files = e.originalEvent.dataTransfer.files;
	getfile(files[0]);
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


