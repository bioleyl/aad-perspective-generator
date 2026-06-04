import type { PaperOrientationValues, PaperSizeValues } from '../types/paper-format.type';

type BorderSide = 'left' | 'top' | 'right' | 'bottom';

type BorderHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

interface BorderHandleState {
  ratio: number;
  side: BorderSide;
}

export interface State {
  paperSize: PaperSizeValues;
  paperOrientation: PaperOrientationValues;
  visionAngle: number;
  displayMeasurePoints: boolean;
  displayCompletePerspectiveLines: boolean;
  horizonLineY: number;
  observerPosition: { x: number; y: number };
  vanishingPointLeftX: number;
  vanishingPointRightX: number;
  cubeAngle: number;
  cubeAngleMinutes: number;
  cubeAngleSeconds: number;
  borderHandles: Record<BorderHandleId, BorderHandleState>;
  hoveredBorderHandle: BorderHandleId | null;
}

class StateService {
  private _state: State = {
    borderHandles: {
      'left-bottom': { ratio: 1, side: 'left' },
      'left-top': { ratio: 0, side: 'left' },
      'right-bottom': { ratio: 1, side: 'right' },
      'right-top': { ratio: 0, side: 'right' },
    },
    cubeAngle: 45,
    cubeAngleMinutes: 0,
    cubeAngleSeconds: 0,
    displayCompletePerspectiveLines: true,
    displayMeasurePoints: true,
    horizonLineY: 100,
    hoveredBorderHandle: null,
    observerPosition: { x: 100, y: 100 },
    paperOrientation: 'landscape',
    paperSize: 'a4',
    vanishingPointLeftX: 10,
    vanishingPointRightX: 287,
    visionAngle: 60,
  };

  getState() {
    return this._state;
  }

  setPaperSize(size: PaperSizeValues) {
    this._state.paperSize = size;
  }

  setPaperOrientation(orientation: PaperOrientationValues) {
    this._state.paperOrientation = orientation;
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

  setCubeAngleMinutes(minutes: number) {
    this._state.cubeAngleMinutes = minutes;
  }

  setCubeAngleSeconds(seconds: number) {
    this._state.cubeAngleSeconds = seconds;
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
