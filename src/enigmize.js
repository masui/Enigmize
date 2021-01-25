
function datestr(){
    var dt = new Date();
    return dt.getFullYear() +
        ("00" + (dt.getMonth()+1)).slice(-2) +
        ("00" + dt.getDate()).slice(-2) +
        ("00" + (dt.getHours())).slice(-2) +
        ("00" + (dt.getMinutes())).slice(-2) +
        ("00" + (dt.getSeconds())).slice(-2);
}



