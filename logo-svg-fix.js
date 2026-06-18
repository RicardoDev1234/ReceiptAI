const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(
  /<div class="nav-logo"[^>]*>.*?<\/div>/,
  '<div class="nav-logo" onclick="showPage(\'landing\')" style="display:flex;align-items:center;cursor:pointer"><img src="logo.svg" alt="ReceiptAI" style="height:44px;width:auto;"></div>'
);
fs.writeFileSync('index.html', c);
console.log('Done');
