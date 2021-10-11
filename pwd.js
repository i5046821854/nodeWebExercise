//const bcrypt = require('bcrypt');

/*
const validatePWD1 = async function() {
    console.log("zzz")
    const val1 = document.getElementById('pwd1').value;
    const pwd = '<%- pwd %>'
    const isMatch = await bcrypt.compare(pwd, val1);
    if (isMatch) {
        alert("이전과 비번이 같음 ")
        btn.disabled = false
    } else {
        btn.disabled = true
    }

}*/

function validatePWD2() {
    const val1 = document.getElementById('pwd1').value;
    const val2 = document.getElementById('pwd2').value;
    const btn = document.getElementById('submit')
    if (val1 == val2) {
        document.getElementById("wrongPWD2").style.display = "none";
        if (document.getElementById("wrongPWD").style.visibility == "hidden")
            btn.disabled = false
    } else {
        document.getElementById("wrongPWD2").style.display = "inline-block";
        btn.disabled = true
    }
}