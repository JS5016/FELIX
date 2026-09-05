/* Inlines the CSS and JS into a single openable HTML file.
 * Usage: node build-standalone.js   →   felix-standalone.html
 */
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, p), 'utf8');

// Escaping "</script" keeps an inlined string from closing the tag early.
const safe = s => s.replace(/<\/script/gi, '<\\/script');

const html = read('index.html')
  .replace(
    '<link rel="stylesheet" href="assets/styles.css" />',
    '<style>\n' + read('assets/styles.css') + '\n</style>'
  )
  .replace(
    '<script src="assets/script-data.js"></script>',
    '<script>\n' + safe(read('assets/script-data.js')) + '\n</script>'
  )
  .replace(
    '<script src="assets/app.js"></script>',
    '<script>\n' + safe(read('assets/app.js')) + '\n</script>'
  );

// Only a surviving href/src matters; the word "assets/" inside a code comment is fine.
if (/(?:href|src)\s*=\s*["']assets\//i.test(html)) {
  console.error('Warning: an assets/ link survived — check the tags in index.html.');
  process.exitCode = 1;
}

fs.writeFileSync(path.join(__dirname, 'felix-standalone.html'), html);
console.log('Wrote felix-standalone.html (' + Math.round(html.length / 1024) + ' KB)');
