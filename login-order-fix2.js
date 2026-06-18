const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix 1: Manual login - add subscription check before loadExpenses
c = c.replace(
  "hideLoading(); applyAdminVisibility();\r\n    try { await loadUserProfile(); } catch(e) {}\r\n    try { await loadExpenses(); } catch(e) {}\r\n    showApp();",
  "hideLoading(); applyAdminVisibility();\r\n    try { await loadUserProfile(); } catch(e) {}\r\n    try {\r\n      const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});\r\n      if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}\r\n    } catch(e) {}\r\n    try { await loadExpenses(); } catch(e) {}\r\n    showApp();"
);

fs.writeFileSync('index.html', c);
console.log('Fix 1 done:', c.includes('subscription-status') ? 'YES' : 'NO - not found');
