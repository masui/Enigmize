

const forge = require('node-forge')
const fs = require("fs");

// % ssh-keygen -e -m PEM -f ~/.ssh/id_rsa > id_rsa.pub.pem
pem = fs.readFileSync("id_rsa.pub.pem","utf8")
//pem = fs.readFileSync("public-key.pem","utf8")
//pem = fs.readFileSync("id_rsa","utf8")

//const pem = "-----BEGIN RSA PUBLIC KEY-----\n" +
//"MIIBCgKCAQEAw2EGtjkb7aPIA10nra7wTRnNUr7+a89z/ONOMKkcF4DChstNpv8S\n" +
//"blngFglS8KUjVED/B+um3CNRHjdio28Jq03U+75QOH1Iav3WKagQz6RYi5jAxjr7\n" +
//"MBTnKFpvCyMtYEzMkrC37OKQOwFATld65kEjJp7uViLphsWZOjrgksML+W67t4D3\n" +
//"SVtzam1UUmZh3y/SIv6hIpnlF9UGFub5UufLhAxDHh9PISXQIE2A913Gs6Wt10AE\n" +
//"OeVL1LfVMHNN67yUnRdvLE3Y9/e4CGguTMQ7TxCwtWqyIx8iuln4KJtac7bhWnY+\n" +
//"weWpuKvspfUF8HFQ99tICP0P27f+rv+v8wIDAQAB\n" +
//"-----END RSA PUBLIC KEY-----\n"

// PEMファイルから公開鍵オブジェクトを生成
//const key = forge.pki.publicKeyFromPem(new FileReaderSync().readAsText(data[1]));
const key = forge.pki.publicKeyFromPem(pem)

const pw = forge.random.getBytesSync(32);
const iv = forge.random.getBytesSync(16);

base = "^&(*()1234500000000000000000000000000"

// AES暗号化
// https://ja.wikipedia.org/wiki/暗号利用モード
//  CBCとは何か書いてある
//
const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
aes.update(forge.util.createBuffer(forge.util.decode64(base)));
aes.finish();

var encrypted = aes.output;
console.log(encrypted)

// outputs encrypted hex
console.log(encrypted.toHex());




//fs.readFile("data.txt", "utf-8", (err, data) => {
//  if (err) throw err;
//  console.log(data);
//});


/*
// 定数
const BUFF_SIZE = 100;    // バッファーのサイズ
const BUFF_POS  = 0;      // バッファーの保存開始位置
const READ_SIZE = 2      // 読み取るサイズ
const READ_POS  = 0;      // 読み取り開始位置

// 入れ物準備
const buff = Buffer.alloc(BUFF_SIZE);
let str = "";

// ファイルを同期的に開いて内容を取得
try{
  const fd = fs.openSync("data.txt", "r");
  fs.readSync(fd, buff, BUFF_POS, READ_SIZE, READ_POS);
  str = buff.toString("utf8", 0, READ_SIZE);
  fs.closeSync(fd);
}
catch(e){
  console.log(e.message);
}

console.log( str );
*/

// 
//const pw = forge.random.getBytesSync(32);
//const iv = forge.random.getBytesSync(16);
//
// ZIPデータはBase64からBinaryに変換して容量削減
// AES暗号化
//const aes = forge.aes.startEncrypting(pw, iv, null, "CBC");
//aes.update(forge.util.createBuffer(forge.util.decode64(base)));
//aes.finish();
