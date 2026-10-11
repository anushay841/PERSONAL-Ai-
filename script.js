
"use strict";

// ========================================
// ANUSHA AI ASSISTANT
// ========================================

let conversationHistory = [];
let recognition = null;

let speechEnabled = true;
let isPaused = false;
let isSpeaking = false;
let voiceListening = false;

let currentUtterance = null;
let currentSpeechText = "";
let speechCharIndex = 0;
let speechWasMuted = false;

let typingTimer = null;
let requestInProgress = false;

// Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbxk7CT74ypSbNfE60IqilhGp6rIflvwYdRITcge-X-RFhNnB5BbnV1GIht52hpXkj1EQg/exec";

// ========================================
// WEBSITE COMMANDS
// ========================================

function checkCommand(text) {
    const command = text.toLowerCase().trim();

    const sites = [
        {
            names: ["youtube"],
            url: "https://www.youtube.com/",
            english: "Opening YouTube.",
            romanUrdu: "YouTube khol rahi hoon."
        },
        {
            names: ["google"],
            url: "https://www.google.com/",
            english: "Opening Google.",
            romanUrdu: "Google khol rahi hoon."
        },
        {
            names: ["fiverr"],
            url: "https://www.fiverr.com/",
            english: "Opening Fiverr.",
            romanUrdu: "Fiverr khol rahi hoon."
        },
        {
            names: ["linkedin"],
            url: "https://www.linkedin.com/",
            english: "Opening LinkedIn.",
            romanUrdu: "LinkedIn khol rahi hoon."
        },
        {
            names: ["tradingview", "trading view"],
            url: "https://www.tradingview.com/",
            english: "Opening TradingView.",
            romanUrdu: "TradingView khol rahi hoon."
        },
        {
            names: ["gmail"],
            url: "https://mail.google.com/",
            english: "Opening Gmail.",
            romanUrdu: "Gmail khol rahi hoon."
        }
    ];

    const englishCommand = /\b(open|launch|visit|go to)\b/i.test(command);
    const urduCommand = /\b(kholo|khol|khol do|kholna)\b/i.test(command);

    for (const site of sites) {
        const mentionsSite = site.names.some(name => command.includes(name));

        if (!mentionsSite) continue;
        if (!englishCommand && !urduCommand) continue;

        return {
            url: site.url,
            reply: englishCommand ? site.english : site.romanUrdu
        };
    }

    return null;
}

// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {
    const input = document.getElementById("userInput");
    const chat = document.getElementById("chat");

    if (!input || !chat) return;

    const userText = input.value.trim();
    if (!userText || requestInProgress) return;

    addMessage(userText, "user");

    conversationHistory.push({
        role: "user",
        content: userText
    });

    input.value = "";

    
const command = checkCommand(userText);

if (command) {
    // Open the website immediately.
    window.open(command.url, "_blank");

    // Show the reply without opening the website again.
    showBotResponse(command.reply);

    conversationHistory.push({
        role: "assistant",
        content: command.reply
    });

    return;
}

requestInProgress = true;


    const botMessage = document.createElement("div");
    botMessage.className = "message bot";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const bubble = document.createElement("div");
    bubble.className = "bubble thinking-bubble";
    bubble.textContent = "Thinking...";

    botMessage.append(avatar, bubble);
    chat.appendChild(botMessage);
    scrollToBottom();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                message: userText,
                history: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();
        console.log("AI Response:", data);

        const reply = data.reply || "I couldn't generate a response.";

        conversationHistory.push({
            role: "assistant",
            content: reply
        });

        typeMessage(botMessage, reply);
        speakText(reply);

    } catch (error) {
        console.error("AI connection error:", error);

        bubble.classList.remove("thinking-bubble");
        bubble.textContent =
            "Connection error. Please check your internet and Apps Script deployment.";

    } finally {
        requestInProgress = false;
    }
}

// ========================================
// DISPLAY BOT RESPONSE
// ========================================

function showBotResponse(text, url = null) {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const message = document.createElement("div");
    message.className = "message bot";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open website";
        link.style.display = "inline-block";
        link.style.marginTop = "8px";
        link.style.color = "#ff5068";

        bubble.appendChild(document.createElement("br"));
        bubble.appendChild(link);

        // Opening a new tab may be blocked by browser settings.
        window.open(url, "_blank", "noopener,noreferrer");
    }

    message.append(avatar, bubble);
    chat.appendChild(message);
    scrollToBottom();

    speakText(text);
}

// ========================================
// TYPE RESPONSE
// Pause stops typing; Resume continues.
// ========================================

function typeMessage(element, text) {
    const bubble = element.querySelector(".bubble");
    if (!bubble) return;

    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }

    bubble.classList.remove("thinking-bubble");
    bubble.textContent = "";

    let index = 0;

    function typeNext() {
        if (!bubble.isConnected) {
            typingTimer = null;
            return;
        }

        if (isPaused) {
            typingTimer = setTimeout(typeNext, 100);
            return;
        }

        if (index < text.length) {
            bubble.textContent += text.charAt(index);
            index++;
            scrollToBottom();
            typingTimer = setTimeout(typeNext, 25);
        } else {
            typingTimer = null;
        }
    }

    typeNext();
}

// ========================================
// ADD MESSAGE
// ========================================

function addMessage(text, type) {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const message = document.createElement("div");
    message.className = "message " + type;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    message.appendChild(bubble);
    chat.appendChild(message);

    scrollToBottom();
}

// ========================================
// SCROLL
// ========================================

