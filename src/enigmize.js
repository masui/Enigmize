require('jsencrypt')

var crypt;

function datestr(){
    var dt = new Date();
    return dt.getFullYear() +
        ("00" + (dt.getMonth()+1)).slice(-2) +
        ("00" + dt.getDate()).slice(-2) +
        ("00" + (dt.getHours())).slice(-2) +
        ("00" + (dt.getMinutes())).slice(-2) +
        ("00" + (dt.getSeconds())).slice(-2);
}

function getfile(file){
    fileReader = new FileReader();
    fileReader.onload = function(event){
        data = event.target.result //  読んだファイルの内容
        console.log(data)  
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
    }
    //fileReader.readAsBinaryString(file)
    fileReader.readAsText(file)
}

$(function () {
    var a = $('#download');
    a.attr('download','SECRET_INK_REMOVER_' + datestr());
    
    crypt = new JSEncrypt({default_key_size: 2048});
    
    var secretKey = crypt.getPrivateKey() + "\n"
    var blob = new Blob([ secretKey ], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    a.attr('href',url)
    
    //a.attr('href','data:text/plain,' + encodeURIComponent(secretKey));
    //a.attr('download','SECRET_INK_REMOVER_' + datestr());
    //a.click();
    
    $('#publickey').text(crypt.getPublicKey())
    
    $.ajax({
        type: "POST",
        async: true,
        url: "/__save_public_key",
        data: "key=" + crypt.getPublicKey()
    });
    
    
    //alert(crypt.encrypt("abcde"));
    //alert(ink);
    //crypt.setKey(ink);
    //alert(crypt.getPublicKey());
    //alert(crypt.encrypt("abcde"));
    
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
