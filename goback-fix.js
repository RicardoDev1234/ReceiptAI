const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  '        <div id="preview-area" style="display:none">\r\n          <img id="preview-img" class="preview-img" src="" alt="Receipt preview"/>\r\n          <button class="btn-gold" onclick="if(userPlan!==\'pro\'){showTrialModal();return;} analyzeReceipt()"',
  '        <div id="preview-area" style="display:none">\r\n          <img id="preview-img" class="preview-img" src="" alt="Receipt preview"/>\r\n          <button onclick="document.getElementById(\'scan-drop\').style.display=\'block\';document.getElementById(\'preview-area\').style.display=\'none\';document.getElementById(\'file-input\').value=\'\';" style="width:100%;padding:10px;font-size:13px;border:1px solid rgba(201,168,76,0.3);border-radius:11px;cursor:pointer;background:transparent;color:#c9a84c;margin-bottom:10px;">&#8592; Change Image</button>\r\n          <button class="btn-gold" onclick="if(userPlan!==\'pro\'){showTrialModal();return;} analyzeReceipt()"'
);

fs.writeFileSync('index.html', c);
console.log('Done');
