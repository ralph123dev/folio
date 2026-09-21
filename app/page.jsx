import Link from 'next/link';
import CategoryGrid from '../components/freelancers/CategoryGrid';
import Footer from '../components/site/Footer';
import Header from '../components/site/Header';
import { getCategories } from '../lib/freelancers';
import { PRIMARY_SPECIALTIES, categoryPath } from '../lib/site';

export const revalidate = 3600;

export default async function HomePage() {
  const fetchedCategories = await getCategories();
  const categories = fetchedCategories.length ? fetchedCategories : PRIMARY_SPECIALTIES.map((label) => ({
    label,
    slug: label,
    count: 0,
  }));

  return (
    <>
      <Header />
      <main>
        <section className="landing-hero">
          <div className="seo-container landing-hero__content">
            <p className="eyebrow">Plateforme B2B de talents indépendants</p>
            <h1>Trouvez le freelance qui fera avancer votre projet.</h1>
            <p className="landing-hero__lead">Folio met les entreprises en relation avec des spécialistes du développement, du design et du digital, selon leur expertise, leur localisation et leurs services.</p>
            <div className="landing-hero__actions">
              <Link href="/freelancers" className="site-button">Parcourir les freelancers</Link>
              <Link href="/espace?auth=signup" className="site-button site-button--outline">Publier mon profil</Link>
            </div>
          </div>
        </section>

        <section className="seo-container landing-copy" id="comment-ca-marche" aria-labelledby="landing-copy-title">
          <p className="eyebrow">Un sourcing plus simple</p>
          <h2 id="landing-copy-title">Des compétences claires, des profils réellement exploitables</h2>
          <p>Recruter un indépendant ne devrait pas commencer par des dizaines de messages sans réponse ni par des portfolios difficiles à comparer. Folio aide les équipes B2B, startups, agences et PME à identifier rapidement les personnes capables de livrer un site web, une application mobile, une identité visuelle, une interface produit ou une stratégie d’acquisition. Chaque profil réunit la spécialité du freelancer, son expérience, ses services, ses liens professionnels, sa zone d’intervention et, lorsqu’il est indiqué, son tarif de départ. Vous pouvez ainsi préparer un premier échange avec le bon contexte.</p>
          <p>Pour les freelancers, Folio transforme un profil en page professionnelle facilement partageable. Une URL claire par spécialité et localisation permet à un développeur, un designer ou un expert SEO d’être trouvé par des prospects qui recherchent précisément ce savoir-faire. Les pages font également le lien vers les catégories métier pertinentes, afin de renforcer la découverte organique et de donner aux visiteurs plusieurs chemins vers les talents adaptés à leur besoin.</p>
          <p>La plateforme est pensée pour des décisions concrètes : comparer une expertise, vérifier une note lorsqu’elle existe, consulter un portfolio et engager la conversation sans détour. Plutôt que de masquer l’information derrière un formulaire, Folio rend les services lisibles pour les acheteurs tout en laissant aux indépendants la maîtrise des informations publiées. Que vous cherchiez un développeur web pour accélérer un lancement, un designer UI/UX pour améliorer un produit, ou un spécialiste du contenu pour soutenir votre croissance, commencez par une catégorie et affinez ensuite par localisation.</p>
        </section>

        <section className="seo-container landing-process" aria-labelledby="process-title">
          <p className="eyebrow">Comment ça marche</p>
          <h2 id="process-title">Trois étapes pour démarrer</h2>
          <ol>
            <li><strong>Explorez un métier.</strong> Accédez à une catégorie structurée autour de la compétence recherchée.</li>
            <li><strong>Évaluez un profil.</strong> Découvrez les services, l’expérience, la localisation, le portfolio et les avis disponibles.</li>
            <li><strong>Contactez l’expert.</strong> Ouvrez une conversation avec une personne déjà alignée sur votre projet.</li>
          </ol>
        </section>

        <div className="seo-container"><CategoryGrid categories={categories.slice(0, 8)} /></div>
        <section className="landing-cta">
          <div className="seo-container">
            <h2>Votre prochain collaborateur est peut-être déjà sur Folio.</h2>
            <Link href={categoryPath('Développeur web')} className="site-button">Découvrir les profils</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
