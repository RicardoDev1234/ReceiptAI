const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `hideLoading(); applyAdminVisibility();
    await loadUserProfile(); await loadExpenses();
    showApp();
  } catch (err) { hideLoading(); showToast(err.message||'Sign in failed.', true); }`,
  `hideLoading(); applyAdminVisibility();
    try { await loadUserProfile(); } catch(e) {}
    try { await loadExpenses(); } catch(e) {}
    showApp();
  } catch (err) { hideLoading(); showToast(err.message || 'Incorrect email or password. Please try again.', true); }`
);

fs.writeFileSync('index.html', c);
console.log('Done');
