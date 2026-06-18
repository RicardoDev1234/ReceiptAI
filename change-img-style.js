const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  'style="width:100%;padding:10px;font-size:13px;border:1px solid rgba(201,168,76,0.3);border-radius:11px;cursor:pointer;background:transparent;color:#c9a84c;margin-bottom:10px;">&#8592; Change Image</button>',
  'style="width:100%;padding:12px;font-size:14px;font-weight:600;border:1.5px solid rgba(201,168,76,0.5);border-radius:11px;cursor:pointer;background:rgba(201,168,76,0.08);color:#c9a84c;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;" onmouseover="this.style.background=\'rgba(201,168,76,0.15)\'" onmouseout="this.style.background=\'rgba(201,168,76,0.08)\'"><i class="ti ti-photo-edit" style="font-size:16px"></i> Change Image</button>'
);

fs.writeFileSync('index.html', c);
console.log('Done');
