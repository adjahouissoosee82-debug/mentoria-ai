document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');

    if (!sendButton || !userInput || !chatBox) {
        console.error("Éléments du chat introuvables dans le HTML.");
        return;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Afficher le message de l'utilisateur
        appendMessage("Moi", text, "user-message");
        userInput.value = "";

        // Afficher un indicateur de chargement
        const loadingId = appendMessage("Mentoria AI", "Réflexion en cours...", "ai-message loading");

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: text })
            });

            const data = await response.json();

            // Supprimer le message de chargement
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();

            if (response.ok) {
                appendMessage("Mentoria AI", data.reply, "ai-message");
            } else {
                appendMessage("Mentoria AI", "Erreur : " + (data.error || "Erreur serveur"), "ai-message error");
            }
        } catch (error) {
            console.error("Erreur de connexion:", error);
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.remove();
            appendMessage("Mentoria AI", "Impossible de joindre le serveur.", "ai-message error");
        }
    }

    function appendMessage(sender, text, className) {
        const messageId = "msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        const messageDiv = document.createElement("div");
        messageDiv.id = messageId;
        messageDiv.className = "message " + className;
        messageDiv.innerHTML = <strong>${sender} :</strong> <p>${text}</p>;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageId;
    }

    // Écoute du clic sur le bouton Envoyer
    sendButton.addEventListener('click', sendMessage);

    // Écoute de la touche "Entrée" dans la zone de texte
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
