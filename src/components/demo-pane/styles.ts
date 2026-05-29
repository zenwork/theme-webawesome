import { css, CSSResultGroup } from 'lit'

export const styles: CSSResultGroup = css`
  :host {
    --demo-editor-bg: #282c34;
    --demo-editor-divider: color-mix(in srgb, var(--wa-color-brand-border-loud) 55%, transparent);
    --demo-editor-min-height: 120px;
    --demo-surface-border: var(--docs-color-divider, var(--wa-color-neutral-300));
    --demo-surface-border-subtle: var(--docs-color-divider, var(--wa-color-neutral-200));
    --demo-surface-bg: var(--docs-color-surface, var(--wa-color-neutral-0));
    --demo-toolbar-bg: var(--docs-color-surface-subtle, var(--wa-color-neutral-50));
    --demo-pane-output-background-default: var(
      --demo-output-bg,
      color-mix(in srgb, var(--demo-toolbar-bg) 55%, transparent)
    );
    --demo-code-font: var(--wa-font-family-code);
    display: block;
    margin-block-end: 0.875rem;
    border: 1px solid var(--demo-surface-border);
    border-radius: var(--wa-border-radius-s);
    overflow: hidden;
    background: var(--demo-surface-bg);
  }

  :host([fit-content]) {
    --demo-editor-min-height: 0px;
  }

  :host([fill-height]) {
    min-block-size: var(--demo-pane-height, calc(100dvh - var(--site-header-scroll-offset, 72px) - 2rem));
  }

  :host(:last-child) {
    /*margin-block-end: 0;*/
  }

  .pane {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 0;
  }

  .pane-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.375rem 0.5rem;
    background: var(--demo-toolbar-bg);
    border-bottom: 1px solid var(--demo-surface-border-subtle);
  }

  .pane-content {
    flex: 1;
    overflow: auto;
    padding: 0.875rem;
    background: var(--demo-surface-bg);
  }

  pre {
    margin: 0;
    font-family: var(--demo-code-font);
    font-size: var(--wa-font-size-xs);
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
    margin: 0.125rem 0.125rem 0.875rem;
    border: 1px dashed var(--demo-surface-border);
    border-radius: var(--wa-border-radius-s);
    background: var(--demo-pane-output-background, var(--demo-pane-output-background-default));
  }

  .error {
    color: var(--wa-color-danger-700);
    background: color-mix(in srgb, var(--wa-color-danger-50) 75%, var(--wa-color-neutral-0));
    border: 1px solid var(--wa-color-danger-200);
    border-left: 3px solid var(--wa-color-danger-500);
    padding: 0.75rem 0.875rem;
    border-radius: var(--wa-border-radius-m);
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
    border-bottom: 1px solid var(--demo-surface-border-subtle);
    background: transparent;
  }

  .editor-panel::part(header) {
    padding-inline: 0.75rem;
    border-bottom: 1px solid var(--demo-surface-border);
    font-size: var(--wa-font-size-xs);
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

  .editor-panel:not([open])::part(content) {
    display: none;
    padding: 0;
    margin: 0;
    block-size: 0;
    min-block-size: 0;
  }

  .editor-panel:not([open])::part(header) {
    padding-block: 0.25rem;
  }

  .editor-panel-content {
    display: grid;
    grid-template-rows: minmax(var(--demo-editor-min-height), 1fr) auto auto;
    gap: 0.375rem;
    box-sizing: border-box;
    padding: 0.5rem 0.625rem 0.5rem;
    block-size: var(--demo-editor-height, auto);
    /*background: var(--demo-editor-bg);*/
  }

  .editor-panel-loading {
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--demo-surface-border);
    font-size: var(--wa-font-size-xs);
    color: var(--wa-color-neutral-600);
  }

  .editor-split {
    --divider-width: 12px;
    --divider-hit-area: 24px;
    block-size: auto;
    min-block-size: var(--demo-editor-min-height);
    background: var(--demo-editor-bg);
    border-radius: var(--wa-border-radius-m);
    overflow: hidden;
    border-top: 0.1rem solid var(--demo-editor-divider);
    border-bottom: 0.1rem solid var(--demo-editor-divider);
  }

  .editor-split::part(divider) {
    background:
      radial-gradient(
        circle at center,
        color-mix(in srgb, var(--wa-color-neutral-500) 70%, transparent) 1px,
        transparent 1.5px
      ) center / 6px 6px repeat-y,
      transparent;
    border-inline: 1px dashed var(--wa-color-neutral-400);
    transition: border-color 0.16s ease, background-color 0.16s ease;
  }

  .editor-split::part(divider):hover {
    border-inline-color: var(--wa-color-brand-border-loud);
  }

  .editor-split::part(start),
  .editor-split::part(end) {
    display: flex;
    align-items: stretch;
    min-inline-size: 0;
    min-block-size: 0;
    overflow: hidden;
    background: var(--demo-editor-bg);
  }

  .editor-split [slot="start"],
  .editor-split [slot="end"] {
    flex: 1 1 auto;
    min-inline-size: 0;
    min-height: 0;
  }

  .editor-field {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.375rem;
    min-inline-size: 0;
    min-height: 0;
    block-size: 100%;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--wa-color-neutral-200);
    background: var(--demo-editor-bg);
  }

  .editor-host {
    min-inline-size: 0;
    min-height: 0;
    inline-size: 100%;
    max-inline-size: 100%;
    block-size: 100%;
    border: 1px solid var(--demo-surface-border);
    border-radius: var(--wa-border-radius-s);
    overflow: hidden;
    background: var(--demo-editor-bg);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--demo-surface-border-subtle) 40%, transparent);
  }

  .editor-field code-example {
    --code-example-surface-bg: var(--demo-editor-bg);
    display: block;
    min-inline-size: 0;
    min-height: 0;
    inline-size: 100%;
    max-inline-size: 100%;
    block-size: 100%;
    background: var(--demo-editor-bg);
  }

  .editor-host .cm-editor {
    min-inline-size: 0;
    inline-size: 100%;
    max-inline-size: 100%;
    block-size: 100%;
    font-size: var(--wa-font-size-xs);
  }

  .editor-host .cm-scroller {
    min-inline-size: 0;
    inline-size: 100%;
    max-inline-size: 100%;
    overflow: auto;
    font-family: var(--demo-code-font);
    line-height: 1.4;
  }

  .editor-host .cm-content {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .editor-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0;
    padding-top: 0.5rem;
    /*border-top: .1rem solid var(--demo-editor-divider);*/
  }

  .editor-actions wa-button::part(base) {
    inline-size: 1.75rem;
    min-inline-size: 1.75rem;
    block-size: 1.75rem;
    padding: 0;
  }

  .pane-toolbar wa-button::part(base) {
    inline-size: 2rem;
    min-inline-size: 2rem;
    block-size: 2rem;
    padding: 0;
  }

  .editor-resizer,
  .preview-resizer {
    block-size: 10px;
    border-top: 1px dashed var(--wa-color-neutral-100);
    background: transparent;
    cursor: ns-resize;
    touch-action: none;
    position: relative;
  }

  .editor-resizer {
    margin-top: 0;
  }

  .preview-resizer {
    margin-top: 0.25rem;
  }

  .editor-resizer::before,
  .preview-resizer::before {
    content: "";
    position: absolute;
    inset-inline: 50%;
    top: 3px;
    transform: translateX(-50%);
    inline-size: 3rem;
    block-size: 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--wa-color-brand-border-loud) 50%, transparent);
    opacity: 0.5;
    transition: background-color 0.16s ease, opacity 0.16s ease;
  }

  .editor-resizer:hover::before,
  .editor-resizer.is-active::before,
  .preview-resizer:hover::before,
  .preview-resizer.is-active::before {
    background: color-mix(in srgb, var(--wa-color-brand-border-loud) 72%, transparent);
    opacity: 0.96;
  }

  .editable-layout {
    display: grid;
    grid-template-rows: auto auto;
    min-block-size: 0;
  }

  .editable-preview {
    min-width: 0;
    block-size: var(--demo-preview-height, 320px);
    min-block-size: 220px;
    margin-bottom: 0.875rem;
  }

  :host([fill-height]) .editable-layout {
    min-block-size: inherit;
    grid-template-rows: auto minmax(0, 1fr);
  }

  :host([fill-height]) .editable-preview {
    block-size: var(--demo-preview-height, auto);
    min-block-size: 220px;
    margin-bottom: 0;
  }

  .editable-preview .pane {
    min-height: 0;
    block-size: 100%;
  }

  .editable-preview .pane-content {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    min-block-size: 0;
    overflow: hidden;
  }

  .editable-preview .output-container,
  .editable-preview .error {
    flex: 1 1 auto;
    min-inline-size: 0;
    min-height: 0;
    min-block-size: 0;
    block-size: auto;
    margin: 0;
    overflow-x: auto;
    overflow-y: auto;
  }

  :host(:not([readonly]):not([editor-open])) .editable-preview .pane-content {
    padding-top: 0.25rem;
  }

  :host(:not([readonly]):not([editor-open])) .editable-preview .output-container,
  :host(:not([readonly]):not([editor-open])) .editable-preview .error {
    margin-top: 0;
  }

  :host(:not([readonly])) .editor-panel:not([open]) {
    border-bottom: 0;
  }

  :host([fill-height]) .editor-panel-content {
    max-block-size: min(var(--demo-editor-height, 220px), 48dvh);
  }

  .tabs-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0.625rem;
    border-bottom: 1px solid var(--demo-surface-border-subtle);
    background: var(--demo-toolbar-bg);
  }

  .tab-btn {
    appearance: none;
    border: 1px solid var(--demo-surface-border);
    background: var(--demo-surface-bg);
    color: var(--wa-color-neutral-800);
    border-radius: var(--wa-border-radius-s);
    font: inherit;
    font-size: var(--wa-font-size-xs);
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
    :host([fill-height]) {
      min-block-size: var(--demo-pane-height, calc(100dvh - var(--site-header-scroll-offset, 72px) - 1rem));
    }

    .pane-split {
      display: none;
    }

    .editor-panel-content {
      padding: 0.5rem 0.625rem 0.625rem;
    }

    :host([fill-height]) .editor-panel-content {
      max-block-size: 42dvh;
    }

    .editor-split {
      min-block-size: 120px;
    }

    .tabs-toolbar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.375rem;
      padding: 0.5rem;
      border-bottom: 1px solid var(--demo-surface-border-subtle);
      background: var(--demo-toolbar-bg);
    }

    .tab-btn {
      font-size: var(--wa-font-size-xs);
      padding: 0.4375rem 0.5rem;
    }
  }
`
