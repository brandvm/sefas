
(() => {
  const repair = (root) => {
    const buttons = root.matches?.('button.iubenda-tp-btn')
      ? [root]
      : (root.querySelectorAll?.('button.iubenda-tp-btn') || []);
    for (const button of buttons) {
      const label = button.querySelector(':scope > label.iub-sr-only');
      if (!label) continue;
      const span = document.createElement('span');
      for (const attribute of label.attributes) span.setAttribute(attribute.name, attribute.value);
      span.textContent = label.textContent;
      label.replaceWith(span);
    }
    if (root.matches?.('label.iub-sr-only') && root.parentElement?.matches('button.iubenda-tp-btn')) {
      const span = document.createElement('span');
      for (const attribute of root.attributes) span.setAttribute(attribute.name, attribute.value);
      span.textContent = root.textContent;
      root.replaceWith(span);
    }
  };
  repair(document);
  new MutationObserver((changes) => {
    for (const change of changes) {
      for (const node of change.addedNodes) if (node.nodeType === 1) repair(node);
    }
  }).observe(document.documentElement, {childList: true, subtree: true});
})();
