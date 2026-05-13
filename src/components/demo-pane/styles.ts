import { css, CSSResultGroup } from 'lit'

export const styles: CSSResultGroup = css`
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

  .editor-panel {
    border-bottom: 1px solid var(--wa-color-neutral-200);
    background: var(--wa-color-neutral-50);
    padding: 0.75rem;
  }

  .editor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .editor-field {
    display: grid;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--wa-color-neutral-700);
  }

  .editor-host {
    min-height: 180px;
    border: 1px solid #374151;
    border-radius: var(--wa-border-radius-small);
    overflow: hidden;
  }

  .editor-host .cm-editor {
    height: 180px;
    font-size: 0.8rem;
  }

  .editor-host .cm-scroller {
    font-family: Monaco, Menlo, Ubuntu Mono, monospace;
    line-height: 1.4;
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .editable-layout {
    display: grid;
    grid-template-rows: auto minmax(260px, 1fr);
    min-height: 560px;
  }

  .editable-preview {
    min-height: 260px;
  }

  .tabs-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--wa-color-neutral-200);
    background: var(--wa-color-neutral-50);
  }

  .tab-btn {
    appearance: none;
    border: 1px solid var(--wa-color-neutral-300);
    background: var(--wa-color-neutral-0);
    color: var(--wa-color-neutral-900);
    border-radius: var(--wa-border-radius-small);
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.5rem 0.625rem;
    cursor: pointer;
  }

  .tab-btn.is-active {
    background: var(--wa-color-brand-fill-loud);
    border-color: var(--wa-color-brand-border-loud);
    color: var(--wa-color-brand-on-loud);
  }

  @media (max-width: 768px) {
    :host {
      min-height: 460px;
    }

    .editor-grid {
      grid-template-columns: 1fr;
    }

    .editable-layout {
      min-height: 460px;
      grid-template-rows: auto minmax(220px, 1fr);
    }

    .pane {
      min-height: 300px;
    }

    wa-split-panel {
      display: none;
    }

    .tabs-toolbar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.375rem;
      padding: 0.5rem;
      border-bottom: 1px solid var(--wa-color-neutral-200);
      background: var(--wa-color-neutral-50);
    }

    .tab-btn {
      appearance: none;
      border: 1px solid var(--wa-color-neutral-300);
      background: var(--wa-color-neutral-0);
      color: var(--wa-color-neutral-900);
      border-radius: var(--wa-border-radius-small);
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.5rem 0.625rem;
      cursor: pointer;
    }

    .tab-btn.is-active {
      background: var(--wa-color-brand-fill-loud);
      border-color: var(--wa-color-brand-border-loud);
      color: var(--wa-color-brand-on-loud);
    }
  }
`
