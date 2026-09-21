import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../src/index.css';
import '../src/App.css';
import './seo.css';
import BootstrapClient from '../components/site/BootstrapClient';
import JsonLd from '../components/seo/JsonLd';
import { localBusinessJsonLd, organizationJsonLd, siteMetadata } from '../lib/seo';

export const metadata = siteMetadata;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#26215C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={localBusinessJsonLd()} />
        <BootstrapClient />
        {children}
      </body>
    </html>
  );
}
