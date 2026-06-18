const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "div.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:12px;overflow:hidden;flex-shrink:0;background:#ffffff;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';",
  "div.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:12px;overflow:hidden;flex-shrink:0;background:#1e1e1e;border:1px solid rgba(201,168,76,0.2);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.4);';"
);

c = c.replace(
  "img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:6px;';",
  "img.style.cssText = 'width:85%;height:85%;object-fit:contain;';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
