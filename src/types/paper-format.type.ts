export type PaperFormatsValues = 'a4-landscape' | 'a4-portrait' | 'a3-landscape' | 'a3-portrait';

export interface PaperFormat {
  label: string;
  width: number; // in mm
  height: number; // in mm
}

export const PAPER_FORMATS: Record<PaperFormatsValues, PaperFormat> = {
  'a3-landscape': { height: 297, label: 'A3 Landscape', width: 420 },
  'a3-portrait': { height: 420, label: 'A3 Portrait', width: 297 },
  'a4-landscape': { height: 210, label: 'A4 Landscape', width: 297 },
  'a4-portrait': { height: 297, label: 'A4 Portrait', width: 210 },
};
