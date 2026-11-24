import React from 'react';
import ralphImage from '../assets/ralph.jpg';

const CtaSection = ({ onStart, onFormation }) => {
    return (
        <section className="py-5" style={{ backgroundColor: 'var(--folio-bg)' }}>
            <div className="container py-5">
                <div className="text-center mx-auto reveal" style={{ maxWidth: '960px' }}>
                    <h2 className="display-4 font-serif mb-4">Prêt à faire décoller ton portfolio & tes ventes ?</h2>
                    <div className="cta-founder-layout">
                        <div className="cta-founder-copy">
                            <p className="lead text-body-custom mb-3">
                                Je suis Ralph, créateur de Folio. J’aide les freelances à valoriser leur savoir-faire, présenter leurs projets et transformer leur portfolio en nouvelles opportunités.
                            </p>
                            <p className="cta-founder-caption">Ralph <span aria-hidden="true">·</span> Créateur de Folio</p>
                        </div>
                        <figure className="cta-founder">
                            <img src={ralphImage} alt="Portrait de Ralph, créateur de Folio" className="cta-founder-image" />
                        </figure>
                    </div>
                    <div className="d-flex justify-content-center gap-3 flex-column flex-sm-row">
                        <button type="button" onClick={onStart} className="btn btn-primary-custom btn-lg px-5 py-3">
                            Créer mon compte
                        </button>
                        <button type="button" onClick={onFormation} className="btn btn-outline-custom btn-lg px-5 py-3 fw-bold">
                            Découvrir la Formation
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
