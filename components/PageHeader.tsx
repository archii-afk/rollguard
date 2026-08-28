export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      {eyebrow && <div className="record-kicker">{eyebrow}</div>}
      <div className="page-header-grid">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children}
      </div>
      {meta && <div className="record-meta">{meta}</div>}
    </header>
  );
}
