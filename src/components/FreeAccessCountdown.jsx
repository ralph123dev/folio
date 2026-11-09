import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const FREE_ACCESS_END = Date.parse('2026-09-27T23:59:59Z');
const getTimeRemaining = () => Math.max(0, FREE_ACCESS_END - Date.now());
const formatTimeRemaining = (timeRemaining) => {
    const totalSeconds = Math.floor(timeRemaining / 1000);
    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    };
};
export default function FreeAccessCountdown({ compact = false }) {
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);
    useEffect(() => {
        const timer = window.setInterval(() => {
            setTimeRemaining(getTimeRemaining());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);
    const countdown = formatTimeRemaining(timeRemaining);
    const units = [
        ['days', compact ? 'j' : 'Jours'],
        ['hours', compact ? 'h' : 'Heures'],
        ['minutes', compact ? 'm' : 'Minutes'],
        ['seconds', compact ? 's' : 'Secondes'],
    ];
    return (_jsx("div", { className: `countdown-grid${compact ? ' countdown-grid-compact' : ''}`, role: "timer", "aria-label": "Temps restant avant la fin du compte \u00E0 rebours", children: units.map(([unit, label]) => (_jsxs("div", { className: "countdown-unit", children: [_jsx("strong", { children: String(countdown[unit]).padStart(2, '0') }), _jsx("span", { children: label })] }, unit))) }));
}
