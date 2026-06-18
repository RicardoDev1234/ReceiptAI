const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "img.src = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';",
  "img.src = 'https://cdn.brandfetch.io/' + domain + '/w/400/h/400?c=1idDcGXFw96jPJMhTBG';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
