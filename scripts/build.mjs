import { mkdirSync, rmSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'script.js', '_headers', 'favicon.svg', 'og-image.svg', 'og-image.png', 'llms.txt', 'robots.txt', 'sitemap.xml'];
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of files) copyFileSync(path.join(root, file), path.join(out, file));
console.log(`Static build complete: ${files.length} files in dist/ (${files.reduce((sum, f) => sum + statSync(path.join(out, f)).size, 0)} bytes).`);
