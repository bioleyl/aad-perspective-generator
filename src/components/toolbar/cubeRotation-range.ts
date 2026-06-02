import { createElement, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarRange } from './toolbar-range';

export class CubeRotationRange extends Jadis {
  static readonly selector = 'aad-cube-rotation-range';

  onConnect() {
    const { cubeAngle } = stateService.getState();

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Angle de rotation du cube',
            max: 85,
            min: 5,
            step: 1,
            unit: '°',
          },
          selectedValue: cubeAngle,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setCubeAngle(value);
    });
  }
}

CubeRotationRange.register();
