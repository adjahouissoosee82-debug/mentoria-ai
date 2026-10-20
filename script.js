// ==========================================
// MENTORIA AI - SCRIPT FRONTEND
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    var chatForm = document.getElementById("chat-form");
    var userInput = document.getElementById("user-input");
    var chatBox = document.getElementById("chat-box");

    if (chatForm) {
        chatForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            var message = userInput.value.trim();
            if (!message) return;

            // Afficher le message de l'utilisateur
            appendMessage("Vous", message, "user-message");
            userInput.value = "";

            // Afficher "Réflexion en cours..."
            var loadingId = appendMessage("Mentoria AI", "Réflexion en cours...", "ai-message loading");

            try {
                var response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message: message })
                });

                var data = await response.json();
                
                // Supprimer le message de chargement
                var loadingElement = document.getElementById(loadingId);
                if (loadingElement) loadingElement.remove();

                if (response.ok) {
                    appendMessage("Mentoria AI", data.reply, "ai-message");
                } else {
                    appendMessage("Mentoria AI", "Erreur : " + (data.error || "Une erreur est survenue."), "ai-message error");
                }
            } catch (error) {
                var loadingElement = document.getElementById(loadingId);
                if (loadingElement) loadingElement.remove();
                console.error("Erreur de connexion:", error);
                appendMessage("Mentoria AI", "Impossible de joindre le serveur.", "ai-message error");
            }
        });
    }

    function appendMessage(sender, text, className) {
        var messageId = "msg-" + Date.now();
        var messageDiv = document.createElement("div");
        messageDiv.id = messageId;
        messageDiv.className = "message " + className;
        messageDiv.innerHTML = "<strong>" + sender + " :</strong> <p>" + text + "</p>";
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageId;
    }
});
