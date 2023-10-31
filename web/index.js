async function sendClicked() {
    messageBox = document.getElementById("message-box");
    const userText = messageBox.value;
    addMessage(userText, "user");
    messageBox.value = "";

    await sendNewPrompt(userText);
}

function addMessage(text, role) {
    chatContainer = document.getElementById("chat-container");

    userMessageBubble = document.createElement("div");
    userMessageBubble.classList.add("message");
    userMessageBubble.classList.add(role);
    userMessageTextP = document.createElement("p");
    userMessageText = document.createTextNode(text);
    userMessageTextP.appendChild(userMessageText);
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

document.getElementById("send-button").addEventListener("click", sendClicked);