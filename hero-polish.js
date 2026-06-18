const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix hero padding - less top space
c = c.replace(
  'padding: 72px 24px 60px; position: relative; overflow: hidden;',
  'padding: 40px 24px 60px; position: relative; overflow: hidden;'
);

// Change headline font to Montserrat
c = c.replace(
  `.hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(40px, 7.5vw, 80px);
  font-weight: 900; line-height: 1.03;
  letter-spacing: -2.5px; margin-bottom: 26px; max-width: 820px;
}`,
  `.hero h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(36px, 6.5vw, 72px);
  font-weight: 800; line-height: 1.08;
  letter-spacing: -1.5px; margin-bottom: 26px; max-width: 820px;
}`
);

// Bigger subtitle
c = c.replace(
  `.hero > p {
  font-size: 18px; color: var(--white2); max-width: 500px;
  line-height: 1.65; margin-bottom: 44px; font-weight: 300;
}`,
  `.hero > p {
  font-size: 19px; color: rgba(255,255,255,0.65); max-width: 520px;
  line-height: 1.75; margin-bottom: 44px; font-weight: 300;
}`
);

// Fix green glow to gold
c = c.replace(
  'background: radial-gradient(circle, #2EAD2214 0%, transparent 68%);',
  'background: radial-gradient(circle, #c9a84c0e 0%, transparent 68%);'
);

fs.writeFileSync('index.html', c);
console.log('Done');
