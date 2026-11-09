import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FormationPaymentModal from './FormationPaymentModal';
export default function FormationLanding({ user, onBack, onOpenReader, onGoogleLogin }) {
    const [hasPaidAccess, setHasPaidAccess] = useState(false);
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    useEffect(() => {
        let isMounted = true;
        const checkAccess = async () => {
            if (!user) {
                setLoadingAccess(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('formation_access')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (isMounted && data && data.status === 'active') {
                    setHasPaidAccess(true);
                }
            }
            catch (err) {
                console.error("Erreur vérification accès formation:", err);
            }
            finally {
                if (isMounted)
                    setLoadingAccess(false);
            }
        };
        checkAccess();
        return () => { isMounted = false; };
    }, [user]);
    const handleActionClick = () => {
        if (!user) {
            if (onGoogleLogin) {
                onGoogleLogin();
            }
            else {
                supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                });
            }
            return;
        }
        if (hasPaidAccess) {
            onOpenReader();
        }
        else {
            setShowPaymentModal(true);
        }
    };
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column", style: { backgroundColor: 'var(--folio-bg)' }, children: [_jsx("header", { className: "py-4 border-bottom bg-white sticky-top shadow-sm", children: _jsxs("div", { className: "container d-flex justify-content-between align-items-center", children: [_jsxs("button", { type: "button", className: "btn btn-outline-secondary rounded-pill px-4 btn-sm d-flex align-items-center gap-2 fw-medium", onClick: onBack, children: [_jsx("i", { className: "bi bi-arrow-left" }), " Retour \u00E0 l'accueil"] }), _jsx("span", { className: "badge text-bg-warning rounded-pill px-3 py-2 font-monospace fw-bold", children: "\uD83C\uDF93 Formation Vendeur d'\u00C9lite 2026" })] }) }), _jsx("main", { className: "flex-grow-1 py-5", children: _jsxs("div", { className: "container", children: [_jsx("div", { className: "row justify-content-center text-center mb-5", children: _jsxs("div", { className: "col-lg-9", children: [_jsx("span", { className: "badge rounded-pill px-3 py-2 mb-3 fw-bold tracking-wider", style: { backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }, children: "MANUEL OFFICIEL \u2022 PAR RALPH, CEO DE FOLIODEV" }), _jsx("h1", { className: "display-4 font-serif fw-bold text-title mb-4", children: "Devenir un Freelance Vendeur d'\u00C9lite en 2026" }), _jsxs("p", { className: "lead text-body-custom mx-auto mb-4 fs-5", style: { maxWidth: '750px', lineHeight: '1.7' }, children: ["L'art supr\u00EAme de vendre tes comp\u00E9tences en ligne, localement ou \u00E0 l'international. Ne vends plus du code ou du design : apprends \u00E0 vendre des ", _jsx("strong", { children: "r\u00E9sultats et des transformations" }), "."] }), _jsxs("div", { className: "d-flex flex-wrap justify-content-center gap-3 mb-5", children: [_jsxs("span", { className: "badge bg-light text-dark border px-3 py-2 rounded-pill", children: [_jsx("i", { className: "bi bi-book text-primary me-1" }), "7 Modules d'\u00C9lite + Pr\u00E9face"] }), _jsxs("span", { className: "badge bg-light text-dark border px-3 py-2 rounded-pill", children: [_jsx("i", { className: "bi bi-check2-circle text-success me-1" }), "Quiz interactifs par module"] }), _jsxs("span", { className: "badge bg-light text-dark border px-3 py-2 rounded-pill", children: [_jsx("i", { className: "bi bi-globe2 text-info me-1" }), "Vente locale & International"] }), _jsxs("span", { className: "badge bg-light text-dark border px-3 py-2 rounded-pill", children: [_jsx("i", { className: "bi bi-infinity text-warning me-1" }), "Acc\u00E8s illimit\u00E9 \u00E0 vie"] })] }), _jsx("div", { className: "p-4 p-md-5 rounded-4 shadow-lg border text-white text-center position-relative overflow-hidden", style: { background: 'linear-gradient(135deg, #26215C 0%, #1E1B4B 100%)' }, children: _jsxs("div", { className: "position-relative z-1", children: [_jsx("span", { className: "badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-3", children: hasPaidAccess ? 'ACCÈS ACTIVÉ ✅' : 'OFFRE DE LANCEMENT EXCLUSIVE' }), _jsx("h3", { className: "fw-bold font-serif mb-2", children: hasPaidAccess
                                                        ? "Vous possédez déjà l'accès complet à la Formation !"
                                                        : "Débloquez l'accès complet à la Formation" }), _jsx("p", { className: "text-white-50 small mb-4 mx-auto", style: { maxWidth: '550px' }, children: hasPaidAccess
                                                        ? "Reprenez votre apprentissage exactement là où vous vous êtes arrêté sur n'importe quel appareil."
                                                        : "Un investissement unique de 9 000 F CFA pour transformer votre activité freelance et recevoir des clients réguliers." }), !hasPaidAccess && (_jsxs("div", { className: "mb-4", children: [_jsx("span", { className: "display-6 fw-bold text-warning", children: "9 000 F CFA" }), _jsx("span", { className: "text-white-50 ms-2 text-decoration-line-through", children: "25 000 F CFA" })] })), loadingAccess ? (_jsx("div", { className: "spinner-border text-light", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Chargement..." }) })) : (_jsx("button", { type: "button", className: "btn btn-warning-custom btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg hover-scale", onClick: handleActionClick, children: !user ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-google me-2" }), "Se connecter avec Google pour continuer"] })) : hasPaidAccess ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-play-fill me-2 fs-5" }), "Acc\u00E9der \u00E0 ma formation (Reprendre l'apprentissage)"] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-credit-card me-2" }), "Payer la formation (9 000 F CFA)"] })) }))] }) })] }) }), _jsxs("div", { className: "row g-4 mt-4", children: [_jsxs("div", { className: "col-12 text-center mb-2", children: [_jsx("h3", { className: "font-serif fw-bold text-title", children: "Au programme de la formation (Sommaire)" }), _jsx("p", { className: "text-muted", children: "D\u00E9couvrez le contenu d\u00E9taill\u00E9 des 7 modules d'\u00E9lite" })] }), [
                                    { num: '0', title: 'Préface : Le constat brutal de 2026', desc: 'Pourquoi les clients n\'achètent plus des compétences, mais des transformations et des solutions.' },
                                    { num: '1', title: 'Module 1 : Le Mindset du Freelance d\'Élite', desc: 'Devenir le CEO de "Vous-même Inc.", dompter la valeur perçue et vaincre le syndrome de l\'imposteur.' },
                                    { num: '2', title: 'Module 2 : L\'Art de la Vente de Compétences', desc: 'Transformer un service en machine à cash, créer une offre irrésistible et comprendre la psychologie d\'achat.' },
                                    { num: '3', title: 'Module 3 : L\'Acquisition Client (4 Piliers)', desc: 'Le réseautage stratégique, le Personal Branding sur LinkedIn/X, la prospection à froid et les plateformes.' },
                                    { num: '4', title: 'Module 4 : La Vente à l\'International', desc: 'Conquérir les marchés USA, Europe et Australie depuis l\'Afrique, maitriser Wise, Payoneer et la communication.' },
                                    { num: '5', title: 'Module 5 : LA RÉVOLUTION FOLIODEV.SITE', desc: 'L\'inversion du marché : ne cherchez plus les clients, faites venir les clients à vous grâce à FolioDev.' },
                                    { num: '6', title: 'Module 6 : Le Closing', desc: 'Conclure la vente en 5 minutes, la règle des 3 questions et vaincre l\'objection "C\'est trop cher".' },
                                    { num: '7', title: 'Module 7 : Livraison & Fidélisation', desc: 'Offrir une expérience client digne d\'un palace, obtenir 5 étoiles et passer de Freelance solo à Agence.' },
                                ].map(mod => (_jsx("div", { className: "col-md-6 col-lg-3", children: _jsxs("div", { className: "card h-100 border-0 shadow-sm rounded-4 p-4 hover-shadow", style: { backgroundColor: '#ffffff' }, children: [_jsxs("div", { className: "d-flex align-items-center gap-3 mb-3", children: [_jsx("span", { className: "badge rounded-circle d-flex align-items-center justify-content-center text-white fw-bold", style: { width: '40px', height: '40px', backgroundColor: 'var(--folio-primary)', fontSize: '1rem' }, children: mod.num }), _jsx("h6", { className: "fw-bold text-title mb-0", children: mod.title })] }), _jsx("p", { className: "text-muted small mb-0", children: mod.desc })] }) }, mod.num)))] })] }) }), showPaymentModal && user && (_jsx(FormationPaymentModal, { user: user, onClose: () => setShowPaymentModal(false), onSuccess: () => {
                    setShowPaymentModal(false);
                    setHasPaidAccess(true);
                    onOpenReader();
                } }))] }));
}
