// Helper script to find autosnooze-card through nested shadow DOMs
// This is needed because Lovelace sections/grids wrap cards in additional shadow roots
export const findCardScript = `
  function findAutosnoozeCard() {
    const findCard = (root) => {
      const card = root.querySelector('autosnooze-card');
      if (card) return card;
      const elements = root.querySelectorAll('*');
      for (const el of elements) {
        if (el.shadowRoot) {
          const found = findCard(el.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    };
    return findCard(document);
  }

  function deepQuery(card, selector) {
    if (!card?.shadowRoot) return null;
    let result = card.shadowRoot.querySelector(selector);
    if (result) return result;
    const children = card.shadowRoot.querySelectorAll('*');
    for (const child of children) {
      if (child.shadowRoot) {
        result = child.shadowRoot.querySelector(selector);
        if (result) return result;
      }
    }
    return null;
  }

  function deepQueryAll(card, selector) {
    const results = [];
    if (!card?.shadowRoot) return results;
    results.push(...card.shadowRoot.querySelectorAll(selector));
    const children = card.shadowRoot.querySelectorAll('*');
    for (const child of children) {
      if (child.shadowRoot) {
        results.push(...child.shadowRoot.querySelectorAll(selector));
      }
    }
    return results;
  }
`;
