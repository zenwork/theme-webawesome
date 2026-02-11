import {css}      from 'npm:lit@^3.3.2'

export let styles: any = css`
  :host {
    display: block;
    min-height: 600px;
    border: 1px solid var(--wa-color-neutral-200);
    border-radius: var(--wa-border-radius-medium);
    overflow: hidden;
    /*background: var(--wa-color-neutral-50);*/
  }

  .pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
  }

  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--wa-color-neutral-100);
    border-bottom: 1px solid var(--wa-color-neutral-200);
    font-weight: 600;
    font-size: 0.875rem;
  }

  .pane-content {
    flex: 1;
    overflow: auto;
    padding: 1rem;
    background: var(--wa-color-neutral-0);
  }

  pre {
    margin: 0;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  pre code {
    display: block;
    padding: 0;
    background: transparent;
  }

  .output-container {
    min-height: 200px;
    padding: 1rem;
    background: var(--wa-color-neutral-0);
  }

  .error {
    color: var(--wa-color-danger-600);
    background: var(--wa-color-danger-50);
    padding: 1rem;
    border-radius: var(--wa-border-radius-small);
    font-size: 0.875rem;
  }

  wa-split-panel {
    --divider-width: 4px;
    height: 100%;
  }

  wa-split-panel::part(divider) {
    background: var(--wa-color-neutral-200);
  }

  wa-split-panel::part(divider):hover {
    background: var(--wa-color-primary-500);
  }

  .copy-button {
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .copy-button:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .pane {
      min-height: 300px;
    }
  }
`
