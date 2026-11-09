import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import burkinaFasoFlag from '../assets/pays/téléchargement (14).png';
import cameroonFlag from '../assets/pays/téléchargement (9).png';
import coteDivoireFlag from '../assets/pays/téléchargement (8).png';
import maliFlag from '../assets/pays/téléchargement (13).png';
import nigerFlag from '../assets/pays/téléchargement (12).png';
import rdcFlag from '../assets/pays/rdc.png';
import senegalFlag from '../assets/pays/téléchargement (10).png';
import togoFlag from '../assets/pays/téléchargement (11).png';
const supportedCountries = [
    { name: "Côte d’Ivoire", flag: coteDivoireFlag },
    { name: 'Cameroun', flag: cameroonFlag },
    { name: 'Sénégal', flag: senegalFlag },
    { name: 'Togo', flag: togoFlag },
    { name: 'Niger', flag: nigerFlag },
    { name: 'Mali', flag: maliFlag },
    { name: 'Burkina Faso', flag: burkinaFasoFlag },
    { name: 'RDC', flag: rdcFlag },
];
const marqueeCountries = Array.from({ length: 4 }, () => supportedCountries).flat();
const SupportedCountries = () => (_jsxs("section", { id: "supported-countries", className: "supported-countries py-5", "aria-labelledby": "supported-countries-title", children: [_jsxs("div", { className: "container text-center mb-4 reveal", children: [_jsx("p", { className: "text-uppercase fw-semibold mb-2 supported-countries-kicker", children: "Folio en Afrique" }), _jsx("h2", { id: "supported-countries-title", className: "display-5 font-serif mb-2", children: "Pays pris en charge" }), _jsx("p", { className: "text-body-custom mb-0", children: "Folio accompagne d\u00E9j\u00E0 les ind\u00E9pendants dans ces pays." })] }), _jsx("div", { className: "supported-countries-marquee", "aria-label": "Liste des pays pris en charge", children: _jsx("div", { className: "supported-countries-track", children: marqueeCountries.map((country, index) => {
                    const isDuplicate = index >= supportedCountries.length;
                    return (_jsxs("div", { className: "supported-country", "aria-hidden": isDuplicate, children: [_jsx("img", { src: country.flag, alt: isDuplicate ? '' : `Drapeau de ${country.name}` }), _jsx("span", { children: country.name })] }, `${country.name}-${index}`));
                }) }) })] }));
export default SupportedCountries;
