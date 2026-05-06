(() => {
  const PREFIX = 'oge13-v4:';
  const blockStarts = [0, 4, 6, 9, 11, 15, 17, 19];
  const blockNames = ['Больше/меньше', 'Графики', 'Бесконечность', 'Отрезки', 'Дроби', 'Построение', 'Линейные', 'Системы'];

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + 'progress')) || { i: 0, done: {}, meta: {} };
    } catch {
      return { i: 0, done: {}, meta: {} };
    }
  }

  function setProgress(progress) {
    localStorage.setItem(PREFIX + 'progress', JSON.stringify(progress));
  }

  function jumpToPack(index) {
    const start = blockStarts[index];
    if (start === undefined) return;
    const progress = getProgress();
    progress.i = start;
    progress.forceJumpAt = Date.now();
    setProgress(progress);
    location.reload();
  }

  function enhanceNav() {
    const items = Array.from(document.querySelectorAll('#nav .navI'));
    if (!items.length) return;
    items.forEach((item, index) => {
      item.dataset.packIndex = String(index);
      item.title = `Перейти к паку: ${blockNames[index] || index + 1}`;
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      item.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        jumpToPack(index);
        return false;
      };
      item.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          jumpToPack(index);
        }
      };
    });
  }

  enhanceNav();
  new MutationObserver(enhanceNav).observe(document.getElementById('nav'), { childList: true, subtree: true });

  const style = document.createElement('style');
  style.textContent = '#nav .navI{cursor:pointer}#nav .navI:hover{border-color:#4dd7b2aa!important;background:#4dd7b21c!important;color:#f4f7fb!important}';
  document.head.appendChild(style);
})();