import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarRange } from './toolbar-range';

export class VisionAngleRange extends Jadis {
  static readonly selector = 'aad-vision-angle-range';

  onConnect() {
    const { visionAngle } = stateService.getState();

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Vision Angle',
            max: 90,
            min: 10,
            step: 1,
            unit: '°',
          },
          selectedValue: visionAngle,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setVisionAngle(value);
    });
  }
}

VisionAngleRange.register();
