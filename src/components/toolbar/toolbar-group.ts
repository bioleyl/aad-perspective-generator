import { css, html, Jadis } from '@jadis/core';

export class ToolbarGroup extends Jadis {
  static readonly selector = 'aad-toolbar-group';

  templateCss() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      label {
        font-size: 13px;
      }

      input[type="range"] {
        width: 180px;
      }
      `;
  }

  templateHtml() {
    return html`
      <slot></slot>
    `;
  }
}

ToolbarGroup.register();
