const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "img.style.cssText = 'width:85%;height:85%;object-fit:contain;';",
  "img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
