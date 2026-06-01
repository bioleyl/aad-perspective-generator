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

    assert(this._paper, 'Paper element not found');
    assert(this._layer, 'Drawing layer not found');

    this._renderService = new RenderService(this._paper, this._layer);

    this.startRendering();
  }

  templateHtml() {
    return html`
      <div class="workspace">
        <svg class="paper" width="100%" height="100%">
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
      }
      .draggable {
        cursor: move;
      }
      @media print {
        .workspace {
          padding: 0;
        }
        .paper {
          box-shadow: none;
          border: none;
        }
        .point {
          r: 0.5;
        }
        line, circle {
          stroke-width: 0.25;
        }
      }
    `;
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
