/**
 * Module d'analyse Portfolio et SEO par Gemini IA
 */

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'Modèle Rapide (Recommandé)', description: 'Ultra-rapide, très stable' },
  { id: 'gemini-3.6-flash', label: 'Modèle Avancé 3.6', description: 'Raisonnement approfondi' },
];

const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

export const analyzePortfolioWithGemini = async ({
  portfolioUrl,
  name,
  profession,
  description,
  selectedModel = DEFAULT_MODEL
}) => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.gemini_api_key || '';
  const apiKey = (rawKey || '').replace(/["'\r\n]/g, '').trim();

  if (!apiKey) {
    throw new Error("La clé API Gemini (VITE_GEMINI_API_KEY) n'est pas configurée dans les variables d'environnement de Vercel.");
  }

  const prompt = `Tu es un expert mondial en SEO, UX/UI et Marketing Digital pour les freelances et professionnels du web.
Analyse le portfolio du professionnel suivant et génère un rapport d'analyse IA complet ainsi que le code HTML d'en-tête (<head>) optimisé à intégrer directement sur son site.

Informations du Freelance :
- Nom : ${name || 'Professionnel Folio'}
- Métier / Spécialité : ${profession || 'Services web & tech'}
- URL du Portfolio : ${portfolioUrl || 'https://votre-site.com'}
- Description / Activités : ${description || 'Services informatiques et développement sur-mesure.'}

Génère une réponse structurée au format JSON strict (SANS balises markdown autour) avec exactement ces champs :
{
  "score": 88,
  "diagnostic": "Un diagnostic synthétique et professionnel de 2-3 phrases sur la visibilité, le positionnement et l'ergonomie du portfolio.",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "weaknesses": ["Point à améliorer 1", "Point à améliorer 2"],
  "recommendations": [
    "Recommandation stratégique 1",
    "Recommandation stratégique 2",
    "Recommandation stratégique 3"
  ],
  "headCode": "<!-- Code SEO & OpenGraph généré par Folio IA -->\\n<title>${name || 'Folio'} | ${profession || 'Expert'}</title>\\n<meta name=\\"description\\" content=\\"Découvrez les services et réalisations de ${name || 'ce professionnel'} en ${profession || 'tech'}. Contactez-moi pour concrétiser vos projets.\\" />\\n<meta name=\\"keywords\\" content=\\"${profession}, portfolio, freelance, services web, dev\\" />\\n<meta name=\\"robots\\" content=\\"index, follow\\" />\\n<meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n<meta property=\\"og:title\\" content=\\"${name || 'Folio'} - ${profession || 'Services'}\\" />\\n<meta property=\\"og:description\\" content=\\"Portfolio et services professionnels de ${name || 'ce freelance'}.\\" />\\n<meta property=\\"og:type\\" content=\\"website\\" />\\n<meta property=\\"og:url\\" content=\\"${portfolioUrl || 'https://votre-site.com'}\\" />\\n<link rel=\\"canonical\\" href=\\"${portfolioUrl || 'https://votre-site.com'}\\" />"
}`;

  // Tenter en premier le modèle choisi par l'utilisateur
  const requestedModel = typeof selectedModel === 'string'
    ? selectedModel
    : selectedModel && typeof selectedModel === 'object'
      ? selectedModel.id
      : null;
  const primaryModel = AVAILABLE_MODELS.some(({ id }) => id === requestedModel)
    ? requestedModel
    : DEFAULT_MODEL;
  const fallbackList = Array.from(new Set([primaryModel, ...AVAILABLE_MODELS.map(({ id }) => id)]));
  let lastError = null;

  for (const model of fallbackList) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const message = errJson.error?.message || `HTTP ${response.status}`;
        const errorObj = new Error(message);
        errorObj.status = response.status;
        errorObj.model = model;
        throw errorObj;
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('Réponse vide.');
      }

      try {
        return JSON.parse(textResponse);
      } catch {
        const cleanedText = textResponse.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleanedText);
      }
    } catch (err) {
      console.warn(`Modèle ${model} échoué:`, err.message);
      if (err.status === 401 || err.status === 403) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Le modèle IA sélectionné est très sollicité en ce moment.');
};
