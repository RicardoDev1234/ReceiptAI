const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Fix 1: Manual login flow
c = c.replace(
  `    hideLoading(); applyAdminVisibility();
    try { await loadUserProfile(); } catch(e) {}
    try { await loadExpenses(); } catch(e) {}
    showApp();`,
  `    hideLoading(); applyAdminVisibility();
    try { await loadUserProfile(); } catch(e) {}
    try {
      const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});
      if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}
    } catch(e) {}
    try { await loadExpenses(); } catch(e) {}
    showApp();`
);

// Fix 2: Auto-login on page load - move showApp to after everything loads
c = c.replace(
  `      if(currentUser){
        showApp();applyAdminVisibility();
        try { await loadUserProfile(); } catch(e) {}
        try {
          const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});
          if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}
        } catch(e) {}
        try { await loadExpenses(); } catch(e) {}
      }`,
  `      if(currentUser){
        try { await loadUserProfile(); } catch(e) {}
        try {
          const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});
          if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}
        } catch(e) {}
        try { await loadExpenses(); } catch(e) {}
        showApp();applyAdminVisibility();
      }`
);

fs.writeFileSync('index.html', c);
console.log('Done');
