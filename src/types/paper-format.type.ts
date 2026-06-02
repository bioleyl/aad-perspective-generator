export type PaperFormatsValues = 'landscape' | 'portrait';

export interface PaperFormat {
  label: string;
  width: number; // in mm
  height: number; // in mm
}

export const PAPER_FORMATS: Record<PaperFormatsValues, PaperFormat> = {
  landscape: { height: 210, label: 'Paysage', width: 297 },
  portrait: { height: 297, label: 'Portrait', width: 210 },
};
