const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix border radius to be more rounded
c = c.replace(
  "border-radius:12px;overflow:hidden;flex-shrink:0;background:#1e1e1e;",
  "border-radius:14px;overflow:hidden;flex-shrink:0;background:#1e1e1e;"
);

// Fix currency format - always currency then amount
c = c.replace(
  "amount:row.amount!=null?'$'+parseFloat(row.amount).toFixed(2):'$0.00'",
  "amount:row.amount!=null?(row.currency&&row.currency!=='USD'?row.currency+' ':'')+parseFloat(row.amount).toFixed(2):'0.00'"
);

fs.writeFileSync('index.html', c);
console.log('Done');
