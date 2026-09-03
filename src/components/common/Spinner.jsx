/**
 * Spinner — animated loading indicator.
 * size: 'sm' | 'md' | 'lg'
 */
export default function Spinner({ size = 'md', label = 'Loading...' }) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role="status"
      aria-label={label}
    />
  );
}
