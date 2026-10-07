let conversationHistory = [];
let recognition = null;

let speechEnabled = true;
let speechQueue = [];
let currentSpeechIndex = 0;
let isPaused = false;
let isSpeaking = false;
let voiceListening = false;

const API_URL =
    "https://script.google.com/macros/s/AKfycbxk7CT74ypSbNfE60IqilhGp6rIflvwYdRITcge-X-RFhNnB5BbnV1GIht52hpXkj1EQg/exec";


// ========================================
// COMMAND CHECKER
// ========================================

function checkCommand(text) {

    const command = text.toLowerCase().trim();

    // GOOGLE
    if (
        command.includes("open google") ||
        command.includes("google kholo") ||
        command.includes("google khol do") ||
        command === "google"
    ) {
        window.open("https://www.google.com/", "_blank");
        return "Google khol rahi hoon 🌐";
    }


    // YOUTUBE
    if (
        command.includes("open youtube") ||
        command.includes("youtube kholo") ||
        command.includes("youtube khol do") ||
        command === "youtube"
    ) {
        window.open("https://www.youtube.com/", "_blank");
        return "YouTube khol rahi hoon ▶️";
    }


    // FIVERR
    if (
        command.includes("open fiverr") ||
        command.includes("fiverr kholo") ||
        command.includes("fiverr khol do")
    ) {
        window.open("https://www.fiverr.com/", "_blank");
        return "Fiverr khol rahi hoon 💼";
    }


    // LINKEDIN
    if (
        command.includes("open linkedin") ||
        command.includes("linkedin kholo") ||
        command.includes("linkedin khol do")
    ) {
        window.open("https://www.linkedin.com/", "_blank");
        return "LinkedIn khol rahi hoon 💼";
    }


    // TRADINGVIEW
    if (
        command.includes("open tradingview") ||
        command.includes("open trading view") ||
        command.includes("tradingview kholo") ||
        command.includes("trading view kholo") ||
        command.includes("tradingview khol do")
    ) {
        window.open("https://www.tradingview.com/", "_blank");
        return "TradingView khol rahi hoon 📈";
    }


    // GMAIL
    if (
        command.includes("open gmail") ||
        command.includes("gmail kholo") ||
        command.includes("gmail khol do") ||
        command.includes("email kholo")
    ) {
        window.open("https://mail.google.com/", "_blank");
        return "Gmail khol rahi hoon 📧";
    }


    return null;
}


// ========================================
// SEND MESSAGE
// ========================================

function sendMessage() {

    const input = document.getElementById("userInput");
    const chat = document.getElementById("chat");

    if (!input || !chat) return;

    const userText = input.value.trim();

    if (!userText) return;


    addMessage(userText, "user");

    conversationHistory.push({
        role: "user",
        content: userText
    });

    input.value = "";


    // CHECK LOCAL COMMAND FIRST
    const commandReply = checkCommand(userText);

    if (commandReply) {

        showBotResponse(commandReply);

        return;
    }


    // THINKING MESSAGE
    const botMessage = document.createElement("div");

    botMessage.className = "message bot";

    botMessage.innerHTML = `
        <div class="avatar">🤖</div>

        <div class="bubble thinking-bubble">

            <span class="thinking-text">
                Thinking
            </span>

            <span class="thinking-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>

        </div>
    `;

    chat.appendChild(botMessage);

    scrollToBottom();


    // SEND TO APPS SCRIPT
    fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
            message: userText,
            history: conversationHistory
        })

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error(
                "Server error: " + response.status
            );
        }

        return response.json();

    })

    .then(function(data) {

        console.log("AI Response:", data);

        const reply =
            data.reply ||
            "I couldn't generate a response.";


        conversationHistory.push({
            role: "assistant",
            content: reply
        });


        const bubble =
            botMessage.querySelector(".bubble");

        bubble.innerHTML = "";


        typeMessage(
            botMessage,
            reply
        );


        if (speechEnabled) {
            speakText(reply);
        }

    })

    .catch(function(error) {

        console.error(
            "Connection Error:",
            error
        );

        const bubble =
            botMessage.querySelector(".bubble");

        bubble.innerHTML =
            "Connection error 😭 Please check your Apps Script.";

    });
}


// ========================================
// BOT COMMAND RESPONSE
// ========================================

