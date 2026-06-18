const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Less top space
c = c.replace(
  'padding: 40px 24px 60px; position: relative; overflow: hidden;',
  'padding: 20px 24px 60px; position: relative; overflow: hidden;'
);

// Fix Instant stat font to match others
c = c.replace(
  '<div class="stat-num">Instant</div>',
  '<div class="stat-num" style="font-family:\'Montserrat\',sans-serif;font-size:26px;">Instant</div>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
