import type { Plugin } from 'vite';

export function stripCrossoriginPlugin(): Plugin {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html: string) {
      // Itch.io sandbox blocks resources with crossorigin attributes.
      // Strips crossorigin attribute and any assigned values cleanly.
      return html.replace(/\s*crossorigin(?:=".*?")?/gi, '');
    }
  };
}
