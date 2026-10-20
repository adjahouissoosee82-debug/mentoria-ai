// ============================================================
// MENTORA AI - SCRIPT NETTOYÉ SANS ERREUR DE SYNTAXE
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var currentMode = "tuteur";
    var isSending = false;

    var conversations = {
        tuteur: [],
        memoire: []
    };

    var chatBox = document.getElementById("coursChatBox") || document.querySelector(".chat-box");
    var messageInput = document.getElementById("messageInput") || document.getElementById("userInput") || document.querySelector("textarea, input[type='text']");
    var sendButton = document.getElementById("sendButton") || document.getElementById("sendBtn") || document.querySelector(".send-btn");

    var tutorButton = document.getElementById("cours-tab-btn") || document.getElementById("coursTabBtn") || document.querySelector('[data-mode="tuteur"]');
    var memoryButton = document.getElementById("memoire-tab-btn") || document.getElementById("memoireTabBtn") || document.querySelector('[data-mode="memoire"]');
    var exportButton = document.getElementById("exportPdfBtn") || document.getElementById("exportPDF") || document.getElementById("export-pdf");

    if (!chatBox) {
        console.error("Zone de chat introuvable.");
        return;
    }

    function renderChat() {
        chatBox.innerHTML = "";
        var history = conversations[currentMode];

        for (var i = 0; i < history.length; i++) {
            var msg = history[i];
            var roleClass = msg.role === "user" ? "user-message" : "bot-message";
            var senderName = msg.role === "user" ? "Vous" : "Mentora AI";
            var text = "";

            if (Array.isArray(msg.parts) && msg.parts[0]) {
                text = msg.parts[0].text;
            } else if (typeof msg.text === "string") {
                text = msg.text;
            }

            var bubble = document.createElement("div");
            bubble.className = "message-bubble " + roleClass;

            var formattedText = text
                .replace(/\n/g, "<br>")
                .replace(/\\(.?)\\*/g, "<strong>$1</strong>");

            bubble.innerHTML = "<strong>" + senderName + " :</strong> <div class='message-content'>" + formattedText + "</div>";
            chatBox.appendChild(bubble);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Gestion des onglets
    if (tutorButton && memoryButton) {
        tutorButton.addEventListener("click", function () {
            currentMode = "tuteur";
            tutorButton.classList.add("active");
            memoryButton.classList.remove("active");
            renderChat();
        });

        memoryButton.addEventListener("click", function () {
            currentMode = "memoire";
            memoryButton.classList.add("active");
            tutorButton.classList.remove("active");
            renderChat();
        });
    }

    // Envoi de message
    async function sendMessage() {
        if (!messageInput) return;
        var text = messageInput.value.trim();
        if (!text || isSending) return;

        isSending = true;
        messageInput.value = "";

        // Ajout à l'historique
        conversations[currentMode].push({
            role: "user",
            parts: [{ text: text }]
        });
        renderChat();

        // Message de chargement
        var loadingDiv = document.createElement("div");
        loadingDiv.className = "message-bubble bot-message loading";
        loadingDiv.innerHTML = "<strong>Mentora AI :</strong> <div class='message-content'>Réflexion en cours...</div>";
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            var response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    mode: currentMode,
                    history: conversations[currentMode].slice(0, -1)
                })
            });

            var data = await response.json();
            if (loadingDiv) loadingDiv.remove();

            if (response.ok && data.success && data.reply) {
                conversations[currentMode].push({
                    role: "model",
                    parts: [{ text: data.reply }]
                });
                renderChat();
            } else {
                alert(data.error || "Erreur de réponse du serveur.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            if (loadingDiv) loadingDiv.remove();
            alert("Impossible de joindre le serveur local.");
        } finally {
            isSending = false;
        }
    }

    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Export PDF
    if (exportButton) {
        exportButton.addEventListener("click", async function () {
            var history = conversations[currentMode];
            if (!history.length) {
                alert("Aucun contenu à exporter pour le moment.");
                return;
            }

            var lastModelMsg = null;
            for (var i = history.length - 1; i >= 0; i--) {
                if (history[i].role === "model") {
                    lastModelMsg = history[i];
                    break;
                }
            }

            var contenuExport = lastModelMsg ? lastModelMsg.parts[0].text : "Document de travail Mentora AI";

            try {
                var response = await fetch("/api/export-pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        titre: currentMode === "memoire" ? "Projet_de_Memoire_Mentora_AI" : "Support_Cours_Mentora_AI",
                        contenu: contenuExport
                    })
                });

                if (!response.ok) throw new Error("Échec de création du PDF");

                var blob = await response.blob();
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = (currentMode === "memoire" ? "Memoire" : "Cours") + "_Mentora_AI.pdf";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Erreur PDF :", err);
                alert("Erreur lors de la création du PDF.");
            }
        });
    }
});