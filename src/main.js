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
    console.log(publicKeyPem);

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

function handleDDFile(file){
    if(file.name.match(/\.enigma$/)){ //が
    }
    else {
	fileReader = new FileReader();
	fileReader.onload = function(event){
	    //
	    // DDされたファイルを公開鍵で暗号化してダウンロードさせる
	    //

	    // 公開鍵PEMファイルから公開鍵オブジェクトを生成
	    console.log(publicKeyPem.length)
	    /*
	    publicKeyPem = "-----BEGIN RSA PUBLIC KEY-----\n" +
		"MIIBCgKCAQEAw2EGtjkb7aPIA10nra7wTRnNUr7+a89z/ONOMKkcF4DChstNpv8S\n" +
		"blngFglS8KUjVED/B+um3CNRHjdio28Jq03U+75QOH1Iav3WKagQz6RYi5jAxjr7\n" +
		"MBTnKFpvCyMtYEzMkrC37OKQOwFATld65kEjJp7uViLphsWZOjrgksML+W67t4D3\n" +
		"SVtzam1UUmZh3y/SIv6hIpnlF9UGFub5UufLhAxDHh9PISXQIE2A913Gs6Wt10AE\n" +
		"OeVL1LfVMHNN67yUnRdvLE3Y9/e4CGguTMQ7TxCwtWqyIx8iuln4KJtac7bhWnY+\n" +
		"weWpuKvspfUF8HFQ99tICP0P27f+rv+v8wIDAQAB\n" +
		"-----END RSA PUBLIC KEY-----\n"
	    */
	    /*
	    console.log(publicKeyPem)
	    publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzWcNN4aeXxRkDYoseLPJ\n" +
		"bMY5UqZv/nkCpOhMhQIWqhNGd/mo+a4GvfPg0ead+oCJcq/ejOeK+mGKeIoxJ23X\n" +
		"xXujUMb6JdnoJxYybGYdaaqnKu/b6Nei+hpCZik5rAf1DUd2U4wKdPOrGMsoSLQX\n" +
		"eTA8tix1WzdTNKuSQdHArtdi/Y7k6qmJ3RBvtX7BQZ9149HpYTQ8jleO6Js6QF0I\n" +
		"a5JxZ2Rvu/X9bsHQgjJRKc9WRInI2T7S+qIUc0B97dni0U3WOSgc+iSsmFboHcMV\n" +
		"Pfs8WDRKqa5ST9STjSX7o+wVTiYQ+hj2eNhjnpoF5VgppOVmNW/nIsyl9IvgeFj2\n" +
		"SQIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"
	    publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApK3ltw5KTMJEQZKhahlh\n" +
		"rEFq11ocxh/9QjF3b0ADRX54by0BggBXK9KsE8LHQT2RbQBxNSVSetzEl0lBNrv0\n" +
		"P1qUPEEPRXYnVizfq35inF452S32PzCEdleLBls/iBL3S/p4owFn2EKXn mQHzyx\n" +
		"MlyjznBzJhB0tfaGRQU2 Hkl gJ1Db5gCUxbopU gO1e9u0sFv2osLiOOCYCR iN\n" +
		"G9UFwhdzGtg9544qC2XJHF/AK6RDbo0kv73J/g1JpOPvW7L9Mtpph7eY7y/MI/CY\n" +
		"XjxfdyIB5Z3KqGJsYTyoDXeCYuRRuoVXIr6HcAKFqUbRwdxmGGu9T2l6r2IYl7g4\n" +
		"aQIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"
	    xxpublicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuW4AAk6Pn7P7LtvwEau2\n" +
		"pHaguLjHvJqtyEmPNUgtlOe54xW+PCmVL09JEF4IiaqGB03zCApiOffDTBJzdUwa\n" +
		"H5hQ58BRnDXU+lhzZHha4JniXFdI0ETq4q7+D5ZvxMZ4gQGZcsimam/E77JRcWQx\n" +
		"YS1GcKZYD0bncq0NALT2iJ/3fYHvSly67OMRIuD1aOK5eeDqjwVDoKDqYNUn08Gv\n" +
		"YVyhusC0faw60zuMLKwWwLAraelo6UFumWdrO4QGK+8yFgGmzCZG4iVkLeY9KHYT\n" +
		"FlOtnx4LVhtIypcYcwtOgfWcaaCFB1GTl1jy8mkQlf76hW3GcWWl7rklkmTA/sJM\n" +
		"qwIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"
	    publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1lnpQK7aaR2vP0s3Ztq7\n" +
		"/vjsKFx5J3f5D7nv5z3Ydx1Dw5upqZ9+oiNkE28YzHhBlpPU5gyi37dAlPY5isMj\n" +
		"sLgwq9lfS6yGiZt8U84UlrBRa3uQSZz7LGzhN0pFobHgBsMzrZTnPFAi9K0gXY3V\n" +
		"hGcZyGXbDbZXxJdrqONFnmTssdcOdkS+lv2wQLJtjLCJwtlOtHQx60yHnqKI/AY1\n" +
		"4Wh/os1fQpYr0/MbfLR20xjKDEPBDjvvBgqWKbAI7RSw2xj9EXvwagGWg9WzakvZ\n" +
		"bA1t5N5RO4kRyporoMv3Po89FF/YCGSHgiJiktXN9VxABYW1/bBtwwaFzo3Id8dE\n" +
		"UwIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"

	    var pki = forge.pki;
	    var keypair = pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
	    privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
	    publicKeyPem = pki.publicKeyToPem(keypair.publicKey);

	    console.log(publicKeyPem)

	    publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj6MNA0K3nK6k737gV50c\n" +
		"9hVHS8GprSpdEJUiGYhLZTiLYqmvcPy7EdR8BueerjPGpmeRLQGoJDaFnaK28WX1\n" +
		"ZNn8N4TlNCLrSF+zk0MCygIRB7IcPe1sBkvyIHTu/Lkt1ZEsylYnGmMM2aZ3gdEg\n" +
		"QraIIkRv3wn2A9k5hpVQJ/2aIwF3DJYU9EpCTp5fp7Q76paaXQesxjaZqQEWIlCY\n" +
		"kw39n2vTk6zThK7pGM1Mtz7kV6d469l434KtO3iSz0MMNB1c4I9S37QOPE7dPCGH\n" +
		"7PaOGz6KpC1Ct7S+1iOwSklwayCwY1VAHVRiJHhE0aste0PL7Gj1yf+aNHvpgiLp\n" +
		"FQIDAQAB\n" +
		"-----END PUBLIC KEY-----\n"
	    */
	    console.log(publicKeyPem.length)
	    //const s = publicKeyPem.replace(/[\r\n]+/g,"\n")
	    //const s = publicKeyPem
	    //console.log(`s.length = ${s.length}`)
	    //const key = forge.pki.publicKeyFromPem(s)
	    const key = forge.pki.publicKeyFromPem(publicKeyPem)
	    // const key = forge.pki.publicKeyFromPem(publicKeyPem.replace(/[\r\n]+/g,"\n"))
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


