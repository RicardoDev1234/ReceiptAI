const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix 1: Clear expenses and plan on SIGNED_IN before loading new ones
c = c.replace(
  "      if(event==='SIGNED_IN' && session?.user && !isCheckoutSuccess){\r\n        const onAppPage = document.getElementById('page-app')?.classList.contains('active');\r\n        if(!onAppPage){\r\n          await loadUserProfile();\r\n          await loadExpenses();\r\n          showApp();\r\n          applyAdminVisibility();\r\n        }\r\n      }",
  "      if(event==='SIGNED_IN' && session?.user && !isCheckoutSuccess){\r\n        const onAppPage = document.getElementById('page-app')?.classList.contains('active');\r\n        if(!onAppPage){\r\n          expenses=[]; setUserPlan('free');\r\n          const tb=document.getElementById('expenses-tbody'); if(tb) tb.innerHTML='';\r\n          const rl=document.getElementById('recent-list'); if(rl) rl.innerHTML='';\r\n          try { await loadUserProfile(); } catch(e) {}\r\n          try {\r\n            const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});\r\n            if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}\r\n          } catch(e) {}\r\n          try { await loadExpenses(); } catch(e) {}\r\n          showApp();\r\n          applyAdminVisibility();\r\n        }\r\n      }"
);

// Fix 2: Replace Smart Expense Tracker with username
c = c.replace(
  '<div class="sidebar-brand-tag">Smart Expense Tracker</div>',
  '<div class="sidebar-brand-tag" id="sidebar-username">Smart Expense Tracker</div>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
