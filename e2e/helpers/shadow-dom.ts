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
`;
