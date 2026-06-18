const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `<div class="stat"><div class="stat-num">Instant</div><div class="stat-label">Receipt scanning</div></div>
      <div class="stat"><div class="stat-num">24/7</div><div class="stat-label">Always available</div></div>
      <div class="stat"><div class="stat-num">$0</div><div class="stat-label">To get started</div></div>
      <div class="stat"><div class="stat-num">100%</div><div class="stat-label">Private & secure</div></div>`,
  `<div class="stat"><div class="stat-num">$0</div><div class="stat-label">To get started</div></div>
      <div class="stat"><div class="stat-num">Instant</div><div class="stat-label">Receipt scanning</div></div>
      <div class="stat"><div class="stat-num">100%</div><div class="stat-label">Private & secure</div></div>`
);

fs.writeFileSync('index.html', c);
console.log('Done');
