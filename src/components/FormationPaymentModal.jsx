import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
export default function FormationPaymentModal({ user, onClose, onSuccess }) {
    const [solde, setSolde] = useState(null);
    const [loadingSolde, setLoadingSolde] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const FORMATION_PRICE = 9000;
    useEffect(() => {
        let mounted = true;
        const fetchSolde = async () => {
            try {
                const { data, error: fetchErr } = await supabase
                    .from('profils')
                    .select('solde')
                    .eq('id', user.id)
                    .maybeSingle();
                if (fetchErr)
                    throw fetchErr;
                if (mounted) {
                    setSolde(data?.solde ?? 0);
                }
            }
            catch (err) {
                console.error("Erreur chargement solde:", err);
                if (mounted) {
                    setSolde(0);
                    setError("Impossible de charger votre solde. Réessayez.");
                }
            }
            finally {
                if (mounted)
                    setLoadingSolde(false);
            }
        };
        fetchSolde();
        return () => { mounted = false; };
    }, [user]);
    const hasSufficientBalance = solde !== null && solde >= FORMATION_PRICE;
    const handlePayWithBalance = async () => {
        if (!hasSufficientBalance)
            return;
        setLoading(true);
        setError(null);
        try {
            const newSolde = solde - FORMATION_PRICE;
            const { error: updateErr } = await supabase
                .from('profils')
                .update({ solde: newSolde })
                .eq('id', user.id);
            if (updateErr)
                throw updateErr;
            const { error: accessErr } = await supabase.from('formation_access').upsert({
                user_id: user.id,
                email: user.email,
                amount: FORMATION_PRICE,
                status: 'active',
            }, { onConflict: 'user_id' });
            if (accessErr)
                throw accessErr;
            await supabase.from('formation_progress').upsert({
                user_id: user.id,
                current_module_index: 0,
                completed_modules: [],
                quiz_scores: {}
            }, { onConflict: 'user_id' });
            setSuccess(true);
            setSolde(newSolde);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }
        catch (err) {
            console.error("Erreur paiement formation:", err);
            setError(err?.message || "Une erreur est survenue lors du paiement. Réessayez.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", style: { backgroundColor: 'rgba(15, 12, 41, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1070 }, onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", children: _jsxs("div", { className: "modal-content border-0 shadow-lg", style: { borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff' }, children: [_jsxs("div", { className: "modal-header border-0 text-white px-4 py-4 d-flex justify-content-between align-items-center", style: { background: 'linear-gradient(135deg, #26215C 0%, #4338CA 100%)' }, children: [_jsxs("div", { children: [_jsx("span", { className: "badge bg-warning text-dark rounded-pill fw-bold px-3 py-1 mb-2", children: "\uD83C\uDF93 Formation Vendeur d'\u00C9lite" }), _jsx("h4", { className: "modal-title font-serif fw-bold text-white mb-0", children: "Paiement de la Formation" })] }), _jsx("button", { type: "button", className: "btn-close btn-close-white", onClick: onClose, disabled: loading })] }), _jsxs("div", { className: "modal-body p-4", children: [_jsxs("div", { className: "p-4 rounded-4 text-center mb-4 border", style: { backgroundColor: '#F4F4FD', borderColor: 'rgba(67, 56, 202, 0.15)' }, children: [_jsx("span", { className: "text-muted small fw-bold text-uppercase tracking-wider", children: "Montant de la formation" }), _jsxs("h2", { className: "display-5 fw-bold my-1", style: { color: 'var(--folio-primary)' }, children: ["9 000 ", _jsx("span", { className: "fs-4", children: "F CFA" })] }), _jsxs("p", { className: "text-muted small mb-0", children: [_jsx("i", { className: "bi bi-shield-check text-success me-1" }), "Acc\u00E8s complet \u00E0 vie \u2022 7 Modules d'\u00C9lite \u2022 Mises \u00E0 jour incluses"] })] }), loadingSolde ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("div", { className: "spinner-border text-primary", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Chargement du solde..." }) }), _jsx("p", { className: "text-muted small mt-2 mb-0", children: "V\u00E9rification de votre solde..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: `p-4 rounded-4 text-center mb-4 border ${hasSufficientBalance ? 'border-success' : 'border-danger'}`, style: { backgroundColor: hasSufficientBalance ? '#f0fdf4' : '#fef2f2' }, children: [_jsxs("div", { className: "d-flex align-items-center justify-content-center gap-2 mb-2", children: [_jsx("i", { className: `bi ${hasSufficientBalance ? 'bi-wallet-fill text-success' : 'bi-wallet2 text-danger'} fs-4` }), _jsx("span", { className: "text-muted small fw-bold text-uppercase", children: "Votre solde actuel" })] }), _jsxs("h3", { className: `fw-bold mb-1 ${hasSufficientBalance ? 'text-success' : 'text-danger'}`, children: [Number(solde).toLocaleString('fr-FR'), " F CFA"] }), hasSufficientBalance ? (_jsxs("p", { className: "text-success small mb-0 fw-medium", children: [_jsx("i", { className: "bi bi-check-circle-fill me-1" }), "Solde suffisant pour payer la formation"] })) : (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: "text-danger fw-bold mb-2", children: [_jsx("i", { className: "bi bi-exclamation-triangle-fill me-1" }), "Solde insuffisant"] }), _jsxs("p", { className: "text-muted small mb-0", children: ["Il vous manque ", _jsxs("strong", { className: "text-danger", children: [Number(FORMATION_PRICE - solde).toLocaleString('fr-FR'), " F CFA"] }), ". Rechargez votre solde dans le ", _jsx("strong", { children: "Tableau de bord" }), " pour continuer."] })] }))] }), success && (_jsxs("div", { className: "alert alert-success rounded-4 text-center py-3 mb-3", children: [_jsx("i", { className: "bi bi-check-circle-fill fs-3 d-block mb-2 text-success" }), _jsx("strong", { children: "Paiement r\u00E9ussi !" }), _jsx("p", { className: "small mb-0 mt-1", children: "Redirection vers votre formation..." })] })), error && (_jsxs("div", { className: "alert alert-danger rounded-3 py-2 px-3 mb-3", style: { fontSize: '0.85rem' }, children: [_jsx("i", { className: "bi bi-exclamation-triangle me-2" }), error] })), hasSufficientBalance && !success && (_jsxs("div", { className: "p-3 rounded-3 bg-light border mb-3", children: [_jsxs("h6", { className: "fw-bold text-title mb-2 small", children: [_jsx("i", { className: "bi bi-receipt me-2 text-primary" }), "R\u00E9capitulatif"] }), _jsxs("div", { className: "d-flex justify-content-between small mb-1", children: [_jsx("span", { className: "text-muted", children: "Solde actuel" }), _jsxs("span", { className: "fw-medium", children: [Number(solde).toLocaleString('fr-FR'), " F CFA"] })] }), _jsxs("div", { className: "d-flex justify-content-between small mb-1", children: [_jsx("span", { className: "text-muted", children: "Co\u00FBt de la formation" }), _jsxs("span", { className: "fw-medium text-danger", children: ["- ", Number(FORMATION_PRICE).toLocaleString('fr-FR'), " F CFA"] })] }), _jsx("hr", { className: "my-2" }), _jsxs("div", { className: "d-flex justify-content-between small fw-bold", children: [_jsx("span", { children: "Solde apr\u00E8s paiement" }), _jsxs("span", { className: "text-success", children: [Number(solde - FORMATION_PRICE).toLocaleString('fr-FR'), " F CFA"] })] })] })), hasSufficientBalance ? (_jsx("button", { type: "button", className: "btn btn-lg w-100 py-3 text-white fw-bold shadow", style: { background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', borderRadius: '14px', border: 'none' }, disabled: loading || success, onClick: handlePayWithBalance, children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status" }), "Paiement en cours..."] })) : success ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-check-circle-fill me-2" }), "Paiement effectu\u00E9 !"] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-wallet-fill me-2" }), "Payer 9 000 F CFA avec mon solde"] })) })) : (_jsxs("button", { type: "button", className: "btn btn-lg w-100 py-3 fw-bold shadow-sm", style: { background: 'linear-gradient(135deg, #26215C 0%, #4338CA 100%)', borderRadius: '14px', border: 'none', color: 'white' }, onClick: onClose, children: [_jsx("i", { className: "bi bi-arrow-left me-2" }), "Retour \u2014 Rechargez votre solde dans le Tableau de bord"] }))] }))] })] }) }) }));
}
