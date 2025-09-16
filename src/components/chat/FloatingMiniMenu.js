// src/components/chat/FloatingMiniMenu.jsx
import React from 'react';

/* Three-dots menu that positions itself next to the clicked button (Requirement 2)
   - we pass 'anchorRect' from parent when opening so the menu can position itself */
export default function FloatingMiniMenu({ anchorRect, onClose, actions = [] }) {
  if (!anchorRect) return null;
  // compute position (prefer below right; constrain to viewport)
  const style = { position: 'absolute' };
  const menuWidth = 180;
  const spacing = 8;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  // default to below right
  let left = anchorRect.right - menuWidth;
  let top = anchorRect.bottom + spacing;
  // keep in viewport
  if (left < 8) left = 8;
  if (left + menuWidth > viewportW - 8) left = viewportW - menuWidth - 8;
  if (top + 200 > viewportH - 8) top = anchorRect.top - 200 - spacing;
  style.left = `${left}px`;
  style.top = `${Math.max(8, top)}px`;
  return (
    <div className="floating-mini-menu" style={style} onMouseLeave={onClose}>
      {actions.map((a, i) => (
        <button key={i} className="mini-item" onClick={() => { a.onClick(); onClose(); }}>{a.label}</button>
      ))}
    </div>
  );
}
