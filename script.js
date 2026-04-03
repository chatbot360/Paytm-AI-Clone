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
let hasInteractedWithBot = false;
let expectingTxnInfo = false;

// Mock user state
const userData = {
    brands: 'boAt, Myntra',
    extraCount: 4,
    recentFailedTx: { merchant: 'Zomato', amount: '₹340', id: 'TXN89324021' },
    refundLodged: false
};

// Toggle Chatbot Window
function toggleChatbot() {
    chatbotContainer.classList.toggle('expanded');
    const isExpanded = chatbotContainer.classList.contains('expanded');
    
    if (isExpanded) {
        chatbotMinimized.classList.add('hidden');
    } else {
        setTimeout(() => {
            chatbotMinimized.classList.remove('hidden');
        }, 300);
    }
    hasInteractedWithBot = true;
}

function toggleFeaturesMenu() {
    const qr = document.getElementById('quick-replies');
    const icon = document.querySelector('#features-toggle-btn i');
    if (qr.classList.contains('hidden')) {
        qr.classList.remove('hidden');
        document.getElementById('chat-back-btn').classList.add('hidden');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-times');
    } else {
        qr.classList.add('hidden');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-plus');
    }
}

function showQuickReplies(e) {
    if(e) e.stopPropagation();
    const qr = document.getElementById('quick-replies');
    qr.classList.remove('hidden');
    document.getElementById('chat-back-btn').classList.add('hidden');
    
    const icon = document.querySelector('#features-toggle-btn i');
    if (icon) {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-times');
    }
}

// Initialization
window.onload = () => {
    applyDynamicButtonColors();
    chatbotContainer.classList.remove('expanded');
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        // Let the radar spawn logic if it needs any offsets
        setTimeout(() => {
            const radar = document.getElementById('refund-radar-minimized');
            if(radar) radar.classList.add('roll-out-anim');
        }, 800);
        
        appendMessage('bot', "Hi! Welcome back to Paytm! I'm Paytm.AI, what can I do for you today?");
        
        // Proactive Voucher Warning
        setTimeout(() => {
            appendMessage('bot', `**Hurry up!** Your ${userData.brands} and +${userData.extraCount} more vouchers are getting expired. <a href="#" style="color:var(--paytm-light-blue); font-weight:bold; cursor:pointer;" onclick="claimVouchers(event)">Click here to claim!</a>`);
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
    });

    micBtn.addEventListener('click', () => {
        hasInteractedWithBot = true;
        startListening(false);
    });
};

function claimVouchers(e) {
    e.preventDefault();
    appendMessage('bot', "Awesome! We've automatically added the offers to your account. Go shop!");
}

