import { Jadis } from '@jadis/core';

import { typedEntries } from '../../helper';
import { stateService } from '../../services/state.service';
import { PAPER_FORMATS } from '../../types/paper-format.type';
import { createToolbarSelect } from './toolbar-select';

import type { PaperFormatsValues } from '../../types/paper-format.type';

export class PaperFormatSelector extends Jadis {
  static readonly selector = 'aad-paper-format-selector';

  onConnect(): void {
    const { paperFormat } = stateService.getState();

    const select = createToolbarSelect<PaperFormatsValues>(
      {
        label: 'Paper Format',
        options: typedEntries(PAPER_FORMATS).map(([value, { label }]) => ({ label, value })),
      },
      paperFormat,
      this.shadowRoot ?? this
    );

    select.events.register('change', (value) => stateService.setPaperFormat(value));
  }
}

PaperFormatSelector.register();
