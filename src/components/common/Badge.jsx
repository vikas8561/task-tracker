export default function Badge({ type, children }) {
  const classes = {
    high: 'badge badge-high',
    medium: 'badge badge-medium',
    low: 'badge badge-low',
    revision: 'badge badge-revision',
    completed: 'badge badge-completed',
  };
  return <span className={classes[type] || 'badge'}>{children}</span>;
}