function applyDynamicButtonColors() {
    const buttons = quickReplies.querySelectorAll('button');
    const defaultColor = '#00baf2'; // Paytm light blue
    
    buttons.forEach((btn) => {
        btn.style.backgroundColor = defaultColor;
        btn.style.color = '#fff';
        btn.style.borderColor = defaultColor;
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

function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    appendMessage('user', text);
    chatInput.value = '';
    hasInteractedWithBot = true;

    showTypingIndicator();
    setTimeout(() => {
        processAIResponse(text);
    }, 1000 + Math.random() * 1000);
}

function sendQuickReply(text) {
    document.getElementById('quick-replies').classList.add('hidden');
    document.getElementById('chat-back-btn').classList.remove('hidden');
    
    const icon = document.querySelector('#features-toggle-btn i');
    if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-plus');
    }
    
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
    
    if (expectingTxnInfo) {
        expectingTxnInfo = false;
        const merchants = ['Amazon India', 'Flipkart', 'Swiggy', 'Zomato', 'MakeMyTrip', 'Starbucks', 'Uber Rides'];
        const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
        const randomAmount = '₹' + (Math.floor(Math.random() * 5000) + 150);
        userData.recentFailedTx = { merchant: randomMerchant, amount: randomAmount, id: 'TXN'+Math.floor(Math.random()*99999999) };
        userData.refundLodged = true;
        
        appendMessage('bot', `Thank you for details. I located your transaction for **${randomAmount}** to **${randomMerchant}**.\n\nI have successfully lodged a **Refund Ticket**. Please be assured and do not take any stress!\n\nThe refund will be credited back within **24-48 hours**.`);
        appendActionCard(`Ticket #RFD-${Math.floor(Math.random()*9999)}-SUCCESS`, "Refund lodged and processing. You can type 'track complaint' anytime to see the status.");
        return;
    }
    
    if (lowerInput.includes('refund') || lowerInput.includes('failed') || lowerInput.includes('didn\'t go through') || lowerInput.includes('money') || lowerInput.includes('complaint')) {
        handleRefundRadarIntent();
        return;
    }
    
    if (lowerInput.includes('track') || lowerInput.includes('status')) {
        if (!userData.refundLodged) {
            appendMessage('bot', "There is no refund ticket lodged yet. Let me quickly scan your last transactions...");
            handleRefundRadarIntent();
        } else {
            appendTrackingTimeline();
        }
        return;
    }

    if (lowerInput.includes('how to pay') || lowerInput.includes('scan qr') || lowerInput.includes('pay merchant') || lowerInput.includes('phone number') || lowerInput.includes('pay via qr')) {
        appendMessage('bot', "Scanning a QR code on Paytm is incredibly easy! \n\n1. Tap the **Scan QR Code** card button at the center of your screen.\n2. Point your camera at the QR code.\n3. Enter the amount to pay and enter your UPI PIN.\n\nAlternatively, you can just click the **Scan QR Code** card directly on this website!");
        return;
    }

    // FAQ Accordion UI
    if (lowerInput.includes('faq')) {
        const faqs = [
            { q: "Why did my UPI transaction fail even though I entered the correct PIN?", ans: "Starting April 1, 2026, UPI requires an additional layer of authentication (like a fingerprint or OTP) for many transactions. Please ensure you completed the second verification step. Other causes include low server connectivity or bank downtime. Check your \"Bank Status\" in the app to see if your bank's servers are active" },
            { q: "Money was debited from my account, but the recipient hasn't received it. What now?", ans: "Don't worry! This usually happens due to a technical delay between banks. If the transaction is \"Pending,\" the money will either reach the recipient or be refunded to your account within 3–5 business days. You can track the real-time status in the \"Balance & History\" section." },
            { q: "Can I still use my Paytm Payments Bank (PPBL) Debit Card?", ans: "As per recent notices, PPBL Debit Cards remain functional until their 8-year expiry date for existing balances. However, per RBI directives, issuance of new cards is currently on hold. If your card has expired, you can still use UPI or Net Banking to access your funds" },
            { q: "How do I know if my KYC has expired?", ans: "Tap your profile icon on the top left. A Blue Tick next to your name indicates Full KYC. If your Minimum KYC has expired (usually after 24 months), you will see a notification to upgrade. Without Full KYC, you cannot add money to your wallet or transfer balances to a bank." },
            { q: "I received a call asking for my OTP to \"unblock\" my account. Should I give it?", ans: "NEVER. Paytm employees will never ask for your OTP, PIN, or Password over the phone, SMS, or email. If someone asks for these, hang up immediately and report the number in our \"Security & Fraud\" section." },
            { q: "How do I report a fraudulent transaction?", ans: "Go to \"Help & Support\" and select the specific transaction from your history. Choose \"Report Fraud\" to instantly raise a ticket. Our team will investigate and coordinate with the bank to secure your account." },
            { q: "How can I increase my daily UPI transfer limit?", ans: "Standard UPI limits are set at ₹1 Lakh per day by NPCI. However, for specific categories like Insurance, Education, or IPOs, the limit can be higher. New UPI registrations have a limit of ₹5,000 for the first 24 hours for security reasons." },
            { q: "Can I change the mobile number linked to my KYC account?", ans: "Yes. Go to your Profile > Edit Profile > Update Number. You will need access to your old number for OTP verification. If you no longer have access to the old number, please use the \"De-link KYC\" option in the 24x7 Help section." },
            { q: "How do I get a refund for a failed Bill Payment (Electricity/Water)?", ans: "Most billers take 24–48 hours to confirm a payment. If the biller rejects the payment, your refund is initiated automatically. It typically reflects in your source account (Bank/Wallet) within 7 business days." },
            { q: "My Samsung/Android phone screen is broken; how do I access my account on a new device?", ans: "Simply download Paytm on your new device and log in with your registered mobile number. For security, we will send an SMS from your phone to verify the device. Note: Only one active login is allowed at a time for your safety." }
        ];

        let html = '<div class="faq-accordion">';
        faqs.forEach((faq) => {
            html += `
            <div class="faq-item" onclick="toggleFaq(this)">
                <div class="faq-question">
                    <span class="faq-toggle-icon">+</span>
                    <span>${faq.q}</span>
                </div>
                <div class="faq-answer">${faq.ans}</div>
            </div>`;
        });
        html += '</div>';

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot');
        msgDiv.innerHTML = "Here are answers to some commonly asked questions! Tap the **+** symbol to view the answer:<br>" + html;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return;
    }

    // Match individual non-faq array items explicitly if needed
    const specificFaqMatch = [
        { q: "fail", ans: "Starting April 1, 2026, UPI requires an additional layer of authentication. Please ensure you completed the second verification step." },
        { q: "fraud", ans: "Go to \"Help & Support\" and select the specific transaction from your history to Report Fraud." }
    ].find(f => lowerInput.includes(f.q));
    if (specificFaqMatch) {
         appendMessage('bot', specificFaqMatch.ans);
         return;
    }
    
    if (lowerInput.includes('book') || lowerInput.includes('order')) {
        let keyword = 'ticket';
        if (lowerInput.includes('ola') || lowerInput.includes('uber') || lowerInput.includes('rapido')) {
            keyword = lowerInput.match(/ola|uber|rapido/i)[0];
            appendMessage('bot', `I can help you book your **${keyword}** directly through Paytm!\n\n✨ **Special Offer:** If you book your ride now using our link, you will be rewarded with **up to 50% cashback** and **2 free coupons/vouchers** for your next rides!\n\n<a href="#" style="display:inline-block; margin-top:10px; background:var(--paytm-light-blue); color:white; padding:8px 15px; border-radius:20px; text-decoration:none; font-weight:bold;" onclick="alert('Redirecting to ${keyword} Mini-App securely...')">Proceed to ${keyword}</a>`);
            return;
        } else if (lowerInput.includes('order')) {
            appendMessage('bot', "Hungry or Need Groceries? 🍔 You can safely order anything online now!\n\n✨ **Special Deal:** Use code **FREE25** and save 25% off today + earn cashback!");
            return;
        } else {
            const match = lowerInput.match(/book a\s+(\w+)|book\s+(\w+)/i);
            const item = match ? (match[1] || match[2]) : 'ticket';
            const cashback = Math.floor(Math.random() * 51); // 0 to 50
            
            appendMessage('bot', `I can help you book your **${item}**!\n\n1. Go to the "Ticket Booking" section on the dashboard.\n2. Select your dates and preferences.\n3. Make the payment.\n\n✨ **Pro Tip:** Apply the promo code **BUYNOW50** during checkout to grab up to **${cashback}% cashback** instantly!`);
            return;
        }
    }

    if (lowerInput.includes('history') || lowerInput.includes('transactions') || lowerInput.includes('last')) {
        appendMessage('bot', "Sure! Please give me **3-4 seconds** while I securely process and build the PDF in preview format for your recent transactions...");
        setTimeout(() => {
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                generatePDFPreview(5);
                appendActionCard("Statement Generated", "A PDF statement containing your latest transactions is ready for viewing.");
            }, 3500);
        }, 500);
        return;
    }

    if (lowerInput.includes('thanks') || lowerInput.includes('thank you') || lowerInput.includes('appreciate')) {
        appendMessage('bot', "I am firmly obliged to serve you. Have a fantastic day ahead!");
        return;
    }

    appendMessage('bot', "I'm specialized in the Paytm ecosystem, but I am firmly obliged to serve you! Could you please try asking about payments, refunds, booking tickets, or your transaction history?");
}

