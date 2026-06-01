import type { PaperFormatsValues } from '../types/paper-format.type';

export interface State {
  paperFormat: PaperFormatsValues;
  visionAngle: number;
  displayVisionAngle: boolean;
  displayVisionCircle: boolean;
  displayObserver: boolean;
  displayVanishingPoints: boolean;
  displayMeasurePoints: boolean;
  horizonLineY: number;
  observerPosition: { x: number; y: number };
  vanishingPointLeftX: number;
  vanishingPointRightX: number;
}

class StateService {
  private _state: State = {
    displayMeasurePoints: true,
    displayObserver: true,
    displayVanishingPoints: true,
    displayVisionAngle: true,
    displayVisionCircle: true,
    horizonLineY: 22,
    observerPosition: { x: 100, y: 100 },
    paperFormat: 'a4-landscape',
    vanishingPointLeftX: 50,
    vanishingPointRightX: 150,
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

  setDisplayVisionAngle(display: boolean) {
    this._state.displayVisionAngle = display;
  }

  setDisplayVisionCircle(display: boolean) {
    this._state.displayVisionCircle = display;
  }

  setDisplayObserver(display: boolean) {
    this._state.displayObserver = display;
  }

  setDisplayMeasurePoints(display: boolean) {
    this._state.displayMeasurePoints = display;
  }

  setDisplayVanishingPoints(display: boolean) {
    this._state.displayVanishingPoints = display;
  }

  setHorizonLineY(y: number) {
    this._state.horizonLineY = y;
  }

  setObserverPosition(x: number, y: number) {
    this._state.observerPosition = { x, y };
  }

  setVanishingPointLeftX(x: number) {
    this._state.vanishingPointLeftX = x;
  }

  setVanishingPointRightX(x: number) {
    this._state.vanishingPointRightX = x;
  }
}

export const stateService = new StateService();
