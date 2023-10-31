function sendClicked() {
    messageBox = document.getElementById("message-box");
    addMessage(messageBox.value, "user");
    messageBox.value = "";
    chatContainer.scrollTop = chatContainer.scrollHeight;
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
}

document.getElementById("send-button").addEventListener("click", sendClicked);