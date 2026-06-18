const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Hide the hero badge
c = c.replace(
  '.hero-badge {',
  '.hero-badge { display: none !important; } .hero-badge-hidden {'
);

// Replace feature card emojis with Tabler icons
c = c.replace('<div class="feature-icon">📸</div>', '<div class="feature-icon"><i class="ti ti-scan"></i></div>');
c = c.replace('<div class="feature-icon">📊</div>', '<div class="feature-icon"><i class="ti ti-layout-dashboard"></i></div>');
c = c.replace('<div class="feature-icon">📄</div>', '<div class="feature-icon"><i class="ti ti-file-invoice"></i></div>');
c = c.replace('<div class="feature-icon">🌍</div>', '<div class="feature-icon"><i class="ti ti-world"></i></div>');
c = c.replace('<div class="feature-icon">👥</div>', '<div class="feature-icon"><i class="ti ti-users"></i></div>');
c = c.replace('<div class="feature-icon">🔒</div>', '<div class="feature-icon"><i class="ti ti-shield-lock"></i></div>');

fs.writeFileSync('index.html', c);
console.log('Done');
