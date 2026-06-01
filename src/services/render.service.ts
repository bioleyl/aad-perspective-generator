import { PAPER_FORMATS } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

const DraggableElements = {
  observer: 'observer',
  principlePoint: 'principle-point',
  vanishingPointLeft: 'vanishing-point-left',
  vanishingPointRight: 'vanishing-point-right',
} as const;

type DraggableElements = (typeof DraggableElements)[keyof typeof DraggableElements];

export class RenderService {
  private _svg: SVGSVGElement;
  private _layer: SVGGElement;
  private _state: State;
  private _draggingElement: DraggableElements | null = null;
  private _lineWidth = '0.5';
  private _pointRadius = '3';
  private _visionLineColor = 'green';
  private _vanishingPointsDistanceSecurityMargin = 10;

  constructor(svg: SVGSVGElement, layer: SVGGElement) {
    this._svg = svg;
    this._layer = layer;
    this._state = stateService.getState();

    this._svg.addEventListener('pointerdown', this.onMouseDown.bind(this));
    this._svg.addEventListener('pointermove', this.onMouseMove.bind(this));
    this._svg.addEventListener('pointerup', this.onMouseUp.bind(this));
  }

  render() {
    this._state = stateService.getState();

    this.clearLayer();
    this.setPaperFormat();
    this.drawHorizonLine();
    this.drawVisionAngle();
    this.drawVisionCircle();
    this.drawObserver();
    this.drawPrinciplePoint();
    this.drawVanishingPoints();
    this.drawMeasurePoints();
  }

  private onMouseDown(event: MouseEvent) {
    const target = event.target as SVGElement;
    this._draggingElement = target.getAttribute('data-draggable') as DraggableElements | null;
  }

  private onMouseUp() {
    this._draggingElement = null;
  }

  private onMouseMove(event: MouseEvent) {
    if (!this._draggingElement) {
      return;
    }

    const point = this._svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(this._svg.getScreenCTM()?.inverse());

    const y = svgPoint.y;
    const x = svgPoint.x;
    const { height, width } = PAPER_FORMATS[this._state.paperFormat];

    const clampedX = Math.max(0, Math.min(x, width));
    const clampedY = Math.max(0, Math.min(y, height));

    if (this._draggingElement === DraggableElements.observer) {
      stateService.setObserverPosition(clampedX, clampedY);
    } else if (this._draggingElement === DraggableElements.principlePoint) {
      const { observerPosition, vanishingPointLeftX, vanishingPointRightX } = this._state;
      // For simplicity, we will just move the principle point horizontally with the observer
      stateService.setObserverPosition(clampedX, observerPosition.y);
      stateService.setHorizonLineY(clampedY);
      if (clampedX < vanishingPointLeftX + this._vanishingPointsDistanceSecurityMargin) {
        stateService.setVanishingPointLeftX(clampedX - this._vanishingPointsDistanceSecurityMargin);
      }
      if (clampedX > vanishingPointRightX - this._vanishingPointsDistanceSecurityMargin) {
        stateService.setVanishingPointRightX(clampedX + this._vanishingPointsDistanceSecurityMargin);
      }
    } else if (this._draggingElement === DraggableElements.vanishingPointLeft) {
      const { observerPosition } = this._state;
      stateService.setVanishingPointLeftX(
        Math.min(clampedX, observerPosition.x - this._vanishingPointsDistanceSecurityMargin)
      );
    } else if (this._draggingElement === DraggableElements.vanishingPointRight) {
      const { observerPosition } = this._state;
      stateService.setVanishingPointRightX(
        Math.max(clampedX, observerPosition.x + this._vanishingPointsDistanceSecurityMargin)
      );
    }
  }

  private clearLayer() {
    this._layer.innerHTML = '';
  }

  private setPaperFormat() {
    const { paperFormat } = this._state;
    const { width, height } = PAPER_FORMATS[paperFormat];
    this._svg.setAttribute('width', `${width}mm`);
    this._svg.setAttribute('height', `${height}mm`);
    this._svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
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
    const { observerPosition, displayObserver } = this._state;
    if (displayObserver) {
      this.buildSvgPoint(observerPosition.x, observerPosition.y, 'red', 'OBS', DraggableElements.observer);
    }
  }

  private drawVanishingPoints() {
    const { displayVanishingPoints, vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;
    if (!displayVanishingPoints) {
      return;
    }

    this.buildSvgPoint(vanishingPointLeftX, horizonLineY, 'purple', 'PFG', DraggableElements.vanishingPointLeft);
    this.buildSvgPoint(vanishingPointRightX, horizonLineY, 'purple', 'PFD', DraggableElements.vanishingPointRight);
  }

  private drawMeasurePoints() {
    const { displayMeasurePoints, vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;
    if (!displayMeasurePoints) {
      return;
    }

    const leftMeasurePointX = this.getMeasurePointX(vanishingPointLeftX, Math.PI / 4);
    const rightMeasurePointX = this.getMeasurePointX(vanishingPointRightX, -Math.PI / 4);

    this.buildSvgPoint(leftMeasurePointX, horizonLineY, 'orange', 'PMG');
    this.buildSvgPoint(rightMeasurePointX, horizonLineY, 'orange', 'PMD');
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
    this.buildSvgPoint(observerPosition.x, horizonLineY, 'blue', 'PP', DraggableElements.principlePoint);
  }

  private drawVisionAngle() {
    const { displayVisionAngle, visionAngle, observerPosition, horizonLineY } = this._state;
    if (!displayVisionAngle) {
      return;
    }

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
    const { displayVisionCircle, visionAngle, observerPosition, horizonLineY } = this._state;
    if (!displayVisionCircle) {
      return;
    }

    const { x1, x2 } = this.getVisionHitPoint(visionAngle);
    const radius = Math.max(x1, x2) - observerPosition.x;
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

  private getVisionHitPoint(angle: number): { x1: number; x2: number } {
    const { observerPosition, horizonLineY } = this._state;
    const verticalDistanceToHorizon = observerPosition.y - horizonLineY;
    const horizontalOffset = verticalDistanceToHorizon * Math.tan(((Math.PI / 180) * angle) / 2);
    return {
      x1: observerPosition.x + horizontalOffset,
      x2: observerPosition.x - horizontalOffset,
    };
  }

  private buildSvgElement(
    tag: string,
    attributes: Record<string, string> = {},
    draggableName?: DraggableElements
  ): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    if (draggableName) {
      element.setAttribute('data-draggable', draggableName);
      element.classList.add('draggable');
    }
    return element;
  }

  private buildSvgPoint(
    x: number,
    y: number,
    color: string,
    label?: string,
    draggableName?: DraggableElements
  ): void {
    const circle = this.buildSvgElement(
      'circle',
      {
        cx: `${x}`,
        cy: `${y}`,
        fill: color,
        r: this._pointRadius,
      },
      draggableName
    );
    this._layer.appendChild(circle);

    if (label) {
      const text = this.buildSvgElement(
        'text',
        {
          fill: 'black',
          'font-size': this._pointRadius,
          x: `${x + 3}`,
          y: `${y - 3}`,
        },
        draggableName
      );
      text.textContent = label || '';
      this._layer.appendChild(text);
    }
  }
}
