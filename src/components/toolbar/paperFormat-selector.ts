import { css, Jadis } from '@jadis/core';

import { typedEntries } from '../../helper';
import { stateService } from '../../services/state.service';
import { PAPER_FORMATS, PAPER_ORIENTATIONS } from '../../types/paper-format.type';
import { createToolbarSelect } from './toolbar-select';

import type { PaperOrientationValues, PaperSizeValues } from '../../types/paper-format.type';

export class PaperFormatSelector extends Jadis {
  static readonly selector = 'aad-paper-format-selector';

  onConnect(): void {
    const { paperOrientation, paperSize } = stateService.getState();

    const sizeSelect = createToolbarSelect<PaperSizeValues>(
      {
        label: 'Format de papier',
        options: typedEntries(PAPER_FORMATS).map(([value, { label }]) => ({ label, value })),
      },
      paperSize,
      this.shadowRoot ?? this
    );

    sizeSelect.events.register('change', (value) => stateService.setPaperSize(value));

    const orientationSelect = createToolbarSelect<PaperOrientationValues>(
      {
        label: 'Orientation',
        options: typedEntries(PAPER_ORIENTATIONS).map(([value, { label }]) => ({ label, value })),
      },
      paperOrientation,
      this.shadowRoot ?? this
    );

    orientationSelect.events.register('change', (value) => stateService.setPaperOrientation(value));
  }

  templateCss() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
    `;
  }
}

PaperFormatSelector.register();
