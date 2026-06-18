const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  "img.onerror = function() {\r\n    div.innerHTML = '<div style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:'+(size*0.4)+'px;color:#c9a84c;\">'+initial+'</div>';\r\n  };",
  "img.onerror = function() {\r\n    div.style.background = '#1e1e1e';\r\n    div.innerHTML = '<div style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;font-size:'+(size*0.45)+'px;color:#c9a84c;\">'+initial+'</div>';\r\n  };\r\n  img.onload = function() {\r\n    if(this.naturalWidth < 10) {\r\n      div.style.background = '#1e1e1e';\r\n      div.innerHTML = '<div style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;font-size:'+(size*0.45)+'px;color:#c9a84c;\">'+initial+'</div>';\r\n    }\r\n  };"
);

fs.writeFileSync('index.html', c);
console.log('Done:', c.includes('naturalWidth') ? 'YES' : 'NO');
