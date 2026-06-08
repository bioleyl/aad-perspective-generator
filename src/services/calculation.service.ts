import { getPaperDimensions } from '../types/paper-format.type';
import { stateService } from './state.service';

import type { State } from './state.service';

export type BorderSide = 'left' | 'top' | 'right' | 'bottom';

export type BorderHandleId =
  | 'left-top'
  | 'left-bottom'
  | 'right-top'
  | 'right-bottom'
  | 'vertical-left'
  | 'vertical-right';

type HorizontalHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

const PERSPECTIVE_LINE_ORDER: HorizontalHandleId[] = ['left-top', 'left-bottom', 'right-top', 'right-bottom'];

const PERSPECTIVE_LINE_LABELS: Record<HorizontalHandleId, string> = {
  'left-bottom': 'D2',
  'left-top': 'D1',
  'right-bottom': 'G2',
  'right-top': 'G1',
};

const VERTICAL_LINE_LABELS: Array<{ handleId: BorderHandleId; lineLabel: string }> = [
  { handleId: 'vertical-left', lineLabel: 'V1' },
  { handleId: 'vertical-right', lineLabel: 'V2' },
];

export type BorderHandle = {
  id: BorderHandleId;
  label: string;
  side: BorderSide;
  ratio: number;
  position: { x: number; y: number };
};

export type Point = { x: number; y: number };

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

export class CalculationService {
  private _state: State;

  constructor() {
    this._state = stateService.getState();
  }

  syncState() {
    this._state = stateService.getState();
  }

  computeObserverPosition(): Point {
    return { ...this._state.observerPosition };
  }

  computeVanishingPoints(): { leftX: number; rightX: number } {
    const { observerPosition, horizonLineY } = this._state;
    const cubeAngleRadians = this.getCubeAngleInRadians();
    const epsilon = 0.0001;
    const clampedAngle = Math.min(Math.PI / 2 - epsilon, Math.max(epsilon, cubeAngleRadians));
    const verticalDistanceToHorizon = Math.max(epsilon, Math.abs(observerPosition.y - horizonLineY));
    const tangent = Math.tan(clampedAngle);

    const leftDistanceToPrinciplePoint = verticalDistanceToHorizon * tangent;
    const rightDistanceToPrinciplePoint = verticalDistanceToHorizon / tangent;

    return {
      leftX: observerPosition.x - leftDistanceToPrinciplePoint,
      rightX: observerPosition.x + rightDistanceToPrinciplePoint,
    };
  }

  computeHorizonLineY(): number {
    const { observerPosition, horizonLineReferenceY } = this._state;
    const headAngleRadians = this.getHeadAngleInRadians();
    const eyeToPictureDistance = Math.max(0.0001, observerPosition.y - horizonLineReferenceY);

    return horizonLineReferenceY + eyeToPictureDistance * Math.tan(headAngleRadians);
  }

  getThirdVanishingPoint(): Point | null {
    const { observerPosition, horizonLineY, horizonLineReferenceY } = this._state;
    const headAngleRadians = this.getHeadAngleInRadians();
    const epsilon = 0.0001;

    if (Math.abs(headAngleRadians) < epsilon) {
      return null;
    }

    const eyeToPictureDistance = Math.max(0.0001, observerPosition.y - horizonLineReferenceY);
    const verticalOffsetFromHorizon = eyeToPictureDistance / Math.tan(headAngleRadians);

    return {
      x: observerPosition.x,
      y: horizonLineY - verticalOffsetFromHorizon,
    };
  }

  getMeasurePoints(): { measurePoint45: number; measurePointLeft: number; measurePointRight: number } {
    const { observerPosition, horizonLineY, vanishingPointLeftX, vanishingPointRightX } = this._state;

    const measurePoint45 = this.getMeasurePointX(vanishingPointLeftX, Math.PI / 4);
    const distanceLeftToObserver = Math.hypot(
      observerPosition.x - vanishingPointLeftX,
      observerPosition.y - horizonLineY
    );
    const distanceRightToObserver = Math.hypot(
      observerPosition.x - vanishingPointRightX,
      observerPosition.y - horizonLineY
    );

    return {
      measurePoint45,
      measurePointLeft: vanishingPointLeftX + distanceLeftToObserver,
      measurePointRight: vanishingPointRightX - distanceRightToObserver,
    };
  }

