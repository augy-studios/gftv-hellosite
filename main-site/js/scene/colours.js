// The scene's colours. Everything that should follow the theme is read from
// the stylesheet's tokens, so the 3D parts change with the colour theme and
// mode exactly like the rest of the page. The few fixed colours are the
// things in the scene that are objects rather than interface: the ink the
// card is printed in, and the ramen.

import { Color } from '../vendor/three.module.min.js';

// The name card's printed smile, sampled from the artwork. The smile starts
// in this ink while it sits on the card.
export const CARD_INK = new Color('#181817');

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

// How far the smile and the line are mixed from the text colour towards the
// page background: a soft tint, so they sit behind the words on the page (the
// headline in particular, which the smile lands on) rather than competing
// with them.
const LINE_SOFTNESS = 0.6;

// Theme colours, read again whenever the theme changes.
export function readTheme() {
  const text = new Color(token('--text') || '#1a1a2e');
  const background = new Color(token('--bg') || '#ffffff');
  return {
    text,
    line: text.clone().lerp(background, LINE_SOFTNESS),
    surface: new Color(token('--bg-alt') || '#f5f5f5'),
    // How strongly the background shapes show in this mode.
    shapeOpacity: Number.parseFloat(token('--shape-opacity')) || 0.25,
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
