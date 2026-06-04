export type PaperSizeValues = 'a3' | 'a4' | 'a5' | 'b3' | 'b4' | 'b5' | 'raisin' | 'demi-raisin' | 'quart-raisin';
export type PaperOrientationValues = 'landscape' | 'portrait';

export interface PaperFormat {
  label: string;
  width: number; // in mm
  height: number; // in mm
}

export const PAPER_FORMATS: Record<PaperSizeValues, PaperFormat> = {
  a3: { height: 420, label: 'A3', width: 297 },
  a4: { height: 297, label: 'A4', width: 210 },
  a5: { height: 210, label: 'A5', width: 148 },
  b3: { height: 500, label: 'B3', width: 353 },
  b4: { height: 353, label: 'B4', width: 250 },
  b5: { height: 250, label: 'B5', width: 176 },
  'demi-raisin': { height: 500, label: 'Demi-raisin', width: 325 },
  'quart-raisin': { height: 325, label: 'Quart-raisin', width: 250 },
  raisin: { height: 650, label: 'Raisin', width: 500 },
};

export const PAPER_ORIENTATIONS: Record<PaperOrientationValues, { label: string }> = {
  landscape: { label: 'Paysage' },
  portrait: { label: 'Portrait' },
};

export function getPaperDimensions(size: PaperSizeValues, orientation: PaperOrientationValues) {
  const { width, height } = PAPER_FORMATS[size];

  if (orientation === 'portrait') {
    return { height, width };
  }

  return { height: width, width: height };
}
