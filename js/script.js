// toggle icon navbar
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}

// scroll section active link 

let sections = document.querySelectorAll('section')
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop -150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if(top >= offset && top < offset + height){
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active');
            });
        };
    });

    // sticky navbar
    let header = document.querySelector('header');

    header.classList.toggle('sticky', window.scrollY > 100);

    // remove toggle icon and navbar when click navbar link (scroll)
    menuIcon.classList.remove('bx-x');
    navbar.classList.remove('active');
};

function sendMail(event){
    event.preventDefault(); // stop form reload

    const name = document.querySelector('input[placeholder="Full Name"]').value;
    const email = document.querySelector('input[placeholder="Email Address"]').value;
    const mobile = document.querySelector('input[placeholder="Mobile Number"]').value;
    const subject = document.querySelector('input[placeholder="Email Subject"]').value;
    const message = document.querySelector('textarea').value;

    const params = {
        from_name: name,
        from_email: email,
        mobile: mobile,
        subject: subject,
        message: message
    };

    emailjs.send("service_b1ziifo", "template_pqa91dv", params)
        .then(() => {
            alert("Your Email has been sent!");
        })
        .catch((err) => {
            console.error("Failed to send email:", err);
            alert("Oops! Something went wrong.");
        });
}

const typedText = document.querySelector('#typed-text');
const typingWords = ['AI Engineer', 'Developer', 'Researcher'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const cursorGlow = document.querySelector('.cursor-glow');

function typeEffect() {
    if (!typedText) return;

    const currentWord = typingWords[wordIndex];

    if (isDeleting) {
        charIndex--;
    } else {
        charIndex++;
    }

    typedText.textContent = currentWord.substring(0, charIndex);

    let typingSpeed = isDeleting ? 80 : 140;

    if (!isDeleting && charIndex === currentWord.length) {
        typingSpeed = 1200;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % typingWords.length;
        typingSpeed = 250;
    }

    setTimeout(typeEffect, typingSpeed);
}

typeEffect();

if (cursorGlow) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    function animateGlow() {
        // Ease the glow toward the cursor for a soft trailing effect.
        glowX += (mouseX - glowX) * 0.14;
        glowY += (mouseY - glowY) * 0.14;
        cursorGlow.style.left = `${glowX}px`;
        cursorGlow.style.top = `${glowY}px`;
        requestAnimationFrame(animateGlow);
    }

    animateGlow();
}
