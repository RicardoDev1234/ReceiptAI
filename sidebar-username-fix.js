const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Update sidebar HTML - replace ReceiptAI brand with username display
c = c.replace(
  '      <div class="sidebar-brand">\r\n        <div class="sidebar-brand-name">ReceiptAI</div>\r\n        <div class="sidebar-brand-tag" id="sidebar-username">Smart Expense Tracker</div>\r\n      </div>',
  '      <div class="sidebar-brand">\r\n        <div class="sidebar-brand-name" id="sidebar-username" style="font-size:16px;font-family:Montserrat,sans-serif;">My Account</div>\r\n        <div class="sidebar-brand-tag">Welcome back</div>\r\n      </div>'
);

// Update CSS for username
c = c.replace(
  '.sidebar-brand-name {\r\n  font-family: \'Playfair Display\', serif; font-size: 18px; font-weight: 900;\r\n  background: linear-gradient(135deg, var(--gold), var(--gold2));\r\n  -webkit-background-clip: text; -webkit-text-fill-color: transparent;\r\n}',
  '.sidebar-brand-name {\r\n  font-family: \'Montserrat\', sans-serif; font-size: 15px; font-weight: 700;\r\n  background: linear-gradient(135deg, var(--gold), var(--gold2));\r\n  -webkit-background-clip: text; -webkit-text-fill-color: transparent;\r\n}'
);

fs.writeFileSync('index.html', c);
console.log('Done');
