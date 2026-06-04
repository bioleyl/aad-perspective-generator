import { getPaperDimensions } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

type BorderSide = 'left' | 'top' | 'right' | 'bottom';

type BorderHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

const PERSPECTIVE_LINE_ORDER: BorderHandleId[] = ['left-top', 'left-bottom', 'right-top', 'right-bottom'];

const PERSPECTIVE_LINE_LABELS: Record<BorderHandleId, string> = {
  'left-bottom': 'B',
  'left-top': 'A',
  'right-bottom': 'D',
  'right-top': 'C',
};

type BorderHandle = {
  id: BorderHandleId;
  label: string;
  side: BorderSide;
  ratio: number;
  position: { x: number; y: number };
};

type Point = { x: number; y: number };

export interface PerspectiveLineDimensions {
  lineLabel: string;
  point: { label: string; x: number; y: number };
  primePoint: { label: string; x: number; y: number };
}

export interface TablePointDimensions {
  label: string;
  x: number;
  y: number;
}

export class RenderService {
  private _layer: SVGGElement;
  private _state: State;
  private _lineWidth = '0.5';
  private _pointRadius = '1';
  private _visionLineColor = 'green';
  private _perspectiveLineColor = '#666';

  constructor(layer: SVGGElement) {
    this._layer = layer;
    this._state = stateService.getState();
  }

