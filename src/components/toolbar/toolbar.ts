import { css, html, Jadis } from '@jadis/core';

export class Toolbar extends Jadis {
  static readonly selector = 'aad-toolbar';

  private _isCollapsed = false;

  readonly refs = this.useRefs((ref) => ({
    collapseToggle: ref<HTMLButtonElement>('.collapse-toggle'),
    content: ref<HTMLDivElement>('.toolbar-content'),
  }));

  onConnect() {
    this.updateCollapsedState();

    this.on(this.refs.collapseToggle, 'click', () => {
      this._isCollapsed = !this._isCollapsed;
      this.updateCollapsedState();
    });
  }

  templateCss() {
    return css`
      :host {
        background: white;
        border-bottom: 1px solid #ccc;
        padding: 10px;
        display: block;
        --default-toolbar-element-width: 180px;
      }

      .toolbar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .collapse-toggle {
        border: 1px solid #ccc;
        background: #fff;
        padding: 6px 10px;
        font-size: 14px;
        line-height: 1.1;
        border-radius: 4px;
        cursor: pointer;
        width: var(--default-toolbar-element-width);
      }

      .toolbar-content {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: flex-start;
      }

      .toolbar-content[hidden] {
        display: none;
      }

      @media (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
        :host {
          padding: 6px 8px;
        }

        .toolbar-header {
          gap: 6px;
        }

        .toolbar-header strong {
          font-size: 14px;
          line-height: 1;
        }

        .collapse-toggle {
          padding: 3px 8px;
          font-size: 12px;
        }

        .toolbar-content {
          margin-top: 6px;
          gap: 12px;
        }
      }
      `;
  }

  templateHtml() {
    return html`
      <div class="toolbar-header">
        <strong>Toolbar</strong>
        <div class="toolbar-actions">
          <button type="button" class="collapse-toggle">Collapse</button>
        </div>
      </div>
      <div class="toolbar-content">
        <aad-toolbar-group>
          <aad-paper-format-selector></aad-paper-format-selector>
        </aad-toolbar-group>
        <aad-toolbar-group>
          <aad-cube-rotation-range></aad-cube-rotation-range>
        </aad-toolbar-group>
        <aad-toolbar-group>
          <aad-vision-angle-range></aad-vision-angle-range>
        </aad-toolbar-group>
        <aad-toolbar-group>
          <aad-display-checkboxes></aad-display-checkboxes>
        </aad-toolbar-group>
      </div>
    `;
  }

  private updateCollapsedState() {
    this.refs.content.hidden = this._isCollapsed;
    this.refs.collapseToggle.textContent = this._isCollapsed ? 'Expand' : 'Collapse';
    this.refs.collapseToggle.setAttribute('aria-expanded', String(!this._isCollapsed));
  }
}

Toolbar.register();
