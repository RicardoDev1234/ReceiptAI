const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(
  "img.src = 'https://logo.clearbit.com/' + domain;",
  "img.src = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';"
);
fs.writeFileSync('index.html', c);
console.log('Done');
