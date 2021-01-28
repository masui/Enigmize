forge = require('node-forge')

var pki = forge.pki;
var keypair = pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
publicKeyPem = pki.publicKeyToPem(keypair.publicKey);

const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)

const pw = forge.random.getBytesSync(32);
const iv = forge.random.getBytesSync(16);
const encPw = publicKey.encrypt(pw, "RSA-OAEP", {
    md: forge.md.sha256.create()
});

const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
const decPw = privateKey.decrypt(encPw, "RSA-OAEP", {
    md: forge.md.sha256.create()
});

console.log('-----------')
console.log(pw)
console.log('-----------')
console.log(encPw)
console.log('-----------')
console.log(decPw)