  getVisionCircleRadius(): number {
    const { observerPosition } = this._state;
    const { x1, x2 } = this.getVisionHitPoint(this._state.visionAngle);
    return Math.max(Math.abs(x1 - observerPosition.x), Math.abs(x2 - observerPosition.x));
  }

  getPaperRectGeometry(): { height: number; width: number; x: number; y: number } {
    const { observerPosition, horizonLineReferenceY } = this._state;
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

    const ratio = width / height;
    const radius = this.getVisionCircleRadius();
    const rectWidth = (2 * radius * ratio) / Math.sqrt(ratio * ratio + 1);
    const rectHeight = (2 * radius) / Math.sqrt(ratio * ratio + 1);

    return {
      height: rectHeight,
      width: rectWidth,
      x: observerPosition.x - rectWidth / 2,
      y: horizonLineReferenceY - rectHeight / 2,
    };
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
    const handles = this.getBorderHandles(paper);
    const horizontalDimensions = PERSPECTIVE_LINE_ORDER.map((handleId) =>
      this.getPerspectiveLineDimensionsForHandle(handleId, paper, handles)
    ).filter((line): line is PerspectiveLineDimensions => line !== null);

    const thirdVanishingPoint = this.getThirdVanishingPoint();

    if (!thirdVanishingPoint) {
      return horizontalDimensions;
    }

    const verticalDimensions = VERTICAL_LINE_LABELS.map(({ handleId, lineLabel }) =>
      this.getPerspectiveLineDimensionsFromTarget(lineLabel, handles[handleId].position, thirdVanishingPoint, paper)
    ).filter((line): line is PerspectiveLineDimensions => line !== null);

    return [...horizontalDimensions, ...verticalDimensions];
  }

  getTablePoints(): TablePointDimensions[] {
    const perspectivePoints = this.getPerspectiveLineDimensions().flatMap(({ point, primePoint }) => [
      point,
      primePoint,
    ]);
    const auxiliaryPoints = this.getAuxiliaryPointsInPaper();

    return [...perspectivePoints, ...auxiliaryPoints];
  }

