/**
 * Button — Primary, Secondary, Ghost variants with optional full-width and large size.
 */
export default function Button({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'ghost'
  size = 'md',           // 'md' | 'lg'
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  id,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'lg' ? 'btn--lg' : '',
    fullWidth ? 'btn--full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      id={id}
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
