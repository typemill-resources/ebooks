window.onload = function() {

    // Create overlay element
    let overlay = document.createElement('div');
    overlay.setAttribute('id', 'overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.5)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontSize = '40px';
    overlay.style.zIndex = '1000';
    document.body.appendChild(overlay);

    // Countdown logic
    let countdown = 10; // 30 seconds
    overlay.textContent = 'Rendering, please wait ... ' + countdown;

    let countdownInterval = setInterval(function() {
        countdown--;
        overlay.textContent =  'Rendering, please wait ... ' + countdown;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            document.body.removeChild(overlay);
        }
    }, 1000);

    let lastScrollHeight = 0;
    let interval = setInterval(function() {
        let currentScrollHeight = document.body.scrollHeight;
        if (currentScrollHeight != lastScrollHeight) {
            window.scrollTo({ top: currentScrollHeight, behavior: 'smooth' });
            lastScrollHeight = currentScrollHeight;
        }
    }, 1000); // Check every 1000 milliseconds (1 second)

    // Optional: Clear the interval after a certain time if needed
    setTimeout(function() {
        clearInterval(interval);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10000); // Stop checking after 10 seconds
};