function scrollToBottom() {
    const chat = document.getElementById("chat");
    if (chat) chat.scrollTop = chat.scrollHeight;
}

// ========================================
// ENTER KEY
// ========================================

function handleKeyPress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ========================================
// CLEAR CHAT
// ========================================

function clearChat() {
    const chat = document.getElementById("chat");

    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }

    stopAllSpeech();

    if (chat) chat.innerHTML = "";

    conversationHistory = [];
}

// ========================================
// TEXT TO SPEECH
// ========================================

function speakText(text) {
    if (!speechEnabled || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    currentSpeechText = String(text);
    speechCharIndex = 0;
    currentUtterance = null;
    isSpeaking = false;
    speechWasMuted = false;

    if (!isPaused) startCurrentSpeech();
}

function startCurrentSpeech() {
    if (!speechEnabled || !currentSpeechText || isPaused) return;

    const synth = window.speechSynthesis;
    const fullText = currentSpeechText;
    const startIndex = Math.min(speechCharIndex, fullText.length);

    if (startIndex >= fullText.length) {
        finishSpeech();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(
        fullText.substring(startIndex)
    );

    currentUtterance = utterance;

    utterance.lang = /[\u0600-\u06FF]/.test(fullText)
        ? "ur-PK"
        : "en-US";

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onboundary = function(event) {
        if (currentUtterance !== utterance) return;

        if (typeof event.charIndex === "number") {
            speechCharIndex = startIndex + event.charIndex;
        }
    };

    utterance.onstart = function() {
        if (currentUtterance !== utterance) return;

        isSpeaking = true;
        updatePauseButton();
    };

    utterance.onend = function() {
        if (currentUtterance !== utterance) return;

        speechCharIndex = fullText.length;
        finishSpeech();
    };

    utterance.onerror = function(event) {
        if (currentUtterance !== utterance) return;

        if (event.error !== "canceled" &&
            event.error !== "interrupted") {
            console.warn("Speech error:", event.error);
        }

        currentUtterance = null;
        isSpeaking = false;
        updatePauseButton();
    };

    synth.speak(utterance);
}

function finishSpeech() {
    currentUtterance = null;
    currentSpeechText = "";
    speechCharIndex = 0;
    speechWasMuted = false;
    isSpeaking = false;
    updatePauseButton();
}

// ========================================
// PAUSE / RESUME TEXT AND SPEECH
// ========================================

function togglePause() {
    const synth = window.speechSynthesis;

    if (!isPaused) {
        isPaused = true;

        if (synth && synth.speaking && !synth.paused) {
            synth.pause();
        }

        updatePauseButton();
        return;
    }

    isPaused = false;

    if (currentSpeechText && speechEnabled) {
        if (synth && synth.paused && currentUtterance) {
            synth.resume();
        } else if (!currentUtterance) {
            startCurrentSpeech();
        }
    }

    updatePauseButton();
}

function updatePauseButton() {
    const button = document.getElementById("pauseVoiceButton");
    if (!button) return;

    button.textContent = isPaused ? "▶️" : "⏸️";
    button.title = isPaused ? "Resume" : "Pause";
    button.setAttribute("aria-label", button.title);
}

// ========================================
// SOUND ON / OFF
// ========================================

function toggleVoice() {
    speechEnabled = !speechEnabled;

    const button = document.getElementById("voiceToggleButton");

    if (button) {
        button.textContent = speechEnabled ? "🔊" : "🔇";
        button.title = speechEnabled ? "Sound ON" : "Sound OFF";
        button.setAttribute("aria-label", button.title);
    }

    if (!speechEnabled) {
        speechWasMuted = Boolean(currentSpeechText) &&
            Boolean(currentUtterance) &&
            (isSpeaking || window.speechSynthesis.speaking);

        if (speechWasMuted) {
            // Save the last known character position before cancelling.
            window.speechSynthesis.cancel();
            currentUtterance = null;
            isSpeaking = false;
        }
    } else if (speechWasMuted && currentSpeechText && !isPaused) {
        speechWasMuted = false;
        startCurrentSpeech();
    } else {
        speechWasMuted = false;
    }

    updatePauseButton();
}

function stopAllSpeech() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    currentUtterance = null;
    currentSpeechText = "";
    speechCharIndex = 0;
    speechWasMuted = false;
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
        alert("Voice input is not supported. Please try Chrome.");
        return;
    }

    if (voiceListening) {
        if (recognition) recognition.stop();
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = function() {
        voiceListening = true;
        setVoiceButton(true);
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById("userInput");

        if (input) {
            input.value = transcript;
            sendMessage();
        }
    };

    recognition.onerror = function(event) {
        console.warn("Voice input error:", event.error);
        voiceListening = false;
        setVoiceButton(false);
    };

    recognition.onend = function() {
        voiceListening = false;
        setVoiceButton(false);
    };

    try {
        recognition.start();
    } catch (error) {
        console.error("Could not start microphone:", error);
    }
}

function setVoiceButton(listening) {
    const button = document.querySelector(
        'button[onclick="startVoiceInput()"]'
    );

    if (!button) return;

    button.textContent = listening ? "🔴" : "🎤";
    button.title = listening ? "Listening..." : "Voice input";
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("userInput");

    if (input) {
        input.onkeydown = handleKeyPress;
    }

    updatePauseButton();

    const soundButton = document.getElementById("voiceToggleButton");

    if (soundButton) {
        soundButton.textContent = speechEnabled ? "🔊" : "🔇";
    }

    console.log("Anusha AI loaded successfully.");
});
