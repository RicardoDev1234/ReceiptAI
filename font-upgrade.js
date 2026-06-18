const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
`.nav-logo {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 900; letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--gold), var(--gold2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  cursor: pointer; user-select: none;
}
.nav-logo em { font-style: normal; -webkit-text-fill-color: var(--green); }`,
`.nav-logo {
  font-family: 'Playfair Display', serif;
  font-size: 24px; font-weight: 900; letter-spacing: 0.5px;
  color: #f5f0e8;
  -webkit-text-fill-color: #f5f0e8;
  cursor: pointer; user-select: none;
}
.nav-logo em { font-style: normal; -webkit-text-fill-color: #c9a84c; color: #c9a84c; letter-spacing: 1px; }`
);

fs.writeFileSync('index.html', c);
console.log('Done');
