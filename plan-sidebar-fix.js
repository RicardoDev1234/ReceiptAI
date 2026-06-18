const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "function setUserPlan(plan) {\r\n  userPlan=plan;",
  "function setUserPlan(plan) {\r\n  userPlan=plan;\r\n  const planTag = document.querySelector('.sidebar-brand-tag');\r\n  if(planTag) planTag.textContent = plan==='pro' ? 'Pro Plan' : 'Free Plan';"
);

fs.writeFileSync('index.html', c);
console.log('Done');
