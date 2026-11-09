import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
const MODULES_DATA = [
    {
        id: 0,
        title: 'PRÉFACE : Le constat brutal du marché en 2026',
        content: `
### 📖 LE CONSTAT BRUTAL DE 2026

Le monde du travail a muté. En 2026, l'intelligence artificielle génère du code, crée des designs et rédige des textes en quelques secondes. Pourtant, une chose n'a pas changé : **les clients n'achètent pas des compétences, ils achètent des solutions.**

La grande majorité des freelances (développeurs, designers, rédacteurs) passent 80% de leur temps à perfectionner leur technique, et seulement 20% à essayer de vendre. C'est une erreur fatale.

Ce document n'a pas pour but de vous apprendre à coder ou à designer. Il a pour but de vous apprendre à **vendre**. Parce qu'un freelance moyen qui sait vendre gagnera toujours plus d'argent qu'un expert technique qui ne sait pas décrocher un contrat.
    `,
        quiz: [
            {
                question: "1. En 2026, qu'est-ce que les clients achètent réellement auprès d'un freelance ?",
                options: [
                    "Du code informatique complexe",
                    "Des solutions concrètes et du Retour sur Investissement (ROI)",
                    "Le nombre d'heures passées sur le projet"
                ],
                correct: 1
            },
            {
                question: "2. Quelle est l'erreur fatale commise par 80% des freelances ?",
                options: [
                    "Passer 80% de leur temps sur la technique et seulement 20% sur la vente",
                    "Se former continuellement sur les nouvelles technologies",
                    "Communiquer trop souvent avec leurs clients"
                ],
                correct: 0
            },
            {
                question: "3. Qui gagne le plus d'argent sur le marché du freelancing ?",
                options: [
                    "L'expert technique qui ne sait pas vendre ses compétences",
                    "Le freelance moyen qui maîtrise l'art de la vente",
                    "Seuls les diplômés des grandes écoles"
                ],
                correct: 1
            }
        ]
    },
    {
        id: 1,
        title: 'MODULE 1 : Le Mindset du Freelance d\'Élite (Devenir un CEO)',
        content: `
### 🧠 MODULE 1 : LE MINDSET DU FREELANCE D'ÉLITE

#### 1.1. Vous êtes une entreprise, pas un employé
Si vous attendez qu'on vous donne du travail, vous êtes un employé sans les avantages d'un employé. En freelance, vous êtes le PDG de *Vous-même Inc.* Votre produit, c'est votre temps et votre expertise. Votre rôle principal n'est pas de produire, mais de **trouver des clients pour votre production**.

#### 1.2. La Loi de la Valeur Perçue
Un site web coûte 500 000 F CFA ou 5 000 000 F CFA. Pourquoi ? Parce que la valeur ne dépend pas du nombre d'heures passées, mais de la *perception* de la valeur par le client. Si vous vendez un site à un restaurant, vendez-lui "plus de réservations". Si vous vendez à un cabinet d'avocats, vendez-leur "une image de confiance". **Ne vendez jamais du code. Vendez du résultat.**

#### 1.3. Vaincre le Syndrome de l'Imposteur
Le syndrome de l'imposteur est le tueur numéro 1 des freelances. Vous pensez que vous n'êtes pas assez bon ? Détrompez-vous. Le client ne cherche pas le meilleur du monde, il cherche **celui qui résout son problème** le plus rapidement possible. Si vous savez faire le travail, vous êtes légitime pour être payé.
    `,
        quiz: [
            {
                question: "1. En tant que freelance, quel doit être votre état d'esprit principal ?",
                options: [
                    "Être le PDG de 'Vous-même Inc.' et chercher activement des clients",
                    "Attendre passivement qu'un employeur vous donne des ordres",
                    "Travailler gratuitement pour accumuler des heures"
                ],
                correct: 0
            },
            {
                question: "2. Selon la Loi de la Valeur Perçue, de quoi dépend le prix de vos prestations ?",
                options: [
                    "Du nombre d'heures exactes passées devant l'écran",
                    "De la perception de la valeur et du résultat par le client",
                    "Du langage de programmation utilisé"
                ],
                correct: 1
            },
            {
                question: "3. Comment vaincre le syndrome de l'imposteur ?",
                options: [
                    "Attendre 10 ans d'expérience avant de postuler",
                    "Comprendre que le client cherche simplement celui qui résout son problème",
                    "Baisser systématiquement ses tarifs à zéro"
                ],
                correct: 1
            }
        ]
    },
    {
        id: 2,
        title: 'MODULE 2 : L\'Art de la Vente de Compétences',
        content: `
### 💰 MODULE 2 : L'ART DE LA VENTE DE COMPÉTENCES

#### 2.1. Ne vendez pas un site web, vendez une machine à cash
Le client se fiche de savoir si vous utilisez React, Vue ou Svelte. Il veut savoir une chose : *"Est-ce que ce travail va me rapporter plus d'argent que je n'en dépense ?"* Votre argumentaire de vente doit toujours être axé sur le Retour sur Investissement (ROI).

#### 2.2. Comment créer une offre irrésistible (Packaging)
Ne vendez pas "un site vitrine". Vendez "Le Pack de Lancement d'Autorité pour Coach en 14 jours".
* **Donnez un nom à votre offre.**
* **Donnez une durée.**
* **Donnez un résultat garanti.**
* **Fixez un prix qui correspond à la valeur, pas au temps passé.**

#### 2.3. La Psychologie de l'Acheteur International
Un client américain ou européen n'achète pas de la même façon qu'un client local. L'international cherche : la fiabilité, la communication claire, le respect des délais, et la capacité à comprendre ses enjeux business. Vous devez paraître **professionnel** avant même d'avoir envoyé un devis.
    `,
        quiz: [
            {
                question: "1. Quel doit être l'axe principal de votre argumentaire de vente ?",
                options: [
                    "Les détails techniques de votre code",
                    "Le Retour sur Investissement (ROI) et les gains pour le client",
                    "Votre liste de diplômes"
                ],
                correct: 1
            },
            {
                question: "2. Quelles sont les composantes d'une offre irrésistible (Packaging) ?",
                options: [
                    "Un nom accrocheur, une durée précise et un résultat garanti",
                    "Un tarif horaire bradé sans précision",
                    "Un devis flou sans date de livraison"
                ],
                correct: 0
            },
            {
                question: "3. Que recherche en priorité un client international (Europe, USA) ?",
                options: [
                    "La fiabilité, la clarté de communication et le respect des délais",
                    "Des remises de 90%",
                    "Des messages vagues et irréguliers"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 3,
        title: 'MODULE 3 : L\'Acquisition Client (Les 4 Piliers)',
        content: `
### 🤝 MODULE 3 : L'ACQUISITION CLIENT (TROUVER DES CLIENTS)

#### 3.1. Pilier 1 : Le Réseautage Stratégique
Un réseau se crée en apportant de la valeur sans rien attendre en retour. 
* **La méthode des 5 contacts par jour :** Chaque jour, commentez intelligemment le post d'un prospect, partagez une ressource utile, ou proposez une aide gratuite et rapide.
* **Les communautés :** Rejoignez des groupes Slack, Discord, ou des événements locaux. Les clients internationaux achètent à quelqu'un en qui ils ont confiance.

#### 3.2. Pilier 2 : Le Personal Branding (Être trouvé)
En 2026, si vous n'êtes pas sur LinkedIn ou Twitter (X), vous n'existez pas pour les clients internationaux. Postez 3 fois par semaine : une fois sur un projet réussi, une fois sur une leçon technique apprise, une fois sur votre vision du métier. Attirez les clients comme un aimant.

#### 3.3. Pilier 3 : La Prospection à Froid (Outbound)
C'est l'art d'aller chercher le client directement. Mais attention, le spam tue votre réputation. Une bonne prospection à froid se fait avec une analyse préalable : montrez au client que vous avez étudié son entreprise et proposez-lui une amélioration précise.

#### 3.4. Pilier 4 : Les Plateformes Traditionnelles
Sur des plateformes comme Upwork, Fiverr ou Malt, vous devez créer un profil et répondre à des centaines d'offres. C'est le modèle de la "mendicité numérique". Il fonctionne, mais il est épuisant.
    `,
        quiz: [
            {
                question: "1. Comment construire un réseau professionnel efficace ?",
                options: [
                    "En apportant de la valeur et de l'aide sincère sans rien attendre immédiatement",
                    "En envoyant du spam automatisé à 500 personnes",
                    "En restant isolé chez soi"
                ],
                correct: 0
            },
            {
                question: "2. Quelle est la fréquence recommandée de publication pour le Personal Branding ?",
                options: [
                    "3 fois par semaine sur LinkedIn ou Twitter (X)",
                    "1 fois par an",
                    "Uniquement quand on cherche du travail désespérément"
                ],
                correct: 0
            },
            {
                question: "3. Quel est l'inconvénient des plateformes traditionnelles comme Upwork ou Fiverr ?",
                options: [
                    "Elles vous poussent à la mendicité numérique et à la baisse des prix",
                    "Elles sont interdites aux freelances",
                    "Elles payent trop cher"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 4,
        title: 'MODULE 4 : La Vente à l\'International',
        content: `
### 🌍 MODULE 4 : LA VENTE À L'INTERNATIONAL

#### 4.1. Franchir la barrière de la langue et de la culture
Vous n'avez pas besoin d'un anglais parfait, mais vous avez besoin d'un anglais **professionnel**. Utilisez des outils de traduction pour vos propositions, mais gardez un ton humain. Soyez poli, concis, et allez droit au but. Les Anglo-Saxons détestent les longs discours.

#### 4.2. Gérer les paiements et les devises
Pour travailler à l'international, vous devez accepter les paiements en dollars ou en euros. Utilisez des solutions comme **Wise** ou **Payoneer** pour recevoir votre argent sans frais exorbitants. Proposez toujours à vos clients de payer via des plateformes sécurisées.

#### 4.3. Où trouver les clients à fort pouvoir d'achat ?
* **USA & Canada :** Les budgets sont élevés, mais les exigences aussi.
* **Europe (France, Suisse, Belgique) :** La proximité culturelle et linguistique est un atout majeur pour les francophones.
* **Australie & Nouvelle-Zélande :** Un marché souvent oublié, mais très demandeur de talents tech.
    `,
        quiz: [
            {
                question: "1. Quel style de communication adopter avec des clients anglo-saxons ou internationaux ?",
                options: [
                    "Poly, concis, professionnel et direct",
                    "Des pavés de 50 pages avec des formules complexes",
                    "Un langage trop familier"
                ],
                correct: 0
            },
            {
                question: "2. Quelles solutions permettent de recevoir les devises internationales (USD, EUR) sans frais excessifs ?",
                options: [
                    "Wise ou Payoneer",
                    "Envois de cash par enveloppe",
                    "Des virement bancaires classiques avec 20% de frais"
                ],
                correct: 0
            },
            {
                question: "3. Quels pays européens francophones représentent une opportunité majeure ?",
                options: [
                    "France, Suisse et Belgique",
                    "Uniquement les marchés locaux",
                    "Aucun pays"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 5,
        title: 'MODULE 5 : LA RÉVOLUTION FOLIODEV.SITE',
        content: `
### 🚀 MODULE 5 : LA RÉVOLUTION FOLIODEV.SITE (LE GAME CHANGER DE 2026)

C'est le module le plus important de ce document. Pendant des années, les freelances ont été des mendiants sur les plateformes traditionnelles.

#### 5.1. L'inversion du marché avec FolioDev.site
**Foliodev.site** a complètement changé la donne. Sur cette plateforme, **vous ne cherchez plus les clients. Ce sont les clients qui viennent à vous.** 

Comment cela fonctionne-t-il ? La plateforme est conçue pour que les clients publient leurs besoins réels. En tant que freelance, vous créez votre profil, vous montrez votre expertise, et **vous recevez directement les demandes de clients** qui correspondent à votre profil.

#### 5.2. Pourquoi FolioDev est le meilleur site en 2026
* **Moins de concurrence déloyale :** Vous n'êtes pas noyé sous 10 000 propositions identiques.
* **Des clients qualifiés :** Les clients qui viennent sur FolioDev cherchent des professionnels, pas juste le moins cher.
* **Un écosystème pensé pour le freelancer :** Avec des outils intégrés pour booster votre visibilité.
* **Zéro intermédiaire inutile :** Vous discutez directement avec le client. Vous fixez vos prix.

#### 5.3. Comment exploser vos ventes sur FolioDev (Guide Pratique)
1. **Le Badge de Vérification (500 F CFA) :** Il vous donne une crédibilité immédiate.
2. **Le Freelancer ProMax (250 F CFA) :** Il place votre profil tout en haut des recherches avec un badge orange.
3. **Le Contact Boost :** Achetez des contacts WhatsApp de clients qualifiés pour signer en 24h.
    `,
        quiz: [
            {
                question: "1. Quel est le principe fondamental de la plateforme FolioDev.site ?",
                options: [
                    "L'inversion du marché : ce sont les clients qui viennent vers les freelances",
                    "Envoyer 100 candidatures payantes par jour",
                    "Subir les enchères vers le bas"
                ],
                correct: 0
            },
            {
                question: "2. Quel badge accorde une crédibilité immédiate auprès des recruteurs sur FolioDev ?",
                options: [
                    "Le Badge de Vérification",
                    "Le badge débutant",
                    "Aucun badge n'est nécessaire"
                ],
                correct: 0
            },
            {
                question: "3. Quel avantage procure le forfait Freelancer ProMax sur FolioDev ?",
                options: [
                    "Placer son profil en haut des résultats avec un badge orange distinctif",
                    "Cacher son nom aux clients",
                    "Bloquer la messagerie"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 6,
        title: 'MODULE 6 : Le Closing (Conclure la vente)',
        content: `
### 🎯 MODULE 6 : LE CLOSING (COMMENT CONCLURE LA VENTE)

Lorsqu'un client vous contacte sur FolioDev.site, vous avez 5 minutes pour faire bonne impression. 

#### 6.1. La règle des 3 questions
Au lieu de dire "Bonjour, voici mes tarifs", posez ces 3 questions :
1. Quel est votre objectif principal avec ce projet ? (Pour comprendre le ROI)
2. Quelle est votre échéance absolue ? (Pour voir si le client est sérieux)
3. Avez-vous déjà travaillé avec un freelance avant ? (Pour adapter votre discours)

#### 6.2. Répondre à l'objection "C'est trop cher"
Ne baissez jamais vos prix sans réduire le périmètre du projet. Si le client dit que c'est trop cher, répondez : *"Je comprends. Mon tarif inclut la garantie de résultat et un suivi de 30 jours. Si nous retirons le suivi et la garantie, je peux baisser de 20%. Voulez-vous procéder ainsi ?"* Souvent, le client préfère garder la qualité.
    `,
        quiz: [
            {
                question: "1. De combien de temps disposez-vous pour faire une excellente impression lors d'un premier contact ?",
                options: [
                    "5 minutes",
                    "24 heures",
                    "1 semaine"
                ],
                correct: 0
            },
            {
                question: "2. Quelle est la première question à poser à un prospect au lieu de donner un tarif brut ?",
                options: [
                    "Quel est votre objectif principal avec ce projet ?",
                    "Combien d'argent avez-vous en banque ?",
                    "Pouvez-vous me payer en avance ?"
                ],
                correct: 0
            },
            {
                question: "3. Comment réagir intelligemment face à l'objection 'C'est trop cher' ?",
                options: [
                    "Proposer de réduire le périmètre ou les garanties plutôt que baisser le prix",
                    "Baisser le prix de 50% immédiatement sans rien changer",
                    "Abandonner la négociation"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 7,
        title: 'MODULE 7 : La Livraison et la Fidélisation',
        content: `
### 📈 MODULE 7 : LA LIVRAISON ET LA FIDÉLISATION

#### 7.1. Offrir une expérience client digne d'un palace
La vente ne s'arrête pas au paiement. Envoyez des mises à jour régulières, respectez les délais, et livrez un travail qui dépasse les attentes. Un client satisfait est un client qui revient.

#### 7.2. Transformer un client en ambassadeur
Après chaque projet réussi, demandez un témoignage (et une note de 5 étoiles sur FolioDev). Demandez-lui s'il connaît d'autres personnes qui pourraient avoir besoin de vos services. C'est le marketing le plus puissant et le moins cher du monde.

#### 7.3. Passer de Freelance à Agence
Une fois que vous avez trop de clients, vous ne pouvez plus tout faire seul. C'est le moment de sous-traiter à d'autres freelances et de devenir une agence. Vous passez de "vendeur de temps" à "chef d'orchestre".
    `,
        quiz: [
            {
                question: "1. Quand s'arrête réellement le processus de vente en freelancing ?",
                options: [
                    "Après la livraison parfaite et la satisfaction du client",
                    "Dès que le premier acompte est touché",
                    "Au moment de la signature du devis"
                ],
                correct: 0
            },
            {
                question: "2. Que devez-vous demander à chaque client satisfait après la livraison ?",
                options: [
                    "Un témoignage, une note 5 étoiles et des recommandations",
                    "Une augmentation de tarif rétroactive",
                    "Rien du tout"
                ],
                correct: 0
            },
            {
                question: "3. Comment passer de freelance solo à la tête d'une agence ?",
                options: [
                    "En sous-traitant les surplus de projets à d'autres freelances qualifiés",
                    "En travaillant 24h/24 sans dormir",
                    "En déclinant tous les nouveaux contrats"
                ],
                correct: 0
            }
        ]
    },
    {
        id: 8,
        title: '🏁 CONCLUSION & PLAN D\'ACTION SUR 7 JOURS',
        content: `
### 🏁 CONCLUSION & PLAN D'ACTION

Devenir un freelance d'élite en 2026 ne dépend pas de votre niveau en programmation. Cela dépend de votre capacité à **vendre votre valeur**. Le monde est rempli de clients qui ont besoin de vous, mais ils ne vous trouveront pas si vous restez caché.

Avec des plateformes comme **Foliodev.site**, vous avez entre les mains l'outil ultime pour inverser la tendance. Ne soyez plus un chercheur de clients. Devenez une machine à recevoir des contrats. 

#### 📋 Votre plan d'action pour les 7 prochains jours :
1. Créez ou mettez à jour votre profil sur **Foliodev.site**.
2. Activez le Badge de Vérification ou le ProMax pour être visible immédiatement.
3. Préparez votre offre irrésistible (Packaging).
4. Publiez 3 posts sur LinkedIn pour commencer à attirer l'attention.
5. Répondez à 5 demandes de clients sur FolioDev.

*Créé par Ralph, CEO FolioDev*
    `,
        quiz: [
            {
                question: "1. De quoi dépend votre réussite ultime en tant que freelance d'élite ?",
                options: [
                    "De votre capacité à vendre et communiquer votre valeur",
                    "Du nombre de diplômes universitaires accumulés",
                    "De la chance uniquement"
                ],
                correct: 0
            },
            {
                question: "2. Quelle est la toute première action à réaliser dans le plan de 7 jours ?",
                options: [
                    "Créer ou optimiser son profil sur FolioDev.site",
                    "Attendre sans rien faire",
                    "Changer de métier"
                ],
                correct: 0
            },
            {
                question: "3. Qui est le créateur de ce manuel et CEO de FolioDev ?",
                options: [
                    "Ralph",
                    "Un anonyme",
                    "Une IA générique"
                ],
                correct: 0
            }
        ]
    }
];
export default function FormationReader({ user, onBackToHome }) {
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [completedModules, setCompletedModules] = useState([]);
    const [quizScores, setQuizScores] = useState({});
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizPassed, setQuizPassed] = useState(false);
    const [quizError, setQuizError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        let mounted = true;
        const fetchProgress = async () => {
            if (!user) {
                setLoadingProgress(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('formation_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (mounted && data) {
                    const modIdx = typeof data.current_module_index === 'number' ? data.current_module_index : 0;
                    const compMods = Array.isArray(data.completed_modules) ? data.completed_modules : [];
                    const scores = data.quiz_scores || {};
                    setCurrentModuleIndex(modIdx);
                    setCompletedModules(compMods);
                    setQuizScores(scores);
                    if (compMods.includes(modIdx)) {
                        setQuizPassed(true);
                    }
                }
            }
            catch (err) {
                console.error("Erreur chargement progression formation:", err);
            }
            finally {
                if (mounted)
                    setLoadingProgress(false);
            }
        };
        fetchProgress();
        return () => { mounted = false; };
    }, [user]);
    useEffect(() => {
        setSelectedAnswers({});
        setQuizError(null);
        if (completedModules.includes(currentModuleIndex)) {
            setQuizPassed(true);
        }
        else {
            setQuizPassed(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentModuleIndex, completedModules]);
    const currentModule = MODULES_DATA[currentModuleIndex] || MODULES_DATA[0];
    const handleSelectAnswer = (qIndex, optionIndex) => {
        setSelectedAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };
    const handleVerifyQuiz = async () => {
        setQuizError(null);
        const questions = currentModule.quiz;
        let correctCount = 0;
        for (let i = 0; i < questions.length; i++) {
            if (selectedAnswers[i] === undefined) {
                setQuizError("Veuillez répondre à toutes les questions avant de valider.");
                return;
            }
            if (selectedAnswers[i] === questions[i].correct) {
                correctCount++;
            }
        }
        const passed = correctCount >= 2;
        const newScores = { ...quizScores, [currentModuleIndex]: `${correctCount}/${questions.length}` };
        setQuizScores(newScores);
        if (passed) {
            setQuizPassed(true);
            const newCompleted = Array.from(new Set([...completedModules, currentModuleIndex]));
            setCompletedModules(newCompleted);
            if (user) {
                setSaving(true);
                try {
                    await supabase.from('formation_progress').upsert({
                        user_id: user.id,
                        current_module_index: currentModuleIndex,
                        completed_modules: newCompleted,
                        quiz_scores: newScores,
                        last_accessed_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                }
                catch (err) {
                    console.error("Erreur sauvegarde progression:", err);
                }
                finally {
                    setSaving(false);
                }
            }
        }
        else {
            setQuizPassed(false);
            setQuizError(`Score : ${correctCount}/${questions.length}. Vous devez avoir au moins 2 réponses correctes sur 3 pour débloquer la suite.`);
        }
    };
    const handleNextModule = async () => {
        if (currentModuleIndex < MODULES_DATA.length - 1) {
            const nextIdx = currentModuleIndex + 1;
            setCurrentModuleIndex(nextIdx);
            if (user) {
                try {
                    await supabase.from('formation_progress').upsert({
                        user_id: user.id,
                        current_module_index: nextIdx,
                        completed_modules: completedModules,
                        quiz_scores: quizScores,
                        last_accessed_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                }
                catch (err) {
                    console.error("Erreur mise à jour module suivant:", err);
                }
            }
        }
    };
    if (loadingProgress) {
        return (_jsx("div", { className: "vh-100 d-flex justify-content-center align-items-center", style: { backgroundColor: 'var(--folio-bg)' }, children: _jsx("div", { className: "spinner-border text-primary", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Chargement de votre formation..." }) }) }));
    }
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column", style: { backgroundColor: '#F8F9FE' }, children: [_jsxs("header", { className: "py-3 px-4 bg-white border-bottom sticky-top shadow-sm d-flex justify-content-between align-items-center", children: [_jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsxs("button", { type: "button", className: "btn btn-sm btn-outline-secondary rounded-pill px-3", onClick: onBackToHome, children: [_jsx("i", { className: "bi bi-house me-1" }), " Accueil"] }), _jsx("span", { className: "fw-bold font-serif text-title fs-5", children: "\uD83C\uDF93 Folio Vendeur d'\u00C9lite" })] }), _jsx("div", { className: "d-flex align-items-center gap-3", children: _jsxs("span", { className: "badge bg-primary text-white rounded-pill px-3 py-2", children: ["Module ", currentModuleIndex + 1, " / ", MODULES_DATA.length] }) })] }), _jsx("div", { className: "container-fluid flex-grow-1 py-4 px-lg-5", children: _jsxs("div", { className: "row g-4", children: [_jsx("div", { className: "col-lg-3", children: _jsxs("div", { className: "bg-white rounded-4 p-3 shadow-sm border sticky-top", style: { top: '90px' }, children: [_jsxs("h6", { className: "fw-bold text-title mb-3 px-2", children: [_jsx("i", { className: "bi bi-journal-bookmark text-primary me-2" }), "Modules de formation"] }), _jsx("div", { className: "d-flex flex-column gap-2", style: { maxHeight: '70vh', overflowY: 'auto' }, children: MODULES_DATA.map((mod, idx) => {
                                            const isCompleted = completedModules.includes(idx);
                                            const isCurrent = idx === currentModuleIndex;
                                            const isLocked = idx > 0 && !completedModules.includes(idx - 1) && !isCompleted && !isCurrent;
                                            return (_jsxs("button", { type: "button", disabled: isLocked, className: `btn text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between border-0 ${isCurrent
                                                    ? 'bg-primary text-white fw-bold shadow-sm'
                                                    : isCompleted
                                                        ? 'bg-light text-dark hover-bg'
                                                        : isLocked
                                                            ? 'text-muted opacity-50'
                                                            : 'text-dark hover-bg'}`, onClick: () => {
                                                    if (!isLocked)
                                                        setCurrentModuleIndex(idx);
                                                }, style: { fontSize: '0.85rem' }, children: [_jsx("span", { className: "text-truncate me-2", children: idx === 0 ? 'Préface' : `Mod ${idx}: ${mod.title.split(':')[0]}` }), isCompleted ? (_jsx("i", { className: `bi bi-check-circle-fill ${isCurrent ? 'text-white' : 'text-success'}` })) : isLocked ? (_jsx("i", { className: "bi bi-lock-fill text-muted" })) : isCurrent ? (_jsx("i", { className: "bi bi-play-fill text-white fs-5" })) : (_jsx("i", { className: "bi bi-circle text-muted" }))] }, mod.id));
                                        }) })] }) }), _jsx("div", { className: "col-lg-9", children: _jsxs("div", { className: "bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-4", children: [_jsxs("div", { className: "border-bottom pb-4 mb-4", children: [_jsxs("span", { className: "badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold mb-2", children: ["MODULE ", currentModuleIndex] }), _jsx("h2", { className: "font-serif fw-bold text-title mb-0", children: currentModule.title })] }), _jsx("div", { className: "module-body text-dark style-description mb-5", style: { fontSize: '1.05rem', lineHeight: '1.85', whiteSpace: 'pre-line' }, children: currentModule.content }), _jsxs("div", { className: "p-4 rounded-4 border bg-light mt-5", children: [_jsxs("div", { className: "d-flex align-items-center gap-2 mb-3", children: [_jsx("span", { className: "badge bg-primary rounded-circle p-2", children: _jsx("i", { className: "bi bi-question-lg text-white" }) }), _jsxs("h4", { className: "fw-bold font-serif text-title mb-0", children: ["Quiz de validation - Module ", currentModuleIndex] })] }), _jsx("p", { className: "text-muted small mb-4", children: "R\u00E9pondez correctement au quiz ci-dessous pour valider ce module et d\u00E9bloquer la suite de la formation." }), _jsx("div", { className: "d-flex flex-column gap-4", children: currentModule.quiz.map((q, qIdx) => (_jsxs("div", { className: "bg-white p-3.5 rounded-3 border", children: [_jsx("p", { className: "fw-bold text-dark mb-3", children: q.question }), _jsx("div", { className: "d-flex flex-column gap-2", children: q.options.map((opt, oIdx) => {
                                                                const isSelected = selectedAnswers[qIdx] === oIdx;
                                                                return (_jsxs("div", { className: `p-3 rounded-3 border d-flex align-items-center gap-3 ${isSelected ? 'border-primary bg-primary-subtle fw-medium' : 'bg-white hover-bg'}`, style: { cursor: 'pointer', transition: 'all 0.2s ease' }, onClick: () => handleSelectAnswer(qIdx, oIdx), children: [_jsx("input", { type: "radio", name: `q_${qIdx}`, checked: isSelected, onChange: () => handleSelectAnswer(qIdx, oIdx), style: { accentColor: 'var(--folio-primary)' } }), _jsx("span", { className: "text-dark small", children: opt })] }, oIdx));
                                                            }) })] }, qIdx))) }), quizError && (_jsxs("div", { className: "alert alert-danger mt-3 py-2 px-3 mb-0 rounded-3", children: [_jsx("i", { className: "bi bi-exclamation-triangle me-2" }), quizError] })), quizPassed && (_jsxs("div", { className: "alert alert-success mt-3 py-2 px-3 mb-0 rounded-3 d-flex align-items-center gap-2", children: [_jsx("i", { className: "bi bi-check-circle-fill fs-5" }), _jsx("span", { children: "F\u00E9licitations ! Module valid\u00E9 avec succ\u00E8s. Vous pouvez maintenant passer au module suivant." })] })), _jsxs("div", { className: "d-flex justify-content-between align-items-center mt-4", children: [_jsx("button", { type: "button", className: "btn btn-primary px-4 py-2.5 rounded-pill fw-bold", onClick: handleVerifyQuiz, disabled: saving, children: saving ? 'Sauvegarde...' : 'Valider le Quiz' }), currentModuleIndex < MODULES_DATA.length - 1 && (_jsxs("button", { type: "button", className: `btn ${quizPassed ? 'btn-success' : 'btn-secondary opacity-50'} px-4 py-2.5 rounded-pill fw-bold`, disabled: !quizPassed, onClick: handleNextModule, children: ["Module Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-1" })] }))] })] })] }) })] }) })] }));
}
