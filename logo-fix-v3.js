const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

const logoFn = `
function getLogoDomain(vendor) {
  var map = {
    'kfc': 'kfc.com', 'mcdonald': 'mcdonalds.com', 'starbucks': 'starbucks.com',
    'subway': 'subway.com', 'pizza hut': 'pizzahut.com', 'burger king': 'burgerking.com',
    'cheesecake factory': 'thecheesecakefactory.com', 'nando': 'nandos.com',
    'costa': 'costa.co.uk', 'ikea': 'ikea.com', 'amazon': 'amazon.com',
    'apple': 'apple.com', 'netflix': 'netflix.com', 'spotify': 'spotify.com',
    'noon': 'noon.com', 'carrefour': 'carrefour.com', 'uber': 'uber.com',
    'domino': 'dominos.com', 'walmart': 'walmart.com'
  };
  var lower = vendor.toLowerCase();
  for (var key in map) { if (lower.indexOf(key) !== -1) return map[key]; }
  return lower.replace(/[^a-z0-9]/g, '').slice(0, 20) + '.com';
}
function vendorLogoHtml(vendor, size) {
  size = size || 36;
  var domain = getLogoDomain(vendor);
  var initial = vendor.charAt(0).toUpperCase();
  var div = document.createElement('div');
  div.style.cssText = 'width:'+size+'px;height:'+size+'px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;';
  var img = document.createElement('img');
  img.src = 'https://logo.clearbit.com/' + domain;
  img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:4px;';
  img.onerror = function() {
    div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:'+(size*0.4)+'px;color:#c9a84c;">'+initial+'</div>';
  };
  div.appendChild(img);
  return div.outerHTML;
}
`;

c = c.replace('async function loadExpenses()', logoFn + 'async function loadExpenses()');

c = c.replace(
  '<div class="rcpt-ico" style="background:var(--gold-dim)">🧾</div><div class="rcpt-info"><div class="rcpt-name">${esc(exp.vendor)}</div>',
  '${vendorLogoHtml(exp.vendor)}<div class="rcpt-info"><div class="rcpt-name">${esc(exp.vendor)}</div>'
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
