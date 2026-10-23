// =================================================================
// MENTORA AI - SERVEUR PRINCIPAL (MULTI-DOMAINES DE RECHERCHE)
// =================================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const PDFDocument = require("pdfkit");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

// Initialisation du SDK Google Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PORT = Number(process.env.PORT) || 3000;

// Vérification de la clé API
if (!process.env.GEMINI_API_KEY) {
    console.error("ERREUR : GEMINI_API_KEY est absente des variables d'environnement.");
    process.exit(1);
}

// =================================================================
// ROUTE PRINCIPALE CHAT
// =================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Le message (prompt) est requis." });
        }

        // Utilisation de la nouvelle syntaxe officielle du SDK @google/genai
        const response = await genAI.models.generateContent({
            model: "gemini-3.0-flash-liste",
            contents: prompt,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Erreur API Gemini :", error);
        res.status(500).json({ error: error.message || "Erreur interne du serveur." });
    }
});

// =================================================================
// DEMARRAGE DU SERVEUR
// =================================================================
app.listen(PORT, () => {
    console.log(`Serveur Mentora AI en ligne sur le port ${PORT}`);
});
