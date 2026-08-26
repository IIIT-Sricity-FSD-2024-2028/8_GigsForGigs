import React from 'react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  src,
  size = 40,
  children,
  className = '',
  style
}) => {
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div
      className={`avatar-component ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#0D568D',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: `${Math.round(size * 0.4)}px`,
        overflow: 'hidden',
        ...style
      }}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        children || initials
      )}
    </div>
  );
};

export default Avatar;
