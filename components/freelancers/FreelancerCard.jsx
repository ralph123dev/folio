import Image from 'next/image';
import Link from 'next/link';
import { categoryPath, locationPath, profilePath, safeImageUrl } from '../../lib/site';

function makeWhatsAppUrl(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export default function FreelancerCard({ freelancer, headingLevel = 'h2' }) {
  const Heading = headingLevel;
  const image = safeImageUrl(freelancer.photo_url);
  const whatsappUrl = makeWhatsAppUrl(freelancer.whatsapp);

  return (
    <article className="freelancer-card">
      <div className="freelancer-card__topline">
        {image ? (
          <Image
            src={image}
            alt={`Portrait de ${freelancer.name}`}
            width={96}
            height={96}
            sizes="96px"
            loading="lazy"
            className="freelancer-card__avatar"
          />
        ) : <div className="freelancer-card__avatar freelancer-card__avatar--placeholder" aria-hidden="true">{freelancer.name.charAt(0)}</div>}
        <div>
          <Heading className="freelancer-card__name"><Link href={profilePath(freelancer)}>{freelancer.name}</Link></Heading>
          <p className="freelancer-card__specialty">{freelancer.activite}</p>
          <p className="freelancer-card__location">{freelancer.location}</p>
        </div>
      </div>
      {freelancer.description && <p className="freelancer-card__description">{freelancer.description}</p>}
      <div className="freelancer-card__facts">
        {freelancer.annees_experience ? <span>{freelancer.annees_experience} an{freelancer.annees_experience > 1 ? 's' : ''} d’expérience</span> : null}
        {freelancer.averageRating ? <span aria-label={`Note moyenne ${freelancer.averageRating} sur 5`}>★ {freelancer.averageRating}/5 ({freelancer.ratingCount})</span> : null}
        {Number(freelancer.prix_a_partir_de) > 0 ? <span>Dès {Number(freelancer.prix_a_partir_de).toLocaleString('fr-FR')} {freelancer.devise || 'XAF'}</span> : null}
      </div>
      <div className="freelancer-card__links">
        <Link href={profilePath(freelancer)} className="text-link">Voir le profil</Link>
        {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-link">Contacter</a> : null}
      </div>
      <p className="freelancer-card__taxonomy">
        <Link href={categoryPath(freelancer.activite)}>{freelancer.activite}</Link>
        <span aria-hidden="true"> · </span>
        <Link href={locationPath(freelancer.activite, freelancer.location)}>{freelancer.location}</Link>
      </p>
    </article>
  );
}
