const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');
const statusContainer = document.getElementById('statusContainer');
const statusText = statusContainer.querySelector('.status-text');

// Configure Marked.js for GitHub Flavored Markdown
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false
});

function updateStatus(status) {
    statusContainer.classList.remove('status-online', 'status-away', 'status-offline');
    statusContainer.classList.add(`status-${status}`);
    statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function showThinking() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.classList.add('message', 'bot', 'thinking-message');
    thinkingDiv.id = 'thinkingIndicator';

    thinkingDiv.innerHTML = `
        <div class="message-content">
            <div class="thinking-container">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeThinking() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) indicator.remove();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.focus();

    sendBtn.disabled = true;
    updateStatus('away');
    showThinking();

    try {
        const response = await fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();

        removeThinking();

        if (response.ok) {
            addMessage(data.reply, 'bot');
            updateStatus('online');
        } else {
            addMessage(`Error: ${data.error || 'Request failed'}`, 'bot');
            updateStatus('offline');
        }
    } catch (err) {
        removeThinking();
        addMessage('Network error. Please check your connection.', 'bot');
        updateStatus('offline');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    // ✅ Parse Markdown to HTML
    contentDiv.innerHTML = marked.parse(text);

    // ✅ Apply syntax highlighting and add enhanced headers to <pre><code> blocks
    contentDiv.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (code) {
            hljs.highlightElement(code);
            
            // Extract language from class (e.g., "language-javascript" -> "javascript")
            let lang = 'code';
            const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
            if (langClass) {
                lang = langClass.replace('language-', '');
            }

            // Create header container
            const header = document.createElement('div');
            header.classList.add('code-header');
            
            // Language badge
            const langBadge = document.createElement('span');
            langBadge.classList.add('code-lang');
            langBadge.textContent = lang;
            
            // Action buttons container
            const actions = document.createElement('div');
            actions.classList.add('code-actions');

            // Expand button
            const expandBtn = document.createElement('button');
            expandBtn.classList.add('expand-code-btn');
            expandBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
            expandBtn.title = 'Expand';
            
            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('copy-code-btn');
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
            
            actions.appendChild(expandBtn);
            actions.appendChild(copyBtn);
            
            header.appendChild(langBadge);
            header.appendChild(actions);
            
            pre.insertBefore(header, code);
            pre.style.position = 'relative';
            
            // Copy Logic
            copyBtn.addEventListener('click', () => {
                const textToCopy = code.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });

            // Expand Logic
            expandBtn.addEventListener('click', () => {
                showExpandedCode(code.innerText, lang);
            });
        }
    });

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function showExpandedCode(codeText, lang) {
    const overlay = document.createElement('div');
    overlay.classList.add('code-expansion-overlay');
    
    overlay.innerHTML = `
        <div class="expansion-container">
            <div class="expansion-header">
                <span class="code-lang">${lang}</span>
                <div class="expansion-actions">
                    <button class="copy-code-btn"><i class="fa-regular fa-copy"></i> Copy</button>
                    <button class="close-expansion-btn"><i class="fa-solid fa-times"></i></button>
                </div>
            </div>
            <pre><code class="language-${lang}"></code></pre>
        </div>
    `;
    
    const codeBlock = overlay.querySelector('code');
    codeBlock.textContent = codeText;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    hljs.highlightElement(codeBlock);
    
    // Copy logic for expansion
    const copyBtn = overlay.querySelector('.copy-code-btn');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeText).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    });
    
    const closeBtn = overlay.querySelector('.close-expansion-btn');
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeBtn.click();
    });
}

// Chat Modal Toggle
const openChatBtn = document.getElementById('openChatBtn');
const openChatLinks = document.querySelectorAll('.open-chat-link');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatOverlay = document.getElementById('chatOverlay');

if (chatOverlay) {
    const openChat = () => chatOverlay.classList.add('active');
    const closeChat = () => chatOverlay.classList.remove('active');

    if (openChatBtn) openChatBtn.addEventListener('click', openChat);
    openChatLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        openChat();
    }));

    if (closeChatBtn) closeChatBtn.addEventListener('click', closeChat);

    // Close on clicking outside the container
    chatOverlay.addEventListener('click', (e) => {
        if (e.target === chatOverlay) {
            closeChat();
        }
    });
}

// Testimonials Carousel
const track = document.getElementById('carouselTrack');
const dots = document.querySelectorAll('.carousel-dot');

if (track && dots.length > 0) {
    let currentIndex = 0;

    function updateCarousel(index) {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        currentIndex = index;
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateCarousel(index);
        });
    });

    // Auto rotate every 5 seconds
    setInterval(() => {
        let nextIndex = (currentIndex + 1) % dots.length;
        updateCarousel(nextIndex);
    }, 5000);
}