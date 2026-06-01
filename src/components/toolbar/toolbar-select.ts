import { createElement, css, html, Jadis } from '@jadis/core';

type TypedToolbarSelect<TValue extends string> = ToolbarSelect<TValue>;

export interface SelectOption<TValue extends string = string> {
  label: string;
  options: { value: TValue; label: string }[];
}

export class ToolbarSelect<TValue extends string = string> extends Jadis {
  static readonly selector = 'aad-toolbar-select';
  readonly refs = this.useRefs((ref) => ({
    label: ref('.label'),
    select: ref<HTMLSelectElement>('select'),
  }));

  events = this.useEvents<{
    change: TValue;
  }>();

  declare options: SelectOption<TValue>;
  declare selectedValue?: TValue;

  onConnect() {
    this.refs.label.textContent = this.options.label;
    this.refs.select.innerHTML = this.options.options
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');

    if (this.selectedValue) {
      this.refs.select.value = this.selectedValue;
    }

    this.on(this.refs.select, 'change', () => {
      this.events.emit('change', this.refs.select.value as TValue);
    });
  }

  templateCss() {
    return css`
      :host > * {
        width: var(--default-toolbar-element-width, 180px);
      }
      `;
  }

  templateHtml() {
    return html`
      <aad-toolbar-group>
        <div class="label"></div>
        <select name="${this.ATTRIBUTE_NODE}"></select>
      </aad-toolbar-group>
    `;
  }
}

export function createToolbarSelect<TValue extends string>(
  options: SelectOption<TValue>,
  currentValue?: TValue,
  appendTo?: HTMLElement | ShadowRoot
): TypedToolbarSelect<TValue> {
  return createElement(
    ToolbarSelect,
    {
      props: {
        options,
        selectedValue: currentValue,
      },
    },
    appendTo
  ) as TypedToolbarSelect<TValue>;
}

ToolbarSelect.register();
