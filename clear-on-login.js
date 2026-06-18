const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "    currentUser  = json.user;\r\n    sessionToken = json.session?.access_token || null;",
  "    currentUser  = json.user;\r\n    sessionToken = json.session?.access_token || null;\r\n    expenses = []; setUserPlan('free');\r\n    const tbody=document.getElementById('expenses-tbody'); if(tbody) tbody.innerHTML='';\r\n    const rl=document.getElementById('recent-list'); if(rl) rl.innerHTML='';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
