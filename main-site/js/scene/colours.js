// The scene's colours. Everything that should follow the theme is read from
// the stylesheet's tokens, so the 3D parts change with the colour theme and
// mode exactly like the rest of the page. The only fixed colours are the
// ramen's, since the bowl is an object rather than interface.

import { Color } from '../vendor/three.module.min.js';

// The bowl and what is in it. Food is the colour it is in any theme.
export const RAMEN = {
  bowl: '#1c1c1c',
  rimRed: '#d8282e',
  rimInk: '#1c1c1c',
  broth: '#f1d9a6',
  noodle: '#f4d27a',
  pork: '#a75a33',
  porkEdge: '#7a3a1f',
  egg: '#fff8ea',
  yolk: '#f5a524',
  corn: '#ffd23f',
  onion: '#5fb547',
  nori: '#1f2a22',
};

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Theme colours, read again whenever the theme changes.
export function readTheme() {
  return {
    text: new Color(token('--text') || '#1a1a2e'),
    surface: new Color(token('--bg-alt') || '#f5f5f5'),
  };
}

// Calls back when the colour theme or the mode changes, whether picked in the
// theme dialog or resolved by the clock.
export function onThemeChange(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mode', 'data-color-theme'],
  });
}
