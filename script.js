// Chatbot DOM Elements
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotMinimized = document.getElementById('chatbot-minimized');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const listeningOverlay = document.getElementById('listening-overlay');
const quickReplies = document.getElementById('quick-replies');

// State Variables
let isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
let recognition = null;
let silenceTimer = null;
let hasInteractedWithBot = false;
let autoVoiceTriggered = false;

// Mock user state
const userData = {
    brands: 'boAt, Myntra',
    extraCount: 4,
    recentFailedTx: { merchant: 'Zomato', amount: '₹340', id: 'TXN89324021' }
};

// Toggle Chatbot Window
function toggleChatbot() {
    chatbotContainer.classList.toggle('expanded');
    const isExpanded = chatbotContainer.classList.contains('expanded');
    
    if (isExpanded) {
        chatbotMinimized.classList.add('hidden');
        resetSilenceTimer();
    } else {
        setTimeout(() => {
            chatbotMinimized.classList.remove('hidden');
        }, 300);
        clearTimeout(silenceTimer);
    }
    hasInteractedWithBot = true;
}

// Text-to-Speech Function
function speakText(text, callback) {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        
        // Settings for a softer, more human-like female voice
        msg.pitch = 1.15; 
        msg.rate = 0.95; 
        msg.volume = 1.0;

        // Find a high-quality female voice
        const voices = window.speechSynthesis.getVoices();
        let femaleVoice = voices.find(v => 
            v.name.includes('Female') || 
            v.name.includes('Zira') || 
            v.name.includes('Samantha') || 
            v.name.includes('Victoria')
        );
        
        // Assign the voice if found, else fallback
        if (femaleVoice) {
            msg.voice = femaleVoice;
        } else {
            msg.lang = 'en-IN'; 
        }
        
        msg.onend = () => {
            if (callback) callback();
        };

        window.speechSynthesis.speak(msg);
    } else {
        if (callback) callback();
    }
}

// Pre-load voices so they are ready when the bot speaks
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Initialization
window.onload = () => {
    applyDynamicButtonColors();

    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        chatbotContainer.classList.add('expanded');
        chatbotContainer.classList.remove('state-hidden');
        
        appendMessage('bot', "Hi! Welcome back to Paytm! I'm Paytm.AI, what can I do for you today?");
        
        // Proactive Voucher Warning
        setTimeout(() => {
            appendMessage('bot', `**Hurry up!** Your ${userData.brands} and +${userData.extraCount} more vouchers are getting expired. <a href="#" style="color:var(--paytm-light-blue); font-weight:bold; cursor:pointer;" onclick="claimVouchers(event)">Click here to claim!</a>`);
            resetSilenceTimer();
        }, 800);
        
    }, 1500);

    // Setup Speech Recognition
    if (isVoiceSupported) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            micBtn.classList.add('active');
            listeningOverlay.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            micBtn.classList.remove('active');
            listeningOverlay.classList.add('hidden');
            handleSend();
        };

        recognition.onerror = () => {
            micBtn.classList.remove('active');
            listeningOverlay.classList.add('hidden');
        };

        recognition.onend = () => {
            micBtn.classList.remove('active');
            listeningOverlay.classList.add('hidden');
        };
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    chatInput.addEventListener('input', () => {
        hasInteractedWithBot = true;
        clearTimeout(silenceTimer);
    });

    micBtn.addEventListener('click', () => {
        hasInteractedWithBot = true;
        clearTimeout(silenceTimer);
        startListening(false);
    });
};

function claimVouchers(e) {
    e.preventDefault();
    appendMessage('bot', "Awesome! We've automatically added the offers to your account. Go shop!");
}

function applyDynamicButtonColors() {
    const buttons = quickReplies.querySelectorAll('button');
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#00bcd4', '#009688', '#ff9800', '#ff5722'];
    
    // Shuffle colors
    colors.sort(() => 0.5 - Math.random());

    buttons.forEach((btn, index) => {
        const color = colors[index % colors.length];
        btn.style.backgroundColor = color;
        btn.style.color = '#fff';
        btn.style.borderColor = color;
    });
}

function startListening(triggerVibration = true) {
    if (triggerVibration && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]); // Vibrate twice
    }
    
    if (isVoiceSupported && recognition) {
        try { recognition.start(); } catch(e) { console.log(e); }
    } else {
        // Fallback mock
        listeningOverlay.classList.remove('hidden');
        setTimeout(() => {
            listeningOverlay.classList.add('hidden');
            chatInput.value = "I need help with a refund";
            handleSend();
        }, 2000);
    }
}

// Blind-Friendly 30s Timeout Auto-listen Logic
function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    if (!autoVoiceTriggered) {
        silenceTimer = setTimeout(() => {
            if (chatbotContainer.classList.contains('expanded')) {
                autoVoiceTriggered = true;
                const audioText = "How may I help you today! Now your voice will be recorded for processing.";
                
                appendMessage('bot', audioText);
                
                // Read out text, then vibrate & start listening
                speakText(audioText, () => {
                    startListening(true);
                });
            }
        }, 30000); // 30 seconds
    }
}

function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    appendMessage('user', text);
    chatInput.value = '';
    quickReplies.style.display = 'none';
    hasInteractedWithBot = true;
    clearTimeout(silenceTimer);

    showTypingIndicator();
    setTimeout(() => {
        processAIResponse(text);
    }, 1000 + Math.random() * 1000);
}

function sendQuickReply(text) {
    chatInput.value = text;
    handleSend();
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    let parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsedText = parsedText.replace(/\`(.*?)\`/g, '<code>$1</code>');
    
    msgDiv.innerHTML = parsedText;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot', 'typing-wrapper');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function processAIResponse(userInput) {
    removeTypingIndicator();
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('refund') || lowerInput.includes('failed') || lowerInput.includes('didn\'t go through') || lowerInput.includes('money')) {
        handleRefundRadarIntent();
        return;
    }
    
    if (lowerInput.includes('track') || lowerInput.includes('status')) {
        appendMessage('bot', `I have checked your account. The refund for **${userData.recentFailedTx.merchant}** (ID: ${userData.recentFailedTx.id}) is successfully lodged and in process. It will reflect in your account within the next 24-48 hours!`);
        return;
    }

    if (lowerInput.includes('how') || lowerInput.includes('where')) {
        appendMessage('bot', "I can help you navigate! Usually, all major features like Payments, Recharges, and Wallets are on the main Dashboard. Could you be a bit more specific on what you want to do?");
        return;
    }

    appendMessage('bot', "I am still learning! Could you please try asking about a failed payment, how to navigate a feature, or tracking your refunds?");
}

function handleRefundRadarIntent() {
    appendMessage('bot', "I understand you're facing an issue with a transaction. Let me check the **Refund Radar** systems immediately...");
    
    setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            const tx = userData.recentFailedTx;
            appendMessage('bot', `I found a failed transaction for **${tx.amount}** to **${tx.merchant}**. \n\nI have successfully lodged a **Refund Ticket**. Please be assured and do not take any stress! \n\nThe refund will be credited back within **24-48 hours**.`);
            appendActionCard("Ticket #RFD-8942-SUCCESS", "Refund lodged and processing. You can type 'track my refund' anytime to see the status.");
        }, 1500);
    }, 500);
}

function appendActionCard(title, desc) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot');
    msgDiv.innerHTML = `
        <div class="bot-action-box">
            <h5><i class="fas fa-check-circle" style="color: #4caf50;"></i> ${title}</h5>
            <p>${desc}</p>
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
