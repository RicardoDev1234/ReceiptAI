const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(
  "const res=await fetch(`${RAIL}/api/expenses?t=${Date.now()}`,{headers:{'Authorization':`Bearer ${sessionToken}`,'Cache-Control':'no-cache'}});",
  "const res=await fetch(`${RAIL}/api/expenses`,{headers:{'Authorization':`Bearer ${sessionToken}`}});"
);
fs.writeFileSync('index.html', c);
console.log('Done');
