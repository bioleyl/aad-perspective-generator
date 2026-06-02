import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarCheckbox } from './toolbar-checkbox';
import { ToolbarGroup } from './toolbar-group';

export class DisplayCheckboxes extends Jadis {
  static readonly selector = 'aad-display-checkboxes';

  onConnect() {
    const { displayMeasurePoints } = stateService.getState();

    const group = createElement(ToolbarGroup, {}, this.shadowRoot ?? this);

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayMeasurePoints, label: 'Afficher les points de mesure' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayMeasurePoints(checked));
  }
}

DisplayCheckboxes.register();
