import Link from 'next/link';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Fil d’Ariane" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.path}-${item.name}`}>
            {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
