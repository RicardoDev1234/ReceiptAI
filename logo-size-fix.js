const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "div.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;';",
  "div.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:12px;overflow:hidden;flex-shrink:0;background:#ffffff;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';"
);

c = c.replace(
  "img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:4px;';",
  "img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:6px;';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
