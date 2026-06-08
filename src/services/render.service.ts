import { CalculationService } from './calculation.service';
import { stateService } from './state.service';

import type {
  BorderHandle,
  BorderHandleId,
  PerspectiveLineDimensions,
  Point,
  TablePointDimensions,
} from './calculation.service';
import type { State } from './state.service';

export type { PerspectiveLineDimensions, TablePointDimensions } from './calculation.service';

export class RenderService {
  private _layer: SVGGElement;
  private _state: State;
  private _calculations: CalculationService;
  private _lineWidth = '0.5';
  private _pointRadius = '1';
  private _visionLineColor = 'green';
  private _perspectiveLineColorLeft = 'red';
  private _perspectiveLineColorRight = 'blue';
  private _perspectiveLineColorVertical = 'purple';

  constructor(layer: SVGGElement) {
    this._layer = layer;
    this._state = stateService.getState();
    this._calculations = new CalculationService();
  }

  render() {
    this.syncState();
    const horizonLineY = this._calculations.computeHorizonLineY();
    stateService.setHorizonLineY(horizonLineY);
    this.syncState();

    const { leftX, rightX } = this._calculations.computeVanishingPoints();
    stateService.setVanishingPoints(leftX, rightX);
    this.syncState();

    this.clearLayer();
    this.drawPaper();
    this.drawPaperAxesReference();
    this.drawVisionCircle();
    this.drawVisionLine();
    // this.drawObserver();
    this.drawHorizonLine();
    this.drawPrinciplePoint();
    this.drawVanishingPoints();
    this.drawThirdVanishingPoint();
    this.drawMeasurePoints();
    this.drawPerspectiveLines();
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

  private drawPaperAxesReference() {
    const paper = this.getPaperRectGeometry();
    const origin = {
      x: paper.x - 12,
      y: paper.y + paper.height + 12,
    };
    const axisLength = 14;

    const axisGroup = this.buildSvgElement('g', {
      class: 'paper-axes-reference',
      'pointer-events': 'none',
    });

    const xEnd = { x: origin.x + axisLength, y: origin.y };
    const yEnd = { x: origin.x, y: origin.y - axisLength };

    axisGroup.appendChild(
      this.buildSvgElement('line', {
        stroke: '#111',
        'stroke-width': this._lineWidth,
        x1: `${origin.x}`,
        x2: `${xEnd.x}`,
        y1: `${origin.y}`,
        y2: `${xEnd.y}`,
      })
    );

    axisGroup.appendChild(
      this.buildSvgElement('line', {
        stroke: '#111',
        'stroke-width': this._lineWidth,
        x1: `${origin.x}`,
        x2: `${yEnd.x}`,
        y1: `${origin.y}`,
        y2: `${yEnd.y}`,
      })
    );

    axisGroup.appendChild(
      this.buildSvgElement('polygon', {
        fill: '#111',
        points: `${xEnd.x},${xEnd.y} ${xEnd.x - 2},${xEnd.y - 1} ${xEnd.x - 2},${xEnd.y + 1}`,
      })
    );

    axisGroup.appendChild(
      this.buildSvgElement('polygon', {
        fill: '#111',
        points: `${yEnd.x},${yEnd.y} ${yEnd.x - 1},${yEnd.y + 2} ${yEnd.x + 1},${yEnd.y + 2}`,
      })
    );

    const originLabel = this.buildSvgElement('text', {
      fill: '#111',
      'font-size': '3',
      'font-weight': '600',
      x: `${origin.x - 3.2}`,
      y: `${origin.y + 3.6}`,
    });
    originLabel.textContent = 'O';
    axisGroup.appendChild(originLabel);

    const xLabel = this.buildSvgElement('text', {
      fill: '#111',
      'font-size': '3',
      'font-weight': '700',
      x: `${xEnd.x + 1.4}`,
      y: `${xEnd.y + 1.4}`,
    });
    xLabel.textContent = 'X';
    axisGroup.appendChild(xLabel);

    const yLabel = this.buildSvgElement('text', {
      fill: '#111',
      'font-size': '3',
      'font-weight': '700',
      x: `${yEnd.x - 1.8}`,
      y: `${yEnd.y - 1.2}`,
    });
    yLabel.textContent = 'Y';
    axisGroup.appendChild(yLabel);

    axisGroup.appendChild(
      this.buildSvgElement('circle', {
        cx: `${origin.x}`,
        cy: `${origin.y}`,
        fill: '#111',
        r: '0.8',
      })
    );

    this._layer.appendChild(axisGroup);
  }

  private drawPerspectiveLines() {
    const paper = this._calculations.getPaperRectGeometry();
    const { displayCompletePerspectiveLines, vanishingPointLeftX, vanishingPointRightX } = this._state;
    const handles = this._calculations.getBorderHandlesGeometry();
    const thirdVanishingPoint = this._calculations.getThirdVanishingPoint();
    const visibleHandles = thirdVanishingPoint
      ? Object.values(handles)
      : Object.values(handles).filter(({ id }) => id !== 'vertical-left' && id !== 'vertical-right');

    if (!displayCompletePerspectiveLines) {
      this.drawBorderHandles(visibleHandles);
      this.drawPerspectivePointMarkers(paper);
      this.drawPerspectivePointLabels(paper);
      return;
    }

    const perspectiveLines = this.buildSvgElement('g');

    this.drawPerspectiveLine(
      perspectiveLines,
      handles['left-top'].position.x,
      handles['left-top'].position.y,
      vanishingPointRightX,
      this._state.horizonLineY,
      this._perspectiveLineColorRight
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['left-bottom'].position.x,
      handles['left-bottom'].position.y,
      vanishingPointRightX,
      this._state.horizonLineY,
      this._perspectiveLineColorRight
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-top'].position.x,
      handles['right-top'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY,
      this._perspectiveLineColorLeft
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-bottom'].position.x,
      handles['right-bottom'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY,
      this._perspectiveLineColorLeft
    );

    if (thirdVanishingPoint) {
      this.drawPerspectiveLine(
        perspectiveLines,
        handles['vertical-left'].position.x,
        handles['vertical-left'].position.y,
        thirdVanishingPoint.x,
        thirdVanishingPoint.y,
        this._perspectiveLineColorVertical
      );
      this.drawPerspectiveLine(
        perspectiveLines,
        handles['vertical-right'].position.x,
        handles['vertical-right'].position.y,
        thirdVanishingPoint.x,
        thirdVanishingPoint.y,
        this._perspectiveLineColorVertical
      );
    }

    this._layer.appendChild(perspectiveLines);
    this.drawBorderHandles(visibleHandles);
    this.drawPerspectivePointMarkers(paper);
    this.drawPerspectivePointLabels(paper);
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

  private drawVanishingPoints() {
    const { vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;

    this.buildSvgPoint(vanishingPointLeftX, horizonLineY, 'purple', 'PFG');
    this.buildSvgPoint(vanishingPointRightX, horizonLineY, 'purple', 'PFD');
  }

  private drawThirdVanishingPoint() {
    const thirdVanishingPoint = this._calculations.getThirdVanishingPoint();

    if (!thirdVanishingPoint) {
      return;
    }

    const svg = this._layer.ownerSVGElement;
    if (!svg) {
      this.buildSvgPoint(thirdVanishingPoint.x, thirdVanishingPoint.y, 'purple', 'PFV');
      return;
    }

    const viewBox = svg.viewBox.baseVal;
    const padding = 4;
    const minX = viewBox.x + padding;
    const maxX = viewBox.x + viewBox.width - padding;
    const minY = viewBox.y + padding;
    const maxY = viewBox.y + viewBox.height - padding;

    const isInsideView =
      thirdVanishingPoint.x >= minX
      && thirdVanishingPoint.x <= maxX
      && thirdVanishingPoint.y >= minY
      && thirdVanishingPoint.y <= maxY;

    if (!isInsideView) {
      return;
    }

    this.buildSvgPoint(thirdVanishingPoint.x, thirdVanishingPoint.y, 'purple', 'PFV');
  }

  private drawBorderHandles(handles: BorderHandle[]) {
    for (const handle of handles) {
      this.buildSvgBorderHandle(handle.position.x, handle.position.y, handle.id, handle.label);
    }
  }

  private drawPerspectivePointLabels(paper: { x: number; y: number; width: number; height: number }) {
    const dimensions = this._calculations.getPerspectiveLineDimensions();

    for (const { point, primePoint } of dimensions) {
      this.drawExteriorPointLabel(this._calculations.toCanvasSpace(point, paper), point.label, paper);
      this.drawExteriorPointLabel(this._calculations.toCanvasSpace(primePoint, paper), primePoint.label, paper);
    }
  }

  private drawPerspectivePointMarkers(paper: { x: number; y: number; width: number; height: number }) {
    const dimensions = this._calculations.getPerspectiveLineDimensions();

    for (const { point, primePoint } of dimensions) {
      const points = [point, primePoint];

      for (const perspectivePoint of points) {
        const canvasPoint = this._calculations.toCanvasSpace(perspectivePoint, paper);
        const marker = this.buildSvgElement('circle', {
          class: 'perspective-point-marker',
          cx: `${canvasPoint.x}`,
          cy: `${canvasPoint.y}`,
          fill: '#f59e0b',
          'pointer-events': 'none',
          r: '2.2',
          stroke: 'white',
          'stroke-width': '0.5',
        });
        this._layer.appendChild(marker);
      }
    }
  }

  private drawMeasurePoints() {
    const { displayMeasurePoints, horizonLineY } = this._state;

    if (!displayMeasurePoints) {
      return;
    }

    const { measurePoint45, measurePointLeft, measurePointRight } = this._calculations.getMeasurePoints();

    this.buildSvgPoint(measurePoint45, horizonLineY, 'orange', 'PM 45°');

    this.buildSvgPoint(measurePointLeft, horizonLineY, 'orange', 'PMG');
    this.buildSvgPoint(measurePointRight, horizonLineY, 'orange', 'PMD');
  }
  private drawPrinciplePoint() {
    const { observerPosition, horizonLineY } = this._state;
    this.buildSvgPoint(observerPosition.x, horizonLineY, 'blue', 'PP');
  }

  private drawVisionCircle() {
    const { observerPosition, horizonLineReferenceY } = this._state;
    const radius = this._calculations.getVisionCircleRadius();
    const circle = this.buildSvgElement('circle', {
      class: 'non-printable vision-circle',
      cx: `${observerPosition.x}`,
      cy: `${horizonLineReferenceY}`,
      fill: 'none',
      r: `${radius}`,
      stroke: this._visionLineColor,
      'stroke-dasharray': '2 2',
      'stroke-width': this._lineWidth,
    });
    this._layer.appendChild(circle);
  }

  private drawVisionLine() {
    const { observerPosition, horizonLineReferenceY } = this._state;
    const radius = this._calculations.getVisionCircleRadius();

    const line = this.buildSvgElement('line', {
      class: 'non-printable vision-line',
      stroke: this._visionLineColor,
      'stroke-width': this._lineWidth,
      x1: `${observerPosition.x - radius}`,
      x2: `${observerPosition.x + radius}`,
      y1: `${horizonLineReferenceY}`,
      y2: `${horizonLineReferenceY}`,
    });

    this._layer.appendChild(line);
  }

  private drawPerspectiveLine(
    parent: SVGGElement | SVGElement,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    color: string
  ) {
    const line = this.buildSvgElement('line', {
      stroke: color,
      'stroke-width': this._lineWidth,
      x1: `${startX}`,
      x2: `${targetX}`,
      y1: `${startY}`,
      y2: `${targetY}`,
    });

    parent.appendChild(line);
  }

  getPaperRectGeometry(): { height: number; width: number; x: number; y: number } {
    this.syncState();
    return this._calculations.getPaperRectGeometry();
  }

  getBorderHandlesGeometry(): Record<BorderHandleId, BorderHandle> {
    this.syncState();
    return this._calculations.getBorderHandlesGeometry();
  }

  getPaperIntersectionPoints(handleId: BorderHandleId): { start: Point; end: Point } | null {
    this.syncState();
    return this._calculations.getPaperIntersectionPoints(handleId);
  }

  getPerspectiveLineDimensions(): PerspectiveLineDimensions[] {
    this.syncState();
    return this._calculations.getPerspectiveLineDimensions();
  }

  getTablePoints(): TablePointDimensions[] {
    this.syncState();
    return this._calculations.getTablePoints();
  }

  getThirdVanishingPoint(): Point | null {
    this.syncState();
    return this._calculations.getThirdVanishingPoint();
  }

  private buildSvgBorderHandle(x: number, y: number, id: BorderHandleId, label: string): void {
    const group = this.buildSvgElement('g', {
      class: 'border-handle',
      'data-draggable-handle': 'true',
      'data-handle-id': id,
      'data-handle-label': label,
    });

    const circle = this.buildSvgElement('circle', {
      cx: `${x}`,
      cy: `${y}`,
      fill: '#111',
      r: '4',
      stroke: 'white',
      'stroke-width': '1',
    });
    group.appendChild(circle);
    this._layer.appendChild(group);
  }

  private buildSvgElement(tag: string, attributes: Record<string, string> = {}): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }

  private drawExteriorPointLabel(
    point: Point,
    labelText: string,
    paper: { x: number; y: number; width: number; height: number }
  ) {
    const leftDistance = Math.abs(point.x - paper.x);
    const rightDistance = Math.abs(point.x - (paper.x + paper.width));
    const topDistance = Math.abs(point.y - paper.y);
    const bottomDistance = Math.abs(point.y - (paper.y + paper.height));

    let labelX = point.x;
    let labelY = point.y;
    let anchor: 'start' | 'middle' | 'end' = 'middle';
    const offset = 5;

    const minDistance = Math.min(leftDistance, rightDistance, topDistance, bottomDistance);

    if (minDistance === leftDistance) {
      labelX -= offset;
      anchor = 'end';
    } else if (minDistance === rightDistance) {
      labelX += offset;
      anchor = 'start';
    } else if (minDistance === topDistance) {
      labelY -= offset;
    } else {
      labelY += offset + 1;
    }

    const adjustedPosition = this.adjustLabelPositionInViewBox(point, { anchor, x: labelX, y: labelY });

    const circleRadius = 2.8 + Math.max(0, labelText.length - 1) * 0.9;
    const labelCenterX =
      adjustedPosition.anchor === 'start'
        ? adjustedPosition.x + circleRadius * 0.55
        : adjustedPosition.anchor === 'end'
          ? adjustedPosition.x - circleRadius * 0.55
          : adjustedPosition.x;
    const labelCenterY = adjustedPosition.y - 1.1;

    const backgroundCircle = this.buildSvgElement('circle', {
      class: 'perspective-point-label-bg',
      cx: `${labelCenterX}`,
      cy: `${labelCenterY}`,
      fill: 'white',
      'pointer-events': 'none',
      r: `${circleRadius}`,
    });
    this._layer.appendChild(backgroundCircle);

    const text = this.buildSvgElement('text', {
      class: 'perspective-point-label',
      fill: '#111',
      'font-size': '3.2',
      'font-weight': '700',
      'pointer-events': 'none',
      'text-anchor': adjustedPosition.anchor,
      x: `${adjustedPosition.x}`,
      y: `${adjustedPosition.y}`,
    });
    text.textContent = labelText;
    this._layer.appendChild(text);
  }

  private adjustLabelPositionInViewBox(
    point: Point,
    position: { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
  ): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
    const svg = this._layer.ownerSVGElement;
    if (!svg) {
      return position;
    }

    const viewBox = svg.viewBox.baseVal;
    const padding = 3;
    const offset = 5;
    let { x, y, anchor } = position;

    if (anchor === 'end' && x < viewBox.x + padding) {
      x = point.x + offset;
      anchor = 'start';
    } else if (anchor === 'start' && x > viewBox.x + viewBox.width - padding) {
      x = point.x - offset;
      anchor = 'end';
    }

    if (y < viewBox.y + padding) {
      y = point.y + offset + 1;
    } else if (y > viewBox.y + viewBox.height - padding) {
      y = point.y - offset;
    }

    return { anchor, x, y };
  }

  private syncState() {
    this._state = stateService.getState();
    this._calculations.syncState();
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
        'font-size': `${Number(this._pointRadius) * 3}`,
        x: `${x + 2}`,
        y: `${y - 2}`,
      });
      text.textContent = label || '';
      this._layer.appendChild(text);
    }
  }
}
