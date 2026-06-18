const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

const logoHelper = `
function getVendorDomain(vendor) {
  const map = {
    'kfc': 'kfc.com', 'mcdonald': 'mcdonalds.com', 'starbucks': 'starbucks.com',
    'subway': 'subway.com', 'pizza hut': 'pizzahut.com', 'burger king': 'burgerking.com',
    'cheesecake factory': 'thecheesecakefactory.com', 'nando': 'nandos.com',
    'costa': 'costa.co.uk', 'ikea': 'ikea.com', 'amazon': 'amazon.com',
    'apple': 'apple.com', 'google': 'google.com', 'netflix': 'netflix.com',
    'spotify': 'spotify.com', 'noon': 'noon.com', 'carrefour': 'carrefour.com',
    'lulu': 'luluhypermarket.com', 'domino': 'dominos.com', 'walmart': 'walmart.com',
    'uber': 'uber.com', 'airbnb': 'airbnb.com', 'booking': 'booking.com',
  };
  const lower = vendor.toLowerCase();
  for (const [key, domain] of Object.entries(map)) {
    if (lower.includes(key)) return domain;
  }
  return lower.replace(/[^a-z0-9]/g, '').slice(0, 20) + '.com';
}
function vendorLogoHtml(vendor, size=36) {
  const domain = getVendorDomain(vendor);
  const initial = vendor.charAt(0).toUpperCase();
  const color = '#c9a84c';
  return '<div style="width:'+size+'px;height:'+size+'px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;"><img src="https://logo.clearbit.com/'+domain+'" style="width:100%;height:100%;object-fit:contain;padding:4px;" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\';"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-weight:700;font-size:'+(size*0.4)+'px;color:'+color+';">'+initial+'</div></div>';
}
`;

c = c.replace('async function loadExpenses()', logoHelper + 'async function loadExpenses()');

c = c.replace(
  'rrow.innerHTML=`<div class="rcpt-ico" style="background:var(--gold-dim)">🧾</div>',
  'rrow.innerHTML=`${vendorLogoHtml(exp.vendor)}'
);

c = c.replace(
  'row.innerHTML=`<td><div class="exp-vendor">${esc(exp.vendor)}</div><span class="tag tg">${esc(exp.category)}</span></td>',
  'row.innerHTML=`<td><div style="display:flex;align-items:center;gap:10px;">${vendorLogoHtml(exp.vendor,40)}<div><div class="exp-vendor">${esc(exp.vendor)}</div><span class="tag tg">${esc(exp.category)}</span></div></div></td>'
);

c = c.replace(
  'tr.innerHTML=`<td><div class="exp-vendor">${esc(exp.vendor)}</div><span class="tag tg">${esc(exp.category)}</span></td>',
  'tr.innerHTML=`<td><div style="display:flex;align-items:center;gap:10px;">${vendorLogoHtml(exp.vendor,40)}<div><div class="exp-vendor">${esc(exp.vendor)}</div><span class="tag tg">${esc(exp.category)}</span></div></div></td>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
