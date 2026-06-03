import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarRange } from './toolbar-range';

export class GuidePointsDistanceRange extends Jadis {
  static readonly selector = 'aad-guide-points-distance-range';

  onConnect() {
    const { guidePointsInset } = stateService.getState();

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Distance des points des bords',
            max: 10,
            min: 0,
            step: 1,
            unit: ' mm',
          },
          selectedValue: guidePointsInset,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setGuidePointsInset(value);
    });
  }
}

GuidePointsDistanceRange.register();