function showBotResponse(text) {

    const chat = document.getElementById("chat");

    if (!chat) return;

    const botMessage =
        document.createElement("div");

    botMessage.className =
        "message bot";

    botMessage.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="bubble"></div>
    `;

    chat.appendChild(botMessage);

    scrollToBottom();

    typeMessage(
        botMessage,
        text
    );

    conversationHistory.push({
        role: "assistant",
        content: text
    });

    if (speechEnabled) {
        speakText(text);
    }
}


// ========================================
// TYPING ANIMATION
// ========================================

function typeMessage(element, text) {

    const bubble =
        element.querySelector(".bubble");

    if (!bubble) return;

    bubble.innerHTML = "";

    let index = 0;

    const typingSpeed = 20;


    function typeCharacter() {

        if (index < text.length) {

            bubble.textContent +=
                text.charAt(index);

            index++;

            scrollToBottom();

            setTimeout(
                typeCharacter,
                typingSpeed
            );

        }
    }

    typeCharacter();
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(text, type) {

    const chat =
        document.getElementById("chat");

    if (!chat) return;

    const message =
        document.createElement("div");

    message.className =
        "message " + type;

    message.textContent = text;

    chat.appendChild(message);

    scrollToBottom();
}


// ========================================
// SCROLL
// ========================================

function scrollToBottom() {

    const chat =
        document.getElementById("chat");

    if (chat) {
        chat.scrollTop =
            chat.scrollHeight;
    }
}


// ========================================
// ENTER KEY
// ========================================

function handleKeyPress(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// ========================================
// CLEAR CHAT
// ========================================

function clearChat() {

    const chat =
        document.getElementById("chat");

    if (!chat) return;

    stopAllSpeech();

    chat.innerHTML = "";

    conversationHistory = [];

    console.log("🗑️ Chat cleared.");
}


// ========================================
// TEXT TO SPEECH
// ========================================

function speakText(text) {

    if (!speechEnabled) return;

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    speechQueue =
        String(text)
            .match(
                /[^.!?]+[.!?]+|[^.!?]+$/g
            )
            ?.map(function(sentence) {
                return sentence.trim();
            })
            .filter(Boolean)
            ||
            [String(text)];

    currentSpeechIndex = 0;

    isPaused = false;
    isSpeaking = false;

    updatePauseButton();

    speakNextPart();
}


// ========================================
// SPEAK NEXT PART
// ========================================

function speakNextPart() {

    if (!speechEnabled || isPaused) return;

    if (
        currentSpeechIndex >=
        speechQueue.length
    ) {

        isSpeaking = false;

        updatePauseButton();

        return;
    }


    const text =
        speechQueue[currentSpeechIndex];


    const utterance =
        new SpeechSynthesisUtterance(text);


    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;


    utterance.onstart = function() {

        isSpeaking = true;

        updatePauseButton();

    };


    utterance.onend = function() {

        if (isPaused) return;

        currentSpeechIndex++;

        setTimeout(
            speakNextPart,
            80
        );

    };


    utterance.onerror = function(event) {

        console.error(
            "Speech error:",
            event.error
        );

        isSpeaking = false;

        updatePauseButton();

    };


    window.speechSynthesis.speak(
        utterance
    );
}


// ========================================
// PAUSE / RESUME
// ========================================

function togglePause() {

    if (!("speechSynthesis" in window)) return;

    const synth =
        window.speechSynthesis;


    if (
        synth.speaking &&
        !synth.paused
    ) {

        synth.pause();

        isPaused = true;

        updatePauseButton();

        return;
    }


    if (synth.paused) {

        isPaused = false;

        synth.resume();

        updatePauseButton();

    }
}


// ========================================
// PAUSE BUTTON
// ========================================

function updatePauseButton() {

    const button =
        document.getElementById(
            "pauseVoiceButton"
        );

    if (!button) return;


    if (isPaused) {

        button.textContent = "▶️";
        button.title = "Resume";

    } else {

        button.textContent = "⏸️";
        button.title = "Pause";
    }
}


// ========================================
// VOICE ON / OFF
// ========================================

function toggleVoice() {

    speechEnabled =
        !speechEnabled;

    const button =
        document.getElementById(
            "voiceToggleButton"
        );


    if (speechEnabled) {

        if (button) {

            button.textContent = "🔊";
            button.title = "Voice ON";

        }

    } else {

        if (button) {

            button.textContent = "🔇";
            button.title = "Voice OFF";

        }

        stopAllSpeech();
    }
}


// ========================================
// STOP SPEECH
// ========================================

function stopAllSpeech() {

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    speechQueue = [];

    currentSpeechIndex = 0;

    isPaused = false;
    isSpeaking = false;

    updatePauseButton();
}


// ========================================
// VOICE INPUT
// ========================================

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported in this browser."
        );

        return;
    }


    if (voiceListening) return;


    recognition =
        new SpeechRecognition();


    // Keep this English because Chrome
    // works more reliably with it.
    // Roman Urdu commands are handled
    // after recognition.

    recognition.lang = "en-US";

    recognition.interimResults = false;

    recognition.continuous = false;


    recognition.onstart = function() {

        voiceListening = true;

        const button =
            document.querySelector(
                '.icon-button[title="Voice input"]'
            );


        if (button) {

            button.textContent = "🔴";

            button.title = "Listening...";

        }

        console.log("🎤 Listening...");
    };


    recognition.onresult = function(event) {

        const text =
            event.results[0][0]
                .transcript;


        console.log(
            "🎤 You said:",
            text
        );


        const input =
            document.getElementById(
                "userInput"
            );


        if (input) {

            input.value = text;

        }


        if (text.trim()) {

            sendMessage();

        }
    };


    recognition.onerror = function(event) {

        console.error(
            "Voice input error:",
            event.error
        );

        voiceListening = false;

        resetVoiceButton();
    };


    recognition.onend = function() {

        voiceListening = false;

        resetVoiceButton();

        console.log(
            "🎤 Voice input ended."
        );
    };


    recognition.start();
}


// ========================================
// RESET VOICE BUTTON
// ========================================

function resetVoiceButton() {

    const button =
        document.querySelector(
            '.icon-button[title="Listening..."]'
        );


    if (button) {

        button.textContent = "🎤";

        button.title = "Voice input";

    }
}


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const input =
            document.getElementById(
                "userInput"
            );


        if (input) {

            input.addEventListener(
                "keydown",
                handleKeyPress
            );

        }


        updatePauseButton();


        console.log(
            "🦇 Anusha AI ready."
        );

    }
);
   