const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(/--green:\s*#2EAD22;/, '--green: #c9a84c;');
c = c.replace(/--green2:\s*#26921C;/, '--green2: #b8964a;');
c = c.replace(/--green-dim:\s*#2EAD221A;/, '--green-dim: #c9a84c1A;');
c = c.replace(/--green-glow:\s*#2EAD2233;/, '--green-glow: #c9a84c33;');
c = c.replace(/#2EAD2240/g, '#c9a84c40');
c = c.replace(/#2EAD2250/g, '#c9a84c50');

fs.writeFileSync('index.html', c);
console.log('Done');
