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
const chatWidget = document.querySelector('#chat-widget');
const chatToggle = document.querySelector('#chat-toggle');
const chatPanel = document.querySelector('#chat-panel');
const chatClose = document.querySelector('#chat-close');
const chatClear = document.querySelector('#chat-clear');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const chatStatusDot = document.querySelector('#chat-status-dot');
const chatStatusText = document.querySelector('#chat-status-text');
// const CHAT_API_URL = 'http://127.0.0.1:8000/chats';
const CHAT_API_URL = 'https://personal-chatbot-api-cdht.onrender.com/chats';
const CHAT_API_BASE_URL = new URL(CHAT_API_URL).origin;
const CHAT_HEALTH_URL = `${CHAT_API_BASE_URL}/health`;
const CHAT_STORAGE_KEY = 'portfolio_chat_messages';
const CHAT_USER_ID_KEY = 'portfolio_chat_user_id';
const legacyBotGreeting = 'Hi, I can help visitors learn about your work. Hook me to your API later and I will become fully functional.';
const defaultBotGreeting = "Hi, I'm Sumit's AI assistant. Ask me about his skills, projects, experience, or how he builds AI systems.";
const CHAT_STATUS_POLL_INTERVAL = 30000;
const CHAT_STATUS_FAILURE_THRESHOLD = 3;
let chatStatusIntervalId = null;
let failedChatHealthChecks = 0;
let hasConfirmedChatOnline = false;

function getOrCreateChatUserId() {
    let userId = localStorage.getItem(CHAT_USER_ID_KEY);

    if (!userId) {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            userId = window.crypto.randomUUID();
        } else {
            userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        }

        localStorage.setItem(CHAT_USER_ID_KEY, userId);
    }

    return userId;
}

function saveChatMessages(messages) {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

function loadChatMessages() {
    try {
        const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);

        if (!storedMessages) {
            return [{ sender: 'bot', text: defaultBotGreeting }];
        }

        const parsedMessages = JSON.parse(storedMessages);

        if (!Array.isArray(parsedMessages) || parsedMessages.length === 0) {
            return [{ sender: 'bot', text: defaultBotGreeting }];
        }

        const migratedMessages = parsedMessages.map((message) => {
            if (
                message &&
                message.sender === 'bot' &&
                message.text === legacyBotGreeting
            ) {
                return {
                    ...message,
                    text: defaultBotGreeting
                };
            }

            return message;
        });

        if (JSON.stringify(migratedMessages) !== JSON.stringify(parsedMessages)) {
            saveChatMessages(migratedMessages);
        }

        return migratedMessages;
    } catch (error) {
        console.error('Failed to load chat history:', error);
        return [{ sender: 'bot', text: defaultBotGreeting }];
    }
}

function renderChatMessages(messages) {
    if (!chatMessages) return;

    chatMessages.innerHTML = '';
    messages.forEach(({ text, sender }) => appendChatMessage(text, sender));
}

function storeAndAppendChatMessage(text, sender) {
    const currentMessages = loadChatMessages();
    const nextMessages = [...currentMessages, { text, sender }];
    saveChatMessages(nextMessages);
    appendChatMessage(text, sender);
}

function clearChatHistory() {
    const initialMessages = [{ sender: 'bot', text: defaultBotGreeting }];
    saveChatMessages(initialMessages);
    renderChatMessages(initialMessages);
}

function setChatStatus(state, label) {
    if (!chatStatusDot || !chatStatusText) return;

    chatStatusDot.classList.remove('online', 'offline', 'checking');
    chatStatusDot.classList.add(state);
    chatStatusText.textContent = label;
}

