import type { PaperFormatsValues } from '../types/paper-format.type';

type BorderSide = 'left' | 'top' | 'right' | 'bottom';

type BorderHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

interface BorderHandleState {
  ratio: number;
  side: BorderSide;
}

export interface State {
  paperFormat: PaperFormatsValues;
  visionAngle: number;
  displayMeasurePoints: boolean;
  displayCompletePerspectiveLines: boolean;
  horizonLineY: number;
  observerPosition: { x: number; y: number };
  vanishingPointLeftX: number;
  vanishingPointRightX: number;
  cubeAngle: number;
  borderHandles: Record<BorderHandleId, BorderHandleState>;
  hoveredBorderHandle: BorderHandleId | null;
}

class StateService {
  private _state: State = {
    borderHandles: {
      'left-bottom': { ratio: 0.625, side: 'left' },
      'left-top': { ratio: 0.375, side: 'left' },
      'right-bottom': { ratio: 0.625, side: 'right' },
      'right-top': { ratio: 0.375, side: 'right' },
    },
    cubeAngle: 35,
    displayCompletePerspectiveLines: true,
    displayMeasurePoints: true,
    horizonLineY: 70,
    hoveredBorderHandle: null,
    observerPosition: { x: 100, y: 100 },
    paperFormat: 'landscape',
    vanishingPointLeftX: 10,
    vanishingPointRightX: 287,
    visionAngle: 60,
  };

  getState() {
    return this._state;
  }

  setPaperFormat(format: PaperFormatsValues) {
    this._state.paperFormat = format;
  }

  setVisionAngle(angle: number) {
    this._state.visionAngle = angle;
  }

  setDisplayMeasurePoints(display: boolean) {
    this._state.displayMeasurePoints = display;
  }

  setDisplayCompletePerspectiveLines(display: boolean) {
    this._state.displayCompletePerspectiveLines = display;
  }

  setObserverPosition(x: number, y: number) {
    this._state.observerPosition = { x, y };
  }

  setCubeAngle(angle: number) {
    this._state.cubeAngle = angle;
  }

  setBorderHandlePosition(handle: BorderHandleId, side: BorderSide, ratio: number) {
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    this._state.borderHandles[handle] = { ratio: clampedRatio, side };
  }

  setHoveredBorderHandle(handle: BorderHandleId | null) {
    this._state.hoveredBorderHandle = handle;
  }
}

export const stateService = new StateService();
