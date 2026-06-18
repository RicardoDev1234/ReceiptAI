const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `.feature-icon {
  width: 48px; height: 48px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin-bottom: 18px;
  background: var(--gold-dim); border: 1px solid var(--border);
}`,
  `.feature-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-bottom: 20px;
  background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25);
  color: #c9a84c;
  transition: background 0.2s, border-color 0.2s;
}
.feature-card:hover .feature-icon {
  background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5);
}`
);

fs.writeFileSync('index.html', c);
console.log('Done');
