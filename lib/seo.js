import {
  absoluteUrl,
  displayName,
  normalizeText,
  profilePath,
  safeImageUrl,
  SITE_NAME,
  SITE_URL,
} from './site';

const DEFAULT_DESCRIPTION = 'Folio met en relation les entreprises avec des freelancers vérifiés en développement, design et acquisition digitale.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

export const siteMetadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: 'Folio | Trouvez le freelance adapté à votre projet',
    template: '%s | Folio',
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ['freelance', 'développeur', 'designer', 'services B2B', 'Folio'],
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Folio | Trouvez le freelance adapté à votre projet',
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Folio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Folio | Trouvez le freelance adapté à votre projet',
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

function socialLinks(freelancer) {
  return [
    freelancer.site_web,
    freelancer.linkedin,
    freelancer.facebook,
    freelancer.instagram && (freelancer.instagram.startsWith('http') ? freelancer.instagram : `https://instagram.com/${freelancer.instagram.replace(/^@/, '')}`),
    freelancer.twitter,
  ].filter((url) => {
    try {
      return Boolean(new URL(url));
    } catch {
      return false;
    }
  });
}

function ratingSchema(freelancer) {
  if (!freelancer.ratingCount || !freelancer.averageRating) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: freelancer.averageRating,
    reviewCount: freelancer.ratingCount,
    bestRating: 5,
    worstRating: 1,
  };
}

export function profileDescription(freelancer) {
  const name = displayName(freelancer);
  const specialty = freelancer.activite || 'freelance';
  const location = freelancer.location || freelancer.localisation || 'en ligne';
  const intro = `${name}, ${specialty} à ${location}.`;
  const details = normalizeText(freelancer.description, 128);
  return normalizeText(`${intro} ${details || `Découvrez ses services et contactez ce ${specialty.toLowerCase()} sur Folio.`}`, 160);
}

export function profileMetadata(freelancer) {
  const name = displayName(freelancer);
  const specialty = freelancer.activite || 'Freelance';
  const location = freelancer.location || freelancer.localisation || 'En ligne';
  const canonical = absoluteUrl(profilePath(freelancer));
  const description = profileDescription(freelancer);
  const image = safeImageUrl(freelancer.photo_url) || `${canonical}/opengraph-image`;
  const title = `${name} - ${specialty} à ${location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description, images: [image] },
  };
}

export function categoryMetadata({ label, canonicalPath, location, count }) {
  const where = location ? ` à ${location}` : '';
  const title = `Freelances ${label}${where}`;
  const description = normalizeText(
    `Trouvez ${count ? `${count} ` : ''}freelancer${count > 1 ? 's' : ''} ${label}${where} pour concrétiser votre projet de développement, design ou marketing digital.`,
    160,
  );
  const canonical = absoluteUrl(canonicalPath);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title: `${title} | ${SITE_NAME}`, description, images: [DEFAULT_OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    areaServed: 'Worldwide',
    priceRange: '$$',
  };
}

export function freelancerJsonLd(freelancer) {
  const name = displayName(freelancer);
  const canonical = absoluteUrl(profilePath(freelancer));
  const price = Number(freelancer.prix_a_partir_de);
  const hasPrice = Number.isFinite(price) && price > 0;
  const service = {
    '@type': 'Service',
    name: `${freelancer.activite || 'Services freelance'} — ${name}`,
    description: normalizeText(freelancer.description || `Services de ${freelancer.activite || 'freelance'} proposés par ${name}.`, 500),
    url: canonical,
    provider: { '@type': 'Person', name, url: canonical },
    areaServed: freelancer.location || freelancer.localisation || 'En ligne',
    aggregateRating: ratingSchema(freelancer),
    offers: hasPrice ? {
      '@type': 'Offer',
      price,
      priceCurrency: freelancer.devise || 'XAF',
      availability: 'https://schema.org/InStock',
      url: canonical,
    } : undefined,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name,
        url: canonical,
        image: safeImageUrl(freelancer.photo_url) || undefined,
        jobTitle: freelancer.activite || 'Freelance',
        description: profileDescription(freelancer),
        sameAs: socialLinks(freelancer),
        makesOffer: service,
      },
      service,
    ],
  };
}
