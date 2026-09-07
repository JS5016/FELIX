/* Inlines the CSS and JS into a single openable HTML file.
 * Usage: node build-standalone.js   →   felix-standalone.html
 */
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, p), 'utf8');

// Escaping "</script" keeps an inlined string from closing the tag early.
const safe = s => s.replace(/<\/script/gi, '<\\/script');

const SCRIPTS = ['assets/script-data.js', 'assets/voice.js', 'assets/app.js'];

let html = read('index.html').replace(
  '<link rel="stylesheet" href="assets/styles.css" />',
  '<style>\n' + read('assets/styles.css') + '\n</style>'
);

for (const src of SCRIPTS) {
  const tag = `<script src="${src}"></script>`;
  if (!html.includes(tag)) throw new Error(`index.html has no <script> tag for ${src}`);
  html = html.replace(tag, '<script>\n' + safe(read(src)) + '\n</script>');
}

// Only a surviving href/src matters; the word "assets/" inside a code comment is fine.
if (/(?:href|src)\s*=\s*["']assets\//i.test(html)) {
  console.error('Warning: an assets/ link survived — check the tags in index.html.');
  process.exitCode = 1;
}

fs.writeFileSync(path.join(__dirname, 'felix-standalone.html'), html);
console.log('Wrote felix-standalone.html (' + Math.round(html.length / 1024) + ' KB)');
