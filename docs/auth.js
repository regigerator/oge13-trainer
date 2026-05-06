(() => {
  const PREFIX = 'oge13-v4:';
  const ADMIN_PIN = '1313';
  const adminBtn = document.getElementById('adminMode');
  const studentBtn = document.getElementById('studentMode');

  function setMode(mode) {
    localStorage.setItem(PREFIX + 'mode', JSON.stringify(mode));
    window.location.reload();
  }

  function isAdminUnlocked() {
    return sessionStorage.getItem(PREFIX + 'adminUnlocked') === '1';
  }

  function unlockAdmin() {
    const pin = window.prompt('Введите PIN администратора');
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(PREFIX + 'adminUnlocked', '1');
      setMode('admin');
      return;
    }
    window.alert('Неверный PIN. Админ-режим не открыт.');
  }

  // If somebody previously left the page in admin mode, do not reopen admin
  // automatically in a new session without the PIN.
  const savedMode = JSON.parse(localStorage.getItem(PREFIX + 'mode') || '"student"');
  if (savedMode === 'admin' && !isAdminUnlocked()) {
    localStorage.setItem(PREFIX + 'mode', JSON.stringify('student'));
    window.location.reload();
    return;
  }

  if (adminBtn) {
    adminBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isAdminUnlocked()) {
        setMode('admin');
      } else {
        unlockAdmin();
      }
    };
  }

  if (studentBtn) {
    studentBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMode('student');
    };
  }
})();