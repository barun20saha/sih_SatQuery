/**
 * Card — base card with optional accent border variant.
 * accent: 'accent' | 'success' | 'warning' | 'error' | null
 */
export default function Card({ children, accent = null, className = '', style, id }) {
  const classes = [
    'card',
    accent ? `card--${accent}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div id={id} className={classes} style={style}>
      {children}
    </div>
  );
}
