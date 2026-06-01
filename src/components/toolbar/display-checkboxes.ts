import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarCheckbox } from './toolbar-checkbox';
import { ToolbarGroup } from './toolbar-group';

export class DisplayCheckboxes extends Jadis {
  static readonly selector = 'aad-display-checkboxes';

  onConnect() {
    const {
      displayVisionAngle,
      displayVisionCircle,
      displayObserver,
      displayMeasurePoints,
      displayVanishingPoints,
    } = stateService.getState();

    const group = createElement(ToolbarGroup, {}, this.shadowRoot ?? this);

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayVisionAngle, label: 'Vision Angle' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayVisionAngle(checked));

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayVisionCircle, label: 'Vision Circle' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayVisionCircle(checked));

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayObserver, label: 'Observer' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayObserver(checked));

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayMeasurePoints, label: 'Measure Points' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayMeasurePoints(checked));

    createElement(
      ToolbarCheckbox,
      { props: { checked: displayVanishingPoints, label: 'Vanishing Points' } },
      group
    ).events.register('change', (checked) => stateService.setDisplayVanishingPoints(checked));
  }
}

DisplayCheckboxes.register();
