export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">
        {Icon && <Icon size={28} />}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}
