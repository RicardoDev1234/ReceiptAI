const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '.sidebar-item .si-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }',
  '.sidebar-item .si-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; color: #c9a84c; }\n.sidebar-item.active .si-icon { color: #c9a84c; }\n.sidebar-item:hover .si-icon { color: #e8c96a; }'
);

fs.writeFileSync('index.html', c);
console.log('Done');
