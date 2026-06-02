import { PAPER_FORMATS } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

export class RenderService {
  private _layer: SVGGElement;
  private _state: State;
  private _lineWidth = '0.5';
  private _pointRadius = '3';
  private _printOpacity = 0.5;
  private _printPointRadiusMm = 0.4;
  private _printLineWidthMm = 0.2;
  private _visionLineColor = 'green';
  private _perspectiveLineColor = '#666';
  private _printColor = 'black';

  constructor(layer: SVGGElement) {
    this._layer = layer;
    this._state = stateService.getState();
  }

  render() {
    this.computeObserverCoordinates();

    this._state = stateService.getState();

    this.clearLayer();
    this.drawPaper();
    this.drawPerspectiveLines();
    this.drawHorizonLine();
    this.drawVisionAngle();
    this.drawVisionCircle();
    this.drawObserver();
    this.drawPrinciplePoint();
    this.drawVanishingPoints();
    this.drawMeasurePoints();
  }

  print() {
    const paper = this.getPaperRectGeometry();
    const { width: mmWidth, height: mmHeight } = PAPER_FORMATS[this._state.paperFormat];
    const pointRadius = (this._printPointRadiusMm * paper.width) / mmWidth;

    const printSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    printSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    printSvg.setAttribute('width', `${mmWidth}mm`);
    printSvg.setAttribute('height', `${mmHeight}mm`);
    printSvg.setAttribute('viewBox', `${paper.x} ${paper.y} ${paper.width} ${paper.height}`);
    printSvg.setAttribute('opacity', `${this._printOpacity}`);

    const svg = this._layer.ownerSVGElement;
    if (svg) {
      const defs = svg.querySelector('defs');
      if (defs) {
        printSvg.appendChild(defs.cloneNode(true));
      }
    }

    printSvg.appendChild(this._layer.cloneNode(true));

    const orientation = mmWidth > mmHeight ? 'landscape' : 'portrait';
    const serialized = new XMLSerializer().serializeToString(printSvg);

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: ${mmWidth}mm;
        height: ${mmHeight}mm;
        overflow: hidden;
      }
      body {
        background: white;
      }
      svg {
        display: block;
      }
      .non-printable {
        display: none;
      }
      .point {
        r: ${pointRadius};
        fill: ${this._printColor};
        stroke: none;
      }
      text {
        display: none;
      }
      line, circle, rect {
        stroke: ${this._printColor};
        stroke-width: ${this._printLineWidthMm}mm;
        vector-effect: non-scaling-stroke;
      }
      @page {
        size: ${mmWidth}mm ${mmHeight}mm ${orientation};
        margin: 0;
      }
      </style>
    </head>
    <body>${serialized}</body>
    </html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }

    printWindow.addEventListener('load', () => {
      printWindow.focus();
      printWindow.print();
    });

    printWindow.addEventListener('afterprint', () => {
      printWindow.close();
      URL.revokeObjectURL(url);
    });
  }

  private clearLayer() {
    this._layer.innerHTML = '';
  }

  private drawPaper() {
    const { x, y, width, height } = this.getPaperRectGeometry();

    const rect = this.buildSvgElement('rect', {
      fill: 'none',
      height: `${height}`,
      stroke: '#666',
      'stroke-width': this._lineWidth,
      width: `${width}`,
      x: `${x}`,
      y: `${y}`,
    });

    this._layer.appendChild(rect);
  }

  private drawPerspectiveLines() {
    const { vanishingPointLeftX, vanishingPointRightX, displayCompletePerspectiveLines } = this._state;
    const paper = this.getPaperRectGeometry();
    const quarterHalfHeight = paper.height / 8;
    const upperY = paper.y + paper.height / 2 - quarterHalfHeight;
    const lowerY = paper.y + paper.height / 2 + quarterHalfHeight;
    const perspectiveLines = this.buildSvgElement('g');

    if (!displayCompletePerspectiveLines) {
      perspectiveLines.setAttribute('clip-path', `url(#${this.updatePaperClipPath(paper)})`);
    }

    this.drawPerspectiveLine(perspectiveLines, paper.x, upperY, vanishingPointRightX, this._state.horizonLineY);
    this.drawPerspectiveLine(perspectiveLines, paper.x, lowerY, vanishingPointRightX, this._state.horizonLineY);
    this.drawPerspectiveLine(
      perspectiveLines,
      paper.x + paper.width,
      upperY,
      vanishingPointLeftX,
      this._state.horizonLineY
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      paper.x + paper.width,
      lowerY,
      vanishingPointLeftX,
      this._state.horizonLineY
    );

    this._layer.appendChild(perspectiveLines);
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
    const { horizonLineY } = this._state;
    const line = this.buildSvgElement('line', {
      stroke: 'black',
      'stroke-width': this._lineWidth,
      x1: '-100',
      x2: '400',
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
      class: 'non-printable',
      stroke: this._visionLineColor,
      'stroke-width': this._lineWidth,
      x1: `${observerPosition.x}`,
      x2: `${x1}`,
      y1: `${observerPosition.y}`,
      y2: `${horizonLineY}`,
    });

    const line2 = this.buildSvgElement('line', {
      class: 'non-printable',
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
      class: 'non-printable',
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

  private drawPerspectiveLine(
    parent: SVGGElement | SVGElement,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ) {
    const line = this.buildSvgElement('line', {
      stroke: this._perspectiveLineColor,
      'stroke-width': this._lineWidth,
      x1: `${startX}`,
      x2: `${targetX}`,
      y1: `${startY}`,
      y2: `${targetY}`,
    });

    parent.appendChild(line);
  }

  private getVisionCircleRadius(): number {
    const { visionAngle, observerPosition } = this._state;
    const { x1, x2 } = this.getVisionHitPoint(visionAngle);
    return Math.max(Math.abs(x1 - observerPosition.x), Math.abs(x2 - observerPosition.x));
  }

  private getPaperRectGeometry(): { height: number; width: number; x: number; y: number } {
    const { observerPosition, horizonLineY } = this._state;
    const { width, height } = PAPER_FORMATS[this._state.paperFormat];

    const ratio = width / height;
    const radius = this.getVisionCircleRadius();
    const rectWidth = (2 * radius * ratio) / Math.sqrt(ratio * ratio + 1);
    const rectHeight = (2 * radius) / Math.sqrt(ratio * ratio + 1);

    return {
      height: rectHeight,
      width: rectWidth,
      x: observerPosition.x - rectWidth / 2,
      y: horizonLineY - rectHeight / 2,
    };
  }

  private updatePaperClipPath(paper: { height: number; width: number; x: number; y: number }): string {
    const clipPathId = 'paper-clip-path';
    const svg = this._layer.ownerSVGElement;

    if (!svg) {
      return clipPathId;
    }

    let defs = svg.querySelector('defs') as SVGElement | null;
    if (!defs) {
      defs = this.buildSvgElement('defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    let clipPath = svg.querySelector(`#${clipPathId}`) as SVGElement | null;
    if (!clipPath) {
      clipPath = this.buildSvgElement('clipPath', { id: clipPathId });
      defs.appendChild(clipPath);
    }

    while (clipPath.firstChild) {
      clipPath.removeChild(clipPath.firstChild);
    }

    clipPath.appendChild(
      this.buildSvgElement('rect', {
        height: `${paper.height}`,
        width: `${paper.width}`,
        x: `${paper.x}`,
        y: `${paper.y}`,
      })
    );

    return clipPathId;
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
