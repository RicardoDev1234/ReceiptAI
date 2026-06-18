const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace('--black:  #080808;', '--black:  #0f0f1a;');
c = c.replace('--black2: #111111;', '--black2: #161624;');
c = c.replace('--black3: #191919;', '--black3: #1e1e2e;');

fs.writeFileSync('index.html', c);
console.log('Done');
