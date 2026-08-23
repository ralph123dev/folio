import { useEffect } from 'react';

export const useScrollReveal = (introFinished, showAuth) => {
  useEffect(() => {
    // Si la vidéo d'intro n'est pas finie (ou si l'auth est affichée), on pourrait ne pas observer,
    // mais dans tous les cas l'observer se nettoiera si les éléments ne sont pas là.
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    // Timeout léger pour s'assurer que le DOM est bien rendu après un changement d'état
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.reveal');
      elements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [introFinished, showAuth]);
};
