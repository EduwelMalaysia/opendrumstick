const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');

// Configure Marked.js for GitHub Flavored Markdown
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.focus();

    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    try {
        const response = await fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();

        if (response.ok) {
            addMessage(data.reply, 'bot');
        } else {
            addMessage(`Error: ${data.error || 'Request failed'}`, 'bot');
        }
    } catch (err) {
        addMessage('Network error. Please check your connection.', 'bot');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    // ✅ Parse Markdown to HTML
    contentDiv.innerHTML = marked.parse(text);

    // ✅ Apply syntax highlighting to <pre><code> blocks
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}