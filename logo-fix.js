const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '<div class="nav-logo" onclick="showPage(\'landing\')">Receipt<em>AI</em></div>',
  '<div class="nav-logo" onclick="showPage(\'landing\')" style="display:flex;align-items:center;gap:8px;cursor:pointer"><img src="logo.png" alt="ReceiptAI" style="height:36px;width:auto;">Receipt<em>AI</em></div>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
