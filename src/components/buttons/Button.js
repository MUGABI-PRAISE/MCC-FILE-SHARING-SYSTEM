import React from 'react';
import './buttonStyles.css';

export default function Button({ onClick, icon, className, value }) {
  return (
    <button onClick={onClick} className={className}>
      {icon}{value}
    </button>
  );
}