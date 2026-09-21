import burkinaFasoFlag from '../assets/pays/téléchargement (14).png';
import cameroonFlag from '../assets/pays/téléchargement (9).png';
import coteDivoireFlag from '../assets/pays/téléchargement (8).png';
import maliFlag from '../assets/pays/téléchargement (13).png';
import nigerFlag from '../assets/pays/téléchargement (12).png';
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
];

const marqueeCountries = Array.from({ length: 4 }, () => supportedCountries).flat();

const SupportedCountries = () => (
  <section id="supported-countries" className="supported-countries py-5" aria-labelledby="supported-countries-title">
    <div className="container text-center mb-4 reveal">
      <p className="text-uppercase fw-semibold mb-2 supported-countries-kicker">Folio en Afrique</p>
      <h2 id="supported-countries-title" className="display-5 font-serif mb-2">Pays pris en charge</h2>
      <p className="text-body-custom mb-0">Folio accompagne déjà les indépendants dans ces pays.</p>
    </div>

    <div className="supported-countries-marquee" aria-label="Liste des pays pris en charge">
      <div className="supported-countries-track">
        {marqueeCountries.map((country, index) => {
          const isDuplicate = index >= supportedCountries.length;

          return (
            <div className="supported-country" key={`${country.name}-${index}`} aria-hidden={isDuplicate}>
              <img src={country.flag} alt={isDuplicate ? '' : `Drapeau de ${country.name}`} />
              <span>{country.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default SupportedCountries;
