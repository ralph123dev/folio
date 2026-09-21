import Link from 'next/link';
import CategoryGrid from '../../components/freelancers/CategoryGrid';
import FreelancerCard from '../../components/freelancers/FreelancerCard';
import JsonLd from '../../components/seo/JsonLd';
import Breadcrumbs from '../../components/site/Breadcrumbs';
import Footer from '../../components/site/Footer';
import Header from '../../components/site/Header';
import { filterFreelancers, getCategories, getFreelancers } from '../../lib/freelancers';
import { breadcrumbJsonLd } from '../../lib/seo';
import { absoluteUrl, normalizeText } from '../../lib/site';

export const revalidate = 3600;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.q || '').trim();

  if (!query) {
    return {
      title: 'Annuaire des freelancers',
      description: 'Trouvez un freelance en développement, design, SEO et marketing digital sur Folio.',
      alternates: { canonical: absoluteUrl('/freelancers') },
    };
  }

  const safeQuery = normalizeText(query, 70);
  return {
    title: `Recherche de freelancers : ${safeQuery}`,
    description: `Résultats Folio pour « ${safeQuery} ». Explorez les profils et leurs services.`,
    alternates: { canonical: absoluteUrl('/freelancers') },
    // Free-text result pages can be numerous and should not compete with the
    // category/location landing pages in the index.
    robots: { index: false, follow: true },
  };
}

export default async function FreelancersPage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.q || '').trim();
  const [freelancers, categories] = await Promise.all([getFreelancers(), getCategories()]);
  const results = filterFreelancers(freelancers, query).slice(0, 60);
  const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Freelancers', path: '/freelancers' }];

  return (
    <>
      <Header />
      <main className="directory-page">
        <div className="seo-container">
          <Breadcrumbs items={breadcrumbs} />
          <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
          <section className="directory-intro">
            <p className="eyebrow">Annuaire B2B</p>
            <h1>Trouvez un freelancer pour votre projet</h1>
            <p>Parcourez des profils de développeurs, designers et spécialistes du digital. Pour les filtres principaux, utilisez les pages métier et localisation ci-dessous : elles ont une URL stable et partageable.</p>
            <form className="directory-search" action="/freelancers" method="get" role="search">
              <label htmlFor="freelancer-search">Rechercher par nom, compétence ou localisation</label>
              <div>
                <input id="freelancer-search" name="q" type="search" defaultValue={query} placeholder="Ex. développeur React à Abidjan" />
                <button type="submit" className="site-button">Rechercher</button>
              </div>
            </form>
          </section>

          {query ? (
            <section aria-labelledby="search-results-title">
              <h2 id="search-results-title">{results.length} résultat{results.length > 1 ? 's' : ''} pour « {query} »</h2>
              {results.length ? <div className="freelancer-grid">{results.map((freelancer) => <FreelancerCard key={freelancer.id} freelancer={freelancer} />)}</div> : <p className="empty-state">Aucun profil ne correspond encore à cette recherche. Essayez un métier ou une localisation plus large.</p>}
            </section>
          ) : (
            <section aria-labelledby="directory-results-title">
              <h2 id="directory-results-title">Profils récemment publiés</h2>
              {results.length ? <div className="freelancer-grid">{results.map((freelancer) => <FreelancerCard key={freelancer.id} freelancer={freelancer} />)}</div> : <p className="empty-state">Les premiers profils apparaîtront ici dès leur publication. <Link href="/espace?auth=signup">Créer un profil freelance</Link>.</p>}
            </section>
          )}

          <CategoryGrid categories={categories} title="Affiner par spécialité" />
        </div>
      </main>
      <Footer />
    </>
  );
}
