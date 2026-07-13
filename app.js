"use strict";
console.log("js연결완료");
const darkbtn = document.getElementById('darkbtn');
if (darkbtn) {
    darkbtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            darkbtn.textContent = "press to light";
        }
        else {
            darkbtn.textContent = "press to dark";
        }
    });
}