async function checkChatbotStatus() {
    if (CHAT_API_URL === 'YOUR_API_ENDPOINT_HERE') {
        setChatStatus('offline', 'API not configured');
        return false;
    }

    if (failedChatHealthChecks === 0) {
        setChatStatus('checking', 'Checking status...');
    }

    try {
        const response = await fetch(CHAT_HEALTH_URL, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Health check failed with status ${response.status}`);
        }

        const rawBody = await response.text();
        let data = null;

        try {
            data = rawBody ? JSON.parse(rawBody) : null;
        } catch (parseError) {
            console.warn('Health check returned non-JSON response:', parseError);
        }

        const normalizedStatus = String(data?.status || '').toLowerCase();
        const isOnline = !data || normalizedStatus === 'ok' || normalizedStatus === 'online' || normalizedStatus === 'healthy';

        failedChatHealthChecks = 0;
        hasConfirmedChatOnline = isOnline;
        setChatStatus(isOnline ? 'online' : 'offline', isOnline ? 'Online' : 'Offline');
        return isOnline;
    } catch (error) {
        console.error('Chat health check failed:', error);
        failedChatHealthChecks += 1;

        if (failedChatHealthChecks >= CHAT_STATUS_FAILURE_THRESHOLD) {
            hasConfirmedChatOnline = false;
            setChatStatus('offline', 'Offline');
        } else if (!hasConfirmedChatOnline) {
            setChatStatus('checking', 'Reconnecting...');
        }

        return false;
    }
}

function startChatStatusPolling() {
    if (chatStatusIntervalId) {
        clearInterval(chatStatusIntervalId);
    }

    checkChatbotStatus();
    chatStatusIntervalId = window.setInterval(checkChatbotStatus, CHAT_STATUS_POLL_INTERVAL);
}

async function getChatbotReply(query) {
    if (CHAT_API_URL === 'YOUR_API_ENDPOINT_HERE') {
        return 'Set your API URL in js/script.js to start using live replies.';
    }

    const payload = {
        user_id: getOrCreateChatUserId(),
        query: query
    };

    const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Chat API request failed with status ${response.status}`);
    }

    const data = await response.json();
    failedChatHealthChecks = 0;
    hasConfirmedChatOnline = true;
    setChatStatus('online', 'Online');

    return data.reply || data.response || data.message || 'The assistant returned an empty response.';
}

function toggleChat(forceOpen) {
    if (!chatWidget || !chatToggle || !chatPanel) return;

    const shouldOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : !chatWidget.classList.contains('open');

    chatWidget.classList.toggle('open', shouldOpen);
    chatToggle.setAttribute('aria-expanded', shouldOpen);
    chatPanel.setAttribute('aria-hidden', String(!shouldOpen));

    if (shouldOpen && chatInput) {
        chatInput.focus();
    }
}

function appendChatMessage(text, sender) {
    if (!chatMessages) return;

    const message = document.createElement('div');
    const bubble = document.createElement('div');

    message.className = `chat-message ${sender}`;
    bubble.className = 'chat-message-content';

    if (sender === 'bot' && window.marked && window.DOMPurify) {
        const parsedMarkdown = window.marked.parse(text, {
            breaks: true,
            gfm: true
        });
        bubble.innerHTML = window.DOMPurify.sanitize(parsedMarkdown);
    } else {
        bubble.textContent = text;
    }

    message.appendChild(bubble);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    if (!chatMessages) return;

    removeTypingIndicator();

    const typingMessage = document.createElement('div');
    const bubble = document.createElement('div');

    typingMessage.className = 'chat-message bot typing';
    typingMessage.id = 'chat-typing-indicator';
    bubble.className = 'chat-message-content';
    bubble.innerHTML = `
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
    `;

    typingMessage.appendChild(bubble);
    chatMessages.appendChild(typingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('#chat-typing-indicator');

    if (typingIndicator) {
        typingIndicator.remove();
    }
}

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

if (chatToggle) {
    chatToggle.addEventListener('click', () => toggleChat());
}

if (chatClose) {
    chatClose.addEventListener('click', () => toggleChat(false));
}

if (chatClear) {
    chatClear.addEventListener('click', () => {
        clearChatHistory();
    });
}

if (chatForm) {
    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!chatInput) return;

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        storeAndAppendChatMessage(userMessage, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        showTypingIndicator();

        try {
            const reply = await getChatbotReply(userMessage);
            removeTypingIndicator();
            storeAndAppendChatMessage(reply, 'bot');
        } catch (error) {
            console.error('Chat API error:', error);
            removeTypingIndicator();
            storeAndAppendChatMessage('Sorry, the assistant is unavailable right now. Please try again.', 'bot');
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    });
}

renderChatMessages(loadChatMessages());
startChatStatusPolling();

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        toggleChat(false);
    }
});
