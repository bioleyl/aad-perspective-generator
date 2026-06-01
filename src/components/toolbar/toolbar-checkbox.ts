import { css, html, Jadis } from '@jadis/core';

export class ToolbarCheckbox extends Jadis {
  static readonly selector = 'aad-toolbar-checkbox';

  readonly refs = this.useRefs((ref) => ({
    input: ref<HTMLInputElement>('input'),
    label: ref('.label'),
  }));

  events = this.useEvents({
    change: Boolean,
  });

  declare label: string;
  declare checked?: boolean;

  onConnect() {
    this.refs.label.textContent = this.label;

    if (this.checked !== undefined) {
      this.refs.input.checked = this.checked;
    }

    this.on(this.refs.input, 'change', () => {
      this.events.emit('change', this.refs.input.checked);
    });
  }

  templateCss() {
    return css`
      :host {
        width: var(--default-toolbar-element-width, 180px);
      }
      label {
        display: flex;
        justify-content: space-between;
        cursor: pointer;
      }
      `;
  }

  templateHtml() {
    return html`
      <label><span class="label"></span><input type="checkbox" /></label>
      
    `;
  }
}

ToolbarCheckbox.register();
