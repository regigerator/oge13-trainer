(function () {
  "use strict";

  const tasks = window.OGE13_TASKS || [];
  const blocks = window.OGE13_BLOCKS || [];
  const config = window.OGE13_CONFIG || { studentNameDefault: "Ученик", storagePrefix: "oge13-trainer-v2" };
  const blocksById = Object.fromEntries(blocks.map((block) => [block.id, block]));
  const taskIds = new Set(tasks.map((task) => task.id));
  const fallbackStorage = {};

  const storageKeys = {
    progress: `${config.storagePrefix}:progress`,
    log: `${config.storagePrefix}:sessionLog`,
    session: `${config.storagePrefix}:sessionId`
  };

  const elements = {
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    blockNav: document.getElementById("blockNav"),
    taskArea: document.getElementById("taskArea"),
    studentNameInput: document.getElementById("studentNameInput")
  };

  const makeRay = (endpoint, pointType, direction, min, max) => ({
    kind: "ray",
    endpoint,
    pointType,
    direction,
    min,
    max
  });

  const makeSegment = (left, right, leftType, rightType, min, max) => ({
    kind: "segment",
    left,
    right,
    leftType,
    rightType,
    min,
    max
  });

  const makePoint = (endpoint, min, max) => ({
    kind: "point",
    endpoint,
    min,
    max
  });

  const errorLabels = {
    direction_error: "direction_error",
    point_error: "point_error",
    endpoint_error: "endpoint_error",
    both_error: "both_error",
    bracket_error: "bracket_error",
    fraction_order_error: "fraction_order_error",
    algebra_move_error: "algebra_move_error",
    intersection_error: "intersection_error",
    no_solution_error: "no_solution_error",
    system_union_instead_intersection_error: "system_union_instead_intersection_error",
    only_first_condition_error: "only_first_condition_error",
    only_second_condition_error: "only_second_condition_error",
    endpoint_inclusion_error: "endpoint_inclusion_error",
    false_no_solution_error: "false_no_solution_error",
    missed_single_point_solution: "missed_single_point_solution",
    wrong_endpoint: "wrong_endpoint",
    wrong_left_endpoint: "wrong_left_endpoint",
    wrong_right_endpoint: "wrong_right_endpoint",
    interval_side_error: "interval_side_error",
    sign_transfer_error: "sign_transfer_error",
    minus_before_brackets_error: "minus_before_brackets_error",
    distribution_sign_error: "distribution_sign_error",
    negative_times_negative_error: "negative_times_negative_error",
    combine_constants_error: "combine_constants_error",
    copying_error: "copying_error",
    attention_drift_error: "attention_drift_error",
    negative_division_flip_error: "negative_division_flip_error"
  };

  let sessionLog = loadJson(storageKeys.log, []);
  let progress = loadJson(storageKeys.progress, createFreshProgress());
  let lineConfigs = {};
  let state = createFreshState();

  let sessionId = getOrCreateSessionId();

  init();

  function init() {
    if (elements.studentNameInput) elements.studentNameInput.value = getStudentName();

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    normalizeProgress();
    render();
  }

  function createFreshProgress() {
    return {
      currentTaskIndex: 0,
      completedResults: {},
      taskMeta: {}
    };
  }

  function createFreshState(patch = {}) {
    return {
      selectedChoice: null,
      builders: {},
      pointSelections: {},
      algebraStages: {},
      systemStages: {},
      systemOverlap: {},
      drawStages: {},
      microStages: {},
      feedback: null,
      awaitingNextTaskId: null,
      reviewTaskId: null,
      ...patch
    };
  }

  function loadJson(key, fallback) {
    try {
      const raw = readStorage("localStorage", key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Не удалось прочитать localStorage:", error);
      return fallback;
    }
  }

  function saveJson(key, value) {
    writeStorage("localStorage", key, JSON.stringify(value));
  }

  function saveProgress() {
    saveJson(storageKeys.progress, progress);
  }

  function saveLog() {
    saveJson(storageKeys.log, sessionLog);
  }

  function getOrCreateSessionId() {
    const existing = readStorage("sessionStorage", storageKeys.session);
    if (existing) return existing;

    const id = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    writeStorage("sessionStorage", storageKeys.session, id);
    return id;
  }

  function readStorage(storageName, key) {
    try {
      const storage = window[storageName];
      if (storage) return storage.getItem(key);
    } catch (error) {
      console.warn(`Не удалось прочитать ${storageName}:`, error);
    }

    return fallbackStorage[`${storageName}:${key}`] || null;
  }

  function writeStorage(storageName, key, value) {
    try {
      const storage = window[storageName];
      if (storage) {
        storage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.warn(`Не удалось записать в ${storageName}:`, error);
    }

    fallbackStorage[`${storageName}:${key}`] = String(value);
  }

  function getStudentName() {
    return config.studentNameDefault || "Ученик";
  }

  function normalizeProgress() {
    progress.currentTaskIndex = Number.isInteger(progress.currentTaskIndex) ? progress.currentTaskIndex : 0;
    progress.completedResults = progress.completedResults || {};
    progress.taskMeta = progress.taskMeta || {};

    while (
      progress.currentTaskIndex < tasks.length &&
      progress.completedResults[tasks[progress.currentTaskIndex].id] &&
      state.awaitingNextTaskId !== tasks[progress.currentTaskIndex].id &&
      state.reviewTaskId !== tasks[progress.currentTaskIndex].id
    ) {
      progress.currentTaskIndex += 1;
    }

    saveProgress();
  }

  function getCurrentTask() {
    return tasks[progress.currentTaskIndex] || null;
  }

  function getTaskMeta(task) {
    progress.taskMeta = progress.taskMeta || {};
    if (!progress.taskMeta[task.id]) {
      progress.taskMeta[task.id] = {
        attempts: 0,
        wrongAttempts: 0,
        usedHint: false,
        openedTheory: false,
        viewedSolution: false,
        solutionOpen: false,
        theoryPanelOpen: null,
        startedAt: Date.now()
      };
      saveProgress();
    }
    return progress.taskMeta[task.id];
  }

  function updateTaskMeta(task, patch) {
    const meta = getTaskMeta(task);
    Object.assign(meta, patch);
    saveProgress();
    return meta;
  }

  function render() {
    normalizeProgress();
    lineConfigs = {};
    renderStatus();
    renderBlockNav();

    if (progress.currentTaskIndex >= tasks.length) {
      renderReport();
      return;
    }

    const task = getCurrentTask();
    if (!task) {
      renderReport();
      return;
    }

    if (progress.completedResults[task.id] && state.awaitingNextTaskId === task.id) {
      renderTaskComplete(task);
      return;
    }

    renderTask(task);
  }

  function renderStatus() {
    const completed = Object.keys(progress.completedResults || {}).filter((id) => taskIds.has(id)).length;
    const total = tasks.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    elements.progressText.textContent = `${completed} / ${total}`;
    elements.progressFill.style.width = `${percent}%`;
  }

  function renderBlockNav() {
    const currentTask = getCurrentTask();
    const currentBlockTasks = currentTask ? tasks.filter((task) => task.blockId === currentTask.blockId) : [];
    elements.blockNav.innerHTML = blocks
      .map((block, index) => {
        const blockTasks = tasks.filter((task) => task.blockId === block.id);
        const completed = blockTasks.filter((task) => progress.completedResults[task.id]).length;
        const isActive = currentTask && currentTask.blockId === block.id;
        const isComplete = completed === blockTasks.length;
        return `
          <button class="block-link ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}" type="button" data-action="jump-block" data-block-id="${escapeHtml(block.id)}">
            <span class="block-index">${index + 1}</span>
            <span>
              <span class="block-title">${escapeHtml(block.shortTitle || block.title)}</span>
              <span class="block-meta">${escapeHtml(block.badge)} · ${completed}/${blockTasks.length}</span>
            </span>
          </button>
        `;
      })
      .join("") + (currentBlockTasks.length ? `
        <div class="task-jump-panel">
          <span class="status-label">Задания блока</span>
          <div class="task-jump-grid">
            ${currentBlockTasks.map((task) => {
              const globalIndex = tasks.findIndex((item) => item.id === task.id);
              const isCurrent = currentTask && currentTask.id === task.id;
              const isDone = Boolean(progress.completedResults[task.id]);
              return `
                <button class="task-jump-button ${isCurrent ? "is-active" : ""} ${isDone ? "is-done" : ""}" type="button" data-action="jump-task" data-task-index="${globalIndex}">
                  ${globalIndex + 1}
                </button>
              `;
            }).join("")}
          </div>
        </div>
      ` : "");
  }

  function renderTask(task) {
    const block = blocksById[task.blockId];
    const meta = getTaskMeta(task);
    const theoryOpen = shouldShowTheory(task, block, meta);

    elements.taskArea.innerHTML = `
      ${renderTaskHeader(task, block)}
      ${renderTheory(block, theoryOpen)}
      ${renderFeedback()}
      <section class="task-body">${renderTaskBody(task)}</section>
      ${meta.solutionOpen ? renderSolution(task) : ""}
      ${renderActions(task, meta)}
    `;
  }

  function renderTaskHeader(task, block) {
    const taskNumber = progress.currentTaskIndex + 1;
    return `
      <section class="task-header">
        <div>
          <span class="mission-badge">${escapeHtml(block.badge)}</span>
          <h2 class="task-title">${escapeHtml(task.prompt)}</h2>
          <p class="task-subtitle">${escapeHtml(block.title)}</p>
        </div>
        <div class="task-counter">${taskNumber}/${tasks.length}</div>
      </section>
    `;
  }

  function shouldShowTheory(task, block, meta) {
    if (meta.theoryPanelOpen !== null) return Boolean(meta.theoryPanelOpen);
    const completedBeforeInBlock = tasks
      .slice(0, progress.currentTaskIndex)
      .filter((item) => item.blockId === task.blockId && progress.completedResults[item.id]).length;
    return completedBeforeInBlock < (block.theoryVisibleFor || 0);
  }

  function renderTheory(block, isOpen) {
    if (!isOpen) {
      return `
        <div class="collapsed-theory">
          <span>Теория свернута. Можно открыть её в любой момент.</span>
          <button class="soft-button" type="button" data-action="open-theory">Открыть теорию</button>
        </div>
      `;
    }

    return `
      <section class="theory-panel">
        <div class="theory-head">
          <h3>Короткая теория</h3>
          <button class="ghost-button" type="button" data-action="close-theory">Свернуть</button>
        </div>
        <ul class="theory-list">
          ${block.theory.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderFeedback() {
    if (!state.feedback) return "";
    return `
      <section class="feedback-panel ${state.feedback.kind ? `is-${state.feedback.kind}` : ""}">
        <p>${escapeHtml(state.feedback.message)}</p>
      </section>
    `;
  }

  function renderTaskBody(task) {
    switch (task.type) {
      case "graph_choice":
      case "segment_choice":
      case "notation_choice":
        return renderChoiceTask(task);
      case "text_choice":
        return renderTextChoiceTask(task);
      case "point_placement":
        return renderPointPlacementTask(task);
      case "build_ray":
      case "number_line_draw_ray":
        return renderBuildRayTask(task);
      case "number_line_draw_interval":
        return renderIntervalDrawTask(task);
      case "algebra_build":
        return renderAlgebraBuildTask(task);
      case "system_overlap":
        return renderSystemOverlapTask(task);
      case "system_draw_two_conditions":
        return renderSystemDrawTwoConditionsTask(task);
      case "system_draw_intersection":
        return renderSystemDrawIntersectionTask(task);
      case "oge13_draw_then_choose_graph":
        return renderOgeDrawThenChooseTask(task);
      case "algebra_expand_negative_brackets":
      case "algebra_transfer_sign":
      case "algebra_combine_constants":
      case "algebra_line_control":
        return renderAlgebraMicroTask(task);
      case "system_basic":
        return renderSystemTask(task);
      default:
        return `<p>Этот тип задания пока не подключен.</p>`;
    }
  }

  function renderChoiceTask(task) {
    const selectedIndex = selectedChoiceIndex(task.id);
    const stimulus = task.stimulusGraph
      ? `
        <div class="stimulus">
          <span class="status-label">Дан график</span>
          ${renderNumberLineSvg(task.stimulusGraph)}
        </div>
      `
      : task.expression
        ? `<div class="expression-chip">${escapeHtml(task.expression)}</div>`
        : "";

    return `
      ${stimulus}
      <div class="choice-grid ${task.type === "notation_choice" ? "is-notation-grid" : ""}">
        ${task.options
          .map((option, index) => {
            const isSelected = selectedIndex === index;
            const graph = option.graph && task.type !== "notation_choice" ? renderNumberLineSvg(option.graph, { compact: true }) : "";
            return `
              <button class="choice-button ${task.type === "notation_choice" ? "is-notation" : ""} ${isSelected ? "is-selected" : ""}" type="button" data-action="select-choice" data-index="${index}">
                <span class="${task.type === "notation_choice" ? "choice-text" : "choice-label"}">${escapeHtml(option.label)}</span>
                ${graph}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderTextChoiceTask(task) {
    const selectedIndex = selectedChoiceIndex(task.id);
    return `
      ${renderComparisonStimulus(task)}
      <div class="choice-grid">
        ${task.options
          .map((option, index) => `
            <button class="choice-button ${selectedIndex === index ? "is-selected" : ""}" type="button" data-action="select-choice" data-index="${index}">
              <span class="choice-label">${index + 1}</span>
              <span class="choice-text">${escapeHtml(option.label)}</span>
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  function renderComparisonStimulus(task) {
    const values = (task.options || [])
      .map((option, index) => ({
        label: option.label,
        value: parseNumberInput(option.value || option.label),
        index
      }))
      .filter((item) => Number.isFinite(item.value));

    if (values.length < 2) return "";

    const minValue = Math.min(...values.map((item) => item.value));
    const maxValue = Math.max(...values.map((item) => item.value));
    const min = Math.floor(minValue - 1);
    const max = Math.ceil(maxValue + 1);

    return `
      <div class="stimulus comparison-stimulus">
        <span class="status-label">Смотри на прямую</span>
        ${renderComparisonLine(values, min, max)}
      </div>
    `;
  }

  function renderComparisonLine(values, min, max) {
    const width = 760;
    const height = 144;
    const pad = 44;
    const y = 66;
    const xFor = (value) => pad + ((value - min) / (max - min)) * (width - pad * 2);
    const integerTicks = [];
    for (let value = Math.ceil(min); value <= Math.floor(max); value += 1) integerTicks.push(value);
    const ticks = uniqueSorted([...integerTicks, ...values.map((item) => item.value)]);
    const labelTicks = selectVisibleTickLabels(ticks, values.map((item) => item.value), xFor, false);

    return `
      <svg class="number-line comparison-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="Сравнение чисел на прямой">
        <line class="axis-line" x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}"></line>
        <polygon fill="#6d788d" points="${pad - 8},${y} ${pad + 4},${y - 6} ${pad + 4},${y + 6}"></polygon>
        <polygon fill="#6d788d" points="${width - pad + 8},${y} ${width - pad - 4},${y - 6} ${width - pad - 4},${y + 6}"></polygon>
        ${ticks.map((tick) => `
          <line class="tick-line" x1="${xFor(tick)}" y1="${y - 10}" x2="${xFor(tick)}" y2="${y + 10}"></line>
        `).join("")}
        ${labelTicks.map((tick) => `
          <text class="tick-label" x="${xFor(tick)}" y="${y + 34}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>
        `).join("")}
        ${values.map((item) => `
          <g class="comparison-point is-${item.index + 1}">
            <circle cx="${xFor(item.value)}" cy="${y - 24}" r="11"></circle>
            <text x="${xFor(item.value)}" y="${y - 44}" text-anchor="middle">${escapeHtml(item.label)}</text>
          </g>
        `).join("")}
      </svg>
    `;
  }

  function renderPointPlacementTask(task) {
    const key = `point:${task.id}`;
    const selected = state.pointSelections[task.id];
    const graph = selected === undefined ? { kind: "blank", min: task.targetPoint.min, max: task.targetPoint.max } : makePoint(selected, task.targetPoint.min, task.targetPoint.max);

    return `
      <div class="expression-chip">${escapeHtml(task.targetPoint.endpointLabel || formatNumber(task.targetPoint.endpoint))}</div>
      <div class="interactive-wrap">
        ${renderNumberLineSvg(graph, {
          interactive: true,
          mode: "point",
          lineKey: key,
          snapValues: task.snapValues,
          highlightValues: [task.targetPoint.endpoint],
          min: task.targetPoint.min,
          max: task.targetPoint.max
        })}
      </div>
      <p class="selected-readout">Выбрано: ${selected === undefined ? "пока нет точки" : formatNumber(selected)}</p>
    `;
  }

  function renderBuildRayTask(task, customKey, correctOverride, snapValuesOverride) {
    const correct = correctOverride || task.correct;
    const key = customKey || `build:${task.id}`;
    const snapValues = snapValuesOverride || task.snapValues;
    return `
      ${task.expression ? `<div class="expression-chip">${escapeHtml(task.expression)}</div>` : ""}
      ${renderBuilderControls(key, correct, snapValues)}
    `;
  }

  function renderBuilderControls(key, correct, snapValues) {
    const builder = ensureBuilder(key);
    const hasEndpoint = builder.endpoint !== null && builder.endpoint !== undefined;
    const previewGraph = hasEndpoint
      ? makeRay(builder.endpoint, builder.pointType, builder.direction, correct.min, correct.max)
      : { kind: "blank", min: correct.min, max: correct.max };

    return `
      <div class="builder-controls">
        <div class="control-row">
          <span class="control-label">Тип точки</span>
          <button class="segmented-button ${builder.pointType === "open" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="pointType" data-value="open">○ пустая</button>
          <button class="segmented-button ${builder.pointType === "closed" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="pointType" data-value="closed">● закрашенная</button>
        </div>
        <div class="control-row">
          <span class="control-label">Направление</span>
          <button class="segmented-button ${builder.direction === "left" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="direction" data-value="left">← влево</button>
          <button class="segmented-button ${builder.direction === "right" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="direction" data-value="right">вправо →</button>
        </div>
        <div class="interactive-wrap">
          ${renderNumberLineSvg(previewGraph, {
            interactive: true,
            mode: "builder",
            lineKey: key,
            snapValues,
            min: correct.min,
            max: correct.max
          })}
        </div>
        <p class="selected-readout">Число: ${hasEndpoint ? formatNumber(builder.endpoint) : "нажми на прямую"}</p>
      </div>
    `;
  }

  function renderIntervalDrawTask(task) {
    return `
      ${task.expression ? `<div class="expression-chip">${escapeHtml(task.expression)}</div>` : ""}
      ${renderGraphDrawBuilder(`interval:${task.id}`, task.correct, task.snapValues, {
        allowedTypes: ["interval"],
        defaultType: "interval"
      })}
    `;
  }

  function renderGraphDrawBuilder(key, correct, snapValues, options = {}) {
    const builder = ensureBuilder(key);
    const allowedTypes = options.allowedTypes || ["ray", "interval", "point", "empty"];
    const defaultType = options.defaultType || graphKindToAnswerKind(correct.kind);
    if (!builder.answerKind || !allowedTypes.includes(builder.answerKind)) {
      builder.answerKind = defaultType;
      builder.activeField = defaultType === "interval" ? "left" : defaultType === "point" ? "point" : "endpoint";
    }

    const preview = graphFromDrawBuilder(builder, correct);
    const showKindChooser = allowedTypes.length > 1;

    return `
      <div class="draw-builder">
        ${showKindChooser ? renderAnswerKindChooser(key, allowedTypes, builder.answerKind) : ""}
        ${renderAnswerKindControls(key, builder, correct, snapValues)}
        <div class="interactive-wrap draw-preview">
          ${renderNumberLineSvg(preview, {
            interactive: builder.answerKind !== "empty",
            mode: "draw-builder",
            lineKey: key,
            snapValues,
            min: correct.min,
            max: correct.max
          })}
        </div>
        <p class="selected-readout">${escapeHtml(drawBuilderReadout(builder))}</p>
      </div>
    `;
  }

  function renderAnswerKindChooser(key, allowedTypes, current) {
    const labels = {
      ray: "луч",
      interval: "промежуток",
      point: "одна точка",
      empty: "нет решений"
    };
    return `
      <div class="draw-kind-grid">
        ${allowedTypes
          .map((type) => `
            <button class="segmented-button ${current === type ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="answerKind" data-value="${type}">
              ${escapeHtml(labels[type] || type)}
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  function renderAnswerKindControls(key, builder, correct, snapValues) {
    if (builder.answerKind === "ray") {
      return `
        <div class="control-row">
          <span class="control-label">Граница</span>
          <button class="segmented-button is-active" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="activeField" data-value="endpoint">клик по числу</button>
        </div>
        <div class="control-row">
          <span class="control-label">Тип точки</span>
          <button class="segmented-button ${builder.pointType === "open" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="pointType" data-value="open">○ пустая</button>
          <button class="segmented-button ${builder.pointType === "closed" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="pointType" data-value="closed">● закрашенная</button>
        </div>
        <div class="control-row">
          <span class="control-label">Направление</span>
          <button class="segmented-button ${builder.direction === "left" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="direction" data-value="left">← влево</button>
          <button class="segmented-button ${builder.direction === "right" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="direction" data-value="right">вправо →</button>
        </div>
      `;
    }

    if (builder.answerKind === "interval") {
      return `
        <div class="draw-help">
          <strong>Левая граница</strong> — меньшее число, где промежуток начинается. <strong>Правая граница</strong> — большее число, где он заканчивается.
          Тип точки выбираем отдельно: круглая скобка = пустая, квадратная = закрашенная.
        </div>
        <div class="control-row">
          <span class="control-label">Что кликаем</span>
          <button class="segmented-button ${(builder.activeField || "left") === "left" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="activeField" data-value="left">левая граница</button>
          <button class="segmented-button ${builder.activeField === "right" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="activeField" data-value="right">правая граница</button>
        </div>
        <div class="control-row">
          <span class="control-label">Левая точка</span>
          <button class="segmented-button ${builder.leftType === "open" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="leftType" data-value="open">○ пустая</button>
          <button class="segmented-button ${builder.leftType === "closed" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="leftType" data-value="closed">● закрашенная</button>
        </div>
        <div class="control-row">
          <span class="control-label">Правая точка</span>
          <button class="segmented-button ${builder.rightType === "open" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="rightType" data-value="open">○ пустая</button>
          <button class="segmented-button ${builder.rightType === "closed" ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="rightType" data-value="closed">● закрашенная</button>
        </div>
        <div class="control-row">
          <span class="control-label">Участок</span>
          <button class="segmented-button ${builder.spanSelected ? "is-active" : ""}" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="spanSelected" data-value="true">выделить между границами</button>
        </div>
      `;
    }

    if (builder.answerKind === "point") {
      return `
        <div class="control-row">
          <span class="control-label">Точка</span>
          <button class="segmented-button is-active" type="button" data-action="builder-field" data-builder-key="${escapeHtml(key)}" data-field="activeField" data-value="point">клик по числу</button>
        </div>
      `;
    }

    return `
      <div class="empty-answer-box">
        <strong>Выбрано: общей части нет</strong>
        <span>Если пересечения нет, проверка примет этот тип ответа.</span>
      </div>
    `;
  }

  function graphFromDrawBuilder(builder, correct) {
    const min = correct.min;
    const max = correct.max;

    if (builder.answerKind === "ray") {
      if (builder.endpoint === null || builder.endpoint === undefined) return { kind: "blank", min, max };
      return makeRay(builder.endpoint, builder.pointType || "open", builder.direction || "right", min, max);
    }

    if (builder.answerKind === "interval") {
      const hasLeft = builder.left !== null && builder.left !== undefined;
      const hasRight = builder.right !== null && builder.right !== undefined;
      if (!hasLeft && !hasRight) return { kind: "blank", min, max };
      if (!hasLeft) return makePoint(builder.right, min, max);
      if (!hasRight) return makePoint(builder.left, min, max);
      const left = Math.min(builder.left, builder.right);
      const right = Math.max(builder.left, builder.right);
      return makeSegment(left, right, builder.leftType || "open", builder.rightType || "open", min, max);
    }

    if (builder.answerKind === "point") {
      if (builder.point === null || builder.point === undefined) return { kind: "blank", min, max };
      return makePoint(builder.point, min, max);
    }

    if (builder.answerKind === "empty") {
      return { kind: "empty", min, max };
    }

    return { kind: "blank", min, max };
  }

  function drawBuilderReadout(builder) {
    if (builder.answerKind === "ray") {
      return `Луч: граница ${builder.endpoint === null || builder.endpoint === undefined ? "не выбрана" : formatNumber(builder.endpoint)}, ${builder.direction === "left" ? "влево" : "вправо"}, точка ${builder.pointType === "closed" ? "закрашенная" : "пустая"}`;
    }
    if (builder.answerKind === "interval") {
      const left = builder.left === null || builder.left === undefined ? "?" : formatNumber(builder.left);
      const right = builder.right === null || builder.right === undefined ? "?" : formatNumber(builder.right);
      return `Промежуток: ${left} ... ${right}, участок ${builder.spanSelected ? "выделен" : "ещё не выделен"}`;
    }
    if (builder.answerKind === "point") {
      return `Одна точка: ${builder.point === null || builder.point === undefined ? "не выбрана" : formatNumber(builder.point)}`;
    }
    return "Ответ: общей части нет";
  }

  function graphKindToAnswerKind(kind) {
    if (kind === "segment") return "interval";
    if (kind === "ray") return "ray";
    if (kind === "point") return "point";
    if (kind === "empty") return "empty";
    return "interval";
  }

  function renderAlgebraBuildTask(task) {
    const stage = state.algebraStages[task.id] || "algebra";
    if (stage === "build") {
      return `
        <div class="stimulus">
          <span class="status-label">Шаг 2</span>
          <strong>Теперь построй ответ: ${escapeHtml(buildRelationText(task.correct))}</strong>
        </div>
        ${renderBuildRayTask(task, `algebra:${task.id}`, task.correct, task.snapValues)}
      `;
    }

    return `
      <div class="expression-chip">${escapeHtml(task.inequality)}</div>
      <div class="algebra-step">
        <label for="algebraAnswer">${escapeHtml(task.reducedPrompt)}</label>
        <input id="algebraAnswer" class="answer-input" type="text" inputmode="decimal" autocomplete="off" placeholder="число">
      </div>
      <p class="small-note">Шаг 1: получи неравенство вида x ... число.</p>
    `;
  }

  function renderSystemOverlapTask(task) {
    const selection = ensureSystemOverlapSelection(task.id);
    const stage = selection.stage || 1;
    const zoneCorrect = selection.zone === task.correctZone;
    const zoneLabel = selection.zone ? systemZoneLabel(selection.zone, task) : "пока не выбрана";

    return `
      <div class="system-overlap-panel">
        <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
        <div class="system-legend" aria-label="Цвета условий">
          <span><i class="legend-dot is-first"></i>${escapeHtml(task.first.label)}</span>
          <span><i class="legend-dot is-second"></i>${escapeHtml(task.second.label)}</span>
          <span><i class="legend-dot is-common"></i>общая часть</span>
        </div>
        ${renderSystemOverlapSteps(task, selection)}
        ${renderSystemOverlapLine(task, selection)}
        ${renderSystemOverlapControls(task, selection)}
        ${stage >= 3 ? `<p class="selected-readout">Выбрано: ${escapeHtml(zoneLabel)}</p>` : ""}
      </div>

      ${zoneCorrect ? `<div class="notation-panel">
        <p class="small-note">Шаг 2: выбери запись этой общей части.</p>
        <div class="notation-grid">
          ${task.notationOptions
            .map((option) => `
              <button class="notation-button ${selection.notation === option.value ? "is-selected" : ""}" type="button" data-action="select-system-notation" data-value="${escapeHtml(option.value)}">
                ${escapeHtml(option.label)}
              </button>
            `)
            .join("")}
        </div>
      </div>` : ""}
    `;
  }

  function renderSystemOverlapSteps(task, selection) {
    const stage = selection.stage || 1;
    const zoneCorrect = selection.zone === task.correctZone;
    const rows = [
      { label: `Первое условие: ${task.first.label}`, done: stage > 1, active: stage === 1 },
      { label: "Понять синюю штриховку", done: stage > 2, active: stage === 2 },
      { label: `Второе условие: ${task.second.label}`, done: stage > 3 || zoneCorrect, active: stage === 3 },
      { label: "Найти наложение", done: zoneCorrect, active: stage >= 3 && !zoneCorrect }
    ];

    return `
      <div class="system-overlap-steps">
        ${rows.map((row, index) => `
          <div class="system-overlap-step ${row.active ? "is-active" : ""} ${row.done ? "is-done" : ""}">
            <strong>${index + 1}</strong>
            <span>${escapeHtml(row.label)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderSystemOverlapControls(task, selection) {
    const stage = selection.stage || 1;
    const zoneCorrect = selection.zone === task.correctZone;

    if (stage === 1) {
      return `
        <div class="system-overlap-note">
          <strong>Построй первое условие: ${escapeHtml(task.first.label)}.</strong>
          <span>Сейчас на прямой видна только синяя штриховка первого условия.</span>
        </div>
        <button class="soft-button" type="button" data-action="advance-system-overlap" data-stage="2">Синяя штриховка понятна</button>
      `;
    }

    if (stage === 2) {
      return `
        <div class="system-overlap-note">
          <strong>Синим показаны все числа, которые подходят первому условию.</strong>
          <span>Теперь добавим второе условие на эту же прямую.</span>
        </div>
        <button class="soft-button" type="button" data-action="advance-system-overlap" data-stage="3">Построить второе условие</button>
      `;
    }

    return `
      <div class="system-overlap-note">
        <strong>${zoneCorrect ? systemOverlapCorrectZoneMessage(task) : "Теперь найди место, где подходят оба условия сразу."}</strong>
        <span>${zoneCorrect ? "Осталось выбрать правильную запись ответа." : "Ответ системы — только там, где две штриховки наложились друг на друга."}</span>
      </div>
      ${!zoneCorrect ? `<p class="small-note">Кликни на участок, где выполняются оба условия одновременно.</p>` : ""}
      ${!zoneCorrect ? renderSystemZoneButtons(task, selection.zone) : ""}
    `;
  }

  function renderSystemOverlapLine(task, selection) {
    const width = 760;
    const height = 168;
    const pad = 44;
    const axisY = 78;
    const min = task.min ?? task.first.graph.min ?? -6;
    const max = task.max ?? task.first.graph.max ?? 6;
    const [left, right] = task.bounds;
    const xFor = (value) => pad + ((value - min) / (max - min)) * (width - pad * 2);
    const ticks = collectTicks(min, max, [left, right], task.snapValues, false);
    const stage = selection.stage || 1;
    const showSecond = stage >= 3;
    const endpointsOverlap = showSecond && nearlyEqual(task.first.graph.endpoint, task.second.graph.endpoint);
    const firstPointOffset = endpointsOverlap ? -15 : 0;
    const secondPointOffset = endpointsOverlap ? 15 : 0;

    return `
      <svg class="number-line system-overlap-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="Система на числовой прямой">
        <line class="axis-line" x1="${pad}" y1="${axisY}" x2="${width - pad}" y2="${axisY}"></line>
        <polygon fill="#6d788d" points="${pad - 8},${axisY} ${pad + 4},${axisY - 6} ${pad + 4},${axisY + 6}"></polygon>
        <polygon fill="#6d788d" points="${width - pad + 8},${axisY} ${width - pad - 4},${axisY - 6} ${width - pad - 4},${axisY + 6}"></polygon>
        ${ticks
          .map((tick) => `
            <line class="tick-line" x1="${xFor(tick)}" y1="${axisY - 12}" x2="${xFor(tick)}" y2="${axisY + 12}"></line>
            <text class="tick-label" x="${xFor(tick)}" y="${axisY + 42}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>
          `)
          .join("")}
        ${showSecond ? renderSystemCommonOverlap(task, xFor, axisY, pad, width) : ""}
        ${selection.zone ? renderSelectedSystemZone(task, selection.zone, xFor, axisY, pad, width) : ""}
        ${renderSystemConditionMarkup(task.first.graph, xFor, axisY, pad, width, "first", firstPointOffset)}
        ${showSecond ? renderSystemConditionMarkup(task.second.graph, xFor, axisY, pad, width, "second", secondPointOffset) : ""}
        ${showSecond ? renderSystemSvgZones(task, xFor, axisY, pad, width) : ""}
      </svg>
    `;
  }

  function renderSystemCommonOverlap(task, xFor, y, pad, width) {
    const graph = task.correctGraph;
    if (!graph || graph.kind === "empty") return "";

    if (graph.kind === "segment") {
      const leftX = xFor(graph.left);
      const rightX = xFor(graph.right);
      return `<rect class="system-common-zone" x="${leftX}" y="${y - 26}" width="${Math.max(0, rightX - leftX)}" height="52"></rect>`;
    }

    if (graph.kind === "ray") {
      const startX = xFor(graph.endpoint);
      const endX = graph.direction === "right" ? width - pad : pad;
      const x = Math.min(startX, endX);
      return `<rect class="system-common-zone" x="${x}" y="${y - 26}" width="${Math.abs(endX - startX)}" height="52"></rect>`;
    }

    if (graph.kind === "point") {
      return `<circle class="system-common-point" cx="${xFor(graph.endpoint)}" cy="${y}" r="21"></circle>`;
    }

    return "";
  }

  function renderSystemConditionMarkup(graph, xFor, y, pad, width, variant, pointYOffset = 0) {
    const strokeClass = `system-condition-stroke is-${variant}`;
    const fillClass = `system-condition-fill is-${variant}`;
    const openClass = `system-condition-point is-open is-${variant}`;
    const closedClass = `system-condition-point is-closed is-${variant}`;

    if (graph.kind !== "ray") return "";

    const endpointX = xFor(graph.endpoint);
    const endX = graph.direction === "right" ? width - pad : pad;
    const arrow = graph.direction === "right"
      ? `<polygon class="${fillClass}" points="${endX + 8},${y} ${endX - 6},${y - 8} ${endX - 6},${y + 8}"></polygon>`
      : `<polygon class="${fillClass}" points="${endX - 8},${y} ${endX + 6},${y - 8} ${endX + 6},${y + 8}"></polygon>`;
    const pointClass = graph.pointType === "closed" ? closedClass : openClass;
    const pointY = y + pointYOffset;

    return `
      <line class="${strokeClass}" x1="${endpointX}" y1="${y}" x2="${endX}" y2="${y}"></line>
      ${arrow}
      ${pointYOffset ? `<line class="system-point-connector is-${variant}" x1="${endpointX}" y1="${y}" x2="${endpointX}" y2="${pointY}"></line>` : ""}
      <circle class="${pointClass}" cx="${endpointX}" cy="${pointY}" r="9"></circle>
    `;
  }

  function renderSelectedSystemZone(task, selectedZone, xFor, y, pad, width) {
    if (!selectedZone) return "";

    const [left, right] = task.bounds;
    const leftX = xFor(left);
    const rightX = xFor(right);

    const zoneClass = selectedZone === task.correctZone ? "is-correct" : "is-wrong";

    if (selectedZone === "none") {
      return `<text class="system-none-selected ${zoneClass}" x="${width / 2}" y="${y - 42}" text-anchor="middle">выбрано: общей части нет</text>`;
    }

    if (left === right) {
      if (selectedZone === "singlePoint") {
        return `<circle class="system-selected-point ${zoneClass}" cx="${leftX}" cy="${y}" r="17"></circle>`;
      }
      if (selectedZone === "leftRay") {
        return `<rect class="system-selected-zone ${zoneClass}" x="${pad}" y="${y - 22}" width="${Math.max(0, leftX - pad)}" height="44"></rect>`;
      }
      if (selectedZone === "rightRay") {
        return `<rect class="system-selected-zone ${zoneClass}" x="${leftX}" y="${y - 22}" width="${Math.max(0, width - pad - leftX)}" height="44"></rect>`;
      }
      return "";
    }

    const pointWidth = 26;
    const zoneMap = {
      leftRay: { x: pad, width: Math.max(0, leftX - pad) },
      leftPoint: { x: leftX - pointWidth / 2, width: pointWidth },
      middle: { x: leftX, width: Math.max(0, rightX - leftX) },
      rightPoint: { x: rightX - pointWidth / 2, width: pointWidth },
      rightRay: { x: rightX, width: Math.max(0, width - pad - rightX) }
    };
    const zone = zoneMap[selectedZone];
    if (!zone) return "";
    return `<rect class="system-selected-zone ${zoneClass}" x="${zone.x}" y="${y - 22}" width="${zone.width}" height="44"></rect>`;
  }

  function renderSystemSvgZones(task, xFor, y, pad, width) {
    const [left, right] = task.bounds;
    const leftX = xFor(left);
    const rightX = xFor(right);

    if (left === right) {
      return `
        ${svgZoneRect("leftRay", pad, y - 34, Math.max(0, leftX - pad - 12), 68)}
        ${svgZoneRect("singlePoint", leftX - 18, y - 38, 36, 76)}
        ${svgZoneRect("rightRay", leftX + 12, y - 34, Math.max(0, width - pad - leftX - 12), 68)}
      `;
    }

    return `
      ${svgZoneRect("leftRay", pad, y - 34, Math.max(0, leftX - pad - 13), 68)}
      ${svgZoneRect("leftPoint", leftX - 17, y - 38, 34, 76)}
      ${svgZoneRect("middle", leftX + 13, y - 34, Math.max(0, rightX - leftX - 26), 68)}
      ${svgZoneRect("rightPoint", rightX - 17, y - 38, 34, 76)}
      ${svgZoneRect("rightRay", rightX + 13, y - 34, Math.max(0, width - pad - rightX - 13), 68)}
    `;
  }

  function svgZoneRect(zone, x, y, width, height) {
    if (width <= 0 || height <= 0) return "";
    return `<rect class="system-click-zone" x="${x}" y="${y}" width="${width}" height="${height}" data-action="select-system-zone" data-zone="${zone}"></rect>`;
  }

  function renderSystemZoneButtons(task, selectedZone) {
    const [left, right] = task.bounds;
    const zones = left === right
      ? ["leftRay", "singlePoint", "rightRay", "none"]
      : ["leftRay", "leftPoint", "middle", "rightPoint", "rightRay", "none"];

    return `
      <div class="system-zone-grid">
        ${zones
          .map((zone) => `
            <button class="zone-button ${selectedZone === zone ? "is-selected" : ""}" type="button" data-action="select-system-zone" data-zone="${zone}">
              ${escapeHtml(systemZoneLabel(zone, task))}
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  function systemZoneLabel(zone, task) {
    const [left, right] = task.bounds;
    const labels = {
      leftRay: `левый луч: x < ${formatNumber(left)}`,
      leftPoint: `левая точка: ${formatNumber(left)}`,
      middle: `между ${formatNumber(left)} и ${formatNumber(right)}`,
      rightPoint: `правая точка: ${formatNumber(right)}`,
      rightRay: `правый луч: x > ${formatNumber(right)}`,
      singlePoint: `точка ${formatNumber(left)}`,
      none: "общей части нет"
    };
    return labels[zone] || zone;
  }

  function ensureSystemOverlapSelection(taskId) {
    if (!state.systemOverlap[taskId]) {
      state.systemOverlap[taskId] = {
        stage: 1,
        zone: null,
        notation: null
      };
    }
    state.systemOverlap[taskId].stage = state.systemOverlap[taskId].stage || 1;
    return state.systemOverlap[taskId];
  }

  function renderSystemTask(task) {
    const stage = state.systemStages[task.id] || 0;
    const steps = [
      { label: `Построй ${task.inequalities[0].label}` },
      { label: `Построй ${task.inequalities[1].label}` },
      { label: "Выбери итоговое пересечение" }
    ];

    const stepList = `
      <div class="system-steps">
        ${steps
          .map((step, index) => `
            <div class="system-step ${stage === index ? "is-active" : ""} ${stage > index ? "is-done" : ""}">
              <strong>${index + 1}</strong>
              <span>${escapeHtml(step.label)}</span>
            </div>
          `)
          .join("")}
      </div>
    `;

    if (stage < 2) {
      const inequality = task.inequalities[stage];
      return `
        <div class="expression-chip">${escapeHtml(inequality.label)}</div>
        ${stepList}
        ${renderBuildRayTask(task, `system:${task.id}:${stage}`, inequality.correct, inequality.snapValues)}
      `;
    }

    const selectedIndex = selectedChoiceIndex(task.id);
    return `
      <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
      ${stepList}
      <p class="small-note">Система = оба условия сразу. Решение системы = перекрытие.</p>
      <div class="choice-grid">
        ${task.finalOptions
          .map((option, index) => `
            <button class="choice-button ${selectedIndex === index ? "is-selected" : ""}" type="button" data-action="select-choice" data-index="${index}">
              <span class="choice-label">${index + 1}</span>
              <span class="choice-text">${escapeHtml(option.label)}</span>
              ${renderNumberLineSvg(option.graph, { compact: true })}
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  function renderSystemDrawTwoConditionsTask(task) {
    const stage = state.drawStages[task.id] || 0;
    const steps = [
      { label: `Построй ${task.inequalities[0].label}` },
      { label: `Построй ${task.inequalities[1].label}` },
      { label: "Построй общий ответ" }
    ];

    if (stage < 2) {
      const inequality = task.inequalities[stage];
      return `
        <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
        ${renderDrawSteps(steps, stage)}
        ${stage > 0 ? `
          <div class="system-condition-lines">
            ${task.inequalities.slice(0, stage).map((item, index) => `
              <div class="stimulus is-compact-line">
                <span class="status-label">Уже построено ${index + 1}: ${escapeHtml(item.label)}</span>
                ${renderNumberLineSvg(item.correct)}
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="draw-line-card">
          <span class="status-label">Линия ${stage + 1}</span>
          ${renderBuildRayTask(task, `system-draw:${task.id}:${stage}`, inequality.correct, inequality.snapValues)}
        </div>
      `;
    }

    return `
      <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
      ${renderDrawSteps(steps, stage)}
      <div class="system-condition-lines">
        ${task.inequalities.map((item, index) => `
          <div class="stimulus">
            <span class="status-label">Условие ${index + 1}: ${escapeHtml(item.label)}</span>
            ${renderNumberLineSvg(item.correct)}
          </div>
        `).join("")}
      </div>
      <p class="small-note">Третья линия: построй только общую часть двух решений.</p>
      ${renderGraphDrawBuilder(`system-final:${task.id}`, task.finalCorrect, task.snapValues, {
        allowedTypes: task.finalAllowedTypes,
        defaultType: task.finalDefaultType
      })}
    `;
  }

  function renderSystemDrawIntersectionTask(task) {
    return `
      <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
      <div class="system-condition-lines">
        <div class="stimulus">
          <span class="status-label">${escapeHtml(task.first.label)}</span>
          ${renderNumberLineSvg(task.first.graph)}
        </div>
        <div class="stimulus">
          <span class="status-label">${escapeHtml(task.second.label)}</span>
          ${renderNumberLineSvg(task.second.graph)}
        </div>
      </div>
      <p class="small-note">Построй общий ответ: интервал, луч, одну точку или «нет решений».</p>
      ${renderGraphDrawBuilder(`system-final:${task.id}`, task.finalCorrect, task.snapValues, {
        allowedTypes: task.finalAllowedTypes,
        defaultType: task.finalDefaultType
      })}
    `;
  }

  function renderOgeDrawThenChooseTask(task) {
    const stage = state.drawStages[task.id] || 0;
    if (stage === 0) {
      return `
        <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
        ${renderDrawSteps([{ label: "Построй решение сам" }, { label: "Выбери ОГЭ-рисунок" }], 0)}
        ${renderGraphDrawBuilder(`oge-draw:${task.id}`, task.finalCorrect, task.snapValues, {
          allowedTypes: task.finalAllowedTypes,
          defaultType: task.finalDefaultType
        })}
      `;
    }

    const selectedIndex = selectedChoiceIndex(task.id);
    return `
      <div class="expression-chip">${escapeHtml(task.systemLabel)}</div>
      ${renderDrawSteps([{ label: "Построй решение сам" }, { label: "Выбери ОГЭ-рисунок" }], 1)}
      <p class="small-note">Теперь найди среди четырёх рисунков тот, который совпадает с твоим построением.</p>
      <div class="choice-grid">
        ${task.options
          .map((option, index) => `
            <button class="choice-button ${selectedIndex === index ? "is-selected" : ""}" type="button" data-action="select-choice" data-index="${index}">
              <span class="choice-label">${escapeHtml(option.label)}</span>
              ${renderNumberLineSvg(option.graph, { compact: true })}
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  function renderDrawSteps(steps, activeIndex) {
    return `
      <div class="system-steps">
        ${steps.map((step, index) => `
          <div class="system-step ${activeIndex === index ? "is-active" : ""} ${activeIndex > index ? "is-done" : ""}">
            <strong>${index + 1}</strong>
            <span>${escapeHtml(step.label)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderAlgebraMicroTask(task) {
    const stepIndex = state.microStages[task.id] || 0;
    const step = task.steps[stepIndex] || task.steps[task.steps.length - 1];
    const completed = task.steps.slice(0, stepIndex);

    return `
      <div class="expression-chip">${escapeHtml(task.expression)}</div>
      ${completed.length ? `
        <div class="micro-done-list">
          ${completed.map((item) => `<span>${escapeHtml(item.label)} ${escapeHtml(item.displayAnswer || item.answer)}</span>`).join("")}
        </div>
      ` : ""}
      <div class="algebra-step micro-step">
        <label for="microAnswer">${escapeHtml(step.label)}</label>
        <input id="microAnswer" class="answer-input" type="text" autocomplete="off" placeholder="ответ">
      </div>
      <p class="small-note">Микрошаг ${Math.min(stepIndex + 1, task.steps.length)} / ${task.steps.length}. Здесь важен знак.</p>
    `;
  }

  function renderActions(task, meta) {
    const canShowSolution = meta.wrongAttempts >= 2 || meta.solutionOpen;
    const isCompleted = Boolean(progress.completedResults[task.id]);
    const showForward = state.reviewTaskId === task.id && progress.currentTaskIndex + 1 < tasks.length;
    return `
      <div class="actions">
        <button class="ghost-button" type="button" data-action="previous-task" ${progress.currentTaskIndex <= 0 ? "disabled" : ""}>Назад</button>
        ${showForward ? `<button class="ghost-button" type="button" data-action="jump-next">Вперёд</button>` : ""}
        <button class="soft-button" type="button" data-action="hint">Подсказка</button>
        ${canShowSolution ? `<button class="ghost-button" type="button" data-action="show-solution">Показать решение</button>` : ""}
        <button class="primary-button" type="button" data-action="check">${isCompleted ? "Проверить ещё раз" : "Проверить"}</button>
      </div>
    `;
  }

  function renderTaskComplete(task) {
    const block = blocksById[task.blockId];
    elements.taskArea.innerHTML = `
      ${renderTaskHeader(task, block)}
      <section class="feedback-panel is-good">
        <p>${state.feedback ? escapeHtml(state.feedback.message) : "Задание принято. Можно двигаться дальше."}</p>
      </section>
      <div class="actions">
        <button class="ghost-button" type="button" data-action="previous-task" ${progress.currentTaskIndex <= 0 ? "disabled" : ""}>Назад</button>
        <button class="primary-button" type="button" data-action="next-task">${progress.currentTaskIndex + 1 >= tasks.length ? "Открыть отчёт" : "Следующее задание"}</button>
      </div>
    `;
  }

  function renderSolution(task) {
    return `
      <section class="solution-panel">
        <div class="solution-head">
          <h3>Решение</h3>
          <span class="status-label">после попыток</span>
        </div>
        <p class="solution-text">${escapeHtml(task.solution || "Решение появится в следующей версии.")}</p>
      </section>
    `;
  }

  function handleClick(event) {
    const svg = event.target.closest("svg[data-line-key]");
    if (svg) {
      handleLineClick(event, svg);
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const task = getCurrentTask();

    if (action === "reset-progress") {
      resetProgress();
      return;
    }

    if (!task && action !== "copy-report" && action !== "jump-block" && action !== "jump-task") return;

    switch (action) {
      case "jump-block":
        jumpToBlock(button.dataset.blockId);
        break;
      case "jump-task":
        goToTaskIndex(Number(button.dataset.taskIndex));
        break;
      case "previous-task":
        goToPreviousTask();
        break;
      case "jump-next":
        goToTaskIndex(progress.currentTaskIndex + 1);
        break;
      case "select-choice":
        state.selectedChoice = { taskId: task.id, index: Number(button.dataset.index) };
        state.feedback = null;
        render();
        break;
      case "builder-field":
        updateBuilderField(button.dataset.builderKey, button.dataset.field, button.dataset.value);
        break;
      case "advance-system-overlap":
        advanceSystemOverlap(task, Number(button.dataset.stage));
        break;
      case "select-system-zone":
        selectSystemZone(task, button.dataset.zone);
        break;
      case "select-system-notation":
        selectSystemNotation(task, button.dataset.value);
        break;
      case "check":
        checkCurrentTask();
        break;
      case "hint":
        showHint(task);
        break;
      case "show-solution":
        showSolution(task);
        break;
      case "open-theory":
        openTheory(task);
        break;
      case "close-theory":
        closeTheory(task);
        break;
      case "next-task":
        goToNextTask();
        break;
      case "copy-report":
        copyReport();
        break;
      default:
        break;
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Enter") return;
    if (event.target && (event.target.id === "algebraAnswer" || event.target.id === "microAnswer")) {
      event.preventDefault();
      checkCurrentTask();
    }
  }

  function handleLineClick(event, svg) {
    const key = svg.dataset.lineKey;
    const lineConfig = lineConfigs[key];
    if (!lineConfig) return;

    const rect = svg.getBoundingClientRect();
    const viewBoxWidth = Number(svg.getAttribute("viewBox").split(" ")[2]);
    const xInViewBox = ((event.clientX - rect.left) / rect.width) * viewBoxWidth;
    const value = xToNearestValue(xInViewBox, lineConfig);

    if (lineConfig.mode === "point") {
      const task = getCurrentTask();
      state.pointSelections[task.id] = value;
    } else if (lineConfig.mode === "builder") {
      const builder = ensureBuilder(key);
      builder.endpoint = value;
    } else if (lineConfig.mode === "draw-builder") {
      const builder = ensureBuilder(key);
      const activeField = builder.activeField || (builder.answerKind === "interval" ? "left" : builder.answerKind === "point" ? "point" : "endpoint");
      builder[activeField] = value;
    }

    state.feedback = null;
    render();
  }

  function xToNearestValue(x, lineConfig) {
    const rawValue = lineConfig.min + ((x - lineConfig.pad) / (lineConfig.width - lineConfig.pad * 2)) * (lineConfig.max - lineConfig.min);
    const candidates = lineConfig.snapValues && lineConfig.snapValues.length ? lineConfig.snapValues : buildDefaultSnapValues(lineConfig.min, lineConfig.max);
    return candidates.reduce((best, current) => (Math.abs(current - rawValue) < Math.abs(best - rawValue) ? current : best), candidates[0]);
  }

  function updateBuilderField(key, field, value) {
    const builder = ensureBuilder(key);
    builder[field] = value === "true" ? true : value === "false" ? false : value;
    if (field === "answerKind") {
      builder.activeField = value === "interval" ? "left" : value === "point" ? "point" : "endpoint";
    }
    state.feedback = null;
    render();
  }

  function advanceSystemOverlap(task, nextStage) {
    const selection = ensureSystemOverlapSelection(task.id);
    selection.stage = Math.max(selection.stage || 1, nextStage || 1);
    if (selection.stage === 2) {
      state.feedback = {
        kind: "good",
        message: "Синим показано решение первого условия. Теперь построй второе условие на этой же прямой."
      };
    } else if (selection.stage >= 3) {
      state.feedback = {
        kind: "warn",
        message: "Теперь на прямой видно оба условия. Ответ системы — только там, где они наложились."
      };
    } else {
      state.feedback = null;
    }
    render();
  }

  function selectSystemZone(task, zone) {
    const selection = ensureSystemOverlapSelection(task.id);
    if ((selection.stage || 1) < 3) return;
    selection.zone = zone;
    selection.notation = null;
    selection.stage = Math.max(selection.stage || 1, 4);
    const zoneCorrect = zone === task.correctZone;
    if (zoneCorrect) {
      state.feedback = {
        kind: "good",
        message: systemOverlapCorrectZoneMessage(task)
      };
    } else {
      const errorType = systemOverlapErrorType(task, selection, false);
      state.feedback = {
        kind: "bad",
        message: systemOverlapZoneFeedback(task, zone, errorType)
      };
    }
    render();
  }

  function systemOverlapCorrectZoneMessage(task) {
    if (task.correctGraph.kind === "empty") {
      return "Да. Общей части нет: две штриховки не накладываются.";
    }
    if (task.correctGraph.kind === "point") {
      return "Да. Общая часть — одна точка, которая подходит обоим условиям.";
    }
    return "Да. Это общая часть двух условий. Здесь оба условия выполняются одновременно.";
  }

  function systemOverlapFinalMessage(task) {
    if (task.correctGraph.kind === "empty") {
      return "Да. У этой системы нет общей части.";
    }
    if (task.correctGraph.kind === "point") {
      return "Да. Ответ системы — одна точка.";
    }
    return "Да. Здесь оба условия выполняются одновременно.";
  }

  function systemOverlapZoneFeedback(task, zone, errorType) {
    const [left, right] = task.bounds;
    const zonePlace = {
      leftRay: `Левее ${formatNumber(left)}`,
      leftPoint: `В точке ${formatNumber(left)}`,
      middle: left === right ? `В точке ${formatNumber(left)}` : `Между ${formatNumber(left)} и ${formatNumber(right)}`,
      rightPoint: `В точке ${formatNumber(right)}`,
      rightRay: `Правее ${formatNumber(right)}`,
      singlePoint: `В точке ${formatNumber(left)}`
    }[zone] || "Здесь";

    if (errorType === "only_first_condition_error") {
      return `${zonePlace} работает первое условие, но второе не выполняется. Система требует оба условия сразу.`;
    }

    if (errorType === "only_second_condition_error") {
      return `${zonePlace} работает второе условие, но первое не выполняется. Найди место, где совпадают обе штриховки.`;
    }

    if (errorType === "system_union_instead_intersection_error") {
      return "Ты выбрал всё, что подходит хотя бы одному условию. Но система требует оба условия одновременно. Нужно выбрать только наложение.";
    }

    if (errorType === "endpoint_inclusion_error") {
      return "Проверь знак у границы: > или < — точка пустая, ≥ или ≤ — точка закрашенная.";
    }

    if (errorType === "false_no_solution_error") {
      const checkText = task.checkNumber
        ? ` Например, ${task.checkNumber} подходит и ${task.first.label}, и ${task.second.label}.`
        : " Проверь число внутри пересечения: оно должно подходить обоим условиям.";
      return `Общая часть есть.${checkText}`;
    }

    if (errorType === "missed_single_point_solution") {
      return `Общая часть — не отрезок, а одна точка. Число ${formatNumber(left)} подходит обоим условиям.`;
    }

    if (errorType === "no_solution_error") {
      return "У этой системы нет общей зоны: штриховки не накладываются так, чтобы оба условия выполнялись сразу.";
    }

    return errorMessage(errorType, task);
  }

  function selectSystemNotation(task, notation) {
    const selection = ensureSystemOverlapSelection(task.id);
    if (selection.zone !== task.correctZone) {
      state.feedback = {
        kind: "warn",
        message: "Сначала найди общую часть на прямой. Запись выбираем только после правильного участка."
      };
      render();
      return;
    }
    selection.notation = notation;
    state.feedback = null;
    render();
  }

  function ensureBuilder(key) {
    if (!state.builders[key]) {
      state.builders[key] = {
        pointType: "open",
        direction: "right",
        endpoint: null,
        leftType: "open",
        rightType: "open",
        left: null,
        right: null,
        point: null,
        spanSelected: false,
        activeField: "endpoint"
      };
    }
    return state.builders[key];
  }

  function selectedChoiceIndex(taskId) {
    return state.selectedChoice && state.selectedChoice.taskId === taskId ? state.selectedChoice.index : null;
  }

  function checkCurrentTask() {
    const task = getCurrentTask();
    if (!task) return;

    switch (task.type) {
      case "graph_choice":
      case "segment_choice":
      case "notation_choice":
        checkGraphChoice(task);
        break;
      case "text_choice":
        checkTextChoice(task);
        break;
      case "point_placement":
        checkPointPlacement(task);
        break;
      case "build_ray":
      case "number_line_draw_ray":
        checkBuilderTask(task, `build:${task.id}`, task.correct, task.snapValues);
        break;
      case "number_line_draw_interval":
        checkGraphBuilderTask(task, `interval:${task.id}`, task.correct, task.snapValues);
        break;
      case "algebra_build":
        checkAlgebraBuild(task);
        break;
      case "system_overlap":
        checkSystemOverlapTask(task);
        break;
      case "system_draw_two_conditions":
        checkSystemDrawTwoConditionsTask(task);
        break;
      case "system_draw_intersection":
        checkSystemDrawIntersectionTask(task);
        break;
      case "oge13_draw_then_choose_graph":
        checkOgeDrawThenChooseTask(task);
        break;
      case "algebra_expand_negative_brackets":
      case "algebra_transfer_sign":
      case "algebra_combine_constants":
      case "algebra_line_control":
        checkAlgebraMicroTask(task);
        break;
      case "system_basic":
        checkSystemTask(task);
        break;
      default:
        break;
    }
  }

  function checkGraphChoice(task) {
    const index = selectedChoiceIndex(task.id);
    if (index === null || index === undefined || !task.options[index]) {
      state.feedback = { kind: "warn", message: "Сначала выбери один вариант." };
      render();
      return;
    }

    const selected = task.options[index];
    const result = evaluateGraphLike(selected.graph, task.correct, task);
    recordAttempt(task, selected.label, formatGraphAnswer(task.correct), result.correct, result.errorType);

    if (result.correct) {
      completeTask(task, "Верно. Ты сопоставил знак, точку и направление.");
    } else {
      showWrongFeedback(task, result.errorType);
    }
  }

  function checkTextChoice(task) {
    const index = selectedChoiceIndex(task.id);
    if (index === null || index === undefined || !task.options[index]) {
      state.feedback = { kind: "warn", message: "Выбери один из вариантов." };
      render();
      return;
    }

    const selected = task.options[index];
    const isCorrect = selected.value === task.correctValue;
    recordAttempt(task, selected.label, task.correctAnswerText || task.correctValue, isCorrect, isCorrect ? "" : task.errorType);

    if (isCorrect) {
      completeTask(task, "Да, порядок на прямой выбран верно.");
    } else {
      showWrongFeedback(task, task.errorType);
    }
  }

  function checkPointPlacement(task) {
    const selected = state.pointSelections[task.id];
    if (selected === undefined) {
      state.feedback = { kind: "warn", message: "Сначала нажми на число на прямой." };
      render();
      return;
    }

    const isCorrect = nearlyEqual(selected, task.targetPoint.endpoint);
    recordAttempt(task, formatNumber(selected), formatNumber(task.targetPoint.endpoint), isCorrect, isCorrect ? "" : task.errorType);

    if (isCorrect) {
      completeTask(task, "Точка стоит там, где нужно.");
    } else {
      showWrongFeedback(task, task.errorType);
    }
  }

  function checkBuilderTask(task, key, correct, snapValues, onSuccess) {
    const builder = ensureBuilder(key);
    if (builder.endpoint === null || builder.endpoint === undefined) {
      state.feedback = { kind: "warn", message: "Сначала выбери число на прямой." };
      render();
      return false;
    }

    const userGraph = makeRay(builder.endpoint, builder.pointType, builder.direction, correct.min, correct.max);
    const result = evaluateGraphLike(userGraph, correct, task);
    recordAttempt(task, formatGraphAnswer(userGraph), formatGraphAnswer(correct), result.correct, result.errorType);

    if (result.correct) {
      if (onSuccess) {
        onSuccess();
      } else {
        completeTask(task, "Построение совпало с ответом.");
      }
      return true;
    }

    showWrongFeedback(task, result.errorType);
    return false;
  }

  function checkAlgebraBuild(task) {
    const stage = state.algebraStages[task.id] || "algebra";
    if (stage === "build") {
      checkBuilderTask(task, `algebra:${task.id}`, task.correct, task.snapValues);
      return;
    }

    const input = document.getElementById("algebraAnswer");
    const value = parseNumberInput(input ? input.value : "");
    if (value === null) {
      state.feedback = { kind: "warn", message: "Введи число. Можно через запятую или дробью, например 1,5 или 3/2." };
      render();
      return;
    }

    const isCorrect = nearlyEqual(value, task.algebraAnswer);
    recordAttempt(task, formatNumber(value), formatNumber(task.algebraAnswer), isCorrect, isCorrect ? "" : "algebra_move_error");

    if (isCorrect) {
      state.algebraStages[task.id] = "build";
      state.feedback = { kind: "good", message: "Алгебраический шаг верный. Теперь перенеси это на прямую." };
      render();
    } else {
      showWrongFeedback(task, "algebra_move_error");
    }
  }

  function checkSystemOverlapTask(task) {
    const selection = ensureSystemOverlapSelection(task.id);

    if ((selection.stage || 1) < 3) {
      state.feedback = { kind: "warn", message: "Сначала добавь оба условия на одну прямую, чтобы увидеть наложение." };
      render();
      return;
    }

    if (!selection.zone) {
      state.feedback = { kind: "warn", message: "Сначала кликни общую часть на прямой или кнопку «общей части нет»." };
      render();
      return;
    }

    const zoneCorrect = selection.zone === task.correctZone;
    if (!zoneCorrect) {
      const errorType = systemOverlapErrorType(task, selection, false);
      recordAttempt(task, systemZoneLabel(selection.zone, task), task.correctNotation, false, errorType);
      showWrongFeedback(task, errorType);
      return;
    }

    if (!selection.notation) {
      state.feedback = { kind: "warn", message: "Теперь выбери запись промежутка." };
      render();
      return;
    }

    const notationCorrect = selection.notation === task.correctNotation;
    const isCorrect = notationCorrect;
    const errorType = isCorrect ? "" : systemOverlapErrorType(task, selection, true);

    recordAttempt(
      task,
      `${systemZoneLabel(selection.zone, task)} → ${selection.notation}`,
      task.correctNotation,
      isCorrect,
      errorType
    );

    if (isCorrect) {
      completeTask(task, systemOverlapFinalMessage(task));
    } else {
      showWrongFeedback(task, errorType);
    }
  }

  function systemOverlapErrorType(task, selection, zoneCorrect) {
    if (!zoneCorrect) {
      if (selection.zone === "none") {
        return task.correctGraph.kind === "point" ? "missed_single_point_solution" : "false_no_solution_error";
      }
      return task.zoneErrorTags?.[selection.zone] || "intersection_error";
    }

    const option = task.notationOptions.find((item) => item.value === selection.notation);
    if (option && option.errorTag) return option.errorTag;
    if (task.correctGraph.kind === "point") return "missed_single_point_solution";
    return "endpoint_inclusion_error";
  }

  function checkGraphBuilderTask(task, key, correct, snapValues, onSuccess) {
    const builder = ensureBuilder(key);
    const missing = drawBuilderMissingMessage(builder, correct);
    if (missing) {
      state.feedback = { kind: "warn", message: missing };
      render();
      return false;
    }

    const userGraph = graphFromDrawBuilder(builder, correct);
    const result = evaluateDrawnGraph(userGraph, builder, correct, task);
    recordAttempt(task, formatGraphAnswer(userGraph), formatGraphAnswer(correct), result.correct, result.errorType);

    if (result.correct) {
      if (onSuccess) {
        onSuccess();
      } else {
        completeTask(task, "Построение принято: все компоненты совпали.");
      }
      return true;
    }

    showWrongFeedback(task, result.errorType);
    return false;
  }

  function drawBuilderMissingMessage(builder, correct) {
    if (builder.answerKind === "empty") return "";
    if (builder.answerKind === "ray") {
      if (builder.endpoint === null || builder.endpoint === undefined) return "Кликни границу луча на прямой.";
      return "";
    }
    if (builder.answerKind === "interval") {
      if (builder.left === null || builder.left === undefined) return "Выбери левую границу промежутка.";
      if (builder.right === null || builder.right === undefined) return "Выбери правую границу промежутка.";
      if (!builder.spanSelected) return "Нажми «выделить между границами», чтобы показать сам промежуток.";
      return "";
    }
    if (builder.answerKind === "point") {
      if (builder.point === null || builder.point === undefined) return "Кликни точку на прямой.";
      return "";
    }
    return "Выбери тип ответа.";
  }

  function evaluateDrawnGraph(userGraph, builder, correctGraph, task) {
    if (correctGraph.kind === "segment") {
      if (builder.answerKind === "empty") return { correct: false, errorType: "false_no_solution_error" };
      if (builder.answerKind !== "interval" || userGraph.kind !== "segment") return { correct: false, errorType: "interval_side_error" };
      if (!nearlyEqual(builder.left, correctGraph.left)) return { correct: false, errorType: "wrong_left_endpoint" };
      if (!nearlyEqual(builder.right, correctGraph.right)) return { correct: false, errorType: "wrong_right_endpoint" };
      if (builder.leftType !== correctGraph.leftType || builder.rightType !== correctGraph.rightType) {
        return { correct: false, errorType: "endpoint_inclusion_error" };
      }
      if (!builder.spanSelected) return { correct: false, errorType: "interval_side_error" };
      return { correct: true, errorType: "" };
    }

    if (correctGraph.kind === "ray") {
      if (builder.answerKind === "empty") return { correct: false, errorType: "false_no_solution_error" };
      if (builder.answerKind !== "ray" || userGraph.kind !== "ray") return { correct: false, errorType: "intersection_error" };
      return evaluateGraphLike(userGraph, correctGraph, {
        endpointErrorType: task.endpointErrorType || "wrong_endpoint",
        pointErrorType: task.pointErrorType || "endpoint_inclusion_error"
      });
    }

    if (correctGraph.kind === "point") {
      if (builder.answerKind === "empty") return { correct: false, errorType: "missed_single_point_solution" };
      if (builder.answerKind !== "point" || userGraph.kind !== "point") return { correct: false, errorType: "missed_single_point_solution" };
      return { correct: nearlyEqual(userGraph.endpoint, correctGraph.endpoint), errorType: nearlyEqual(userGraph.endpoint, correctGraph.endpoint) ? "" : "wrong_endpoint" };
    }

    if (correctGraph.kind === "empty") {
      return { correct: builder.answerKind === "empty", errorType: builder.answerKind === "empty" ? "" : "no_solution_error" };
    }

    return evaluateGraphLike(userGraph, correctGraph, task);
  }

  function checkSystemDrawTwoConditionsTask(task) {
    const stage = state.drawStages[task.id] || 0;

    if (stage < 2) {
      const inequality = task.inequalities[stage];
      checkBuilderTask(
        task,
        `system-draw:${task.id}:${stage}`,
        inequality.correct,
        inequality.snapValues,
        () => {
          state.drawStages[task.id] = stage + 1;
          state.feedback = { kind: "good", message: stage === 0 ? "Первое условие построено. Теперь второе." : "Оба условия построены. Теперь построй общую часть." };
          render();
        }
      );
      return;
    }

    checkSystemFinalDraw(task, `system-final:${task.id}`);
  }

  function checkSystemDrawIntersectionTask(task) {
    checkSystemFinalDraw(task, `system-final:${task.id}`);
  }

  function checkSystemFinalDraw(task, key, onSuccess) {
    const builder = ensureBuilder(key);
    const missing = drawBuilderMissingMessage(builder, task.finalCorrect);
    if (missing) {
      state.feedback = { kind: "warn", message: missing };
      render();
      return false;
    }

    const userGraph = graphFromDrawBuilder(builder, task.finalCorrect);
    const result = evaluateSystemDrawFinal(task, userGraph, builder);
    recordAttempt(task, formatGraphAnswer(userGraph), formatGraphAnswer(task.finalCorrect), result.correct, result.errorType);

    if (result.correct) {
      if (onSuccess) onSuccess();
      else completeTask(task, "Общий ответ построен верно.");
      return true;
    }

    showWrongFeedback(task, result.errorType);
    return false;
  }

  function evaluateSystemDrawFinal(task, userGraph, builder) {
    const correct = task.finalCorrect;

    if (correct.kind !== "empty" && builder.answerKind === "empty") {
      return { correct: false, errorType: correct.kind === "point" ? "missed_single_point_solution" : "false_no_solution_error" };
    }

    if (correct.kind === "empty") {
      if (builder.answerKind === "empty") return { correct: true, errorType: "" };
      if (task.first && graphsSame(userGraph, task.first.graph)) return { correct: false, errorType: "only_first_condition_error" };
      if (task.second && graphsSame(userGraph, task.second.graph)) return { correct: false, errorType: "only_second_condition_error" };
      if (task.inequalities) {
        if (graphsSame(userGraph, task.inequalities[0].correct)) return { correct: false, errorType: "only_first_condition_error" };
        if (graphsSame(userGraph, task.inequalities[1].correct)) return { correct: false, errorType: "only_second_condition_error" };
      }
      return { correct: false, errorType: "no_solution_error" };
    }

    // В некоторых системах итоговая общая часть совпадает с одним из исходных условий:
    // x > 2 и x > 5 -> итог x > 5; x < 2 и x < 5 -> итог x < 2.
    // Поэтому сначала проверяем финальный ответ, а уже потом ругаемся на «только первое/второе условие».
    const finalResult = evaluateDrawnGraph(userGraph, builder, correct, task);
    if (finalResult.correct) return finalResult;

    if (task.inequalities) {
      if (graphsSame(userGraph, task.inequalities[0].correct)) return { correct: false, errorType: "only_first_condition_error" };
      if (graphsSame(userGraph, task.inequalities[1].correct)) return { correct: false, errorType: "only_second_condition_error" };
    }

    return finalResult;
  }

  function checkOgeDrawThenChooseTask(task) {
    const stage = state.drawStages[task.id] || 0;
    if (stage === 0) {
      checkSystemFinalDraw(task, `oge-draw:${task.id}`, () => {
        state.drawStages[task.id] = 1;
        state.feedback = { kind: "good", message: "Своё построение верное. Теперь выбери такой же ОГЭ-рисунок." };
        render();
      });
      return;
    }

    checkGraphChoice(task);
  }

  function checkAlgebraMicroTask(task) {
    const stepIndex = state.microStages[task.id] || 0;
    const step = task.steps[stepIndex];
    const input = document.getElementById("microAnswer");
    const value = input ? input.value : "";
    const isCorrect = normalizeAlgebraText(value) === normalizeAlgebraText(step.answer);
    recordAttempt(task, value, step.displayAnswer || step.answer, isCorrect, isCorrect ? "" : step.errorType);

    if (isCorrect) {
      if (stepIndex + 1 >= task.steps.length) {
        completeTask(task, "Микрошаги собраны верно. Знаки на месте.");
      } else {
        state.microStages[task.id] = stepIndex + 1;
        state.feedback = { kind: "good", message: "Этот шаг верный. Идём дальше." };
        render();
      }
    } else {
      showWrongFeedback(task, step.errorType);
    }
  }

  function normalizeAlgebraText(value) {
    return String(value || "")
      .toLowerCase()
      .replaceAll("−", "-")
      .replaceAll(" ", "")
      .replaceAll("*", "")
      .replaceAll("·", "")
      .replaceAll("=", "=");
  }

  function checkSystemTask(task) {
    const stage = state.systemStages[task.id] || 0;

    if (stage < 2) {
      const inequality = task.inequalities[stage];
      checkBuilderTask(
        task,
        `system:${task.id}:${stage}`,
        inequality.correct,
        inequality.snapValues,
        () => {
          state.systemStages[task.id] = stage + 1;
          state.feedback = {
            kind: "good",
            message: stage === 0 ? "Первое неравенство построено. Теперь второе." : "Оба неравенства построены. Осталось выбрать общую часть."
          };
          render();
        }
      );
      return;
    }

    const index = selectedChoiceIndex(task.id);
    if (index === null || index === undefined || !task.finalOptions[index]) {
      state.feedback = { kind: "warn", message: "Выбери итоговое пересечение." };
      render();
      return;
    }

    const selected = task.finalOptions[index];
    const result = evaluateSystemFinal(selected.graph, task.finalCorrect);
    recordAttempt(task, selected.label, formatGraphAnswer(task.finalCorrect), result.correct, result.errorType);

    if (result.correct) {
      completeTask(task, "Верно. Общая часть найдена.");
    } else {
      showWrongFeedback(task, result.errorType);
    }
  }

  function evaluateGraphLike(userGraph, correctGraph, task) {
    if (!userGraph || !correctGraph || userGraph.kind !== correctGraph.kind) {
      if (correctGraph && correctGraph.kind === "empty") {
        return { correct: false, errorType: "no_solution_error" };
      }
      return { correct: false, errorType: "intersection_error" };
    }

    if (correctGraph.kind === "ray") {
      const endpointWrong = !nearlyEqual(userGraph.endpoint, correctGraph.endpoint);
      const directionWrong = userGraph.direction !== correctGraph.direction;
      const pointWrong = userGraph.pointType !== correctGraph.pointType;

      if (!endpointWrong && !directionWrong && !pointWrong) {
        return { correct: true, errorType: "" };
      }

      if (task.bothErrorEnabled && directionWrong && pointWrong && !endpointWrong) {
        return { correct: false, errorType: "both_error" };
      }
      if (endpointWrong) return { correct: false, errorType: task.endpointErrorType || "endpoint_error" };
      if (directionWrong) return { correct: false, errorType: "direction_error" };
      if (pointWrong) return { correct: false, errorType: task.pointErrorType || "point_error" };
    }

    if (correctGraph.kind === "segment") {
      const endpointWrong = !nearlyEqual(userGraph.left, correctGraph.left) || !nearlyEqual(userGraph.right, correctGraph.right);
      const bracketWrong = userGraph.leftType !== correctGraph.leftType || userGraph.rightType !== correctGraph.rightType;

      if (!endpointWrong && !bracketWrong) {
        return { correct: true, errorType: "" };
      }
      if (endpointWrong) return { correct: false, errorType: task.endpointErrorType || "endpoint_error" };
      if (bracketWrong) return { correct: false, errorType: task.pointErrorType || "bracket_error" };
    }

    if (correctGraph.kind === "empty") {
      return { correct: userGraph.kind === "empty", errorType: userGraph.kind === "empty" ? "" : "no_solution_error" };
    }

    return { correct: false, errorType: "endpoint_error" };
  }

  function evaluateSystemFinal(userGraph, correctGraph) {
    if (correctGraph.kind === "empty") {
      return {
        correct: userGraph.kind === "empty",
        errorType: userGraph.kind === "empty" ? "" : "no_solution_error"
      };
    }

    if (userGraph.kind === "empty") {
      return { correct: false, errorType: "intersection_error" };
    }

    return evaluateGraphLike(userGraph, correctGraph, { pointErrorType: "point_error" });
  }

  function recordAttempt(task, userAnswer, correctAnswer, isCorrect, errorType) {
    const meta = getTaskMeta(task);
    meta.attempts += 1;
    if (!isCorrect) meta.wrongAttempts += 1;
    saveProgress();

    logEvent(task, {
      userAnswer,
      correctAnswer,
      isCorrect,
      errorType: errorType || "",
      attemptNumber: meta.attempts
    });
  }

  function completeTask(task, message) {
    const meta = getTaskMeta(task);
    const result = {
      taskId: task.id,
      blockId: task.blockId,
      taskType: task.type,
      usedHint: Boolean(meta.usedHint),
      openedTheory: Boolean(meta.openedTheory),
      viewedSolution: Boolean(meta.viewedSolution),
      attempts: meta.attempts,
      wrongAttempts: meta.wrongAttempts,
      timeSpentSeconds: Math.round((Date.now() - meta.startedAt) / 1000),
      completedAt: new Date().toISOString()
    };

    progress.completedResults[task.id] = result;
    state.awaitingNextTaskId = task.id;
    state.feedback = { kind: "good", message };
    saveProgress();
    render();
  }

  function showWrongFeedback(task, errorType) {
    const meta = getTaskMeta(task);
    const tail = meta.wrongAttempts >= 2 ? " Можно открыть решение и спокойно сверить шаги." : " Попробуй ещё раз, без спешки.";
    state.feedback = {
      kind: "bad",
      message: `${errorMessage(errorType, task)}${tail}`
    };
    render();
  }

  function errorMessage(errorType, task) {
    const checkNumberText = task && task.checkNumber ? ` Например, число ${task.checkNumber} подходит обоим условиям.` : " Проверь одно число из общей части: оно должно подходить обоим условиям.";
    const messages = {
      direction_error: "Проверь направление: больше идёт вправо, меньше идёт влево.",
      point_error: "Проверь тип точки: строгие знаки > и < дают пустую точку, ≥ и ≤ дают закрашенную.",
      endpoint_error: "Проверь число на прямой: граница должна стоять ровно на нужном числе.",
      both_error: "Тут одновременно сбились направление и тип точки. Сначала реши: вправо или влево, потом — пустая или закрашенная.",
      bracket_error: "Проверь скобку: круглая значит число не входит, квадратная значит входит.",
      fraction_order_error: "Проверь порядок чисел: переведи дробь в десятичное число и сравни положение на прямой.",
      algebra_move_error: "Проверь перенос числа. Когда число переходит на другую сторону, его знак меняется.",
      intersection_error: "Проверь перекрытие: системе подходят только те числа, которые попали в обе штриховки.",
      no_solution_error: "Проверь, есть ли общая часть. Иногда система не имеет решений.",
      system_union_instead_intersection_error: "Ты выбрал объединение: всё, что подходит хотя бы одному условию. В системе нужна только общая часть, где выполняются оба условия сразу.",
      only_first_condition_error: "Здесь работает первое условие, но второе не выполняется. Система требует оба условия сразу.",
      only_second_condition_error: "Здесь работает второе условие, но первое не выполняется. Найди место, где совпадают обе штриховки.",
      endpoint_inclusion_error: "Проверь знак у границы: > или < — точка пустая, ≥ или ≤ — точка закрашенная.",
      false_no_solution_error: `Общая часть есть.${checkNumberText}`,
      missed_single_point_solution: "Общая часть — не отрезок, а одна точка. Это число подходит обоим условиям.",
      wrong_endpoint: "Граница выбрана не на том числе. Сначала найди число из условия на прямой.",
      wrong_left_endpoint: "Левая граница промежутка выбрана не там. Проверь первое число в записи промежутка.",
      wrong_right_endpoint: "Правая граница промежутка выбрана не там. Проверь второе число в записи промежутка.",
      interval_side_error: "Промежуток должен быть именно участком между двумя границами, а не лучом и не отдельной точкой.",
      sign_transfer_error: "При переносе через знак равенства знак меняется: плюс становится минусом, минус становится плюсом.",
      minus_before_brackets_error: "Перед скобкой стоит отрицательный множитель: он влияет на каждый член внутри скобки.",
      distribution_sign_error: "Проверь распределение множителя по скобке: умножить нужно каждый член и сохранить знак.",
      negative_times_negative_error: "Отрицательное число на отрицательное даёт плюс.",
      combine_constants_error: "Собирай числовые части отдельно: сначала посчитай только числа.",
      copying_error: "Строка переписана с искажением. Сначала перенеси правую часть без изменений.",
      attention_drift_error: "Похоже, внимание уехало на соседний знак или коэффициент. Проверь, какая часть относится к x.",
      negative_division_flip_error: "При делении неравенства на отрицательное число знак неравенства переворачивается."
    };
    return messages[errorType] || "Ответ пока не совпал с нужным. Посмотри на число, точку и направление.";
  }

  function showHint(task) {
    const meta = updateTaskMeta(task, { usedHint: true });
    state.feedback = { kind: "warn", message: task.hint || "Сначала найди границу, потом реши вопрос с точкой и направлением." };
    logEvent(task, {
      userAnswer: "hint",
      correctAnswer: "",
      isCorrect: null,
      errorType: "",
      attemptNumber: meta.attempts
    });
    render();
  }

  function showSolution(task) {
    const meta = updateTaskMeta(task, { viewedSolution: true, solutionOpen: true });
    logEvent(task, {
      userAnswer: "viewed_solution",
      correctAnswer: task.solution || "",
      isCorrect: null,
      errorType: "",
      attemptNumber: meta.attempts
    });
    state.feedback = { kind: "warn", message: "Решение открыто. Можно разобрать его и затем попробовать построить ответ самому." };
    render();
  }

  function openTheory(task) {
    const meta = updateTaskMeta(task, { theoryPanelOpen: true, openedTheory: true });
    logEvent(task, {
      userAnswer: "opened_theory",
      correctAnswer: "",
      isCorrect: null,
      errorType: "",
      attemptNumber: meta.attempts
    });
    state.feedback = null;
    render();
  }

  function closeTheory(task) {
    updateTaskMeta(task, { theoryPanelOpen: false });
    state.feedback = null;
    render();
  }

  function jumpToBlock(blockId) {
    const index = tasks.findIndex((task) => task.blockId === blockId);
    if (index >= 0) goToTaskIndex(index);
  }

  function goToPreviousTask() {
    if (progress.currentTaskIndex <= 0) return;
    goToTaskIndex(progress.currentTaskIndex - 1);
  }

  function goToTaskIndex(index) {
    const boundedIndex = Math.max(0, Math.min(index, tasks.length));
    progress.currentTaskIndex = boundedIndex;
    const task = tasks[boundedIndex];
    state = createFreshState({
      reviewTaskId: task && progress.completedResults[task.id] ? task.id : null
    });
    saveProgress();
    render();
    elements.taskArea.focus();
  }

  function goToNextTask() {
    if (state.awaitingNextTaskId) {
      progress.currentTaskIndex += 1;
    } else if (state.reviewTaskId) {
      progress.currentTaskIndex += 1;
    }
    state = createFreshState();
    saveProgress();
    render();
    elements.taskArea.focus();
  }

  function resetProgress() {
    const ok = window.confirm("Сбросить прогресс и локальный журнал тренировки?");
    if (!ok) return;

    progress = createFreshProgress();
    sessionLog = [];
    state = createFreshState();
    saveProgress();
    saveLog();
    sessionStorage.removeItem(storageKeys.session);
    sessionId = getOrCreateSessionId();
    render();
  }

  function logEvent(task, payload) {
    const meta = getTaskMeta(task);
    const event = {
      timestamp: new Date().toISOString(),
      sessionId,
      studentName: getStudentName(),
      blockId: task.blockId,
      taskId: task.id,
      taskType: task.type,
      prompt: task.prompt,
      userAnswer: normalizeLogValue(payload.userAnswer),
      correctAnswer: normalizeLogValue(payload.correctAnswer),
      isCorrect: payload.isCorrect,
      errorType: payload.errorType || "",
      usedHint: Boolean(meta.usedHint),
      openedTheory: Boolean(meta.openedTheory),
      viewedSolution: Boolean(meta.viewedSolution),
      attemptNumber: payload.attemptNumber === undefined ? meta.attempts : payload.attemptNumber,
      timeSpentSeconds: Math.round((Date.now() - meta.startedAt) / 1000)
    };

    sessionLog.push(event);
    saveLog();
    sendEventToGoogleSheets(event);
  }

  function normalizeLogValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  async function sendEventToGoogleSheets(event) {
    const endpoint = window.GOOGLE_SHEETS_ENDPOINT || "";
    if (!endpoint) {
      console.info("Google Sheets endpoint не задан. Событие сохранено локально.", event);
      return;
    }

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn("Не удалось отправить событие в Google Sheets:", error);
    }
  }

  window.sendEventToGoogleSheets = sendEventToGoogleSheets;

  function renderReport() {
    const report = buildReport();
    elements.taskArea.innerHTML = `
      <section class="task-header">
        <div>
          <span class="mission-badge">Отчёт</span>
          <h2 class="task-title">OGE RAID — отчёт по миссии №13</h2>
          <p class="task-subtitle">Ученик: ${escapeHtml(report.studentName)}</p>
        </div>
        <div class="task-counter">${report.correct}/${report.total}</div>
      </section>
      ${renderFeedback()}

      <section class="report-grid">
        ${renderReportStat("Время", report.durationText)}
        ${renderReportStat("Всего заданий", report.total)}
        ${renderReportStat("Верно", report.correct)}
        ${renderReportStat("Самостоятельно", report.independent)}
        ${renderReportStat("С подсказкой", report.withHint)}
        ${renderReportStat("Открывал теорию", report.openedTheory)}
        ${renderReportStat("Показал решение", report.viewedSolution)}
      </section>

      <h3 class="task-subtitle" style="margin-top: 24px;">Ошибки по типам</h3>
      <section class="error-list">
        ${Object.entries(report.errorCounts)
          .map(([type, count]) => `
            <div class="error-item">
              <span>${escapeHtml(type)}</span>
              <strong>${count}</strong>
            </div>
          `)
          .join("")}
      </section>

      <section class="recommendation">
        <span class="status-label">Вывод</span>
        <p>${escapeHtml(report.recommendation)}</p>
      </section>

      <div class="actions">
        <button class="primary-button" type="button" data-action="copy-report">Скопировать отчёт для Game Master</button>
        <button class="ghost-button" type="button" data-action="reset-progress">Начать заново</button>
      </div>
    `;
  }

  function renderReportStat(label, value) {
    return `
      <div class="report-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </div>
    `;
  }

  function buildReport() {
    const results = Object.values(progress.completedResults || {}).filter((result) => taskIds.has(result.taskId));
    const relevantEvents = sessionLog.filter((event) => taskIds.has(event.taskId));
    const errorCounts = Object.fromEntries(Object.keys(errorLabels).map((type) => [type, 0]));

    relevantEvents.forEach((event) => {
      if (event.isCorrect === false && event.errorType && errorCounts[event.errorType] !== undefined) {
        errorCounts[event.errorType] += 1;
      }
    });

    const durationSeconds = results.reduce((sum, result) => sum + (result.timeSpentSeconds || 0), 0);
    const report = {
      studentName: getStudentName(),
      durationText: formatDuration(durationSeconds),
      total: tasks.length,
      correct: results.length,
      independent: results.filter((result) => !result.usedHint && !result.viewedSolution && result.wrongAttempts === 0).length,
      withHint: results.filter((result) => result.usedHint).length,
      openedTheory: results.filter((result) => result.openedTheory).length,
      viewedSolution: results.filter((result) => result.viewedSolution).length,
      errorCounts
    };

    report.recommendation = buildRecommendation(errorCounts);
    report.text = buildReportText(report);
    return report;
  }

  function buildRecommendation(errorCounts) {
    const rules = [
      ["direction_error", "Есть смысл дать ещё задания на больше/меньше и движение вправо/влево."],
      ["point_error", "Нужно потренировать пустую и закрашенную точку для строгих и нестрогих знаков."],
      ["bracket_error", "Стоит повторить круглые и квадратные скобки в промежутках."],
      ["fraction_order_error", "Лучше отдельно повторить дроби и десятичные числа на прямой."],
      ["algebra_move_error", "Нужна короткая серия на перенос чисел в линейных неравенствах."],
      ["intersection_error", "Стоит вернуться к системам и идее общей части двух штриховок."],
      ["no_solution_error", "Полезно разобрать случаи, где пересечения нет и ответом будет «нет решений»."],
      ["system_union_instead_intersection_error", "Нужно отдельно развести идеи объединения и пересечения: в системе ищем только общую часть."],
      ["only_first_condition_error", "Стоит потренировать проверку выбранного участка сразу по двум условиям, а не только по первому."],
      ["only_second_condition_error", "Стоит потренировать проверку выбранного участка сразу по двум условиям, а не только по второму."],
      ["endpoint_inclusion_error", "Нужно повторить включённость границ: строгий знак, нестрогий знак и скобки."],
      ["false_no_solution_error", "Полезно давать проверочное число из пересечения перед выбором «нет решений»."],
      ["missed_single_point_solution", "Нужно отдельно разобрать системы, где ответ — одна точка, например x = 3."],
      ["wrong_endpoint", "Нужно вернуться к выбору границы на числовой прямой."],
      ["wrong_left_endpoint", "Нужно потренировать левую границу промежутка."],
      ["wrong_right_endpoint", "Нужно потренировать правую границу промежутка."],
      ["interval_side_error", "Стоит отдельно строить именно участок между двумя границами."],
      ["sign_transfer_error", "Нужна короткая серия на перенос с изменением знака."],
      ["minus_before_brackets_error", "Нужно повторить минус и отрицательный множитель перед скобками."],
      ["distribution_sign_error", "Стоит потренировать распределение множителя по каждому члену скобки."],
      ["negative_times_negative_error", "Нужно повторить правило: минус на минус даёт плюс."],
      ["combine_constants_error", "Полезно отдельно собирать числовые части без x."],
      ["copying_error", "Нужно замедлиться на переписывании строки без изменений."],
      ["attention_drift_error", "Нужны короткие задания на удержание знаков и коэффициентов в строке."],
      ["negative_division_flip_error", "Нужно отдельно тренировать деление неравенства на отрицательное число."]
    ];

    const sorted = rules
      .map(([type, text]) => ({ type, text, count: errorCounts[type] || 0 }))
      .sort((a, b) => b.count - a.count);

    if (!sorted[0] || sorted[0].count === 0) {
      return "Ошибок по ключевым типам пока нет. Можно переходить к следующей версии тренажёра.";
    }

    return sorted[0].text;
  }

  function buildReportText(report) {
    const errorLines = Object.entries(report.errorCounts)
      .map(([type, count]) => `${type} — ${count}`)
      .join("\n");

    return [
      "OGE RAID — отчёт по миссии №13",
      `Ученик: ${report.studentName}`,
      `Время: ${report.durationText}`,
      `Всего заданий: ${report.total}`,
      `Верно: ${report.correct}`,
      `Самостоятельно: ${report.independent}`,
      `С подсказкой: ${report.withHint}`,
      `Открывал теорию: ${report.openedTheory}`,
      `Показал решение: ${report.viewedSolution}`,
      "",
      "Ошибки по типам:",
      errorLines,
      "",
      "Вывод:",
      report.recommendation
    ].join("\n");
  }

  function copyReport() {
    const report = buildReport();
    const done = () => {
      state.feedback = { kind: "good", message: "Отчёт скопирован. Его можно отправить Game Master." };
      renderReport();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report.text).then(done).catch(() => fallbackCopy(report.text, done));
    } else {
      fallbackCopy(report.text, done);
    }
  }

  function fallbackCopy(text, done) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.className = "screen-reader-only";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    done();
  }

  function renderNumberLineSvg(graph, options = {}) {
    const width = options.compact ? 520 : 760;
    const height = options.compact ? 118 : 138;
    const pad = options.compact ? 34 : 44;
    const y = options.compact ? 56 : 66;
    const min = options.min ?? graph?.min ?? -6;
    const max = options.max ?? graph?.max ?? 6;
    const xFor = (value) => pad + ((value - min) / (max - min)) * (width - pad * 2);

    const endpoints = collectEndpoints(graph);
    const highlightValues = options.highlightValues || [];
    const ticks = collectTicks(min, max, [...endpoints, ...highlightValues], options.snapValues, options.compact);
    const labelTicks = selectVisibleTickLabels(ticks, [...endpoints, ...highlightValues], xFor, options.compact);

    if (options.interactive && options.lineKey) {
      lineConfigs[options.lineKey] = {
        min,
        max,
        pad,
        width,
        mode: options.mode,
        snapValues: options.snapValues
      };
    }

    const graphMarkup = graph ? renderGraphMarkup(graph, xFor, y, pad, width) : "";
    const dataAttrs = options.interactive ? `data-line-key="${escapeHtml(options.lineKey)}" data-line-mode="${escapeHtml(options.mode)}"` : "";

    return `
      <svg class="number-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="Числовая прямая" ${dataAttrs}>
        <line class="axis-line" x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}"></line>
        <polygon fill="#6d788d" points="${pad - 8},${y} ${pad + 4},${y - 6} ${pad + 4},${y + 6}"></polygon>
        <polygon fill="#6d788d" points="${width - pad + 8},${y} ${width - pad - 4},${y - 6} ${width - pad - 4},${y + 6}"></polygon>
        ${ticks
          .map((tick) => `
            <line class="tick-line" x1="${xFor(tick)}" y1="${y - 10}" x2="${xFor(tick)}" y2="${y + 10}"></line>
          `)
          .join("")}
        ${labelTicks
          .map((tick) => `
            <text class="tick-label" x="${xFor(tick)}" y="${y + 34}" text-anchor="middle">${escapeHtml(labelForTick(tick, graph, options))}</text>
          `)
          .join("")}
        ${graphMarkup}
        ${options.interactive ? `<rect class="hit-zone" x="${pad}" y="${y - 34}" width="${width - pad * 2}" height="68"></rect>` : ""}
      </svg>
    `;
  }

  function renderGraphMarkup(graph, xFor, y, pad, width) {
    if (!graph || graph.kind === "blank") return "";

    if (graph.kind === "ray") {
      const endpointX = xFor(graph.endpoint);
      const endX = graph.direction === "right" ? width - pad : pad;
      const arrow = graph.direction === "right"
        ? `<polygon class="solution-fill" points="${endX + 8},${y} ${endX - 6},${y - 8} ${endX - 6},${y + 8}"></polygon>`
        : `<polygon class="solution-fill" points="${endX - 8},${y} ${endX + 6},${y - 8} ${endX + 6},${y + 8}"></polygon>`;
      const pointClass = graph.pointType === "closed" ? "closed-point" : "open-point";
      return `
        <line class="solution-stroke" x1="${endpointX}" y1="${y}" x2="${endX}" y2="${y}"></line>
        ${arrow}
        <circle class="${pointClass}" cx="${endpointX}" cy="${y}" r="10"></circle>
      `;
    }

    if (graph.kind === "segment") {
      const leftX = xFor(graph.left);
      const rightX = xFor(graph.right);
      const leftClass = graph.leftType === "closed" ? "closed-point" : "open-point";
      const rightClass = graph.rightType === "closed" ? "closed-point" : "open-point";
      return `
        <line class="solution-stroke" x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}"></line>
        <circle class="${leftClass}" cx="${leftX}" cy="${y}" r="10"></circle>
        <circle class="${rightClass}" cx="${rightX}" cy="${y}" r="10"></circle>
      `;
    }

    if (graph.kind === "point") {
      const pointX = xFor(graph.endpoint);
      return `<circle class="target-point" cx="${pointX}" cy="${y}" r="10"></circle>`;
    }

    if (graph.kind === "empty") {
      return `<text class="line-empty-text" x="${(pad + width - pad) / 2}" y="${y - 18}" text-anchor="middle">нет общей части</text>`;
    }

    return "";
  }

  function collectEndpoints(graph) {
    if (!graph) return [];
    if (graph.kind === "ray" || graph.kind === "point") return [graph.endpoint];
    if (graph.kind === "segment") return [graph.left, graph.right];
    return [];
  }

  function collectTicks(min, max, endpoints, snapValues, compact) {
    const values = [];
    if (snapValues && !compact) {
      values.push(...snapValues);
    } else {
      for (let value = Math.ceil(min); value <= Math.floor(max); value += 1) {
        values.push(value);
      }
    }
    values.push(...endpoints);
    return uniqueSorted(values.filter((value) => value >= min && value <= max));
  }

  function buildDefaultSnapValues(min, max) {
    const values = [];
    for (let value = Math.ceil(min); value <= Math.floor(max); value += 1) values.push(value);
    return values.length ? values : [min, max];
  }

  function selectVisibleTickLabels(ticks, priorityValues, xFor, compact) {
    const minSpacing = compact ? 48 : 56;
    const prioritySet = new Set((priorityValues || []).map((value) => Number(value.toFixed(6))));
    const selected = [];
    const candidates = ticks
      .map((value, order) => ({
        value,
        order,
        x: xFor(value),
        priority: prioritySet.has(Number(value.toFixed(6))) ? 2 : 1
      }))
      .sort((a, b) => b.priority - a.priority || a.order - b.order);

    candidates.forEach((candidate) => {
      const tooClose = selected.some((item) => Math.abs(item.x - candidate.x) < minSpacing);
      if (!tooClose) selected.push(candidate);
    });

    return selected.sort((a, b) => a.order - b.order).map((item) => item.value);
  }

  function labelForTick(value, graph, options = {}) {
    const highlight = (options.highlightValues || []).find((item) => nearlyEqual(item, value));
    if (highlight !== undefined) return formatNumber(value);
    if (graph && graph.kind === "ray" && nearlyEqual(value, graph.endpoint) && graph.endpointLabel) return graph.endpointLabel;
    if (graph && graph.kind === "point" && nearlyEqual(value, graph.endpoint) && graph.endpointLabel) return graph.endpointLabel;
    return formatNumber(value);
  }

  function uniqueSorted(values) {
    return [...new Set(values.map((value) => Number(value.toFixed(6))))].sort((a, b) => a - b);
  }

  function formatGraphAnswer(graph) {
    if (!graph) return "";
    if (graph.kind === "ray") {
      return {
        kind: "ray",
        endpoint: graph.endpoint,
        pointType: graph.pointType,
        direction: graph.direction
      };
    }
    if (graph.kind === "segment") {
      return {
        kind: "segment",
        left: graph.left,
        right: graph.right,
        leftType: graph.leftType,
        rightType: graph.rightType
      };
    }
    if (graph.kind === "point") return { kind: "point", endpoint: graph.endpoint };
    if (graph.kind === "empty") return { kind: "empty" };
    return graph;
  }

  function graphsSame(a, b) {
    return evaluateGraphLike(a, b, {}).correct;
  }

  function buildRelationText(graph) {
    const sign = graph.direction === "right"
      ? graph.pointType === "closed" ? "≥" : ">"
      : graph.pointType === "closed" ? "≤" : "<";
    return `x ${sign} ${formatNumber(graph.endpoint)}`;
  }

  function parseNumberInput(raw) {
    const normalized = String(raw || "").trim().replace(",", ".").replace(/\s+/g, "");
    if (!normalized) return null;

    if (/^-?\d+\/-?\d+$/.test(normalized)) {
      const [numerator, denominator] = normalized.split("/").map(Number);
      if (denominator === 0) return null;
      return numerator / denominator;
    }

    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  function nearlyEqual(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.0001;
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (Number.isInteger(number)) return String(number);
    return String(Number(number.toFixed(2))).replace(".", ",");
  }

  function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    if (minutes <= 0) return `${rest} сек`;
    return `${minutes} мин ${rest} сек`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
