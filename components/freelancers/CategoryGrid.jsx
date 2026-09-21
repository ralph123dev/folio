import Link from 'next/link';
import { categoryPath } from '../../lib/site';

export default function CategoryGrid({ categories, title = 'Explorer par métier' }) {
  if (!categories?.length) return null;

  return (
    <section className="category-grid-section" aria-labelledby="category-grid-title">
      <div className="section-heading">
        <p className="eyebrow">Annuaire spécialisé</p>
        <h2 id="category-grid-title">{title}</h2>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <Link className="category-card" href={categoryPath(category.slug || category.label)} key={category.slug || category.label}>
            <span>{category.label}</span>
            <small>{category.count} profil{category.count > 1 ? 's' : ''}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
