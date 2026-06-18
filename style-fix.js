const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Replace stat styles
c = c.replace(
  `.stats-row {
  display: flex; gap: 52px; flex-wrap: wrap;
  justify-content: center; margin-bottom: 0;
}
.stat { text-align: center; }
.stat-num {
  font-family: 'Playfair Display', serif;
  font-size: 38px; font-weight: 900; color: var(--gold);
}
.stat-label { font-size: 12.5px; color: var(--white3); margin-top: 5px; font-weight: 400; }`,
  `.stats-row {
  display: flex; gap: 40px; flex-wrap: wrap;
  justify-content: center; margin-bottom: 0;
}
.stat {
  text-align: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 16px;
  padding: 20px 28px;
  min-width: 120px;
  transition: border-color 0.2s;
}
.stat:hover { border-color: rgba(201,168,76,0.4); }
.stat-num {
  font-family: 'Playfair Display', serif;
  font-size: 34px; font-weight: 900;
  background: linear-gradient(135deg, #c9a84c, #e8c96a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}
.stat-label {
  font-size: 11.5px;
  color: rgba(255,255,255,0.5);
  margin-top: 6px;
  font-weight: 500;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}`
);

// Improve subtitle
c = c.replace(
  '<p>Snap a photo. Let AI do the rest. Track every expense automatically, generate tax-ready reports, and never miss a deduction again.</p>',
  '<p style="font-size:17px;line-height:1.75;color:rgba(255,255,255,0.6);max-width:520px;margin:0 auto 32px;font-weight:300;letter-spacing:0.1px">Snap a photo. Let AI do the rest. Track every expense automatically, generate tax-ready reports, and never miss a deduction again.</p>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
