const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "  const uname = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'My Account';",
  "  const uname = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.raw_user_meta_data?.full_name || currentUser?.email?.split('@')[0] || 'My Account';"
);

c = c.replace(
  "    expenses = []; setUserPlan('free');",
  "    expenses = []; setUserPlan('free');\n    const _uname = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'My Account';\n    const _uel = document.getElementById('sidebar-username');\n    if(_uel) _uel.textContent = 'Welcome, ' + _uname;"
);

fs.writeFileSync('index.html', c);
console.log('Done');
