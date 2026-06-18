const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "function setUserPlan(plan) {\n  userPlan=plan;",
  "function setUserPlan(plan) {\n  userPlan=plan;\n  const planTag = document.querySelector('.sidebar-brand-tag');\n  if(planTag) planTag.textContent = plan==='pro' ? 'Pro Plan' : 'Free Plan';"
);

fs.writeFileSync('index.html', c);
console.log('Done:', c.includes('planTag.textContent') ? 'YES' : 'NO');
