(() => {
  const PREFIX = 'oge13-v4:';
  const blockStarts = [0, 4, 6, 9, 11, 15, 17, 19];
  const nav = document.getElementById('nav');
  if (!nav) return;

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + 'progress')) || { i: 0, done: {}, meta: {} };
    } catch {
      return { i: 0, done: {}, meta: {} };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(PREFIX + 'progress', JSON.stringify(progress));
  }

  // Event capture runs before the app-level click handler. This lets the side menu
  // work even though the main app is a compact single-file script.
  nav.addEventListener('click', (event) => {
    const item = event.target.closest('.navI');
    if (!item) return;

    const items = Array.from(nav.querySelectorAll('.navI'));
    const index = items.indexOf(item);
    if (index < 0 || blockStarts[index] === undefined) return;

    event.preventDefault();
    event.stopPropagation();

    const progress = loadProgress();
    progress.i = blockStarts[index];
    progress.jumpTarget = index;
    saveProgress(progress);

    window.location.reload();
  }, true);

  // Make the menu visibly clickable.
  const style = document.createElement('style');
  style.textContent = '.navI{cursor:pointer}.navI:hover{border-color:#4dd7b255;background:#4dd7b20c;color:#f4f7fb}';
  document.head.appendChild(style);
})();