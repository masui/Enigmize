const forge = require('node-forge')

//var key = forge.random.getBytesSync(16);
var iv = forge.random.getBytesSync(16);
 
// alternatively, generate a password-based 16-byte key
numIterations = 10
var salt = forge.random.getBytesSync(128);
var key = forge.pkcs5.pbkdf2('password', salt, numIterations, 16);
console.log(key.toHex())
 
// encrypt some bytes using CBC mode
// (other modes include: ECB, CFB, OFB, CTR, and GCM)
// Note: CBC and ECB modes use PKCS#7 padding as default
var cipher = forge.cipher.createCipher('AES-CBC', key);
cipher.start({iv: iv});
cipher.update(forge.util.createBuffer("abcdefg"));
cipher.finish();
var encrypted = cipher.output;
// outputs encrypted hex
console.log(encrypted.toHex());


// decrypt some bytes using CBC mode
// (other modes include: CFB, OFB, CTR, and GCM)
var decipher = forge.cipher.createDecipher('AES-CBC', key);
decipher.start({iv: iv});
decipher.update(encrypted);
var result = decipher.finish(); // check 'result' for true/false
console.log(decipher.output)
// outputs decrypted hex
console.log(decipher.output.toHex());