  render() {
    this.computeObserverCoordinates();

    this._state = stateService.getState();

    this.clearLayer();
    this.drawPaper();
    this.drawPaperAxesReference();
    // this.drawVisionAngle();
    this.drawVisionCircle();
    // this.drawObserver();
    this.drawHorizonLine();
    this.drawPrinciplePoint();
    this.drawVanishingPoints();
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
    const paper = this.getPaperRectGeometry();
    const { displayCompletePerspectiveLines, vanishingPointLeftX, vanishingPointRightX } = this._state;
    const handles = this.getBorderHandles(paper);

    if (!displayCompletePerspectiveLines) {
      this.drawBorderHandles(handles);
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
      this._state.horizonLineY
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['left-bottom'].position.x,
      handles['left-bottom'].position.y,
      vanishingPointRightX,
      this._state.horizonLineY
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-top'].position.x,
      handles['right-top'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY
    );
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-bottom'].position.x,
      handles['right-bottom'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY
    );

    this._layer.appendChild(perspectiveLines);
    this.drawBorderHandles(handles);
    this.drawPerspectivePointMarkers(paper);
    this.drawPerspectivePointLabels(paper);
  }

  private computeObserverCoordinates() {
    const {
      cubeAngle,
      cubeAngleMinutes,
      cubeAngleSeconds,
      vanishingPointLeftX,
      vanishingPointRightX,
      horizonLineY,
    } = this._state;

    const fullCubeAngle = cubeAngle + cubeAngleMinutes / 60 + cubeAngleSeconds / 3600;

    const radianCubeAngle = (fullCubeAngle * Math.PI) / 180;
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

  private drawVanishingPoints() {
    const { vanishingPointLeftX, vanishingPointRightX, horizonLineY } = this._state;

    this.buildSvgPoint(vanishingPointLeftX, horizonLineY, 'purple', 'PFG');
    this.buildSvgPoint(vanishingPointRightX, horizonLineY, 'purple', 'PFD');
  }

  private drawBorderHandles(handles: Record<BorderHandleId, BorderHandle>) {
    for (const handle of Object.values(handles)) {
      this.buildSvgBorderHandle(handle.position.x, handle.position.y, handle.id, handle.label);
    }
  }

  private drawPerspectivePointLabels(paper: { x: number; y: number; width: number; height: number }) {
    const dimensions = this.getPerspectiveLineDimensions();

    for (const { point, primePoint } of dimensions) {
      this.drawExteriorPointLabel(this.toCanvasSpace(point, paper), point.label, paper);
      this.drawExteriorPointLabel(this.toCanvasSpace(primePoint, paper), primePoint.label, paper);
    }
  }

  private drawPerspectivePointMarkers(paper: { x: number; y: number; width: number; height: number }) {
    const dimensions = this.getPerspectiveLineDimensions();

    for (const { point, primePoint } of dimensions) {
      const points = [point, primePoint];

      for (const perspectivePoint of points) {
        const canvasPoint = this.toCanvasSpace(perspectivePoint, paper);
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
    const { displayMeasurePoints, vanishingPointLeftX, vanishingPointRightX, horizonLineY, observerPosition } =
      this._state;

    if (!displayMeasurePoints) {
      return;
    }

    const measurePoint45 = this.getMeasurePointX(vanishingPointLeftX, Math.PI / 4);
    const distanceLeftToObserver = Math.hypot(
      observerPosition.x - vanishingPointLeftX,
      observerPosition.y - horizonLineY
    );
    const distanceRightToObserver = Math.hypot(
      observerPosition.x - vanishingPointRightX,
      observerPosition.y - horizonLineY
    );

    const measurePointLeft = vanishingPointLeftX + distanceLeftToObserver;
    const measurePointRight = vanishingPointRightX - distanceRightToObserver;

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

  private drawVisionCircle() {
    const { observerPosition, horizonLineY } = this._state;
    const radius = this.getVisionCircleRadius();
    const circle = this.buildSvgElement('circle', {
      class: 'non-printable vision-circle',
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

  getPaperRectGeometry(): { height: number; width: number; x: number; y: number } {
    return this.computePaperRectGeometry();
  }

  getBorderHandlesGeometry(): Record<BorderHandleId, BorderHandle> {
    return this.getBorderHandles(this.getPaperRectGeometry());
  }

  getPaperIntersectionPoints(handleId: BorderHandleId): { start: Point; end: Point } | null {
    const paper = this.getPaperRectGeometry();
    const handles = this.getBorderHandles(paper);
    const handle = handles[handleId];

    if (!handle) {
      return null;
    }

    const target = this.getVanishingTargetForHandle(handleId);

    const intersections = this.getLineRectangleIntersections(handle.position, target, paper);

    if (intersections.length < 2) {
      return null;
    }

    return { end: intersections[1], start: intersections[0] };
  }

  getPerspectiveLineDimensions(): PerspectiveLineDimensions[] {
    const paper = this.getPaperRectGeometry();

    return PERSPECTIVE_LINE_ORDER.map((handleId) =>
      this.getPerspectiveLineDimensionsForHandle(handleId, paper)
    ).filter((line): line is PerspectiveLineDimensions => line !== null);
  }

  getTablePoints(): TablePointDimensions[] {
    const perspectivePoints = this.getPerspectiveLineDimensions().flatMap(({ point, primePoint }) => [
      point,
      primePoint,
    ]);
    const auxiliaryPoints = this.getAuxiliaryPointsInPaper();

    return [...perspectivePoints, ...auxiliaryPoints];
  }

  private computePaperRectGeometry(): { height: number; width: number; x: number; y: number } {
    const { observerPosition, horizonLineY } = this._state;
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

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

  private getBorderHandles(paper: {
    height: number;
    width: number;
    x: number;
    y: number;
  }): Record<BorderHandleId, BorderHandle> {
    const { borderHandles } = this._state;

    return {
      'left-bottom': {
        id: 'left-bottom',
        label: PERSPECTIVE_LINE_LABELS['left-bottom'],
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['left-bottom'].side,
          borderHandles['left-bottom'].ratio
        ),
        ratio: borderHandles['left-bottom'].ratio,
        side: borderHandles['left-bottom'].side,
      },
      'left-top': {
        id: 'left-top',
        label: PERSPECTIVE_LINE_LABELS['left-top'],
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['left-top'].side,
          borderHandles['left-top'].ratio
        ),
        ratio: borderHandles['left-top'].ratio,
        side: borderHandles['left-top'].side,
      },
      'right-bottom': {
        id: 'right-bottom',
        label: PERSPECTIVE_LINE_LABELS['right-bottom'],
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['right-bottom'].side,
          borderHandles['right-bottom'].ratio
        ),
        ratio: borderHandles['right-bottom'].ratio,
        side: borderHandles['right-bottom'].side,
      },
      'right-top': {
        id: 'right-top',
        label: PERSPECTIVE_LINE_LABELS['right-top'],
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['right-top'].side,
          borderHandles['right-top'].ratio
        ),
        ratio: borderHandles['right-top'].ratio,
        side: borderHandles['right-top'].side,
      },
    };
  }

  private getBorderHandlePosition(
    paper: { height: number; width: number; x: number; y: number },
    side: BorderSide,
    ratio: number
  ): { x: number; y: number } {
    if (side === 'left') {
      return { x: paper.x, y: paper.y + paper.height * ratio };
    }

    if (side === 'right') {
      return { x: paper.x + paper.width, y: paper.y + paper.height * ratio };
    }

    if (side === 'top') {
      return { x: paper.x + paper.width * ratio, y: paper.y };
    }

    return { x: paper.x + paper.width * ratio, y: paper.y + paper.height };
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

  private getLineRectangleIntersections(
    start: Point,
    target: Point,
    paper: { x: number; y: number; width: number; height: number }
  ): Point[] {
    const minX = paper.x;
    const maxX = paper.x + paper.width;
    const minY = paper.y;
    const maxY = paper.y + paper.height;
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const candidates: Point[] = [];

    const addCandidate = (t: number) => {
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      if (x >= minX - 0.001 && x <= maxX + 0.001 && y >= minY - 0.001 && y <= maxY + 0.001) {
        candidates.push({ x, y });
      }
    };

    if (Math.abs(dx) > 0.0001) {
      addCandidate((minX - start.x) / dx);
      addCandidate((maxX - start.x) / dx);
    }

    if (Math.abs(dy) > 0.0001) {
      addCandidate((minY - start.y) / dy);
      addCandidate((maxY - start.y) / dy);
    }

    const unique: Point[] = [];
    for (const point of candidates) {
      if (!unique.some((existing) => Math.hypot(existing.x - point.x, existing.y - point.y) <= 0.1)) {
        unique.push(point);
      }
    }

    return unique.sort(
      (left, right) =>
        Math.hypot(left.x - start.x, left.y - start.y) - Math.hypot(right.x - start.x, right.y - start.y)
    );
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

  private toPaperSpace(point: Point, paper: { x: number; y: number; width: number; height: number }): Point {
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

    return {
      x: ((point.x - paper.x) / paper.width) * width,
      y: height - ((point.y - paper.y) / paper.height) * height,
    };
  }

  private toCanvasSpace(point: Point, paper: { x: number; y: number; width: number; height: number }): Point {
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

    return {
      x: paper.x + (point.x / width) * paper.width,
      y: paper.y + ((height - point.y) / height) * paper.height,
    };
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

  private getVanishingTargetForHandle(handleId: BorderHandleId): Point {
    if (handleId === 'left-top' || handleId === 'left-bottom') {
      return { x: this._state.vanishingPointRightX, y: this._state.horizonLineY };
    }

    return { x: this._state.vanishingPointLeftX, y: this._state.horizonLineY };
  }

  private getPerspectiveLineDimensionsForHandle(
    handleId: BorderHandleId,
    paper: { x: number; y: number; width: number; height: number }
  ): PerspectiveLineDimensions | null {
    const intersections = this.getPaperIntersectionPoints(handleId);

    if (!intersections) {
      return null;
    }

    const lineLabel = PERSPECTIVE_LINE_LABELS[handleId];
    const vanishingTarget = this.getVanishingTargetForHandle(handleId);
    const startDistanceToVanishingPoint = Math.hypot(
      intersections.start.x - vanishingTarget.x,
      intersections.start.y - vanishingTarget.y
    );
    const endDistanceToVanishingPoint = Math.hypot(
      intersections.end.x - vanishingTarget.x,
      intersections.end.y - vanishingTarget.y
    );

    const primePointCanvas =
      startDistanceToVanishingPoint <= endDistanceToVanishingPoint ? intersections.start : intersections.end;
    const pointCanvas =
      startDistanceToVanishingPoint <= endDistanceToVanishingPoint ? intersections.end : intersections.start;

    const point = this.toPaperSpace(pointCanvas, paper);
    const primePoint = this.toPaperSpace(primePointCanvas, paper);

    return {
      lineLabel,
      point: { label: lineLabel, x: point.x, y: point.y },
      primePoint: { label: `${lineLabel}′`, x: primePoint.x, y: primePoint.y },
    };
  }

  private getAuxiliaryPointsInPaper(): TablePointDimensions[] {
    const paper = this.getPaperRectGeometry();
    const { observerPosition, horizonLineY, vanishingPointLeftX, vanishingPointRightX } = this._state;
    const distanceLeftToObserver = Math.hypot(
      observerPosition.x - vanishingPointLeftX,
      observerPosition.y - horizonLineY
    );
    const distanceRightToObserver = Math.hypot(
      observerPosition.x - vanishingPointRightX,
      observerPosition.y - horizonLineY
    );

    const candidatePoints: Array<{ label: string; canvasPoint: Point }> = [
      {
        canvasPoint: {
          x: observerPosition.x,
          y: horizonLineY,
        },
        label: 'PP',
      },
      {
        canvasPoint: {
          x: this.getMeasurePointX(vanishingPointLeftX, Math.PI / 4),
          y: horizonLineY,
        },
        label: 'PM45',
      },
      {
        canvasPoint: {
          x: vanishingPointLeftX + distanceLeftToObserver,
          y: horizonLineY,
        },
        label: 'PMG',
      },
      {
        canvasPoint: {
          x: vanishingPointRightX - distanceRightToObserver,
          y: horizonLineY,
        },
        label: 'PMD',
      },
    ];

    return candidatePoints
      .filter(({ canvasPoint }) => this.isPointInsidePaper(canvasPoint, paper))
      .map(({ label, canvasPoint }) => {
        const paperPoint = this.toPaperSpace(canvasPoint, paper);

        return {
          label,
          x: paperPoint.x,
          y: paperPoint.y,
        };
      });
  }

  private isPointInsidePaper(
    point: Point,
    paper: { x: number; y: number; width: number; height: number }
  ): boolean {
    const epsilon = 0.001;

    return (
      point.x >= paper.x - epsilon
      && point.x <= paper.x + paper.width + epsilon
      && point.y >= paper.y - epsilon
      && point.y <= paper.y + paper.height + epsilon
    );
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
