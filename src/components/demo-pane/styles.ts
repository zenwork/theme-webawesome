import { css, CSSResultGroup } from 'lit'

export const styles: CSSResultGroup = css`
  :host {
    --demo-editor-bg: #282c34;
    display: block;
    min-height: 560px;
    border: 1px solid var(--wa-color-neutral-200);
    border-radius: var(--wa-border-radius-medium);
    overflow: hidden;
    background: var(--wa-color-neutral-0);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--wa-color-neutral-900) 8%, transparent);
  }

  .pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
  }

  .pane-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.375rem 0.5rem;
    background: var(--wa-color-neutral-50);
    border-bottom: 1px solid var(--wa-color-neutral-200);
  }

  .pane-content {
    flex: 1;
    overflow: auto;
    padding: 0.875rem;
    background: var(--wa-color-neutral-0);
  }

  pre {
    margin: 0;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  pre code {
    display: block;
    padding: 0;
    background: transparent;
  }

  .output-container {
    min-height: 200px;
    padding: 0.875rem;
    margin: 0.125rem;
    border: 2px dotted rgba(148, 163, 184, 0.8);
    border-radius: var(--wa-border-radius-small);
    background:
      radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.2) 1px, transparent 0) 0 0 / 10px 10px,
      transparent;
    }

    .error {
      color: var(--wa-color-danger-700);
      background: color-mix(in srgb, var(--wa-color-danger-50) 75%, var(--wa-color-neutral-0));
      border: 1px solid var(--wa-color-danger-200);
      border-left: 3px solid var(--wa-color-danger-500);
      padding: 0.75rem 0.875rem;
      border-radius: var(--wa-border-radius-small);
      font-size: 0.875rem;
    }

    .pane-split {
      --divider-width: 3px;
      height: 100%;
    }

    .pane-split::part(divider) {
      background: var(--wa-color-neutral-300);
      transition: background-color 0.16s ease;
    }

    .pane-split::part(divider):hover {
      background: var(--wa-color-brand-border-loud);
    }

    .copy-button {
      opacity: 0.72;
      transition: opacity 0.16s ease;
    }

    .copy-button:hover {
      opacity: 1;
    }

    .editor-panel {
      border-bottom: 1px solid var(--wa-color-neutral-200);
      background: transparent;
    }

    .editor-panel::part(header) {
      padding-inline: 0.75rem;
      border-bottom: 1px dotted rgba(148, 163, 184, 0.7);
      font-size: 0.8125rem;
      font-weight: 600;
      background: transparent;
      cursor: pointer;
    }

    .editor-panel::part(summary) {
      color: var(--wa-color-neutral-800);
    }

    .editor-panel::part(content) {
      padding: 0;
    }

    .editor-panel-content {
      padding: 0.625rem 0.75rem 0.75rem;
    }

    .editor-panel-loading {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px dotted rgba(148, 163, 184, 0.7);
      font-size: 0.8125rem;
      color: var(--wa-color-neutral-600);
    }

    .editor-split {
      --divider-width: 12px;
      --divider-hit-area: 24px;
      block-size: 180px;
      min-block-size: 180px;
      background: var(--demo-editor-bg);
      border-radius: var(--wa-border-radius-small);
      overflow: hidden;
    }

    .editor-split::part(divider) {
      background:
        radial-gradient(circle at center, rgba(148, 163, 184, 0.45) 1px, transparent 1.5px) center / 6px 6px repeat-y,
        transparent;
      border-inline: 1px dotted rgba(148, 163, 184, 0.75);
      transition: border-color 0.16s ease, background-color 0.16s ease;
    }

    .editor-split::part(divider):hover {
      border-inline-color: color-mix(in srgb, var(--wa-color-brand-border-loud) 75%, rgba(148, 163, 184, 0.75));
    }

    .editor-split::part(start),
    .editor-split::part(end) {
      display: flex;
      align-items: stretch;
      overflow: hidden;
      background: var(--demo-editor-bg);
    }

    .editor-split [slot="start"],
    .editor-split [slot="end"] {
      flex: 1 1 auto;
      min-height: 0;
    }

    .editor-field {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.375rem;
      min-height: 0;
      block-size: 100%;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--wa-color-neutral-700);
    }

    .editor-host {
      min-height: 0;
      block-size: 100%;
      border: 1px solid var(--wa-color-neutral-300);
      border-radius: var(--wa-border-radius-small);
      overflow: hidden;
      background: var(--demo-editor-bg);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, #ffffff 6%, transparent);
    }

    .editor-host .cm-editor {
      block-size: 100%;
      font-size: 0.8rem;
    }

    .editor-host .cm-scroller {
      font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
      line-height: 1.4;
    }

    .editor-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.625rem;
    }

    .editor-actions wa-button::part(base),
    .pane-toolbar wa-button::part(base) {
      inline-size: 2rem;
      min-inline-size: 2rem;
      block-size: 2rem;
      padding: 0;
    }

    .editable-layout {
      display: grid;
      grid-template-rows: auto minmax(320px, 1fr);
      min-height: 560px;
    }

    .editable-preview {
      min-height: 320px;
      min-width: 0;
    }

    .tabs-toolbar {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 0.625rem;
      border-bottom: 1px solid var(--wa-color-neutral-200);
      background: var(--wa-color-neutral-50);
    }

    .tab-btn {
      appearance: none;
      border: 1px solid var(--wa-color-neutral-300);
      background: var(--wa-color-neutral-0);
      color: var(--wa-color-neutral-800);
      border-radius: var(--wa-border-radius-small);
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.4375rem 0.625rem;
      cursor: pointer;
      transition: border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease;
    }

    .tab-btn:hover {
      border-color: var(--wa-color-neutral-400);
      color: var(--wa-color-neutral-900);
    }

    .tab-btn:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--wa-color-brand-border-loud) 55%, transparent);
      outline-offset: 1px;
    }

    .tab-btn.is-active {
      background: color-mix(in srgb, var(--wa-color-brand-fill-loud) 15%, var(--wa-color-neutral-0));
      border-color: color-mix(in srgb, var(--wa-color-brand-border-loud) 70%, var(--wa-color-neutral-300));
      color: var(--wa-color-brand-text-loud);
    }

    @media (max-width: 768px) {
      :host {
        min-height: 460px;
      }

      .editable-layout {
        min-height: 460px;
        grid-template-rows: auto minmax(240px, 1fr);
      }

      .pane {
        min-height: 300px;
      }

      .pane-split {
        display: none;
      }

      .editor-panel-content {
        padding: 0.5rem 0.625rem 0.625rem;
      }

      .editor-split {
        block-size: 140px;
        min-block-size: 140px;
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
        font-size: 0.8rem;
        padding: 0.4375rem 0.5rem;
      }
    }
  `
