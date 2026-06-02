import { PAPER_FORMATS } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

export class RenderService {
  private _layer: SVGGElement;
  private _state: State;
  private _lineWidth = '0.5';
  private _pointRadius = '3';
  private _visionLineColor = 'green';

  constructor(layer: SVGGElement) {
    this._layer = layer;
    this._state = stateService.getState();
  }

  render() {
    this.computeObserverCoordinates();

    this._state = stateService.getState();

    this.clearLayer();
    this.drawPaper();
    this.drawHorizonLine();
    this.drawVisionAngle();
    this.drawVisionCircle();
    this.drawObserver();
    this.drawPrinciplePoint();
    this.drawVanishingPoints();
    this.drawMeasurePoints();
  }

  private clearLayer() {
    this._layer.innerHTML = '';
  }

  private drawPaper() {
    const { observerPosition, horizonLineY } = this._state;
    const { width, height } = PAPER_FORMATS[this._state.paperFormat];

    const ratio = width / height;
    const radius = this.getVisionCircleRadius();
    const rectWidth = (2 * radius * ratio) / Math.sqrt(ratio * ratio + 1);
    const rectHeight = (2 * radius) / Math.sqrt(ratio * ratio + 1);

    const x = observerPosition.x - rectWidth / 2;
    const y = horizonLineY - rectHeight / 2;

    const rect = this.buildSvgElement('rect', {
      fill: 'none',
      height: `${rectHeight}`,
      stroke: '#666',
      'stroke-width': this._lineWidth,
      width: `${rectWidth}`,
      x: `${x}`,
      y: `${y}`,
    });

    this._layer.appendChild(rect);
  }

  private computeObserverCoordinates() {
    const { cubeAngle, vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;

    const radianCubeAngle = (cubeAngle * Math.PI) / 180;
    const vanishingPointsDistance = vanishingPointRightX - vanishingPointLeftX;
    const sin = Math.sin(radianCubeAngle);
    const cos = Math.cos(radianCubeAngle);

    const leftDistanceToPrinciplePoint = vanishingPointsDistance * sin * sin;
    const observerDistanceToHorizon = vanishingPointsDistance * sin * cos;

    stateService.setObserverPosition(
      vanishingPointLeftX + leftDistanceToPrinciplePoint,
      horizonLineY + observerDistanceToHorizon
    );
  }

  private drawHorizonLine() {
    const { horizonLineY, paperFormat } = this._state;
    const { width } = PAPER_FORMATS[paperFormat];
    const line = this.buildSvgElement('line', {
      stroke: 'black',
      'stroke-width': this._lineWidth,
      x1: '0',
      x2: `${width}`,
      y1: `${horizonLineY}`,
      y2: `${horizonLineY}`,
    });
    this._layer.appendChild(line);
  }

  private drawObserver() {
    const { observerPosition } = this._state;
    this.buildSvgPoint(observerPosition.x, observerPosition.y, 'red', 'PAO');
  }

  private drawVanishingPoints() {
    const { vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;

    this.buildSvgPoint(vanishingPointLeftX, horizonLineY, 'purple', 'PFG');
    this.buildSvgPoint(vanishingPointRightX, horizonLineY, 'purple', 'PFD');
  }

  private drawMeasurePoints() {
    const { displayMeasurePoints, vanishingPointLeftX, vanishingPointRightX, horizonLineY, observerPosition } =
      this._state;

    if (!displayMeasurePoints) {
      return;
    }

    const measurePoint45 = this.getMeasurePointX(vanishingPointLeftX, Math.PI / 4);
    const measurePointLeft = observerPosition.x - vanishingPointLeftX + observerPosition.x;
    const measurePointRight = observerPosition.x - (vanishingPointRightX - observerPosition.x);

    this.buildSvgPoint(measurePoint45, horizonLineY, 'orange', 'PM 45°');
    this.buildSvgPoint(measurePointLeft, horizonLineY, 'orange', 'PMG');
    this.buildSvgPoint(measurePointRight, horizonLineY, 'orange', 'PMD');
  }

  private getMeasurePointX(vanishingPointX: number, angle: number): number {
    const { observerPosition, horizonLineY } = this._state;
    const baseDx = vanishingPointX - observerPosition.x;
    const baseDy = horizonLineY - observerPosition.y;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rayDx = baseDx * cos - baseDy * sin;
    const rayDy = baseDx * sin + baseDy * cos;

    const t = (horizonLineY - observerPosition.y) / rayDy;

    return observerPosition.x + t * rayDx;
  }

  private drawPrinciplePoint() {
    const { observerPosition, horizonLineY } = this._state;
    this.buildSvgPoint(observerPosition.x, horizonLineY, 'blue', 'PP');
  }

  private drawVisionAngle() {
    const { visionAngle, observerPosition, horizonLineY } = this._state;

    const { x1, x2 } = this.getVisionHitPoint(visionAngle);

    const line1 = this.buildSvgElement('line', {
      stroke: this._visionLineColor,
      'stroke-width': this._lineWidth,
      x1: `${observerPosition.x}`,
      x2: `${x1}`,
      y1: `${observerPosition.y}`,
      y2: `${horizonLineY}`,
    });

    const line2 = this.buildSvgElement('line', {
      stroke: this._visionLineColor,
      'stroke-width': this._lineWidth,
      x1: `${observerPosition.x}`,
      x2: `${x2}`,
      y1: `${observerPosition.y}`,
      y2: `${horizonLineY}`,
    });

    this._layer.appendChild(line1);
    this._layer.appendChild(line2);
  }

  private drawVisionCircle() {
    const { observerPosition, horizonLineY } = this._state;
    const radius = this.getVisionCircleRadius();
    const circle = this.buildSvgElement('circle', {
      cx: `${observerPosition.x}`,
      cy: `${horizonLineY}`,
      fill: 'none',
      r: `${radius}`,
      stroke: this._visionLineColor,
      'stroke-dasharray': '2 2',
      'stroke-width': this._lineWidth,
    });
    this._layer.appendChild(circle);
  }

  private getVisionCircleRadius(): number {
    const { visionAngle, observerPosition } = this._state;
    const { x1, x2 } = this.getVisionHitPoint(visionAngle);
    return Math.max(Math.abs(x1 - observerPosition.x), Math.abs(x2 - observerPosition.x));
  }

  private getVisionHitPoint(angle: number): { x1: number; x2: number } {
    const { observerPosition, horizonLineY } = this._state;
    const verticalDistanceToHorizon = observerPosition.y - horizonLineY;
    const horizontalOffset = verticalDistanceToHorizon * Math.tan(((Math.PI / 180) * angle) / 2);
    return {
      x1: observerPosition.x + horizontalOffset,
      x2: observerPosition.x - horizontalOffset,
    };
  }

  private buildSvgElement(tag: string, attributes: Record<string, string> = {}): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }

  private buildSvgPoint(x: number, y: number, color: string, label?: string): void {
    const circle = this.buildSvgElement('circle', {
      class: 'point',
      cx: `${x}`,
      cy: `${y}`,
      fill: color,
      r: this._pointRadius,
    });
    this._layer.appendChild(circle);

    if (label) {
      const text = this.buildSvgElement('text', {
        fill: 'black',
        'font-size': this._pointRadius,
        x: `${x + 3}`,
        y: `${y - 3}`,
      });
      text.textContent = label || '';
      this._layer.appendChild(text);
    }
  }
}
