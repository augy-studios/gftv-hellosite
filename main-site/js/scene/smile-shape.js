// The HelloSmile as printed on the name card's front (assets/12Ann Front.png,
// 1280 by 768), measured from the artwork: the mouth as a centreline from its
// top right tip, round the bottom, to its lower left tip, the two eyes as
// short strokes, and the stroke's half width. All in card pixels.
//
// Measured, not drawn: the smile line starts exactly where the printed mouth
// ends on the card, at its stroke width, and the closing smile at the bottom
// of the page is this same drawing. If the card artwork changes, re-measure: the dark pixels of the front, split
// into their three connected shapes, the mouth's centre taken as the mean of
// its pixels in each slice of angle around (900, 360).

export const CARD_WIDTH = 1280;
export const CARD_HEIGHT = 768;

export const STROKE_HALF_WIDTH = 13;

export const MOUTH = [
  [1066.7, 260.8], [1072.5, 272.4], [1077.5, 285.2], [1081.6, 298.2], [1084.7, 311.4],
  [1087.1, 324.7], [1088.7, 338.1], [1089.3, 351.6], [1089.2, 365.2], [1088.3, 378.4],
  [1086.5, 391.7], [1083.8, 404.8], [1080.4, 417.8], [1076.0, 430.5], [1070.7, 442.8],
  [1064.6, 454.9], [1057.7, 466.4], [1049.8, 477.4], [1041.0, 487.7], [1031.7, 497.5],
  [1021.6, 506.3], [1010.9, 514.4], [999.6, 521.9], [987.9, 528.7], [975.7, 534.3],
  [963.1, 539.2], [950.3, 543.2], [937.1, 546.1], [923.8, 548.2], [910.4, 549.0],
  [896.9, 548.9], [883.7, 547.7], [870.5, 545.3], [857.7, 541.9], [845.3, 537.3],
  [833.3, 531.6], [822.2, 524.8], [811.7, 517.4], [802.6, 509.1],
];

export const EYES = [
  [[807.7, 317.0], [843.1, 377.2]],
  [[925.4, 248.5], [960.5, 302.0]],
];

// The box round the whole face (eyes and mouth together), used to fit the
// smile into the closing chapter's square.
export const FACE_BOX = { left: 795, top: 240, right: 1102, bottom: 562 };
