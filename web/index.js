var currentProblem = null;
var config = null;

async function sendClicked() {
    messageBox = document.getElementById("message-box");
    const userText = messageBox.value;
    addMessage(userText, "user");
    messageBox.value = "";

    if (currentProblem === null) {
        setNewProblem(userText);
    }
    else {
        await sendNewPrompt(userText);
    }
}

function addMessage(text, role) {
    chatContainer = document.getElementById("chat-container");

    userMessageBubble = document.createElement("div");
    userMessageBubble.classList.add("message");
    userMessageBubble.classList.add(role);
    userMessageTextP = document.createElement("p");

    if (Array.isArray(text)) {
        for (let x = 0; x < text.length; x++) {
            userMessageText = document.createTextNode(text[x]);
            userMessageTextP.appendChild(userMessageText);
            if (x < text.length - 1) {
                userMessageTextP.appendChild(document.createElement("br"));
            }
        }
    }
    else {
        userMessageText = document.createTextNode(text);
        userMessageTextP.appendChild(userMessageText);
    }

    userMessageBubble.appendChild(userMessageTextP);

    chatContainer.appendChild(userMessageBubble);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendNewPrompt(text) {
    chatContainer = document.getElementById("chat-container");
    loadingDiv = createLoadingDots();
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    await new Promise(r => setTimeout(r, 2000));
    const response = "hi!";

    loadingDiv.remove();
    addMessage(response, "bot");
}

function setNewProblem(value) {
    asNumber = Number(value);
    if (Number.isInteger(asNumber) && asNumber - 1 < config.problems.length) {
        currentProblem = config.problems[asNumber - 1];
        addMessage("Hello! I can assist you with your homework assignment! What do you need help with?", "bot");
    }
    else {
        addMessage(`Please input a number from 1 to ${config.problems.length}`, "bot");
    }
}

function createLoadingDots() {
    const container = document.createElement("div");
    container.classList.add("loading-indicator");
    container.appendChild(createDot(1));
    container.appendChild(createDot(2));
    container.appendChild(createDot(3));
    return container;
}

function createDot(index) {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    dot.classList.add("dot" + index);
    return dot;
}

function onConfigLoaded(newConfig) {
    config = newConfig;
    currentProblem = null;
    const options = config.problems.map((p, i) => `${i + 1}. ${p.Title}`);
    options.unshift('Please input the number of the problem you are working on:');
    addMessage(options, 'bot');
}

window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
        case 'loadConfig':
            onConfigLoaded(JSON.parse(message.data));
            break;
    }
});

document.getElementById("send-button").addEventListener("click", sendClicked);
document.getElementById("message-box").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.key === 'Enter') {
        sendClicked();
    }
});