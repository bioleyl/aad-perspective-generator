import { css, html, Jadis } from '@jadis/core';

export class Toolbar extends Jadis {
  static readonly selector = 'aad-toolbar';

  templateCss() {
    return css`
      :host {
        background: white;
        border-bottom: 1px solid #ccc;
        padding: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: flex-start;
        --default-toolbar-element-width: 180px;
      }

      @media print {
        :host {
          display: none;
        }
      }
      `;
  }

  templateHtml() {
    return html`
      <aad-toolbar-group>
        <aad-paper-format-selector></aad-paper-format-selector>
      </aad-toolbar-group>
      <aad-vision-angle-range></aad-vision-angle-range>
      <aad-toolbar-group>
        <aad-display-checkboxes></aad-display-checkboxes>
      </aad-toolbar-group>
    `;
  }
}

Toolbar.register();
