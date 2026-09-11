import React from 'react';

/**
 * SatQuery AI Button Component
 * Variants:
 *  - 'primary'   : Emerald Green CTA (#2D9D78)
 *  - 'secondary' : Soft White with slate border (#F8FAFC)
 *  - 'tertiary'  : Deep Space Blue link style
 *  - 'preset'    : Small prompt chip with Warm Orange border (#FF8C42)
 *  - 'ghost'     : Subtle hover
 *  - 'danger'    : Error Red (#EF5350)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  id,
  icon,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
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
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
