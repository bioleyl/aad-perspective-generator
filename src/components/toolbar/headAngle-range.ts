import { createElement, css, Jadis } from '@jadis/core';

import { stateService } from '../../services/state.service';
import { ToolbarRange } from './toolbar-range';

export class HeadAngleRange extends Jadis {
  static readonly selector = 'aad-head-angle-range';

  onConnect() {
    const { headAngle, headAngleMinutes } = stateService.getState();

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: 'Angle de vision',
            max: 45,
            min: -45,
            step: 1,
            unit: '°',
          },
          selectedValue: headAngle,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setHeadAngle(value);
    });

    createElement(
      ToolbarRange,
      {
        props: {
          options: {
            label: "Minutes de l'angle de vision",
            max: 59,
            min: 0,
            step: 1,
            unit: "'",
          },
          selectedValue: headAngleMinutes,
        },
      },
      this.shadowRoot ?? this
    ).events.register('change', (value) => {
      stateService.setHeadAngleMinutes(value);
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

HeadAngleRange.register();
