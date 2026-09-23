import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function FormationPaymentModal({ user, onClose, onSuccess }) {
  const [solde, setSolde] = useState(null);
  const [loadingSolde, setLoadingSolde] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const FORMATION_PRICE = 9000;

  // Charger le solde de l'utilisateur au montage
  useEffect(() => {
    let mounted = true;
    const fetchSolde = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('profils')
          .select('solde')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (mounted) {
          setSolde(data?.solde ?? 0);
        }
      } catch (err) {
        console.error("Erreur chargement solde:", err);
        if (mounted) {
          setSolde(0);
          setError("Impossible de charger votre solde. Réessayez.");
        }
      } finally {
        if (mounted) setLoadingSolde(false);
      }
    };

    fetchSolde();
    return () => { mounted = false; };
  }, [user]);

  const hasSufficientBalance = solde !== null && solde >= FORMATION_PRICE;

  const handlePayWithBalance = async () => {
    if (!hasSufficientBalance) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Déduire le montant du solde
      const newSolde = solde - FORMATION_PRICE;
      const { error: updateErr } = await supabase
        .from('profils')
        .update({ solde: newSolde })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      // 2. Enregistrer l'accès dans la table formation_access
      const { error: accessErr } = await supabase.from('formation_access').upsert({
        user_id: user.id,
        email: user.email,
        amount: FORMATION_PRICE,
        status: 'active',
      }, { onConflict: 'user_id' });

      if (accessErr) throw accessErr;

      // 3. Initialiser la progression si inexistante
      await supabase.from('formation_progress').upsert({
        user_id: user.id,
        current_module_index: 0,
        completed_modules: [],
        quiz_scores: {}
      }, { onConflict: 'user_id' });

      setSuccess(true);
      setSolde(newSolde);

      // Petite pause pour montrer le succès, puis rediriger
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Erreur paiement formation:", err);
      setError(err?.message || "Une erreur est survenue lors du paiement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(15, 12, 41, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1070 }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
          
          {/* Header */}
          <div className="modal-header border-0 text-white px-4 py-4 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #26215C 0%, #4338CA 100%)' }}>
            <div>
              <span className="badge bg-warning text-dark rounded-pill fw-bold px-3 py-1 mb-2">
                🎓 Formation Vendeur d'Élite
              </span>
              <h4 className="modal-title font-serif fw-bold text-white mb-0">
                Paiement de la Formation
              </h4>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4">
            {/* Montant de la formation */}
            <div className="p-4 rounded-4 text-center mb-4 border" style={{ backgroundColor: '#F4F4FD', borderColor: 'rgba(67, 56, 202, 0.15)' }}>
              <span className="text-muted small fw-bold text-uppercase tracking-wider">Montant de la formation</span>
              <h2 className="display-5 fw-bold my-1" style={{ color: 'var(--folio-primary)' }}>
                9 000 <span className="fs-4">F CFA</span>
              </h2>
              <p className="text-muted small mb-0">
                <i className="bi bi-shield-check text-success me-1"></i>
                Accès complet à vie • 7 Modules d'Élite • Mises à jour incluses
              </p>
            </div>

            {/* Solde actuel */}
            {loadingSolde ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement du solde...</span>
                </div>
                <p className="text-muted small mt-2 mb-0">Vérification de votre solde...</p>
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-4 text-center mb-4 border ${hasSufficientBalance ? 'border-success' : 'border-danger'}`} 
                     style={{ backgroundColor: hasSufficientBalance ? '#f0fdf4' : '#fef2f2' }}>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <i className={`bi ${hasSufficientBalance ? 'bi-wallet-fill text-success' : 'bi-wallet2 text-danger'} fs-4`}></i>
                    <span className="text-muted small fw-bold text-uppercase">Votre solde actuel</span>
                  </div>
                  <h3 className={`fw-bold mb-1 ${hasSufficientBalance ? 'text-success' : 'text-danger'}`}>
                    {Number(solde).toLocaleString('fr-FR')} F CFA
                  </h3>
                  
                  {hasSufficientBalance ? (
                    <p className="text-success small mb-0 fw-medium">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Solde suffisant pour payer la formation
                    </p>
                  ) : (
                    <div className="mt-2">
                      <p className="text-danger fw-bold mb-2">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Solde insuffisant
                      </p>
                      <p className="text-muted small mb-0">
                        Il vous manque <strong className="text-danger">{Number(FORMATION_PRICE - solde).toLocaleString('fr-FR')} F CFA</strong>. 
                        Rechargez votre solde dans le <strong>Tableau de bord</strong> pour continuer.
                      </p>
                    </div>
                  )}
                </div>

                {/* Message de succès */}
                {success && (
                  <div className="alert alert-success rounded-4 text-center py-3 mb-3">
                    <i className="bi bi-check-circle-fill fs-3 d-block mb-2 text-success"></i>
                    <strong>Paiement réussi !</strong>
                    <p className="small mb-0 mt-1">Redirection vers votre formation...</p>
                  </div>
                )}

                {/* Erreur */}
                {error && (
                  <div className="alert alert-danger rounded-3 py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                  </div>
                )}

                {/* Récapitulatif avant paiement */}
                {hasSufficientBalance && !success && (
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <h6 className="fw-bold text-title mb-2 small">
                      <i className="bi bi-receipt me-2 text-primary"></i>Récapitulatif
                    </h6>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Solde actuel</span>
                      <span className="fw-medium">{Number(solde).toLocaleString('fr-FR')} F CFA</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Coût de la formation</span>
                      <span className="fw-medium text-danger">- {Number(FORMATION_PRICE).toLocaleString('fr-FR')} F CFA</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between small fw-bold">
                      <span>Solde après paiement</span>
                      <span className="text-success">{Number(solde - FORMATION_PRICE).toLocaleString('fr-FR')} F CFA</span>
                    </div>
                  </div>
                )}

                {/* Bouton de paiement ou message d'insuffisance */}
                {hasSufficientBalance ? (
                  <button 
                    type="button"
                    className="btn btn-lg w-100 py-3 text-white fw-bold shadow"
                    style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', borderRadius: '14px', border: 'none' }}
                    disabled={loading || success}
                    onClick={handlePayWithBalance}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Paiement en cours...
                      </>
                    ) : success ? (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Paiement effectué !
                      </>
                    ) : (
                      <>
                        <i className="bi bi-wallet-fill me-2"></i>
                        Payer 9 000 F CFA avec mon solde
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="btn btn-lg w-100 py-3 fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #26215C 0%, #4338CA 100%)', borderRadius: '14px', border: 'none', color: 'white' }}
                    onClick={onClose}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Retour — Rechargez votre solde dans le Tableau de bord
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
