const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `font-family: 'Playfair Display', serif;
  font-size: 24px; font-weight: 900; letter-spacing: 0.5px;`,
  `font-family: 'Inter', 'SF Pro Display', sans-serif;
  font-size: 22px; font-weight: 700; letter-spacing: 0.3px;`
);

fs.writeFileSync('index.html', c);
console.log('Done');
