import { PAPER_FORMATS } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

type BorderSide = 'left' | 'top' | 'right' | 'bottom';

type BorderHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

type BorderHandle = {
  id: BorderHandleId;
  label: string;
  side: BorderSide;
  ratio: number;
  position: { x: number; y: number };
};

type Point = { x: number; y: number };

export class RenderService {
  private _layer: SVGGElement;
  private _state: State;
  private _lineWidth = '0.5';
  private _pointRadius = '3';
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
    this.drawPerspectiveLines();
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
    const paper = this.getPaperRectGeometry();
    const { displayCompletePerspectiveLines, vanishingPointLeftX, vanishingPointRightX } = this._state;
    const handles = this.getBorderHandles(paper);
    const perspectiveLines = this.buildSvgElement('g');

    if (!displayCompletePerspectiveLines) {
      perspectiveLines.setAttribute('clip-path', `url(#${this.updatePaperClipPath(paper)})`);
    }

    this.drawPerspectiveLine(
      perspectiveLines,
      handles['left-top'].position.x,
      handles['left-top'].position.y,
      vanishingPointRightX,
      this._state.horizonLineY
    );
    this.drawPaperCrossingPoint(paper, handles['left-top'].position, {
      x: vanishingPointRightX,
      y: this._state.horizonLineY,
    });
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['left-bottom'].position.x,
      handles['left-bottom'].position.y,
      vanishingPointRightX,
      this._state.horizonLineY
    );
    this.drawPaperCrossingPoint(paper, handles['left-bottom'].position, {
      x: vanishingPointRightX,
      y: this._state.horizonLineY,
    });
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-top'].position.x,
      handles['right-top'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY
    );
    this.drawPaperCrossingPoint(paper, handles['right-top'].position, {
      x: vanishingPointLeftX,
      y: this._state.horizonLineY,
    });
    this.drawPerspectiveLine(
      perspectiveLines,
      handles['right-bottom'].position.x,
      handles['right-bottom'].position.y,
      vanishingPointLeftX,
      this._state.horizonLineY
    );
    this.drawPaperCrossingPoint(paper, handles['right-bottom'].position, {
      x: vanishingPointLeftX,
      y: this._state.horizonLineY,
    });

    this._layer.appendChild(perspectiveLines);
    this.drawBorderHandles(handles);
    this.drawHoveredBorderHandleAnnotation(handles);
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

  private drawBorderHandles(handles: Record<BorderHandleId, BorderHandle>) {
    for (const handle of Object.values(handles)) {
      this.buildSvgBorderHandle(handle.position.x, handle.position.y, handle.id, handle.label);
    }
  }

  private drawHoveredBorderHandleAnnotation(handles: Record<BorderHandleId, BorderHandle>) {
    const { hoveredBorderHandle } = this._state;

    if (!hoveredBorderHandle) {
      return;
    }

    const handle = handles[hoveredBorderHandle];
    if (!handle) {
      return;
    }

    const paper = this.getPaperRectGeometry();
    const intersections = this.getPaperIntersectionPoints(hoveredBorderHandle);

    if (!intersections) {
      return;
    }

    const points = [intersections.start, intersections.end];

    for (const point of points) {
      const paperPoint = this.toPaperSpace(point, paper);
      const marker = this.buildSvgElement('circle', {
        class: 'border-crossing-marker',
        cx: `${point.x}`,
        cy: `${point.y}`,
        fill: '#f59e0b',
        'pointer-events': 'none',
        r: '2.4',
        stroke: 'white',
        'stroke-width': '0.5',
      });
      this._layer.appendChild(marker);

      const label = this.buildSvgElement('text', {
        class: 'border-crossing-label',
        fill: '#111',
        'font-size': '3.2',
        'font-weight': '600',
        'pointer-events': 'none',
        'text-anchor': 'middle',
        x: `${point.x}`,
        y: `${point.y - 4}`,
      });

      label.textContent = `${paperPoint.x.toFixed(1)} mm, ${paperPoint.y.toFixed(1)} mm`;
      this._layer.appendChild(label);
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

    const target =
      handleId === 'left-top' || handleId === 'left-bottom'
        ? { x: this._state.vanishingPointRightX, y: this._state.horizonLineY }
        : { x: this._state.vanishingPointLeftX, y: this._state.horizonLineY };

    const intersections = this.getLineRectangleIntersections(handle.position, target, paper);

    if (intersections.length < 2) {
      return null;
    }

    return { end: intersections[1], start: intersections[0] };
  }

  private computePaperRectGeometry(): { height: number; width: number; x: number; y: number } {
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
        label: 'LB',
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
        label: 'LT',
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
        label: 'RB',
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
        label: 'RT',
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

  private drawPaperCrossingPoint(
    paper: { height: number; width: number; x: number; y: number },
    start: Point,
    target: Point
  ) {
    const intersections = this.getLineRectangleIntersections(start, target, paper);

    for (const point of intersections) {
      if (Math.hypot(point.x - start.x, point.y - start.y) <= 0.1) {
        continue;
      }

      const circle = this.buildSvgElement('circle', {
        cx: `${point.x}`,
        cy: `${point.y}`,
        fill: 'orange',
        r: '2.5',
        stroke: 'white',
        'stroke-width': '0.6',
      });
      this._layer.appendChild(circle);
      break;
    }
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
    const { width, height } = PAPER_FORMATS[this._state.paperFormat];

    return {
      x: ((point.x - paper.x) / paper.width) * width,
      y: height - ((point.y - paper.y) / paper.height) * height,
    };
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
