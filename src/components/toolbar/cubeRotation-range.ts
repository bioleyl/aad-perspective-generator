import { createElement, css, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarRange } from './toolbar-range';

export class CubeRotationRange extends Jadis {
  static readonly selector = 'aad-cube-rotation-range';

  onConnect() {
    const { cubeAngle, cubeAngleMinutes } = stateService.getState();

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Angle de rotation du cube',
            max: 90,
            min: 0,
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

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Minutes de rotation du cube',
            max: 59,
            min: 0,
            step: 1,
            unit: "'",
          },
          selectedValue: cubeAngleMinutes,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setCubeAngleMinutes(value);
    });
  }

  templateCss() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `;
  }
}

CubeRotationRange.register();
