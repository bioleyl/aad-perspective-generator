import { html, Jadis } from '@jadis/core';

import type { Toolbar } from './toolbar';
import type { Workspace } from './workspace';

export class App extends Jadis {
  static readonly selector = 'aad-app';

  refs = this.useRefs((ref) => ({
    toolbar: ref<Toolbar>('aad-toolbar'),
    workspace: ref<Workspace>('aad-workspace'),
  }));

  onConnect() {
    this.refs.toolbar.events.register('print', () => {
      this.refs.workspace.print();
    });
  }

  templateHtml() {
    return html`
      <aad-toolbar></aad-toolbar>
      <aad-workspace></aad-workspace>
    `;
  }
}

App.register();
