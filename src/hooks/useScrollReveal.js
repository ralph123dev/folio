import { useEffect } from 'react';
export const useScrollReveal = (introFinished, showAuth) => {
    useEffect(() => {
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
