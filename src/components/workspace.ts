import { assert, css, html, Jadis } from '@jadis/core';

import { RenderService } from '../services/render.service';

export class Workspace extends Jadis {
  static readonly selector = 'aad-workspace';
  private _paper: SVGSVGElement | null = null;
  private _layer: SVGGElement | null = null;
  private _renderService: RenderService | null = null;

  onConnect() {
    this._paper = this.shadowRoot?.querySelector('.paper') || null;
    this._layer = this._paper?.querySelector('#drawing-layer') || null;

    assert(this._layer, 'Drawing layer not found');

    this._renderService = new RenderService(this._layer);

    this.startRendering();
  }

  templateHtml() {
    return html`
      <div class="workspace">
        <svg class="paper" width="297mm" height="210mm" viewBox="0 0 297 210">
          <g id="drawing-layer"></g>
        </svg>
      </div>
    `;
  }

  templateCss() {
    return css`
      .workspace {
        display: flex;
        justify-content: center;
        padding: 20px;
      }
      .paper {
        background: white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border: 1px solid #ccc;
        touch-action: none;
      }
      .point {
        r: 2;
      }
      @media (hover: none) and (pointer: coarse) {
        .workspace {
          padding: 5px;
          overflow: auto;
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
      }
    `;
  }

  print() {
    this._renderService?.print();
  }

  private startRendering() {
    const render = () => {
      this._renderService?.render();
      requestAnimationFrame(render);
    };
    render();
  }
}

Workspace.register();
