export function SectionTitle({ children, number }) {
  return (
    <div className="section-intro">
      {number && <span className="section-badge">{number}</span>}
      <h2 className="section-name">{children}</h2>
    </div>
  );
}
