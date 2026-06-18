const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `  img.onerror = function() {
    div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:'+(size*0.4)+'px;color:#c9a84c;">'+initial+'</div>';
  };`,
  `  img.onerror = function() {
    div.style.background = '#1e1e1e';
    div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;font-size:'+(size*0.45)+'px;color:#c9a84c;font-family:Montserrat,sans-serif;">'+initial+'</div>';
  };
  img.onload = function() {
    if(img.naturalWidth === 0 || img.naturalHeight === 0) {
      div.style.background = '#1e1e1e';
      div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;font-size:'+(size*0.45)+'px;color:#c9a84c;font-family:Montserrat,sans-serif;">'+initial+'</div>';
    }
  };`
);

fs.writeFileSync('index.html', c);
console.log('Done');
