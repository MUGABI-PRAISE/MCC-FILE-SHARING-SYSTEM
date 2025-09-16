// src/components/chat/utils/colors.js
export const AVATAR_COLORS = [
  '#6C5CE7','#00B894','#0984E3','#FD79A8','#E17055','#00CEC9','#A29BFE'
];

export function pickColor(seed) {
  if (!seed) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
