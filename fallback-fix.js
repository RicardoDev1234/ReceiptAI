const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';",
  "img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:8px;';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
