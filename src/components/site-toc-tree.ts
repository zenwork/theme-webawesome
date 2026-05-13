import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

class SiteTocTree extends LitElement {
  @property({ type: String, attribute: 'storage-key' })
  storageKey = 'site-toc-expanded-v1'
  private isHydrating = true

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    queueMicrotask(() => {
      this.applyPersistedState()
      this.syncSelectedItem()
      this.addEventListener('wa-expand', this.handleTreeChange as EventListener)
      this.addEventListener('wa-collapse', this.handleTreeChange as EventListener)
      this.addEventListener('wa-selection-change', this.handleSelectionChange as EventListener)
      this.addEventListener('click', this.handleClick)
      requestAnimationFrame(() => {
        this.isHydrating = false
      })
    })
  }

  override disconnectedCallback(): void {
    this.removeEventListener('wa-expand', this.handleTreeChange as EventListener)
    this.removeEventListener('wa-collapse', this.handleTreeChange as EventListener)
    this.removeEventListener('wa-selection-change', this.handleSelectionChange as EventListener)
    this.removeEventListener('click', this.handleClick)
    super.disconnectedCallback()
  }

  private handleTreeChange = (): void => {
    this.persistExpandedState()
  }

  private handleSelectionChange = (): void => {
    if (this.isHydrating) {
      return
    }

    const selectedItems = this.getSelectedItems()
    const selected = selectedItems[selectedItems.length - 1]
    if (!selected) {
      return
    }

    const link = selected.querySelector<HTMLAnchorElement>(':scope > a[href]')
    if (!link) {
      return
    }

    const destination = new URL(link.href, window.location.origin)
    const current = new URL(window.location.href)
    if (destination.pathname === current.pathname && destination.hash === current.hash) {
      return
    }

    this.persistExpandedState()
    window.location.assign(destination.href)
  }

  private handleClick = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const link = target.closest('a[href]')
    if (link) {
      this.persistExpandedState()
      return
    }

    const item = this.findTreeItemFromEvent(event)
    if (!item) {
      return
    }

    const itemLink = item.querySelector<HTMLAnchorElement>(':scope > a[href]')
    if (!itemLink) {
      return
    }

    this.persistExpandedState()
    window.location.assign(itemLink.href)
  }

  private syncSelectedItem(): void {
    const currentPath = this.normalizePath(window.location.pathname)
    for (const node of this.querySelectorAll<HTMLElement>('wa-tree-item')) {
      const link = node.querySelector<HTMLAnchorElement>(':scope > a[href]')
      if (!link) {
        node.removeAttribute('selected')
        continue
      }
      const linkPath = this.normalizePath(new URL(link.href, window.location.origin).pathname)
      if (linkPath === currentPath) {
        node.setAttribute('selected', '')
      } else {
        node.removeAttribute('selected')
      }
    }
  }

  private normalizePath(path: string): string {
    if (!path) return '/'
    const normalized = path.endsWith('/') ? path : `${path}/`
    return normalized.replace(/\/+/g, '/')
  }

  private getSelectedItems(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('wa-tree-item')]
      .filter((node) => Boolean((node as HTMLElement & { selected?: boolean }).selected))
  }

  private findTreeItemFromEvent(event: Event): HTMLElement | null {
    const path = event.composedPath()
    for (const entry of path) {
      if (entry instanceof HTMLElement && entry.tagName.toLowerCase() === 'wa-tree-item') {
        return entry
      }
    }
    return null
  }

  private readPersistedKeys(): string[] | null {
    const raw = localStorage.getItem(this.storageKey)
    if (raw === null) {
      return null
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
    } catch {
      return []
    }
  }

  private applyPersistedState(): void {
    const persistedKeys = this.readPersistedKeys()
    if (persistedKeys === null) {
      return
    }

    const expanded = new Set(persistedKeys)
    for (const node of this.querySelectorAll<HTMLElement>('wa-tree-item[data-node-key]')) {
      const key = node.getAttribute('data-node-key')
      if (!key) continue
      ;(node as HTMLElement & { expanded?: boolean }).expanded = expanded.has(key)
    }
  }

  private persistExpandedState(): void {
    const expandedKeys = [...this.querySelectorAll<HTMLElement>('wa-tree-item[data-node-key]')]
      .filter((node) => Boolean((node as HTMLElement & { expanded?: boolean }).expanded))
      .map((node) => node.getAttribute('data-node-key'))
      .filter((value): value is string => Boolean(value))
    localStorage.setItem(this.storageKey, JSON.stringify(expandedKeys))
  }
}

if (!customElements.get('site-toc-tree')) {
  customElements.define('site-toc-tree', SiteTocTree)
}