function handleRefundRadarIntent() {
    if (userData.refundLodged) {
        processAIResponse('track');
        return;
    }
    
    expectingTxnInfo = true;
    appendMessage('bot', "I understand you're facing an issue with a transaction. Activating the **Refund Radar**... \n\nTo investigate further, could you please provide me with the **Transaction ID** or the **Amount** deducted?");
}

function appendTrackingTimeline() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot', 'tracker-container');
    msgDiv.innerHTML = `
        <div class="tracker-header">
            <h4>Refund Radar Status</h4>
            <span class="close-tracker">Close</span>
        </div>
        <div class="tracker-body">
            <div class="track-step success">
                <div class="icon-circle"><i class="fas fa-mobile-alt"></i></div>
                <div class="step-info">
                    <strong>User</strong>
                    <p>Verified</p>
                </div>
            </div>
            <div class="track-step error">
                <div class="icon-circle"><i class="far fa-credit-card"></i></div>
                <div class="step-info">
                    <strong>Bank</strong>
                    <p>Issue detected at Bank server</p>
                </div>
                <span class="badge badge-stuck">STUCK</span>
            </div>
            <div class="track-step pending">
                <div class="icon-circle"><i class="fas fa-shield-alt"></i></div>
                <div class="step-info">
                    <strong>NPCI</strong>
                    <p>Waiting for response</p>
                </div>
            </div>
            <div class="track-step pending">
                <div class="icon-circle"><i class="fas fa-arrow-right"></i></div>
                <div class="step-info">
                    <strong>Merchant</strong>
                    <p>Waiting for response</p>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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

// ==========================================
// MOCK PAYMENT MODAL & REFUND RADAR HANDLING
// ==========================================

function openPaymentMock(title) {
    const modal = document.getElementById('payment-modal');
    const paymentTitle = document.getElementById('payment-title');
    const paymentStatus = document.getElementById('payment-status');
    const paymentLoader = document.getElementById('payment-loader');
    const closeBtn = document.getElementById('close-payment-btn');
    const inputArea = document.getElementById('payment-input-area');
    const scannerArea = document.getElementById('payment-scanner-area');

    paymentTitle.innerText = title;
    paymentStatus.innerText = "";
    paymentStatus.classList.remove('hidden');
    paymentLoader.className = 'payment-loader hidden';
    closeBtn.classList.add('hidden');
    inputArea.classList.add('hidden');
    scannerArea.classList.add('hidden');

    if (title === 'Scan QR Code') {
        scannerArea.classList.remove('hidden');
        paymentStatus.innerText = "Please scan a QR Code";
    } else if (title === 'Pay Mobile Number') {
        inputArea.classList.remove('hidden');
        document.getElementById('payment-number-input').value = '';
        paymentStatus.innerText = "Enter details to proceed";
    } else {
        // Fallback for seamless direct payment
        startPaymentProcess();
    }
    modal.classList.remove('hidden');
}

function startPaymentProcess() {
    const paymentStatus = document.getElementById('payment-status');
    const paymentLoader = document.getElementById('payment-loader');
    const closeBtn = document.getElementById('close-payment-btn');
    
    document.getElementById('payment-input-area').classList.add('hidden');
    document.getElementById('payment-scanner-area').classList.add('hidden');
    
    paymentLoader.classList.remove('hidden');
    paymentLoader.className = 'payment-loader';
    paymentStatus.innerText = "Connecting securely...";

    setTimeout(() => {
        paymentStatus.innerText = "Processing Payment...";
        setTimeout(() => {
            paymentLoader.classList.add('success');
            paymentStatus.innerText = "Payment Successful!";
            closeBtn.classList.remove('hidden');
            showClaimVoucherTooltip();
        }, 2000);
    }, 1500);
}

function showClaimVoucherTooltip() {
    const tooltip = document.getElementById('claim-tooltip');
    if(tooltip) {
        tooltip.classList.remove('hidden');
        setTimeout(() => {
            tooltip.classList.add('hidden');
        }, 6000);
    }
}

function closePaymentMock() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden');
}

function handleRadarClick() {
    // If not expanded, expand it
    if (!chatbotContainer.classList.contains('expanded')) {
        toggleChatbot();
    }
    
    document.getElementById('refund-radar-minimized').classList.add('hidden');
}

// Ensure radar icon disappears when chatbot expands manually
const originalToggle = toggleChatbot;
toggleChatbot = function() {
    originalToggle();
    const isExpanded = chatbotContainer.classList.contains('expanded');
    const radar = document.getElementById('refund-radar-minimized');
    if (isExpanded) {
        radar.classList.add('hidden');
    } else {
        setTimeout(() => {
            radar.classList.remove('hidden');
        }, 300);
    }
}


// ==========================================
// PDF GENERATION LOGIC
// ==========================================

let activePDFDoc = null;

function generatePDFPreview(limit) {
    if (!window.jspdf) {
        console.error("jsPDF not loaded.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Paytm Transaction Statement", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`User: Default User Account`, 14, 38);

    const mockData = [
        ["Txn ID", "Date/Time", "Merchant", "Amount", "Cashback"],
        ["PTM1001", "10-04 14:20", "Zomato", "Rs.340.00", "Rs.0"],
        ["PTM1002", "09-04 09:15", "Uber Rides", "Rs.125.50", "Rs.10"],
        ["PTM1003", "08-04 18:30", "Amazon India", "Rs.1450.00", "Rs.50"],
        ["PTM1004", "07-04 20:00", "Jio Recharge", "Rs.399.00", "Rs.0"],
        ["PTM1005", "05-04 11:45", "Starbucks", "Rs.450.00", "Rs.20"]
    ];

    let startY = 50;
    mockData.forEach((row, i) => {
        if (i === 0) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        
        let startX = 14;
        row.forEach((cell, j) => {
            doc.text(cell, startX, startY);
            startX += (j === 2) ? 50 : 35;
        });
        startY += i === 0 ? 15 : 10;
        
        if (i === 0) {
            doc.line(14, startY - 8, 190, startY - 8);
        }
    });

    doc.line(14, startY, 190, startY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("This is a computer-generated simulated statement.", 14, startY + 10);
    
    activePDFDoc = doc;
    const blobString = doc.output('datauristring');
    const iframe = document.getElementById('pdf-iframe');
    iframe.src = blobString;
    document.getElementById('pdf-preview-modal').classList.remove('hidden');
}

function closePDFModal() {
    document.getElementById('pdf-preview-modal').classList.add('hidden');
    document.getElementById('pdf-iframe').src = '';
}

function downloadActivePDF() {
    if (activePDFDoc) {
        activePDFDoc.save('Paytm_Statement.pdf');
    }
}

function printActivePDF() {
    if (activePDFDoc) {
        activePDFDoc.autoPrint();
        window.open(activePDFDoc.output('bloburl'), '_blank');
    }
}

window.toggleFaq = function(el) {
    const isActive = el.classList.contains('active');
    
    // Close all other FAQs safely within the specific container
    const container = el.closest('.faq-accordion');
    if (container) {
        container.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-toggle-icon').innerText = '+';
        });
    }
    
    // Toggle the clicked FAQ
    if (!isActive) {
        el.classList.add('active');
        el.querySelector('.faq-toggle-icon').innerText = '−'; // minus symbol
        
        // Auto scroll down slightly to ensure space for the expanded text
        setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    }
};
