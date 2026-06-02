import type { PaperFormatsValues } from '../types/paper-format.type';

export interface State {
  paperFormat: PaperFormatsValues;
  visionAngle: number;
  displayMeasurePoints: boolean;
  horizonLineY: number;
  observerPosition: { x: number; y: number };
  vanishingPointLeftX: number;
  vanishingPointRightX: number;
  cubeAngle: number;
}

class StateService {
  private _state: State = {
    cubeAngle: 35,
    displayMeasurePoints: true,
    horizonLineY: 70,
    observerPosition: { x: 100, y: 100 },
    paperFormat: 'landscape',
    vanishingPointLeftX: 10,
    vanishingPointRightX: 280,
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

  setObserverPosition(x: number, y: number) {
    this._state.observerPosition = { x, y };
  }

  setCubeAngle(angle: number) {
    this._state.cubeAngle = angle;
  }
}

export const stateService = new StateService();