  toCanvasSpace(point: Point, paper: { x: number; y: number; width: number; height: number }): Point {
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

    return {
      x: paper.x + (point.x / width) * paper.width,
      y: paper.y + ((height - point.y) / height) * paper.height,
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
      'vertical-left': {
        id: 'vertical-left',
        label: 'V1',
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['vertical-left'].side,
          borderHandles['vertical-left'].ratio
        ),
        ratio: borderHandles['vertical-left'].ratio,
        side: borderHandles['vertical-left'].side,
      },
      'vertical-right': {
        id: 'vertical-right',
        label: 'V2',
        position: this.getBorderHandlePosition(
          paper,
          borderHandles['vertical-right'].side,
          borderHandles['vertical-right'].ratio
        ),
        ratio: borderHandles['vertical-right'].ratio,
        side: borderHandles['vertical-right'].side,
      },
    };
  }

  private getBorderHandlePosition(
    paper: { height: number; width: number; x: number; y: number },
    side: BorderSide,
    ratio: number
  ): Point {
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

  private getCubeAngleInRadians(): number {
    const { cubeAngle, cubeAngleMinutes, cubeAngleSeconds } = this._state;
    const fullCubeAngle = cubeAngle + cubeAngleMinutes / 60 + cubeAngleSeconds / 3600;

    return (fullCubeAngle * Math.PI) / 180;
  }

  private getHeadAngleInRadians(): number {
    const { headAngle, headAngleMinutes } = this._state;
    const fullHeadAngle = headAngle >= 0
      ? headAngle + headAngleMinutes / 60
      : headAngle - headAngleMinutes / 60;

    return (fullHeadAngle * Math.PI) / 180;
  }

  private getVisionHitPoint(angle: number): { x1: number; x2: number } {
    const { observerPosition, horizonLineReferenceY } = this._state;
    const verticalDistanceToHorizon = observerPosition.y - horizonLineReferenceY;
    const horizontalOffset = verticalDistanceToHorizon * Math.tan(((Math.PI / 180) * angle) / 2);
    return {
      x1: observerPosition.x + horizontalOffset,
      x2: observerPosition.x - horizontalOffset,
    };
  }

  private toPaperSpace(point: Point, paper: { x: number; y: number; width: number; height: number }): Point {
    const { width, height } = getPaperDimensions(this._state.paperSize, this._state.paperOrientation);

    return {
      x: ((point.x - paper.x) / paper.width) * width,
      y: height - ((point.y - paper.y) / paper.height) * height,
    };
  }

  private getVanishingTargetForHandle(handleId: BorderHandleId): Point {
    if (handleId === 'vertical-left' || handleId === 'vertical-right') {
      const thirdVanishingPoint = this.getThirdVanishingPoint();

      if (thirdVanishingPoint) {
        return thirdVanishingPoint;
      }

      return { x: this._state.observerPosition.x, y: this._state.horizonLineY };
    }

    if (handleId === 'left-top' || handleId === 'left-bottom') {
      return { x: this._state.vanishingPointRightX, y: this._state.horizonLineY };
    }

    return { x: this._state.vanishingPointLeftX, y: this._state.horizonLineY };
  }

  private getPerspectiveLineDimensionsForHandle(
    handleId: HorizontalHandleId,
    paper: { x: number; y: number; width: number; height: number },
    handles: Record<BorderHandleId, BorderHandle>
  ): PerspectiveLineDimensions | null {
    const handle = handles[handleId];

    if (!handle) {
      return null;
    }

    const lineLabel = PERSPECTIVE_LINE_LABELS[handleId];
    const vanishingTarget = this.getVanishingTargetForHandle(handleId);

    return this.getPerspectiveLineDimensionsFromTarget(
      lineLabel,
      handle.position,
      vanishingTarget,
      paper
    );
  }

  private getPerspectiveLineDimensionsFromTarget(
    lineLabel: string,
    startPoint: Point,
    targetPoint: Point,
    paper: { x: number; y: number; width: number; height: number }
  ): PerspectiveLineDimensions | null {
    const intersections = this.getLineRectangleIntersections(startPoint, targetPoint, paper);

    if (intersections.length < 2) {
      return null;
    }

    const startDistanceToVanishingPoint = Math.hypot(
      intersections[0].x - targetPoint.x,
      intersections[0].y - targetPoint.y
    );
    const endDistanceToVanishingPoint = Math.hypot(
      intersections[1].x - targetPoint.x,
      intersections[1].y - targetPoint.y
    );

    const primePointCanvas =
      startDistanceToVanishingPoint <= endDistanceToVanishingPoint ? intersections[0] : intersections[1];
    const pointCanvas =
      startDistanceToVanishingPoint <= endDistanceToVanishingPoint ? intersections[1] : intersections[0];

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
      {
        canvasPoint: {
          x: vanishingPointLeftX,
          y: horizonLineY,
        },
        label: 'PFG',
      },
      {
        canvasPoint: {
          x: vanishingPointRightX,
          y: horizonLineY,
        },
        label: 'PFD',
      },
    ];

    const tablePoints = candidatePoints
      .filter(({ canvasPoint }) => this.isPointInsidePaper(canvasPoint, paper))
      .map(({ label, canvasPoint }) => {
        const paperPoint = this.toPaperSpace(canvasPoint, paper);

        return {
          label,
          x: paperPoint.x,
          y: paperPoint.y,
        };
      });

    const thirdVanishingPoint = this.getThirdVanishingPoint();

    if (thirdVanishingPoint) {
      const paperPoint = this.toPaperSpace(thirdVanishingPoint, paper);
      tablePoints.push({
        label: 'PFV',
        x: paperPoint.x,
        y: paperPoint.y,
      });
    }

    return tablePoints;
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
}
