import React from 'react';

const Hero = ({ onStart, onFormation }) => {
    return (
        <section className="py-5 mt-4 mt-lg-5 text-center">
            <div className="container">
                <div className="row justify-content-center mb-5">
                    <div className="col-lg-8">
                        <p className="text-uppercase fw-semibold tracking-wider mb-3 reveal" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                            FOLIO DEV • L'INTELLIGENCE ARTIFICIELLE AU SERVICE DES FREELANCES.
                        </p>
                        <h1 className="display-3 lh-sm mb-4 reveal reveal-delay-1">
                            Propulse ton activité de freelance grâce à un portfolio boosté par l'IA.
                        </h1>
                        <p className="lead text-body-custom mb-5 mx-auto fs-5 reveal reveal-delay-2" style={{ maxWidth: '600px' }}>
                            Ne te contente plus d'attendre les clients.
                        </p>
                        <p className="text-body-custom mb-5 mx-auto fs-5 reveal reveal-delay-2" style={{ maxWidth: '700px' }}>
                            Créer un portfolio intelligent en 5 minutes, analyse ton audience en temps réel et reçois des alertes de missions ciblées directement dans ta boîte mail.
                        </p>
                        <div className="d-flex flex-wrap justify-content-center gap-2 reveal reveal-delay-3">
                            <button type="button" onClick={onStart} className="btn btn-primary-custom btn-lg px-5 py-3 shadow-sm">
                                Créer mon portfolio gratuit
                            </button>
                            <button type="button" onClick={onFormation} className="btn btn-outline-custom btn-lg px-4 py-3 shadow-sm fw-bold">
                                Formation Freelance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
