const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '<link href="https://fonts.googleapis.com',
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">\n  <link href="https://fonts.googleapis.com'
);

fs.writeFileSync('index.html', c);
console.log('Done');
