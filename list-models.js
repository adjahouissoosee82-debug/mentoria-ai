require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('Clé API absente du fichier .env');
        return;
    }

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    try {
        console.log('Recherche des modèles disponibles...');

        // Appel de la méthode list()
        const response = await ai.models.list();

        // On parcourt les modèles reçus
        for await (const model of response) {
            if (model.supportedActions?.includes('generateContent')) {
                console.log('Modèle disponible :', model.name);
            }
        }
    } catch (error) {
        console.error('Erreur de récupération des modèles :', error.message);
    }
}

main();