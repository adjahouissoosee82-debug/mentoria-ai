document.addEventListener('DOMContentLoaded', function() {
    var sendButton = document.getElementById('sendButton');
    var userInput = document.getElementById('userInput');
    var chatBox = document.getElementById('chatBox');

    if (!sendButton || !userInput || !chatBox) {
        console.error("Éléments du chat introuvables.");
        return;
    }

    function sendMessage() {
        var text = userInput.value.trim();
        if (!text) return;

        appendMessage("Moi", text, "user-message");
        userInput.value = "";

        var loadingId = "msg-loading-" + Date.now();
        var loadingDiv = document.createElement("div");
        loadingDiv.id = loadingId;
        loadingDiv.className = "message ai-message loading";
        loadingDiv.innerHTML = "<strong>Mentoria AI :</strong> <p>Réflexion en cours...</p>";
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: text })
        })
        .then(function(response) {
            return response.json().then(function(data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function(result) {
            var loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();

            if (result.ok) {
                appendMessage("Mentoria AI", result.data.reply, "ai-message");
            } else {
                appendMessage("Mentoria AI", "Erreur : " + (result.data.error || "Erreur serveur"), "ai-message error");
            }
        })
        .catch(function(error) {
            console.error("Erreur de connexion:", error);
            var loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();
            appendMessage("Mentoria AI", "Impossible de joindre le serveur.", "ai-message error");
        });
    }

    function appendMessage(sender, text, className) {
        var messageId = "msg-" + Date.now() + Math.random();
        var messageDiv = document.createElement("div");
        messageDiv.id = messageId;
        messageDiv.className = "message " + className;
        messageDiv.innerHTML = "<strong>" + sender + " :</strong> <p>" + text + "</p>";
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageId;
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
