console.log("js연결완료")

const darkBtn = document.getElementById('darkbtn') as HTMLButtonElement

if (darkBtn) {
    darkBtn.addEventListener('click', (): void => {
        document.body.classList.toggle('dark-mode')

        if (document.body.classList.contains('dark-mode')) {
            darkBtn.textContent = "press to light"
        } else {
            darkBtn.textContent = "press to dark"
        }
    })
}