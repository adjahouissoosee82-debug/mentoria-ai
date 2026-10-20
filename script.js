// ==========================================
// MENTORIA AI - SCRIPT FRONTEND
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");

    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const message = userInput.value.trim();
            if (!message) return;

            // Afficher le message de l'utilisateur
            appendMessage("Vous", message, "user-message");
            userInput.value = "";

            // Afficher "Réflexion en cours..."
            const loadingId = appendMessage("Mentoria AI", "Réflexion en cours...", "ai-message loading");

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                
                // Supprimer le message de chargement
                document.getElementById(loadingId).remove();

                if (response.ok) {
                    appendMessage("Mentoria AI", data.reply, "ai-message");
                } else {
                    appendMessage("Mentoria AI", "Erreur : " + (data.error || "Une erreur est survenue."), "ai-message error");
                }
            } catch (error) {
                document.getElementById(loadingId).remove();
                console.error("Erreur de connexion:", error);
                appendMessage("Mentoria AI", "Impossible de joindre le serveur.", "ai-message error");
            }
        });
    }

    function appendMessage(sender, text, className) {
        const messageId = "msg-" + Date.now();
        const messageDiv = document.createElement("div")`;
        messageDiv.id = messageId;
        messageDiv.className = `message ${className};
        messageDiv.innerHTML = `<strong>${sender} :</strong> <p>${text}</p>`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageId;
    }
});
