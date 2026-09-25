import { mkdirSync, rmSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'script.js', '_headers', '_redirects', 'favicon.svg', 'og-image.svg', 'og-image.png', 'assets/gumlet-speed-architecture.webp', 'assets/og-image.png', 'llms.txt', 'robots.txt', 'sitemap.xml'];
const pages = ['vimeo-alternative/index.html', 'pricing/index.html', 'guide/embed/index.html'];
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of [...files, ...pages]) {
  const destination = path.join(out, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(root, file), destination);
}
const built = [...files, ...pages];
console.log(`Static build complete: ${built.length} files in dist/ (${built.reduce((sum, file) => sum + statSync(path.join(out, file)).size, 0)} bytes).`);
