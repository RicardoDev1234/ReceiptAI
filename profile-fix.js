const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `async function loadUserProfile() {
  const client=sb(); if(!client||!currentUser) return;
  const {data}=await client.from('users').select('plan, country').eq('id',currentUser.id).single();
  if(data?.plan==='pro') setUserPlan('pro');
  if(data?.country){userCountry=data.country;applyTaxVisibility();}
}`,
  `async function loadUserProfile() {
  try {
    const client=sb(); if(!client||!currentUser) return;
    const {data}=await client.from('users').select('plan, country').eq('id',currentUser.id).single();
    if(data?.plan==='pro') setUserPlan('pro');
    if(data?.country){userCountry=data.country;applyTaxVisibility();}
  } catch(e) { console.warn('[loadUserProfile]', e.message); }
}`
);

fs.writeFileSync('index.html', c);
console.log('Done');
