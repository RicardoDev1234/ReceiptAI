const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace('<div class="auth-icon">🔐</div>', '<div class="auth-icon"><i class="ti ti-lock" style="font-size:28px;color:#c9a84c"></i></div>');
c = c.replace('<div class="auth-icon">✨</div>', '<div class="auth-icon"><i class="ti ti-sparkles" style="font-size:28px;color:#c9a84c"></i></div>');
c = c.replace('<span class="si-icon">📊</span>', '<span class="si-icon"><i class="ti ti-layout-dashboard"></i></span>');
c = c.replace('<span class="si-icon">📸</span>', '<span class="si-icon"><i class="ti ti-camera"></i></span>');
c = c.replace('<span class="si-icon">🗂</span>', '<span class="si-icon"><i class="ti ti-files"></i></span>');
c = c.replace('<span class="si-icon">📄</span>', '<span class="si-icon"><i class="ti ti-chart-bar"></i></span>');
c = c.replace('<span class="si-icon">✦</span>', '<span class="si-icon"><i class="ti ti-crown"></i></span>');
c = c.replace('<span class="si-icon">⚙️</span>', '<span class="si-icon"><i class="ti ti-settings"></i></span>');
c = c.replace('<span class="si-icon">🚪</span>', '<span class="si-icon"><i class="ti ti-logout"></i></span>');
c = c.replace('>⚙ Admin<', '> Admin<');
c = c.replace('>✨ Analyze with AI<', '><i class="ti ti-wand" style="margin-right:6px"></i> Analyze with AI<');

fs.writeFileSync('index.html', c);
console.log('Done');
