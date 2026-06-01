import { html, Jadis } from '@jadis/core';

export interface ToolbarRangeOptions {
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export class ToolbarRange extends Jadis {
  static readonly selector = 'aad-toolbar-range';

  readonly refs = this.useRefs((ref) => ({
    input: ref<HTMLInputElement>('input'),
    label: ref('.label'),
    value: ref('.value'),
  }));

  events = this.useEvents<{
    change: number;
  }>();

  declare options: ToolbarRangeOptions;
  declare selectedValue?: number;

  onConnect() {
    const { label, min, max, step = 1, unit = '' } = this.options;

    this.refs.label.textContent = label;
    this.refs.input.min = String(min);
    this.refs.input.max = String(max);
    this.refs.input.step = String(step);

    if (this.selectedValue !== undefined) {
      this.updateValue(this.selectedValue);
    }

    this.on(this.refs.input, 'input', () => {
      const value = Number(this.refs.input.value);
      this.updateValue(value);
      this.events.emit('change', value);
    });
  }

  templateHtml() {
    return html`
      <aad-toolbar-group>
        <label class="label"></label>
        <input type="range" />
        <span class="value"></span>
      </aad-toolbar-group>
    `;
  }

  private updateValue(value: number) {
    this.refs.input.value = String(value);
    this.refs.value.textContent = `${value}${this.options.unit ?? ''}`;
  }
}

ToolbarRange.register();
