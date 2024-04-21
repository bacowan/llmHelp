const vscode = acquireVsCodeApi();

var currentProblem = null;
var config = null;

async function sendClicked() {
    messageBox = document.getElementById("message-box");
    const userText = messageBox.value;
    addMessage(userText, "user");
    messageBox.value = "";

    if (currentProblem === null) {
        await setNewProblem(userText);
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
    loadingDiv = createLoadingDots();
    const response = await postAsyncMessage("prompt", text);
    loadingDiv.remove();
    addMessage(response, "bot");
}

async function postAsyncMessage(command, message) {
    return await new Promise((resolve, reject) => {
        const eventListener = event => {
            const message = event.data;
            if (message.command === 'return') {
                window.removeEventListener('message', eventListener);
                resolve(message.data);
            }
            // TODO: Timeout and reject?
        };
    
        window.addEventListener('message', eventListener);
    
        vscode.postMessage({ command: command, data: message });
    });
}

async function setNewProblem(value) {
    asNumber = Number(value);
    if (Number.isInteger(asNumber) && asNumber - 1 < config.problems.length) {
        currentProblem = config.problems[asNumber - 1];

        loadingDiv = createLoadingDots();
        await postAsyncMessage("initialize", currentProblem);
        loadingDiv.remove();

        addMessage(config.lang['ICanHelpWithHomework'][config.userLanguage], "bot");
    }
    else {
        addMessage(
            config.lang['InputFrom1ToStart'][config.userLanguage]
                + config.problems.length
                + config.lang['InputFrom1ToEnd'][config.userLanguage],
            "bot");
    }
}

function createLoadingDots() {
    chatContainer = document.getElementById("chat-container");
    const container = document.createElement("div");
    container.classList.add("loading-indicator");
    container.appendChild(createDot(1));
    container.appendChild(createDot(2));
    container.appendChild(createDot(3));
    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
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
    options.unshift(config.lang['SelectNumberOfProblem'][config.userLanguage]);
    addMessage(options, 'bot');
}

window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'loadConfig':
            onConfigLoaded(message.data);
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

vscode.postMessage({ command: "loaded" });