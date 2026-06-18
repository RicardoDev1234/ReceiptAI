const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  'rrow.innerHTML=`<div class="rcpt-ico" style="background:var(--gold-dim)">🧾</div><div class="rcpt-info">',
  'rrow.innerHTML=`${vendorLogoHtml(exp.vendor,48)}<div class="rcpt-info">'
);

fs.writeFileSync('index.html', c);
console.log('Done');
