const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '${vendorLogoHtml(exp.vendor,40)}',
  '${vendorLogoHtml(exp.vendor,48)}'
);

c = c.replace(
  '${vendorLogoHtml(exp.vendor)}',
  '${vendorLogoHtml(exp.vendor,48)}'
);

fs.writeFileSync('index.html', c);
console.log('Done');
