const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '<div class="stat"><div class="stat-num">GPT-4o</div><div class="stat-label">AI engine powering scans</div></div>',
  '<div class="stat"><div class="stat-num" style="font-family:\'Inter\',\'SF Pro Display\',sans-serif;font-size:28px;letter-spacing:-0.5px">GPT-4o</div><div class="stat-label">AI engine powering scans</div></div>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
