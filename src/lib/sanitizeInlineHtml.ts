const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'BR'])
const BLOCK_TAGS = new Set(['DIV', 'P'])

export function sanitizeInlineHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  function clean(node: Node) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) continue

      if (child.nodeType !== Node.ELEMENT_NODE || !ALLOWED_TAGS.has((child as Element).tagName)) {
        const el = child as Element
        const replacement = document.createDocumentFragment()
        // Browsers wrap each line in its own <div>/<p> instead of separating
        // them with <br>. Preserve that line break when unwrapping.
        if (el.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(el.tagName) && child.previousSibling) {
          replacement.append(document.createElement('br'))
        }
        replacement.append(...Array.from(child.childNodes))
        node.replaceChild(replacement, child)
        clean(node)
        return
      }

      const el = child as Element
      for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name)
      clean(el)
    }
  }

  clean(doc.body)
  return doc.body.innerHTML
}
