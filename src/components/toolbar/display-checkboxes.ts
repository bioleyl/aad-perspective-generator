import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarCheckbox } from './toolbar-checkbox';
import { ToolbarGroup } from './toolbar-group';

export class DisplayCheckboxes extends Jadis {
  static readonly selector = 'aad-display-checkboxes';

  onConnect() {
    const { displayPoints: displayMeasurePoints, displayCompletePerspectiveLines } = stateService.getState();

    const group = createElement(ToolbarGroup, {}, this.shadowRoot ?? this);

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayMeasurePoints, label: 'Afficher les points' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayPoints(checked));

    createElement(
      ToolbarCheckbox,
      {
        props: {
          checked: displayCompletePerspectiveLines,
          label: 'Afficher les lignes entre les points de perspective',
        },
      },
      group
    ).events.register('change', (checked) => stateService.setDisplayCompletePerspectiveLines(checked));
  }
}

DisplayCheckboxes.register();
