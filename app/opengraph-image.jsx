import { ImageResponse } from 'next/og';

export const alt = 'Folio — trouvez le freelance adapté à votre projet';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '72px', color: '#ffffff',
        background: 'linear-gradient(135deg, #26215C 0%, #534AB7 58%, #3E9C5C 150%)',
      }}>
        <div style={{ display: 'flex', fontSize: 42, fontWeight: 700, marginBottom: 42 }}>Folio</div>
        <div style={{ display: 'flex', maxWidth: 900, fontSize: 72, lineHeight: 1.05, fontWeight: 700 }}>Les bons experts pour faire avancer vos projets.</div>
        <div style={{ display: 'flex', marginTop: 30, fontSize: 30, color: '#EEEDFE' }}>Développement · Design · Marketing digital</div>
      </div>
    ),
    size,
  );
}
