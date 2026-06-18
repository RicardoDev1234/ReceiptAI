const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

const pwaScript = `
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.style.display = 'flex';
});

async function installPWA() {
  if (!deferredPrompt) {
    alert('To install on iPhone: tap the Share button then Add to Home Screen');
    return;
  }
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('pwa-banner').style.display = 'none';
}

window.addEventListener('appinstalled', () => {
  document.getElementById('pwa-banner').style.display = 'none';
  deferredPrompt = null;
});
`;

c = c.replace('</script>\n</body>', pwaScript + '\n</script>\n</body>');
fs.writeFileSync('index.html', c);
console.log('Done');
