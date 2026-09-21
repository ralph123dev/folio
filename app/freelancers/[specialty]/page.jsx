import { notFound } from 'next/navigation';
import CategoryGrid from '../../../components/freelancers/CategoryGrid';
import FreelancerCard from '../../../components/freelancers/FreelancerCard';
import JsonLd from '../../../components/seo/JsonLd';
import Breadcrumbs from '../../../components/site/Breadcrumbs';
import Footer from '../../../components/site/Footer';
import Header from '../../../components/site/Header';
import { getCategories, getFreelancersByCategory } from '../../../lib/freelancers';
import { breadcrumbJsonLd, categoryMetadata } from '../../../lib/seo';
import { categoryPath, locationPath, PRIMARY_SPECIALTIES, slugify } from '../../../lib/site';

export const revalidate = 3600;

async function getCategoryPageData(specialty) {
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === specialty);
  const fallbackLabel = PRIMARY_SPECIALTIES.find((label) => slugify(label) === specialty);
  const label = category?.label || fallbackLabel;
  if (!label) return null;
  const freelancers = await getFreelancersByCategory(specialty);
  return { category: category || { slug: specialty, label, count: freelancers.length, locations: [] }, freelancers };
}

export async function generateMetadata({ params }) {
  const { specialty } = await params;
  const data = await getCategoryPageData(specialty);
  if (!data) return { title: 'Catégorie introuvable', robots: { index: false, follow: false } };
  return categoryMetadata({ label: data.category.label, canonicalPath: categoryPath(specialty), count: data.freelancers.length });
}

export default async function SpecialtyPage({ params }) {
  const { specialty } = await params;
  const data = await getCategoryPageData(specialty);
  if (!data) notFound();

  const { category, freelancers } = data;
  const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Freelancers', path: '/freelancers' }, { name: category.label, path: categoryPath(specialty) }];
  const locations = category.locations || [];

  return (
    <>
      <Header />
      <main className="category-page">
        <div className="seo-container">
          <Breadcrumbs items={breadcrumbs} />
          <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
          <section className="category-intro">
            <p className="eyebrow">Spécialité</p>
            <h1>Freelances {category.label}</h1>
            <p>Folio réunit des {category.label.toLocaleLowerCase('fr')} pour les entreprises qui veulent concrétiser un besoin précis sans multiplier les intermédiaires. Comparez les profils, leurs expériences, leurs services et leurs moyens de contact avant de lancer la discussion.</p>
            <p>Cette page métier donne un point d’entrée clair aux décideurs qui recherchent une expertise ciblée. Les profils peuvent présenter un portfolio, une note lorsqu’elle est disponible, une zone d’intervention et un tarif de départ. Cette information facilite un premier tri raisonnable : vous savez quel savoir-faire est proposé, où l’expert intervient et comment poursuivre l’échange.</p>
            <p>Le bon indépendant ne se résume pas à une liste de technologies. Prenez le temps de lire la description de ses services, d’évaluer son expérience et de vérifier l’adéquation entre le problème à résoudre et la manière dont il travaille. Vous pouvez ensuite suivre les liens internes vers une localisation ou revenir à l’annuaire général si votre besoin évolue. Pour les freelancers, cette catégorie est aussi une page de découverte durable : un prospect peut la partager à son équipe ou y revenir au moment opportun.</p>
          </section>

          {locations.length > 0 && <section className="location-links" aria-labelledby="locations-title"><h2 id="locations-title">{category.label} par localisation</h2><div>{locations.map((location) => <Link key={location.slug} href={locationPath(category.slug, location.slug)}>{location.label}</Link>)}</div></section>}

          <section aria-labelledby="specialty-profiles-title">
            <h2 id="specialty-profiles-title">Profils {category.label}</h2>
            {freelancers.length ? <div className="freelancer-grid">{freelancers.map((freelancer) => <FreelancerCard key={freelancer.id} freelancer={freelancer} />)}</div> : <p className="empty-state">Les profils publiés dans cette spécialité apparaîtront ici prochainement.</p>}
          </section>
          <CategoryGrid categories={[]} />
        </div>
      </main>
      <Footer />
    </>
  );
}
