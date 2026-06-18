const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
`if(currentUser){
        showApp();applyAdminVisibility();
        try { await loadUserProfile(); } catch(e) {}
        try { await loadExpenses(); } catch(e) {}
        try {
          const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});
          if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}
        } catch(e) {}
      }`,
`if(currentUser){
        showApp();applyAdminVisibility();
        try { await loadUserProfile(); } catch(e) {}
        try {
          const sr=await fetch(RAIL+'/api/subscription-status',{headers:{'Authorization':'Bearer '+sessionToken}});
          if(sr.ok){const sd=await sr.json();if(sd.active)setUserPlan('pro');}
        } catch(e) {}
        try { await loadExpenses(); } catch(e) {}
      }`
);

fs.writeFileSync('index.html', c);
console.log('Done');
