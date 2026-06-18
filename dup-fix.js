const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "  // Clear existing before reload to prevent duplicates\r\n  expenses = [];\r\n  document.getElementById('expenses-empty')?.remove();\r\n  document.getElementById('recent-empty')?.remove();\r\n  const tbody=document.getElementById('expenses-tbody');\r\n  const recentList=document.getElementById('recent-list');",
  "  // Clear existing before reload to prevent duplicates\r\n  expenses = [];\r\n  document.getElementById('expenses-empty')?.remove();\r\n  document.getElementById('recent-empty')?.remove();\r\n  const tbody=document.getElementById('expenses-tbody');\r\n  if(tbody) tbody.innerHTML = '';\r\n  const recentList=document.getElementById('recent-list');\r\n  if(recentList) recentList.innerHTML = '';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
