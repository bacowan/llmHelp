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

    const codeBreaks = text.split("```");
    for (let x = 0; x < codeBreaks.length; x++) {
        // alternates between non-code (even) and code (odd)
        if (x % 2 === 0) {
            const lineBreaks = codeBreaks[x].split("\n");
            for (let y = 0; y < lineBreaks.length; y++) {
                userMessageTextP.appendChild(document.createTextNode(lineBreaks[y]));
                if (x !== codeBreaks[x].length - 1 && y !== lineBreaks.length - 1) {
                    userMessageTextP.appendChild(document.createElement("br"));
                }
            }
        }
        else {
            const lineBreaks = codeBreaks[x].split("\n");
            const userMessageCode = document.createElement("pre");
            userMessageCode.style.fontFamily = "'Courier New', Courier, monospace";
            userMessageCode.style.backgroundColor = "#f0f0f0";
            userMessageCode.style.padding = "5px";
            userMessageCode.style.borderRadius = "3px";
            userMessageCode.style.whiteSpace = "pre-wrap";
            userMessageTextP.appendChild(userMessageCode);

            // the first line defines the language and can be ignored
            for (let y = 1; y < lineBreaks.length; y++) {
                userMessageCode.appendChild(document.createTextNode(lineBreaks[y]));
                if (x !== codeBreaks.length - 1 && y !== lineBreaks.length - 1) {
                    userMessageCode.appendChild(document.createElement("br"));
                }
            }
        }
    }

    userMessageBubble.appendChild(userMessageTextP);

    chatContainer.appendChild(userMessageBubble);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendNewPrompt(text) {
    loadingDiv = createLoadingDots();
    const response = await postAsyncMessage("prompt", text);
    removeLoadingDots(loadingDiv);
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
        removeLoadingDots(loadingDiv);

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
    document.getElementById("send-button").disabled = true;
    document.getElementById("message-box").disabled = true;
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

function removeLoadingDots(dotDiv) {
    document.getElementById("send-button").disabled = false;
    document.getElementById("message-box").disabled = false;
    dotDiv.remove();
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
    let options = config.problems.map((p, i) => `${i + 1}. ${p.Title}`).join("\n");
    options = config.lang['SelectNumberOfProblem'][config.userLanguage] + "\n" + options;
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