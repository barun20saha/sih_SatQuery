/**
 * Badge — status indicator pill.
 * variant: 'success' | 'warning' | 'error' | 'neutral' | 'accent'
 */
export default function Badge({ children, variant = 'neutral', icon }) {
  return (
    <span className={`badge badge--${variant}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
