const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace('--black:  #0f0f1a;', '--black:  #111827;');
c = c.replace('--black2: #161624;', '--black2: #1f2937;');
c = c.replace('--black3: #1e1e2e;', '--black3: #273141;');
fs.writeFileSync('index.html', c);
console.log('Done');
