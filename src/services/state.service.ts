import type { PaperFormatsValues } from '../types/paper-format.type';

export interface State {
  paperFormat: PaperFormatsValues;
  visionAngle: number;
  displayPoints: boolean;
  displayCompletePerspectiveLines: boolean;
  guidePointsInset: number;
  horizonLineY: number;
  observerPosition: { x: number; y: number };
  vanishingPointLeftX: number;
  vanishingPointRightX: number;
  cubeAngle: number;
}

class StateService {
  private _state: State = {
    cubeAngle: 35,
    displayCompletePerspectiveLines: false,
    displayPoints: false,
    guidePointsInset: 3,
    horizonLineY: 70,
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

  setDisplayPoints(display: boolean) {
    this._state.displayPoints = display;
  }

  setDisplayCompletePerspectiveLines(display: boolean) {
    this._state.displayCompletePerspectiveLines = display;
  }

  setGuidePointsInset(inset: number) {
    this._state.guidePointsInset = inset;
  }

  setObserverPosition(x: number, y: number) {
    this._state.observerPosition = { x, y };
  }

  setCubeAngle(angle: number) {
    this._state.cubeAngle = angle;
  }
}

export const stateService = new StateService();
