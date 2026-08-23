import React from 'react';

const CtaSection = ({ onStart }) => {
  return (
    <section className="py-5" style={{ backgroundColor: 'var(--folio-bg)' }}>
      <div className="container py-5">
        <div className="text-center mx-auto reveal" style={{ maxWidth: '800px' }}>
          <h2 className="display-4 font-serif mb-4">Prêt à faire décoller ton portfolio ?</h2>
          <p className="lead text-body-custom mb-5 px-md-5">
            Rejoins les développeurs qui ont arrêté de deviner et commencé à comprendre ce que veulent vraiment leurs visiteurs.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-column flex-sm-row">
            <button type="button" onClick={onStart} className="btn btn-primary-custom btn-lg px-5 py-3">
              Créer mon compte
            </button>
            <button className="btn btn-outline-custom btn-lg px-5 py-3">
              Voir une démo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
