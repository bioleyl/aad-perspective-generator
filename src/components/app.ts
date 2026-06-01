import { html, Jadis } from '@jadis/core';

export class App extends Jadis {
  static readonly selector = 'aad-app';

  templateHtml() {
    return html`
      <aad-toolbar></aad-toolbar>
      <aad-workspace></aad-workspace>
    `;
  }
}

App.register();
