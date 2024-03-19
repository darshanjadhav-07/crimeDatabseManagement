let navButton = document.getElementById("navBtn");
let isProfiled = false;

let mainC = document.getElementById("main");

if(navButton){

    navButton.onclick(() => {
        clicked();
    });
}

function clicked() {
    isProfiled = !(isProfiled);
    if (!isProfiled) {
        if(mainC){
            mainC.hidden = false;
        }
    }
    else {
        if(mainC){
            mainC.hidden = true;
        }
    }
}

let phoneIdVar = document.getElementById("phoneId");
let criminlaNoIdVar = document.getElementById("criminlaNoId");
let criminalInfoIdVar = document.getElementById("criminalInfoId");


let isphone;
let isCrossCrimeNo;
if(phoneIdVar){
    phoneIdVar.addEventListener('input', (e, isphone,isCrossCrimeNo) => {
        showError(e, true,false);
    });
}
if(criminlaNoIdVar){
    criminlaNoIdVar.addEventListener('input', (e, isphone,isCrossCrimeNo) => {
        showError(e, false,false);
    });
}
if(criminalInfoIdVar){
    criminalInfoIdVar.addEventListener('input', (e, isphone,isCrossCrimeNo) => {
        showError(e, false,true);
    });
}



function showError(event, isphone,isCrossCrimeNo) {
    let ans = event.target.value;
    if (isphone) {
        if (ans.length <= 9 || ans.length >= 11) {
            phoneIdVar.style.backgroundColor = "rgb(255, 151, 151)";
        }
        else {
            phoneIdVar.style.backgroundColor = "#ffc107";
        }
    }
    else if(isCrossCrimeNo){
        if (ans.length <= 3 || ans.length >= 5) {
            criminalInfoIdVar.style.backgroundColor = "rgb(255, 151, 151)";
        }
        else {
            criminalInfoIdVar.style.backgroundColor = "#ffc107";
        }
    }
    else {
        if (ans.length <= 3 || ans.length >= 5) {
            criminlaNoIdVar.style.backgroundColor = "rgb(255, 151, 151)";
        }
        else {
            criminlaNoIdVar.style.backgroundColor = "#ffc107";
        }
    }
}


document.getElementById("criminalInfoDate");

let currDate = new Date();
let date = currDate.getDate();
let month = currDate.getMonth();
let year = currDate.getFullYear();

document.getElementById("criminalInfoDate").max = `${year}-0${month}-${date}`;
