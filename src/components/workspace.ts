import { assert, css, html, Jadis } from '@jadis/core';

import { RenderService } from '../services/render.service';
import { stateService } from '../services/state.service';

import type { TablePointDimensions } from '../services/render.service';

type BorderSide = 'left' | 'top' | 'right' | 'bottom';

type BorderHandleId = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

type PaperRect = { height: number; width: number; x: number; y: number };

type BorderSegment = {
  end: { x: number; y: number };
  side: BorderSide;
  start: { x: number; y: number };
};

export class Workspace extends Jadis {
  static readonly selector = 'aad-workspace';
  private _paper: SVGSVGElement | null = null;
  private _layer: SVGGElement | null = null;
  private _renderService: RenderService | null = null;
  private _draggingHandle: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' | null = null;

  readonly refs = this.useRefs((ref) => ({
    perspectiveDimensionsBody: ref<HTMLTableSectionElement>('.perspective-dimensions-body'),
  }));

  onConnect() {
    this._paper = this.shadowRoot?.querySelector('.paper') || null;
    this._layer = this._paper?.querySelector('#drawing-layer') || null;

    assert(this._layer, 'Drawing layer not found');

    this._renderService = new RenderService(this._layer);
    this.bindPointerEvents();

    this.startRendering();
  }

  templateHtml() {
    return html`
      <div class="workspace">
        <svg class="paper" width="297mm" height="210mm" viewBox="0 0 297 210">
          <g id="drawing-layer"></g>
        </svg>
        <div class="dimensions-panel">
          <h3>Lignes de perspective</h3>
          <table class="dimensions-table">
            <thead>
              <tr>
                <th>Point</th>
                <th>X (mm)</th>
                <th>Y (mm)</th>
              </tr>
            </thead>
            <tbody class="perspective-dimensions-body"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  templateCss() {
    return css`
      .workspace {
        display: flex;
        gap: 20px;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
      }

      .dimensions-panel {
        background: #fff;
        border: 1px solid #ccc;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
        min-width: 260px;
        padding: 10px;
      }

      .dimensions-panel h3 {
        font-size: 14px;
        margin: 0 0 8px;
      }

      .dimensions-table {
        border-collapse: collapse;
        font-size: 12px;
        width: 100%;
      }

      .dimensions-table th,
      .dimensions-table td {
        border: 1px solid #ddd;
        padding: 4px 6px;
        text-align: left;
      }

      .dimensions-table td:first-child {
        font-weight: 700;
      }

      .perspective-dimensions-body td {
        font-size: 13px;
      }

      .perspective-dimensions-body td:nth-child(2),
      .perspective-dimensions-body td:nth-child(3) {
        text-align: right;
      }

      .paper {
        background: white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border: 1px solid #ccc;
        touch-action: none;
      }

      .border-handle {
        cursor: grab;
        pointer-events: all;
      }

      .border-handle:active {
        cursor: grabbing;
      }

      .vision-circle {
        opacity: 0.3;
      }

      @media (hover: none) and (pointer: coarse) {
        .workspace {
          padding: 5px;
          overflow: auto;
          flex-direction: column;
          align-items: center;
        }
        .point {
          r: 5;
        }
        text {
          font-size: 6px;
        }
      }

      @media (hover: none) and (pointer: coarse) and (orientation: portrait) {
        .paper {
          /* Portrait phones: width drives scale, height follows to keep ratio. */
          width: calc(100vw - 16px);
          height: auto;
          max-height: calc(100dvh - 16px);
          flex: 0 0 auto;
        }
      }

      @media (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
        .paper {
          /* Landscape phones: height drives scale, width follows to keep ratio. */
          height: calc(100dvh - 16px);
          width: auto;
          max-width: calc(100vw - 16px);
          flex: 0 0 auto;
        }

        .dimensions-panel {
          width: min(100%, 440px);
        }
      }
    `;
  }

  private bindPointerEvents() {
    if (!this._paper) {
      return;
    }

    this._paper.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    this._paper.addEventListener('pointerleave', this._onPointerLeave);
  }

  private _onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element | null;
    const handle = target?.closest('[data-draggable-handle]');

    if (!handle) {
      return;
    }

    const handleId = handle.getAttribute('data-handle-id') as BorderHandleId | null;

    if (!handleId) {
      return;
    }

    this._draggingHandle = handleId;
    this._paper?.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private _onPointerMove = (event: PointerEvent) => {
    if (!this._paper || !this._renderService) {
      return;
    }

    const position = this.getSvgPoint(event.clientX, event.clientY);
    if (!position) {
      return;
    }

    if (this._draggingHandle) {
      const paper = this._renderService.getPaperRectGeometry();
      const projected = this.projectBorderPoint(position, paper, this.getAllowedPath(this._draggingHandle));
      stateService.setBorderHandlePosition(this._draggingHandle, projected.side, projected.ratio);
      stateService.setHoveredBorderHandle(this._draggingHandle);
      return;
    }

    this._updateHoveredHandle(position);
  };

  private _onPointerUp = () => {
    this._draggingHandle = null;
    stateService.setHoveredBorderHandle(null);
  };

  private _onPointerLeave = () => {
    stateService.setHoveredBorderHandle(null);
  };

  private _updateHoveredHandle(position: { x: number; y: number }) {
    if (!this._renderService) {
      return;
    }

    const threshold = 7;
    const hoveredHandle = Object.values(this._renderService.getBorderHandlesGeometry()).find(
      ({ position: handlePosition }) =>
        Math.hypot(handlePosition.x - position.x, handlePosition.y - position.y) <= threshold
    );

    stateService.setHoveredBorderHandle(hoveredHandle?.id ?? null);
  }

  private getAllowedPath(handleId: BorderHandleId): BorderSegment[] {
    if (handleId === 'left-top' || handleId === 'left-bottom') {
      return [
        { end: { x: 1, y: 0 }, side: 'top', start: { x: 0, y: 0 } },
        { end: { x: 0, y: 1 }, side: 'left', start: { x: 0, y: 0 } },
        { end: { x: 0, y: 1 }, side: 'bottom', start: { x: 1, y: 1 } },
      ];
    }

    return [
      { end: { x: 0, y: 0 }, side: 'top', start: { x: 1, y: 0 } },
      { end: { x: 1, y: 1 }, side: 'right', start: { x: 1, y: 0 } },
      { end: { x: 1, y: 1 }, side: 'bottom', start: { x: 0, y: 1 } },
    ];
  }

  private projectBorderPoint(
    position: { x: number; y: number },
    paper: PaperRect,
    allowedPath: BorderSegment[]
  ): { ratio: number; side: BorderSide } {
    const candidates = allowedPath.map((segment) => {
      const projected = this.projectPointOnSegment(position, paper, segment);
      return { ...projected, side: segment.side };
    });

    const closest = candidates.reduce((current, candidate) =>
      candidate.distance < current.distance ? candidate : current
    );

    return {
      ratio: Math.min(1, Math.max(0, this.getBorderRatioFromPoint(closest.point, paper, closest.side))),
      side: closest.side,
    };
  }

  private projectPointOnSegment(
    position: { x: number; y: number },
    paper: PaperRect,
    segment: BorderSegment
  ): { distance: number; point: { x: number; y: number } } {
    const start = this.scalePoint(paper, segment.start);
    const end = this.scalePoint(paper, segment.end);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return { distance: Math.hypot(position.x - start.x, position.y - start.y), point: start };
    }

    const rawT = ((position.x - start.x) * dx + (position.y - start.y) * dy) / lengthSquared;
    const t = Math.min(1, Math.max(0, rawT));
    const projectedX = start.x + dx * t;
    const projectedY = start.y + dy * t;

    return {
      distance: Math.hypot(position.x - projectedX, position.y - projectedY),
      point: { x: projectedX, y: projectedY },
    };
  }

  private getBorderRatioFromPoint(point: { x: number; y: number }, paper: PaperRect, side: BorderSide): number {
    if (side === 'left' || side === 'right') {
      return (point.y - paper.y) / paper.height;
    }

    return (point.x - paper.x) / paper.width;
  }

  private scalePoint(paper: PaperRect, point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: paper.x + paper.width * point.x,
      y: paper.y + paper.height * point.y,
    };
  }

  private getSvgPoint(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!this._paper) {
      return null;
    }

    const svgPoint = this._paper.createSVGPoint();
    const matrix = this._paper.getScreenCTM();

    if (!matrix) {
      return null;
    }

    svgPoint.x = clientX;
    svgPoint.y = clientY;

    const transformed = svgPoint.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  private startRendering() {
    const render = () => {
      this._renderService?.render();
      this.updatePerspectiveDimensionsTable();
      requestAnimationFrame(render);
    };
    render();
  }

  private updatePerspectiveDimensionsTable() {
    if (!this._renderService) {
      return;
    }

    const points = this._renderService.getTablePoints();
    const content = this.buildPerspectiveDimensionsRows(points);

    if (this.refs.perspectiveDimensionsBody.innerHTML !== content) {
      this.refs.perspectiveDimensionsBody.innerHTML = content;
    }
  }

  private buildPerspectiveDimensionsRows(points: TablePointDimensions[]) {
    return points
      .map(
        (point) => `
        <tr>
          <td>${point.label}</td>
          <td>${this.formatMillimeters(point.x)}</td>
          <td>${this.formatMillimeters(point.y)}</td>
        </tr>
      `
      )
      .join('');
  }

  private formatMillimeters(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    const normalized = Object.is(rounded, -0) ? 0 : rounded;
    return normalized.toFixed(1);
  }
}

Workspace.register();
