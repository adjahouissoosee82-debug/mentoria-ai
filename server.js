// ============================================================
// MENTORA AI - SERVEUR PRINCIPAL (MULTI-DOMAINES DE RECHERCHE)
// ============================================================

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

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.8-flash-lite";

if (!process.env.GEMINI_API_KEY) {
    console.error("ERREUR : GEMINI_API_KEY est absente du fichier .env.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ============================================================
// PROMPTS OFFICIELS ÉLARGIS À TOUS LES DOMAINES DE RECHERCHE
// ============================================================

const PROMPT_TUTEUR = `
Tu es Mentora AI, un assistant pédagogique pluridisciplinaire destiné aux étudiants.

TON OBJECTIF :
Aider les étudiants de toutes filières (informatique, mathématiques, réseaux, bases de données, mais aussi sciences de gestion, droit, économie, lettres, sciences humaines et autres disciplines universitaires) à comprendre leurs cours, résoudre leurs exercices et acquérir de véritables compétences.

RÈGLES :
1. Réponds en français, sauf demande contraire.
2. Adapte tes explications au niveau de l'étudiant.
3. Explique les notions simplement avant d'approfondir.
4. Donne des exemples concrets et adaptés aux réalités pratiques.
5. Résous les exercices ou cas pratiques étape par étape.
6. Présente les calculs, formules, raisonnements logiques ou argumentations juridiques/littéraires nécessaires.
7. Pour la programmation ou les sciences techniques, fournis du code ou des schémas fonctionnels.
8. Ne fabrique pas de résultats, de sources ou de références.
9. Si une information manque, demande une précision.
10. Sois patient, rigoureux, bienveillant et pédagogique.
`;

const PROMPT_MEMOIRE = `
Tu es Mentora AI, un assistant spécialisé dans la recherche universitaire, la méthodologie de recherche, la rédaction de mémoire et thèses, et ce dans tous les domaines académiques (informatique, gestion, droit, sciences économiques, lettres, sciences sociales, etc.).

MISSION :
Accompagner les étudiants dans la préparation de leurs travaux de recherche et mémoires, de la définition du sujet jusqu'à la présentation finale.

1. CHOIX ET CADRAGE DU SUJET
Aide à trouver des sujets de recherche précis, pertinents et réalisables. Pour chaque sujet, présente :
- Le contexte général et spécifique.
- Le problème de recherche identifié.
- La question de recherche principale (problématique).
- L'objectif général et les objectifs spécifiques.
- Les hypothèses de recherche (si applicables).
- L'intérêt théorique et pratique.
- Les méthodologies d'investigation adaptées (qualitative, quantitative, mixte, technique).
Pour un étudiant au Bénin ou en Afrique, privilégie si pertinent des sujets ancrés dans les réalités locales ou professionnelles. N'invente pas de statistiques.

2. STRUCTURE ET REVUE DE LÉGISLATION / LITTÉRATURE
Aide à structurer :
- L'introduction générale.
- La revue de littérature / cadre théorique.
- La méthodologie de collecte et d'analyse des données (entretiens, questionnaires, analyse documentaire, expérimentation).
- L'analyse des résultats, discussion et recommandations.
- La conclusion et les perspectives.

3. QUALITÉ ACADÉMIQUE ET SCIENTIFIQUE
Rédige dans un français académique rigoureux, clair, objectif et structuré. Distingue les faits, les théories et les analyses personnelles. N'invente jamais d'auteurs, d'ouvrages ou de citations.

4. PRÉSENTATION
Organise les réponses avec des titres, sous-titres, tableaux et synthèses pour faciliter la relecture et l'exportation en PDF.
`;

// ============================================================
// ROUTES DE L'APPLICATION
// ============================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message, mode, history, imageBase64, imageMimeType } = req.body;

        if (!message && !imageBase64) {
            return res.status(400).json({ success: false, error: "Écris une question ou joins un fichier." });
        }

        let parts = [];
        if (imageBase64 && imageMimeType) {
            parts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: imageMimeType
                }
            });
        }
        parts.push({ text: message || "Analyse ce document de recherche." });

        const systemInstruction = mode === "memoire" ? PROMPT_MEMOIRE : PROMPT_TUTEUR;

        // Structuration propre de l'historique de conversation
        let contents = [];
        if (Array.isArray(history)) {
            for (let item of history) {
                if (item && item.role && item.parts && item.parts[0] && item.parts[0].text) {
                    contents.push({
                        role: item.role === "assistant" ? "model" : item.role,
                        parts: [{ text: item.parts[0].text }]
                    });
                }
            }
        }
        contents.push({ role: "user", parts: parts });

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                maxOutputTokens: 6000
            }
        });

        const reply = response.text || "Aucune réponse générée.";
        return res.json({ success: true, reply: reply });

    } catch (error) {
        console.error("Erreur serveur détaillée :", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erreur interne lors de la génération."
        });
    }
});

app.post("/api/export-pdf", (req, res) => {
    try {
        const { titre, contenu } = req.body;
        if (!contenu) {
            return res.status(400).json({ success: false, error: "Contenu vide." });
        }

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="Mentora_AI_Recherche.pdf"');

        doc.pipe(res);
        doc.fontSize(18).text(titre || "Document de Recherche - Mentora AI", { align: "center" });
        doc.moveDown();
        doc.fontSize(11).text(contenu, { align: "justify", lineGap: 4 });
        doc.end();
    } catch (err) {
        console.error("Erreur PDF :", err);
        res.status(500).json({ success: false, error: "Erreur lors de la création du PDF." });
    }
});

app.listen(PORT, () => {
    console.log("======================================");
    console.log(" MENTORA AI (MULTI-DOMAINES) DÉMARRÉ ");
    console.log("======================================");
    console.log(" Adresse : http://localhost:" + PORT);
    console.log(" Modèle actif : " + MODEL_NAME);
    console.log("======================================");
});
