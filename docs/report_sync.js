(() => {
  const PREFIX = 'oge13-v4:';
  const ENDPOINT_KEY = PREFIX + 'remoteEndpoint';
  const SENT_KEY = PREFIX + 'remoteSentCount';
  const LOG_KEY = PREFIX + 'log';
  const PROGRESS_KEY = PREFIX + 'progress';
  const MODE_KEY = PREFIX + 'mode';

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function endpoint() { return localStorage.getItem(ENDPOINT_KEY) || ''; }
  function setEndpoint(value) { localStorage.setItem(ENDPOINT_KEY, value.trim()); }
  function log() { return readJSON(LOG_KEY, []); }
  function progress() { return readJSON(PROGRESS_KEY, { i: 0, done: {}, meta: {} }); }
  function sentCount() { return Number(localStorage.getItem(SENT_KEY) || 0); }
  function setSentCount(n) { localStorage.setItem(SENT_KEY, String(n)); }

  async function sendPayload(payload) {
    const url = endpoint();
    if (!url) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.warn('Remote report sync failed', err);
      return false;
    }
  }

  async function syncNewEvents() {
    const events = log();
    const from = sentCount();
    const fresh = events.slice(from);
    if (!fresh.length || !endpoint()) return;
    const ok = await sendPayload({
      type: 'events_batch',
      student: 'Ученик',
      page: location.href,
      createdAt: new Date().toISOString(),
      events: fresh,
      progress: progress(),
    });
    if (ok) setSentCount(events.length);
  }

  async function sendFullReport() {
    const ok = await sendPayload({
      type: 'full_report',
      student: 'Ученик',
      page: location.href,
      createdAt: new Date().toISOString(),
      events: log(),
      progress: progress(),
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith(PREFIX)),
    });
    if (ok) {
      setSentCount(log().length);
      alert('Отчёт отправлен. Если endpoint настроен правильно, строки появятся в Google Sheets.');
    } else {
      alert('Не получилось отправить. Проверь endpoint Google Apps Script.');
    }
  }

  function appsScriptTemplate() {
    return `function doPost(e) {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var sheet = ss.getSheetByName('events') || ss.insertSheet('events');\n  var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';\n  var data = JSON.parse(raw);\n\n  if (sheet.getLastRow() === 0) {\n    sheet.appendRow(['receivedAt','type','student','task','prompt','userAnswer','correctAnswer','isCorrect','errorType','usedHint','openedTheory','viewedSolution','attempt','seconds','raw']);\n  }\n\n  var events = data.events || [data];\n  events.forEach(function(ev) {\n    sheet.appendRow([\n      new Date(),\n      data.type || ev.type || 'event',\n      data.student || ev.student || '',\n      ev.task || '',\n      ev.prompt || '',\n      ev.userAnswer || '',\n      ev.correctAnswer || '',\n      ev.isCorrect === undefined ? '' : ev.isCorrect,\n      ev.errorType || '',\n      ev.usedHint === undefined ? '' : ev.usedHint,\n      ev.openedTheory === undefined ? '' : ev.openedTheory,\n      ev.viewedSolution === undefined ? '' : ev.viewedSolution,\n      ev.attempt || '',\n      ev.seconds || '',\n      JSON.stringify(ev)\n    ]);\n  });\n\n  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n}`;
  }

  function injectAdminPanel() {
    const main = document.getElementById('main');
    if (!main || !/Пульт Game Master/.test(main.textContent)) return;
    if (document.getElementById('remoteReportPanel')) return;

    const panel = document.createElement('section');
    panel.className = 'adminCard';
    panel.id = 'remoteReportPanel';
    panel.style.marginTop = '12px';
    panel.innerHTML = `
      <h3>Нелокальное сохранение отчёта</h3>
      <p class="muted">Вставь Web App URL из Google Apps Script. После этого события будут отправляться в Google Sheets.</p>
      <label>Google Apps Script Web App URL</label>
      <input id="remoteEndpointInput" placeholder="https://script.google.com/macros/s/.../exec" value="${endpoint().replaceAll('&','&amp;').replaceAll('"','&quot;')}">
      <div class="actions" style="border-top:0;padding-top:0;margin-top:8px">
        <button class="btn primary" id="saveRemoteEndpoint">Сохранить endpoint</button>
        <button class="btn soft" id="sendFullReport">Отправить всё сейчас</button>
        <button class="btn" id="copyAppsScript">Скопировать Apps Script</button>
      </div>
      <p class="muted">Отправлено событий: <b id="sentCountView">${sentCount()}</b> / ${log().length}</p>
    `;
    main.appendChild(panel);

    document.getElementById('saveRemoteEndpoint').onclick = () => {
      setEndpoint(document.getElementById('remoteEndpointInput').value);
      alert('Endpoint сохранён. Новые действия будут отправляться в таблицу.');
      syncNewEvents();
    };
    document.getElementById('sendFullReport').onclick = sendFullReport;
    document.getElementById('copyAppsScript').onclick = () => {
      navigator.clipboard.writeText(appsScriptTemplate());
      alert('Шаблон Apps Script скопирован. Вставь его в Extensions → Apps Script в Google Sheets.');
    };
  }

  // If the user clicks a pack while admin is open, switch to student mode so the task opens.
  document.addEventListener('click', (event) => {
    const item = event.target.closest('#nav .navI');
    if (!item) return;
    const mode = readJSON(MODE_KEY, 'student');
    if (mode === 'admin') writeJSON(MODE_KEY, 'student');
  }, true);

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    if (key === LOG_KEY) setTimeout(syncNewEvents, 50);
  };

  setInterval(() => { injectAdminPanel(); syncNewEvents(); }, 1200);
  window.addEventListener('load', () => { injectAdminPanel(); syncNewEvents(); });
})();