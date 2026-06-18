const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
`async function loadUserProfile() {
  try {
    const client=sb(); if(!client||!currentUser) return;
    const {data}=await client.from('users').select('plan, country').eq('id',currentUser.id).single();
    if(data?.plan==='pro') setUserPlan('pro');
    if(data?.country){userCountry=data.country;applyTaxVisibility();}
  } catch(e) { console.warn('[loadUserProfile]', e.message); }`,
`async function loadUserProfile() {
  try {
    const client=sb(); if(!client||!currentUser) return;
    const timeout = new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 5000));
    const query = client.from('users').select('plan, country').eq('id',currentUser.id).single();
    const {data} = await Promise.race([query, timeout]);
    if(data?.plan==='pro') setUserPlan('pro');
    if(data?.country){userCountry=data.country;applyTaxVisibility();}
  } catch(e) { console.warn('[loadUserProfile]', e.message); }`
);

fs.writeFileSync('index.html', c);
console.log('Done');
