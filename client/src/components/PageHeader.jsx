export default function PageHeader({ title, subtitle, badge }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {title}
          {badge && <span className={`badge badge-${badge.toLowerCase()}`}>{badge}</span>}
        </h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
    </div>
  );
}
