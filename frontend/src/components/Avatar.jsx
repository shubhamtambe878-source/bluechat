import React from 'react';

const Avatar = ({ src, alt, size = 'medium' }) => {
  return (
    <img
      src={src || '/default-avatar.png'}
      alt={alt}
      className={`avatar avatar-${size}`}
    />
  );
};

export default Avatar;
