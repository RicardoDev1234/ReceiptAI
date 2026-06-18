const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `font-family: 'Inter', 'SF Pro Display', sans-serif;
  font-size: 22px; font-weight: 700; letter-spacing: 0.3px;`,
  `font-family: 'Montserrat', sans-serif;
  font-size: 22px; font-weight: 800; letter-spacing: 1px;`
);

fs.writeFileSync('index.html', c);
console.log('Done');
