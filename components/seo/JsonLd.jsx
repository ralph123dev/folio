export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is serialized rather than interpolated to avoid malformed markup from UGC.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
