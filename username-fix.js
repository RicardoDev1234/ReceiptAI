const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "    if(data?.plan==='pro') setUserPlan('pro');\r\n    if(data?.country){userCountry=data.country;applyTaxVisibility();}\r\n  } catch(e) { console.warn('[loadUserProfile]', e.message); }",
  "    if(data?.plan==='pro') setUserPlan('pro');\r\n    if(data?.country){userCountry=data.country;applyTaxVisibility();}\r\n  } catch(e) { console.warn('[loadUserProfile]', e.message); }\r\n  // Show username in sidebar\r\n  const uname = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'My Account';\r\n  const el = document.getElementById('sidebar-username');\r\n  if(el) el.textContent = 'Welcome, ' + uname;"
);

fs.writeFileSync('index.html', c);
console.log('Done');
