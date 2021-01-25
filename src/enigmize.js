
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
    }
    //fileReader.readAsBinaryString(file)
    fileReader.readAsText(file)
}



