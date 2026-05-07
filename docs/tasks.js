const GOOGLE_SHEETS_ENDPOINT = "";

const OGE13_CONFIG = {
  studentNameDefault: "Ученик",
  missionTitle: "OGE RAID — миссия №13",
  storagePrefix: "oge13-trainer-v2"
};

const ray = (endpoint, pointType, direction, min = -6, max = 6, endpointLabel = "") => ({
  kind: "ray",
  endpoint,
  endpointLabel,
  pointType,
  direction,
  min,
  max
});

const segment = (left, right, leftType, rightType, min = -1, max = 8) => ({
  kind: "segment",
  left,
  right,
  leftType,
  rightType,
  min,
  max
});

const point = (endpoint, min = -3, max = 3, endpointLabel = "") => ({
  kind: "point",
  endpoint,
  endpointLabel,
  min,
  max
});

const emptyGraph = (min = -1, max = 6) => ({
  kind: "empty",
  min,
  max
});

const expectedRay = (from, direction, closed, min = -6, max = 6) => ({
  type: "ray",
  from,
  direction,
  closed,
  min,
  max
});

const expectedInterval = (left, right, leftClosed, rightClosed, min = -6, max = 6) => ({
  type: "interval",
  left,
  right,
  leftClosed,
  rightClosed,
  min,
  max
});

const expectedPoint = (from, min = -6, max = 6) => ({
  type: "point",
  from,
  closed: true,
  min,
  max
});

const expectedEmpty = (min = -6, max = 6) => ({
  type: "empty",
  min,
  max
});

const systemNotationOption = (label, value = label, errorTag = "") => ({
  label,
  value,
  errorTag
});

const OGE13_BLOCKS = [
  {
    id: "block-1",
    title: "Блок 1. Больше и меньше",
    shortTitle: "Больше/меньше",
    badge: "Разведка",
    theoryVisibleFor: 3,
    theory: [
      "x > 3: пустая точка на 3, штриховка вправо, 3 не входит.",
      "x ≥ 3: закрашенная точка на 3, штриховка вправо, 3 входит.",
      "x < 3: пустая точка на 3, штриховка влево, 3 не входит.",
      "x ≤ 3: закрашенная точка на 3, штриховка влево, 3 входит."
    ]
  },
  {
    id: "block-2",
    title: "Блок 2. Выбор правильного графика",
    shortTitle: "Графики",
    badge: "Прицел",
    theoryVisibleFor: 1,
    theory: [
      "Сначала найди число на прямой.",
      "Знак > или ≥ смотрит в сторону больших чисел, значит штриховка идёт вправо.",
      "Знак < или ≤ ведёт влево.",
      "Строгие знаки > и < дают пустую точку, нестрогие ≥ и ≤ дают закрашенную."
    ]
  },
  {
    id: "block-3",
    title: "Блок 3. Промежутки с бесконечностью",
    shortTitle: "Бесконечность",
    badge: "Коридор",
    theoryVisibleFor: 1,
    theory: [
      "(3; +∞) = больше 3, число 3 не входит.",
      "[3; +∞) = больше или равно 3, число 3 входит.",
      "(-∞; 3) = меньше 3, число 3 не входит.",
      "(-∞; 3] = меньше или равно 3, число 3 входит.",
      "Бесконечность всегда пишется с круглой скобкой."
    ]
  },
  {
    id: "block-4",
    title: "Блок 4. Отрезки и скобки",
    shortTitle: "Отрезки",
    badge: "Периметр",
    theoryVisibleFor: 1,
    theory: [
      "(2; 5): края не входят, обе точки пустые.",
      "[2; 5]: оба края входят, обе точки закрашенные.",
      "(2; 5]: 2 не входит, 5 входит.",
      "[2; 5): 2 входит, 5 не входит.",
      "Круглая скобка = пустая точка. Квадратная скобка = закрашенная точка."
    ]
  },
  {
    id: "block-5",
    title: "Блок 5. Дроби и десятичные числа",
    shortTitle: "Дроби",
    badge: "Калибровка",
    theoryVisibleFor: 1,
    theory: [
      "1/2 = 0,5.",
      "3/2 = 1,5.",
      "13/5 = 2,6.",
      "-11/10 = -1,1.",
      "На прямой правее находится большее число.",
      "У отрицательных чисел чем дальше влево, тем число меньше."
    ]
  },
  {
    id: "block-6",
    title: "Блок 6. Построй сам",
    shortTitle: "Построение",
    badge: "Руки",
    theoryVisibleFor: 1,
    theory: [
      "Выбери тип точки: пустая для строгого знака, закрашенная для нестрогого.",
      "Выбери число на прямой.",
      "Выбери направление: больше — вправо, меньше — влево.",
      "После этого нажми «Проверить»."
    ]
  },
  {
    id: "block-systems-overlap",
    title: "Блок 7. Системы: общая часть",
    shortTitle: "Общая часть",
    badge: "Перекрытие",
    theoryVisibleFor: 2,
    theory: [
      "Система значит: оба условия должны выполняться одновременно.",
      "Смотри, где две цветные штриховки накладываются друг на друга.",
      "Не складывай два ответа в объединение: нам нужна только общая часть.",
      "Если границы совпали, общей частью может быть одна точка.",
      "Если общей части нет, выбирай «общей части нет»."
    ]
  },
  {
    id: "block-systems-draw",
    title: "Блок 8. Системы: строю сам",
    shortTitle: "Строю систему",
    badge: "Конструктор",
    theoryVisibleFor: 1,
    theory: [
      "Сначала строим каждое условие отдельно.",
      "Потом строим только общую часть: то, что подходит обоим условиям сразу.",
      "Для луча нужна граница, тип точки и направление.",
      "Для промежутка нужны две границы и включённость каждой точки.",
      "Если общей части нет, выбираем отдельный ответ «нет решений»."
    ]
  },
  {
    id: "block-algebra-micro",
    title: "Блок 9. Антиошибки в алгебре",
    shortTitle: "Антиошибки",
    badge: "Контроль",
    theoryVisibleFor: 1,
    theory: [
      "Сначала контролируем один маленький шаг, а не всю задачу сразу.",
      "Минус перед скобкой меняет знаки внутри.",
      "При переносе через знак равенства число меняет знак.",
      "Числовые части складываем отдельно от x-части.",
      "Каждую строку переписываем внимательно, без потери знаков и коэффициентов."
    ]
  },
  {
    id: "block-7",
    title: "Блок 10. Первые линейные неравенства",
    shortTitle: "Линейные",
    badge: "Алгебра",
    theoryVisibleFor: 1,
    theory: [
      "Сначала приведи неравенство к виду x ... число.",
      "Если переносишь число через знак равенства или неравенства, меняй его знак.",
      "В этих заданиях мы не умножаем и не делим на отрицательное число, поэтому знак неравенства не переворачивается.",
      "После алгебры нужно построить ответ на числовой прямой."
    ]
  },
  {
    id: "block-8",
    title: "Блок 11. Самые базовые системы",
    shortTitle: "Системы",
    badge: "Финал",
    theoryVisibleFor: 1,
    theory: [
      "Система значит, что оба условия должны выполняться сразу.",
      "Решение системы — это общая часть двух штриховок.",
      "Если общей части нет, ответ: нет решений.",
      "Сначала построй первое неравенство, потом второе, затем выбери пересечение."
    ]
  }
];

const OGE13_TASKS = [
  {
    id: "b1-t1",
    blockId: "block-1",
    type: "graph_choice",
    prompt: "Выбери график для x > 3.",
    expression: "x > 3",
    correct: ray(3, "open", "right", -1, 7),
    options: [
      { label: "A", graph: ray(3, "open", "right", -1, 7) },
      { label: "B", graph: ray(3, "closed", "right", -1, 7) },
      { label: "C", graph: ray(3, "open", "left", -1, 7) },
      { label: "D", graph: ray(4, "open", "right", -1, 7) }
    ],
    hint: "Больше — это вправо. Строгий знак > даёт пустую точку.",
    solution: "x > 3: ставим пустую точку на 3 и штрихуем вправо, потому что подходят числа больше 3.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b1-t2",
    blockId: "block-1",
    type: "graph_choice",
    prompt: "Выбери график для x ≥ 3.",
    expression: "x ≥ 3",
    correct: ray(3, "closed", "right", -1, 7),
    options: [
      { label: "A", graph: ray(3, "open", "right", -1, 7) },
      { label: "B", graph: ray(3, "closed", "right", -1, 7) },
      { label: "C", graph: ray(3, "closed", "left", -1, 7) },
      { label: "D", graph: ray(2, "closed", "right", -1, 7) }
    ],
    hint: "Знак ≥ значит, что число 3 входит. Поэтому точка закрашенная.",
    solution: "x ≥ 3: ставим закрашенную точку на 3 и штрихуем вправо.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b1-t3",
    blockId: "block-1",
    type: "graph_choice",
    prompt: "Выбери график для x < 3.",
    expression: "x < 3",
    correct: ray(3, "open", "left", -1, 7),
    options: [
      { label: "A", graph: ray(3, "open", "right", -1, 7) },
      { label: "B", graph: ray(3, "closed", "left", -1, 7) },
      { label: "C", graph: ray(3, "open", "left", -1, 7) },
      { label: "D", graph: ray(4, "open", "left", -1, 7) }
    ],
    hint: "Меньше — это влево. Строгий знак < даёт пустую точку.",
    solution: "x < 3: ставим пустую точку на 3 и штрихуем влево.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b1-t4",
    blockId: "block-1",
    type: "graph_choice",
    prompt: "Выбери график для x ≤ 3.",
    expression: "x ≤ 3",
    correct: ray(3, "closed", "left", -1, 7),
    options: [
      { label: "A", graph: ray(3, "closed", "right", -1, 7) },
      { label: "B", graph: ray(3, "open", "left", -1, 7) },
      { label: "C", graph: ray(2, "closed", "left", -1, 7) },
      { label: "D", graph: ray(3, "closed", "left", -1, 7) }
    ],
    hint: "Знак ≤ значит «меньше или равно»: влево и с закрашенной точкой.",
    solution: "x ≤ 3: ставим закрашенную точку на 3 и штрихуем влево.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b2-t1",
    blockId: "block-2",
    type: "graph_choice",
    prompt: "Выбери правильный график для x > 5.",
    expression: "x > 5",
    correct: ray(5, "open", "right", 0, 8),
    options: [
      { label: "A", graph: ray(5, "open", "left", 0, 8) },
      { label: "B", graph: ray(5, "closed", "right", 0, 8) },
      { label: "C", graph: ray(5, "open", "right", 0, 8) },
      { label: "D", graph: ray(4, "open", "right", 0, 8) }
    ],
    hint: "Знак > — вправо, точка пустая.",
    solution: "Для x > 5 точка на 5 пустая, штриховка идёт вправо.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b2-t2",
    blockId: "block-2",
    type: "graph_choice",
    prompt: "Выбери правильный график для x ≥ -2.",
    expression: "x ≥ -2",
    correct: ray(-2, "closed", "right", -5, 4),
    options: [
      { label: "A", graph: ray(-2, "closed", "right", -5, 4) },
      { label: "B", graph: ray(-2, "open", "right", -5, 4) },
      { label: "C", graph: ray(-2, "closed", "left", -5, 4) },
      { label: "D", graph: ray(-3, "closed", "right", -5, 4) }
    ],
    hint: "≥ означает «больше или равно»: вправо и точка закрашенная.",
    solution: "x ≥ -2: число -2 входит, поэтому точка закрашенная, а штриховка направлена вправо.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b2-t3",
    blockId: "block-2",
    type: "graph_choice",
    prompt: "Выбери правильный график для x < 0.",
    expression: "x < 0",
    correct: ray(0, "open", "left", -4, 4),
    options: [
      { label: "A", graph: ray(0, "open", "right", -4, 4) },
      { label: "B", graph: ray(0, "closed", "left", -4, 4) },
      { label: "C", graph: ray(1, "open", "left", -4, 4) },
      { label: "D", graph: ray(0, "open", "left", -4, 4) }
    ],
    hint: "Меньше нуля — это все числа слева от 0.",
    solution: "x < 0: точка на 0 пустая, штриховка идёт влево.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b2-t4",
    blockId: "block-2",
    type: "graph_choice",
    prompt: "Выбери правильный график для x ≤ 4.",
    expression: "x ≤ 4",
    correct: ray(4, "closed", "left", 0, 8),
    options: [
      { label: "A", graph: ray(4, "closed", "left", 0, 8) },
      { label: "B", graph: ray(4, "open", "left", 0, 8) },
      { label: "C", graph: ray(4, "closed", "right", 0, 8) },
      { label: "D", graph: ray(5, "closed", "left", 0, 8) }
    ],
    hint: "≤ — это «меньше или равно»: влево и точка закрашенная.",
    solution: "x ≤ 4: число 4 входит, значит точка закрашенная, штриховка влево.",
    pointErrorType: "point_error",
    bothErrorEnabled: true
  },
  {
    id: "b3-t1",
    blockId: "block-3",
    type: "graph_choice",
    prompt: "Выбери график для промежутка [3; +∞).",
    expression: "[3; +∞)",
    correct: ray(3, "closed", "right", -1, 7),
    options: [
      { label: "A", graph: ray(3, "open", "right", -1, 7) },
      { label: "B", graph: ray(3, "closed", "right", -1, 7) },
      { label: "C", graph: ray(3, "closed", "left", -1, 7) },
      { label: "D", graph: ray(2, "closed", "right", -1, 7) }
    ],
    hint: "Квадратная скобка у 3 значит, что 3 входит. +∞ указывает вправо.",
    solution: "[3; +∞) означает x ≥ 3: закрашенная точка на 3 и штриховка вправо.",
    pointErrorType: "bracket_error"
  },
  {
    id: "b3-t2",
    blockId: "block-3",
    type: "graph_choice",
    prompt: "Выбери график для промежутка (-∞; -2).",
    expression: "(-∞; -2)",
    correct: ray(-2, "open", "left", -6, 2),
    options: [
      { label: "A", graph: ray(-2, "closed", "left", -6, 2) },
      { label: "B", graph: ray(-2, "open", "right", -6, 2) },
      { label: "C", graph: ray(-2, "open", "left", -6, 2) },
      { label: "D", graph: ray(-1, "open", "left", -6, 2) }
    ],
    hint: "Если -∞ слева, штриховка идёт влево. Круглая скобка у -2 даёт пустую точку.",
    solution: "(-∞; -2) означает x < -2: пустая точка на -2 и штриховка влево.",
    pointErrorType: "bracket_error"
  },
  {
    id: "b3-t3",
    blockId: "block-3",
    type: "notation_choice",
    prompt: "Выбери запись по графику: закрашенная точка на 3, штриховка вправо.",
    stimulusGraph: ray(3, "closed", "right", -1, 7),
    correct: ray(3, "closed", "right", -1, 7),
    options: [
      { label: "(3; +∞)", graph: ray(3, "open", "right", -1, 7) },
      { label: "[3; +∞)", graph: ray(3, "closed", "right", -1, 7) },
      { label: "(-∞; 3]", graph: ray(3, "closed", "left", -1, 7) },
      { label: "[2; +∞)", graph: ray(2, "closed", "right", -1, 7) }
    ],
    hint: "Закрашенная точка — квадратная скобка. Вправо — это +∞.",
    solution: "Закрашенная точка на 3 и штриховка вправо дают запись [3; +∞).",
    pointErrorType: "bracket_error"
  },
  {
    id: "b3-t4",
    blockId: "block-3",
    type: "notation_choice",
    prompt: "Выбери запись по графику: пустая точка на -2, штриховка влево.",
    stimulusGraph: ray(-2, "open", "left", -6, 2),
    correct: ray(-2, "open", "left", -6, 2),
    options: [
      { label: "(-∞; -2)", graph: ray(-2, "open", "left", -6, 2) },
      { label: "(-∞; -2]", graph: ray(-2, "closed", "left", -6, 2) },
      { label: "(-2; +∞)", graph: ray(-2, "open", "right", -6, 2) },
      { label: "(-∞; -3)", graph: ray(-3, "open", "left", -6, 2) }
    ],
    hint: "Влево значит, что -∞ будет слева. Пустая точка — круглая скобка у -2.",
    solution: "Пустая точка на -2 и штриховка влево дают запись (-∞; -2).",
    pointErrorType: "bracket_error"
  },
  {
    id: "b4-t1",
    blockId: "block-4",
    type: "segment_choice",
    prompt: "Выбери график для промежутка (2; 5).",
    expression: "(2; 5)",
    correct: segment(2, 5, "open", "open", 0, 7),
    options: [
      { label: "A", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "B", graph: segment(2, 5, "closed", "closed", 0, 7) },
      { label: "C", graph: segment(2, 5, "open", "closed", 0, 7) },
      { label: "D", graph: segment(1, 5, "open", "open", 0, 7) }
    ],
    hint: "Круглые скобки с обеих сторон — обе точки пустые.",
    solution: "(2; 5): закрашиваем участок между 2 и 5, но точки 2 и 5 оставляем пустыми."
  },
  {
    id: "b4-t2",
    blockId: "block-4",
    type: "segment_choice",
    prompt: "Выбери график для промежутка [2; 5].",
    expression: "[2; 5]",
    correct: segment(2, 5, "closed", "closed", 0, 7),
    options: [
      { label: "A", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "B", graph: segment(2, 5, "closed", "closed", 0, 7) },
      { label: "C", graph: segment(2, 5, "closed", "open", 0, 7) },
      { label: "D", graph: segment(2, 6, "closed", "closed", 0, 7) }
    ],
    hint: "Квадратные скобки — обе точки входят.",
    solution: "[2; 5]: участок между 2 и 5, обе точки закрашенные."
  },
  {
    id: "b4-t3",
    blockId: "block-4",
    type: "segment_choice",
    prompt: "Выбери график для промежутка (2; 5].",
    expression: "(2; 5]",
    correct: segment(2, 5, "open", "closed", 0, 7),
    options: [
      { label: "A", graph: segment(2, 5, "closed", "open", 0, 7) },
      { label: "B", graph: segment(2, 5, "open", "closed", 0, 7) },
      { label: "C", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "D", graph: segment(3, 5, "open", "closed", 0, 7) }
    ],
    hint: "У 2 круглая скобка, у 5 квадратная.",
    solution: "(2; 5]: точка 2 пустая, точка 5 закрашенная, участок между ними выделен."
  },
  {
    id: "b4-t4",
    blockId: "block-4",
    type: "notation_choice",
    prompt: "Выбери запись по графику: точка 2 закрашенная, точка 5 пустая, выделен участок между ними.",
    stimulusGraph: segment(2, 5, "closed", "open", 0, 7),
    correct: segment(2, 5, "closed", "open", 0, 7),
    options: [
      { label: "(2; 5)", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "[2; 5]", graph: segment(2, 5, "closed", "closed", 0, 7) },
      { label: "(2; 5]", graph: segment(2, 5, "open", "closed", 0, 7) },
      { label: "[2; 5)", graph: segment(2, 5, "closed", "open", 0, 7) }
    ],
    hint: "Закрашенная точка — квадратная скобка, пустая — круглая.",
    solution: "2 входит, поэтому слева [ . 5 не входит, поэтому справа ). Ответ: [2; 5).",
    pointErrorType: "bracket_error"
  },
  {
    id: "b5-t1",
    blockId: "block-5",
    type: "text_choice",
    prompt: "Что правее на числовой прямой: 2 или 13/5?",
    options: [
      { label: "2", value: "2" },
      { label: "13/5", value: "13/5" }
    ],
    correctValue: "13/5",
    correctAnswerText: "13/5 = 2,6, поэтому оно правее числа 2.",
    hint: "Переведи 13/5 в десятичное число: 13 : 5 = 2,6.",
    solution: "13/5 = 2,6. Число 2,6 правее числа 2.",
    errorType: "fraction_order_error"
  },
  {
    id: "b5-t2",
    blockId: "block-5",
    type: "text_choice",
    prompt: "Что левее на числовой прямой: -1 или -1,5?",
    options: [
      { label: "-1", value: "-1" },
      { label: "-1,5", value: "-1.5" }
    ],
    correctValue: "-1.5",
    correctAnswerText: "-1,5 левее, потому что среди отрицательных чисел оно меньше.",
    hint: "У отрицательных чисел дальше влево находится меньшее число.",
    solution: "-1,5 меньше, чем -1, поэтому -1,5 находится левее.",
    errorType: "fraction_order_error"
  },
  {
    id: "b5-t3",
    blockId: "block-5",
    type: "point_placement",
    prompt: "Поставь точку -0,6 на числовой прямой.",
    targetPoint: point(-0.6, -2, 2, "-0,6"),
    snapValues: [-2, -1.5, -1.1, -1, -0.6, -0.5, 0, 0.5, 1, 1.5, 2],
    hint: "-0,6 находится левее нуля, но правее -1.",
    solution: "-0,6 — отрицательное число. Оно стоит между -1 и 0, ближе к -0,5.",
    errorType: "fraction_order_error"
  },
  {
    id: "b5-t4",
    blockId: "block-5",
    type: "graph_choice",
    prompt: "Выбери график для x > 13/5.",
    expression: "x > 13/5",
    correct: ray(2.6, "open", "right", 0, 4, "13/5"),
    options: [
      { label: "A", graph: ray(2.6, "open", "right", 0, 4, "13/5") },
      { label: "B", graph: ray(2.6, "closed", "right", 0, 4, "13/5") },
      { label: "C", graph: ray(2.6, "open", "left", 0, 4, "13/5") },
      { label: "D", graph: ray(2, "open", "right", 0, 4) }
    ],
    hint: "13/5 = 2,6. Знак > значит вправо, точка пустая.",
    solution: "13/5 = 2,6. Для x > 2,6 нужна пустая точка на 2,6 и штриховка вправо.",
    pointErrorType: "point_error"
  },
  {
    id: "b5-t5",
    blockId: "block-5",
    type: "graph_choice",
    prompt: "Выбери график для x ≤ -11/10.",
    expression: "x ≤ -11/10",
    correct: ray(-1.1, "closed", "left", -3, 1, "-11/10"),
    options: [
      { label: "A", graph: ray(-1.1, "closed", "right", -3, 1, "-11/10") },
      { label: "B", graph: ray(-1.1, "open", "left", -3, 1, "-11/10") },
      { label: "C", graph: ray(-1.1, "closed", "left", -3, 1, "-11/10") },
      { label: "D", graph: ray(-1, "closed", "left", -3, 1) }
    ],
    hint: "-11/10 = -1,1. Знак ≤ значит влево и с закрашенной точкой.",
    solution: "-11/10 = -1,1. Для x ≤ -1,1 нужна закрашенная точка на -1,1 и штриховка влево.",
    pointErrorType: "point_error"
  },
  {
    id: "b6-t1",
    blockId: "block-6",
    type: "build_ray",
    prompt: "Построй на прямой x ≥ -2.",
    expression: "x ≥ -2",
    correct: ray(-2, "closed", "right", -5, 4),
    snapValues: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4],
    hint: "≥: точка закрашенная, направление вправо.",
    solution: "Для x ≥ -2 ставим закрашенную точку на -2 и штрихуем вправо."
  },
  {
    id: "b6-t2",
    blockId: "block-6",
    type: "build_ray",
    prompt: "Построй на прямой x < 4.",
    expression: "x < 4",
    correct: ray(4, "open", "left", -1, 7),
    snapValues: [-1, 0, 1, 2, 3, 4, 5, 6, 7],
    hint: "<: точка пустая, направление влево.",
    solution: "Для x < 4 ставим пустую точку на 4 и штрихуем влево."
  },
  {
    id: "b6-t3",
    blockId: "block-6",
    type: "build_ray",
    prompt: "Построй на прямой x > 1,5.",
    expression: "x > 1,5",
    correct: ray(1.5, "open", "right", -1, 4),
    snapValues: [-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 4],
    hint: "> означает вправо. 1,5 не входит, поэтому точка пустая.",
    solution: "Для x > 1,5 ставим пустую точку на 1,5 и штрихуем вправо."
  },
  {
    id: "b6-t4",
    blockId: "block-6",
    type: "build_ray",
    prompt: "Построй на прямой x ≤ -0,6.",
    expression: "x ≤ -0,6",
    correct: ray(-0.6, "closed", "left", -2, 2, "-0,6"),
    snapValues: [-2, -1.5, -1.1, -1, -0.6, -0.5, 0, 0.5, 1, 1.5, 2],
    hint: "≤ означает влево и с закрашенной точкой. -0,6 стоит между -1 и 0.",
    solution: "Для x ≤ -0,6 ставим закрашенную точку на -0,6 и штрихуем влево."
  },
  {
    id: "sys-overlap-t1",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x > 2 и x < 5.",
    systemLabel: "x > 2 и x < 5",
    first: { label: "x > 2", graph: ray(2, "open", "right", 0, 7) },
    second: { label: "x < 5", graph: ray(5, "open", "left", 0, 7) },
    bounds: [2, 5],
    min: 0,
    max: 7,
    correctZone: "middle",
    correctNotation: "(2; 5)",
    correctGraph: segment(2, 5, "open", "open", 0, 7),
    checkNumber: "3",
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      leftPoint: "only_second_condition_error",
      rightPoint: "only_first_condition_error",
      rightRay: "only_first_condition_error",
      none: "false_no_solution_error"
    },
    notationOptions: [
      systemNotationOption("(2; 5)"),
      systemNotationOption("[2; 5]", "[2; 5]", "endpoint_inclusion_error"),
      systemNotationOption("(2; +∞)", "(2; +∞)", "only_first_condition_error"),
      systemNotationOption("(-∞; 5)", "(-∞; 5)", "only_second_condition_error"),
      systemNotationOption("Нет решений", "Нет решений", "false_no_solution_error")
    ],
    hint: "Ищи не то, что подходит хотя бы одному условию, а только место, где две штриховки лежат друг на друге.",
    solution: "x > 2 даёт правую штриховку от 2.\nx < 5 даёт левую штриховку от 5.\nНакладываются они между 2 и 5. Оба края строгие, значит ответ: (2; 5)."
  },
  {
    id: "sys-overlap-t2",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x < 2 и x > 5.",
    systemLabel: "x < 2 и x > 5",
    first: { label: "x < 2", graph: ray(2, "open", "left", 0, 7) },
    second: { label: "x > 5", graph: ray(5, "open", "right", 0, 7) },
    bounds: [2, 5],
    min: 0,
    max: 7,
    correctZone: "none",
    correctNotation: "Нет решений",
    correctGraph: emptyGraph(0, 7),
    zoneErrorTags: {
      leftRay: "only_first_condition_error",
      leftPoint: "endpoint_inclusion_error",
      middle: "intersection_error",
      rightPoint: "endpoint_inclusion_error",
      rightRay: "only_second_condition_error"
    },
    notationOptions: [
      systemNotationOption("Нет решений"),
      systemNotationOption("(-∞; 2)", "(-∞; 2)", "only_first_condition_error"),
      systemNotationOption("(5; +∞)", "(5; +∞)", "only_second_condition_error"),
      systemNotationOption("(-∞; 2) ∪ (5; +∞)", "(-∞; 2) ∪ (5; +∞)", "system_union_instead_intersection_error"),
      systemNotationOption("(2; 5)", "(2; 5)", "intersection_error")
    ],
    hint: "Проверь: можно ли одновременно быть левее 2 и правее 5?",
    solution: "x < 2 лежит слева от 2.\nx > 5 лежит справа от 5.\nЭти штриховки не перекрываются. Общей части нет."
  },
  {
    id: "sys-overlap-t3",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x > 2 и x > 5.",
    systemLabel: "x > 2 и x > 5",
    first: { label: "x > 2", graph: ray(2, "open", "right", 0, 8) },
    second: { label: "x > 5", graph: ray(5, "open", "right", 0, 8) },
    bounds: [2, 5],
    min: 0,
    max: 8,
    correctZone: "rightRay",
    correctNotation: "(5; +∞)",
    correctGraph: ray(5, "open", "right", 0, 8),
    checkNumber: "6",
    zoneErrorTags: {
      leftRay: "intersection_error",
      leftPoint: "intersection_error",
      middle: "only_first_condition_error",
      rightPoint: "endpoint_inclusion_error",
      none: "false_no_solution_error"
    },
    notationOptions: [
      systemNotationOption("(5; +∞)"),
      systemNotationOption("(2; +∞)", "(2; +∞)", "only_first_condition_error"),
      systemNotationOption("[5; +∞)", "[5; +∞)", "endpoint_inclusion_error"),
      systemNotationOption("(2; +∞) ∪ (5; +∞)", "(2; +∞) ∪ (5; +∞)", "system_union_instead_intersection_error"),
      systemNotationOption("Нет решений", "Нет решений", "false_no_solution_error")
    ],
    hint: "Если нужно быть больше 2 и больше 5, сильнее ограничение «больше 5».",
    solution: "Все числа правее 5 автоматически больше 2. Поэтому общая часть: (5; +∞). Точка 5 не входит, потому что x > 5 строгое."
  },
  {
    id: "sys-overlap-t4",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x < 2 и x < 5.",
    systemLabel: "x < 2 и x < 5",
    first: { label: "x < 2", graph: ray(2, "open", "left", -1, 7) },
    second: { label: "x < 5", graph: ray(5, "open", "left", -1, 7) },
    bounds: [2, 5],
    min: -1,
    max: 7,
    correctZone: "leftRay",
    correctNotation: "(-∞; 2)",
    correctGraph: ray(2, "open", "left", -1, 7),
    checkNumber: "1",
    zoneErrorTags: {
      leftPoint: "endpoint_inclusion_error",
      middle: "only_second_condition_error",
      rightPoint: "only_second_condition_error",
      rightRay: "intersection_error",
      none: "false_no_solution_error"
    },
    notationOptions: [
      systemNotationOption("(-∞; 2)"),
      systemNotationOption("(-∞; 5)", "(-∞; 5)", "only_second_condition_error"),
      systemNotationOption("(-∞; 2]", "(-∞; 2]", "endpoint_inclusion_error"),
      systemNotationOption("(-∞; 2) ∪ (-∞; 5)", "(-∞; 2) ∪ (-∞; 5)", "system_union_instead_intersection_error"),
      systemNotationOption("Нет решений", "Нет решений", "false_no_solution_error")
    ],
    hint: "Если нужно быть меньше 2 и меньше 5, сильнее ограничение «меньше 2».",
    solution: "Все числа левее 2 одновременно меньше 2 и меньше 5. Поэтому общая часть: (-∞; 2)."
  },
  {
    id: "sys-overlap-t5",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x ≥ 2 и x < 5.",
    systemLabel: "x ≥ 2 и x < 5",
    first: { label: "x ≥ 2", graph: ray(2, "closed", "right", 0, 7) },
    second: { label: "x < 5", graph: ray(5, "open", "left", 0, 7) },
    bounds: [2, 5],
    min: 0,
    max: 7,
    correctZone: "middle",
    correctNotation: "[2; 5)",
    correctGraph: segment(2, 5, "closed", "open", 0, 7),
    checkNumber: "3",
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      leftPoint: "endpoint_inclusion_error",
      rightPoint: "only_first_condition_error",
      rightRay: "only_first_condition_error",
      none: "false_no_solution_error"
    },
    notationOptions: [
      systemNotationOption("[2; 5)"),
      systemNotationOption("(2; 5)", "(2; 5)", "endpoint_inclusion_error"),
      systemNotationOption("[2; 5]", "[2; 5]", "endpoint_inclusion_error"),
      systemNotationOption("(2; 5]", "(2; 5]", "endpoint_inclusion_error"),
      systemNotationOption("Нет решений", "Нет решений", "false_no_solution_error")
    ],
    hint: "Середина между 2 и 5 общая. Теперь проверь края: у 2 есть равно, у 5 строгий знак.",
    solution: "2 входит, потому что x ≥ 2. 5 не входит, потому что x < 5. Общая часть: [2; 5)."
  },
  {
    id: "sys-overlap-t6",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x > 2 и x ≤ 5.",
    systemLabel: "x > 2 и x ≤ 5",
    first: { label: "x > 2", graph: ray(2, "open", "right", 0, 7) },
    second: { label: "x ≤ 5", graph: ray(5, "closed", "left", 0, 7) },
    bounds: [2, 5],
    min: 0,
    max: 7,
    correctZone: "middle",
    correctNotation: "(2; 5]",
    correctGraph: segment(2, 5, "open", "closed", 0, 7),
    checkNumber: "3",
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      leftPoint: "only_second_condition_error",
      rightPoint: "endpoint_inclusion_error",
      rightRay: "only_first_condition_error",
      none: "false_no_solution_error"
    },
    notationOptions: [
      systemNotationOption("(2; 5]"),
      systemNotationOption("(2; 5)", "(2; 5)", "endpoint_inclusion_error"),
      systemNotationOption("[2; 5]", "[2; 5]", "endpoint_inclusion_error"),
      systemNotationOption("[2; 5)", "[2; 5)", "endpoint_inclusion_error"),
      systemNotationOption("Нет решений", "Нет решений", "false_no_solution_error")
    ],
    hint: "Середина между 2 и 5 общая. Теперь проверь края: 2 строго не входит, 5 входит.",
    solution: "2 не входит, потому что x > 2. 5 входит, потому что x ≤ 5. Общая часть: (2; 5]."
  },
  {
    id: "sys-overlap-t7",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x ≥ 3 и x ≤ 3.",
    systemLabel: "x ≥ 3 и x ≤ 3",
    first: { label: "x ≥ 3", graph: ray(3, "closed", "right", 0, 6) },
    second: { label: "x ≤ 3", graph: ray(3, "closed", "left", 0, 6) },
    bounds: [3, 3],
    min: 0,
    max: 6,
    correctZone: "singlePoint",
    correctNotation: "x = 3",
    correctGraph: point(3, 0, 6),
    checkNumber: "3",
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      rightRay: "only_first_condition_error",
      none: "missed_single_point_solution"
    },
    notationOptions: [
      systemNotationOption("x = 3"),
      systemNotationOption("(3; +∞)", "(3; +∞)", "only_first_condition_error"),
      systemNotationOption("(-∞; 3)", "(-∞; 3)", "only_second_condition_error"),
      systemNotationOption("(3; 3)", "(3; 3)", "missed_single_point_solution"),
      systemNotationOption("Нет решений", "Нет решений", "missed_single_point_solution")
    ],
    hint: "Когда обе границы равны 3 и обе точки закрашены, общая часть может быть одной точкой.",
    solution: "x ≥ 3 разрешает 3 и всё правее. x ≤ 3 разрешает 3 и всё левее. Общая часть у них только одна точка: x = 3."
  },
  {
    id: "sys-overlap-t8",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x > 3 и x ≤ 3.",
    systemLabel: "x > 3 и x ≤ 3",
    first: { label: "x > 3", graph: ray(3, "open", "right", 0, 6) },
    second: { label: "x ≤ 3", graph: ray(3, "closed", "left", 0, 6) },
    bounds: [3, 3],
    min: 0,
    max: 6,
    correctZone: "none",
    correctNotation: "Нет решений",
    correctGraph: emptyGraph(0, 6),
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      singlePoint: "only_second_condition_error",
      rightRay: "only_first_condition_error"
    },
    notationOptions: [
      systemNotationOption("Нет решений"),
      systemNotationOption("x = 3", "x = 3", "only_second_condition_error"),
      systemNotationOption("(3; +∞)", "(3; +∞)", "only_first_condition_error"),
      systemNotationOption("(-∞; 3]", "(-∞; 3]", "only_second_condition_error"),
      systemNotationOption("(3; +∞) ∪ (-∞; 3]", "(3; +∞) ∪ (-∞; 3]", "system_union_instead_intersection_error")
    ],
    hint: "Число 3 не подходит первому условию, а числа правее 3 не подходят второму.",
    solution: "x > 3 начинается правее 3 и не включает 3. x ≤ 3 заканчивается на 3. Перекрытия нет."
  },
  {
    id: "sys-overlap-t9",
    blockId: "block-systems-overlap",
    type: "system_overlap",
    prompt: "Найди общую часть: x ≥ 3 и x < 3.",
    systemLabel: "x ≥ 3 и x < 3",
    first: { label: "x ≥ 3", graph: ray(3, "closed", "right", 0, 6) },
    second: { label: "x < 3", graph: ray(3, "open", "left", 0, 6) },
    bounds: [3, 3],
    min: 0,
    max: 6,
    correctZone: "none",
    correctNotation: "Нет решений",
    correctGraph: emptyGraph(0, 6),
    zoneErrorTags: {
      leftRay: "only_second_condition_error",
      singlePoint: "only_first_condition_error",
      rightRay: "only_first_condition_error"
    },
    notationOptions: [
      systemNotationOption("Нет решений"),
      systemNotationOption("x = 3", "x = 3", "only_first_condition_error"),
      systemNotationOption("[3; +∞)", "[3; +∞)", "only_first_condition_error"),
      systemNotationOption("(-∞; 3)", "(-∞; 3)", "only_second_condition_error"),
      systemNotationOption("[3; +∞) ∪ (-∞; 3)", "[3; +∞) ∪ (-∞; 3)", "system_union_instead_intersection_error")
    ],
    hint: "Число 3 подходит первому условию, но не подходит второму. Левее 3 не подходит первому.",
    solution: "x ≥ 3 включает 3 и правую сторону. x < 3 лежит строго слева от 3. Перекрытия нет."
  },
  {
    id: "draw-ray-t1",
    blockId: "block-systems-draw",
    type: "number_line_draw_ray",
    prompt: "Построй луч для x > 3.",
    expression: "x > 3",
    expected: expectedRay(3, "right", false, 0, 7),
    correct: ray(3, "open", "right", 0, 7),
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7],
    endpointErrorType: "wrong_endpoint",
    pointErrorType: "endpoint_inclusion_error",
    hint: "Для x > 3 граница 3, точка пустая, направление вправо.",
    solution: "Кликаем 3, выбираем пустую точку и направление вправо."
  },
  {
    id: "draw-ray-t2",
    blockId: "block-systems-draw",
    type: "number_line_draw_ray",
    prompt: "Построй луч для x ≤ -2.",
    expression: "x ≤ -2",
    expected: expectedRay(-2, "left", true, -5, 3),
    correct: ray(-2, "closed", "left", -5, 3),
    snapValues: [-5, -4, -3, -2, -1, 0, 1, 2, 3],
    endpointErrorType: "wrong_endpoint",
    pointErrorType: "endpoint_inclusion_error",
    hint: "Для x ≤ -2 граница -2, точка закрашенная, направление влево.",
    solution: "Кликаем -2, выбираем закрашенную точку и направление влево."
  },
  {
    id: "draw-interval-t1",
    blockId: "block-systems-draw",
    type: "number_line_draw_interval",
    prompt: "Построй промежуток -2 < x ≤ 5.",
    expression: "-2 < x ≤ 5",
    expected: expectedInterval(-2, 5, false, true, -4, 7),
    correct: segment(-2, 5, "open", "closed", -4, 7),
    snapValues: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
    hint: "Левая граница -2 не входит, правая граница 5 входит. Выделить нужно участок между ними.",
    solution: "Ставим пустую точку на -2, закрашенную точку на 5 и выделяем участок между ними."
  },
  {
    id: "draw-interval-t2",
    blockId: "block-systems-draw",
    type: "number_line_draw_interval",
    prompt: "Построй промежуток [2; 5].",
    expression: "[2; 5]",
    expected: expectedInterval(2, 5, true, true, 0, 7),
    correct: segment(2, 5, "closed", "closed", 0, 7),
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7],
    hint: "Квадратные скобки означают, что обе точки входят.",
    solution: "Ставим закрашенные точки на 2 и 5 и выделяем участок между ними."
  },
  {
    id: "system-draw-t1",
    blockId: "block-systems-draw",
    type: "system_draw_two_conditions",
    prompt: "Построй систему: x > 2 и x < 5.",
    systemLabel: "x > 2 и x < 5",
    inequalities: [
      { label: "x > 2", correct: ray(2, "open", "right", 0, 7), snapValues: [0, 1, 2, 3, 4, 5, 6, 7] },
      { label: "x < 5", correct: ray(5, "open", "left", 0, 7), snapValues: [0, 1, 2, 3, 4, 5, 6, 7] }
    ],
    expected: expectedInterval(2, 5, false, false, 0, 7),
    finalCorrect: segment(2, 5, "open", "open", 0, 7),
    finalAllowedTypes: ["interval", "ray", "point", "empty"],
    finalDefaultType: "interval",
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7],
    checkNumber: "3",
    hint: "Сначала две прямые отдельно, потом на третьей прямой только участок, где они пересеклись.",
    solution: "Первое условие даёт луч вправо от 2. Второе — луч влево от 5. Общая часть между ними: (2; 5)."
  },
  {
    id: "system-draw-t2",
    blockId: "block-systems-draw",
    type: "system_draw_two_conditions",
    prompt: "Построй систему: x > 2 и x > 5.",
    systemLabel: "x > 2 и x > 5",
    inequalities: [
      { label: "x > 2", correct: ray(2, "open", "right", 0, 8), snapValues: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { label: "x > 5", correct: ray(5, "open", "right", 0, 8), snapValues: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
    ],
    expected: expectedRay(5, "right", false, 0, 8),
    finalCorrect: ray(5, "open", "right", 0, 8),
    finalAllowedTypes: ["interval", "ray", "point", "empty"],
    finalDefaultType: "ray",
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    checkNumber: "6",
    hint: "Чтобы подходить обоим условиям, число должно быть правее 5.",
    solution: "Общая часть двух правых лучей начинается от более правой границы: (5; +∞)."
  },
  {
    id: "system-intersection-t1",
    blockId: "block-systems-draw",
    type: "system_draw_intersection",
    prompt: "Выдели общую часть: x ≥ 3 и x ≤ 3.",
    systemLabel: "x ≥ 3 и x ≤ 3",
    first: { label: "x ≥ 3", graph: ray(3, "closed", "right", 0, 6) },
    second: { label: "x ≤ 3", graph: ray(3, "closed", "left", 0, 6) },
    expected: expectedPoint(3, 0, 6),
    finalCorrect: point(3, 0, 6),
    finalAllowedTypes: ["interval", "ray", "point", "empty"],
    finalDefaultType: "point",
    snapValues: [0, 1, 2, 3, 4, 5, 6],
    checkNumber: "3",
    hint: "Обе штриховки встречаются только в точке 3.",
    solution: "3 входит в оба условия, а левее или правее уже одно из условий ломается. Ответ: x = 3."
  },
  {
    id: "system-intersection-t2",
    blockId: "block-systems-draw",
    type: "system_draw_intersection",
    prompt: "Выдели общую часть: x > 3 и x ≤ 3.",
    systemLabel: "x > 3 и x ≤ 3",
    first: { label: "x > 3", graph: ray(3, "open", "right", 0, 6) },
    second: { label: "x ≤ 3", graph: ray(3, "closed", "left", 0, 6) },
    expected: expectedEmpty(0, 6),
    finalCorrect: emptyGraph(0, 6),
    finalAllowedTypes: ["interval", "ray", "point", "empty"],
    finalDefaultType: "empty",
    snapValues: [0, 1, 2, 3, 4, 5, 6],
    hint: "3 не входит в первое условие, а числа правее 3 не подходят второму.",
    solution: "Пересечения нет: ответ «нет решений»."
  },
  {
    id: "oge-draw-choose-t1",
    blockId: "block-systems-draw",
    type: "oge13_draw_then_choose_graph",
    prompt: "Сначала построй, потом выбери ОГЭ-рисунок: x > 2 и x < 5.",
    systemLabel: "x > 2 и x < 5",
    expected: expectedInterval(2, 5, false, false, 0, 7),
    correct: segment(2, 5, "open", "open", 0, 7),
    finalCorrect: segment(2, 5, "open", "open", 0, 7),
    finalAllowedTypes: ["interval", "ray", "point", "empty"],
    finalDefaultType: "interval",
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7],
    options: [
      { label: "A", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "B", graph: segment(2, 5, "closed", "closed", 0, 7) },
      { label: "C", graph: ray(2, "open", "right", 0, 7) },
      { label: "D", graph: emptyGraph(0, 7) }
    ],
    hint: "Сначала добейся своего построения (2; 5), затем сравни его с четырьмя рисунками.",
    solution: "Общая часть системы — (2; 5). После самостоятельного построения выбираем такой же рисунок среди вариантов."
  },
  {
    id: "micro-expand-t1",
    blockId: "block-algebra-micro",
    type: "algebra_expand_negative_brackets",
    prompt: "Раскрой по шагам: -2(x - 11).",
    expression: "-2(x - 11)",
    steps: [
      { label: "-2 · x = ?", answer: "-2x", errorType: "distribution_sign_error" },
      { label: "-2 · (-11) = ?", answer: "22", errorType: "negative_times_negative_error" },
      { label: "Собери выражение", answer: "-2x+22", displayAnswer: "-2x + 22", errorType: "minus_before_brackets_error" }
    ],
    hint: "Отрицательное на отрицательное даёт плюс.",
    solution: "-2 · x = -2x\n-2 · (-11) = +22\nИтог: -2x + 22."
  },
  {
    id: "micro-transfer-t1",
    blockId: "block-algebra-micro",
    type: "algebra_transfer_sign",
    prompt: "Контроль переноса: 10x + 9 = 7x.",
    expression: "10x + 9 = 7x",
    steps: [
      { label: "Если +9 переносим вправо, что будет?", answer: "-9", errorType: "sign_transfer_error" },
      { label: "Запиши строку после переноса", answer: "10x-7x=-9", displayAnswer: "10x - 7x = -9", errorType: "sign_transfer_error" }
    ],
    hint: "При переносе через знак равенства знак числа меняется.",
    solution: "10x + 9 = 7x\n10x - 7x = -9."
  },
  {
    id: "micro-combine-t1",
    blockId: "block-algebra-micro",
    type: "algebra_combine_constants",
    prompt: "Собери похожие части: 2 - 6x - 6.",
    expression: "2 - 6x - 6",
    steps: [
      { label: "x-часть", answer: "-6x", errorType: "attention_drift_error" },
      { label: "числовая часть: 2 - 6", answer: "-4", errorType: "combine_constants_error" },
      { label: "итог", answer: "-6x-4", displayAnswer: "-6x - 4", errorType: "combine_constants_error" }
    ],
    hint: "x-часть и числа собираем отдельно.",
    solution: "x-часть: -6x.\nЧисла: 2 - 6 = -4.\nИтог: -6x - 4."
  },
  {
    id: "micro-line-control-t1",
    blockId: "block-algebra-micro",
    type: "algebra_line_control",
    prompt: "Не потеряй правую часть: 2 - 3(2x + 2) = 5 - 4x.",
    expression: "2 - 3(2x + 2) = 5 - 4x",
    steps: [
      { label: "Перепиши правую часть без изменений", answer: "5-4x", displayAnswer: "5 - 4x", errorType: "copying_error" },
      { label: "-3 · 2x = ?", answer: "-6x", errorType: "distribution_sign_error" },
      { label: "-3 · 2 = ?", answer: "-6", errorType: "distribution_sign_error" }
    ],
    hint: "Правая часть пока не меняется: 5 - 4x.",
    solution: "Сначала сохраняем правую часть: 5 - 4x.\nПотом раскрываем скобки слева: -3 · 2x = -6x, -3 · 2 = -6."
  },
  {
    id: "b7-t1",
    blockId: "block-7",
    type: "algebra_build",
    prompt: "Реши неравенство x + 5 ≥ 1, затем построй ответ.",
    inequality: "x + 5 ≥ 1",
    reducedPrompt: "x ≥ ?",
    algebraAnswer: -4,
    correct: ray(-4, "closed", "right", -6, 2),
    snapValues: [-6, -5, -4, -3, -2, -1, 0, 1, 2],
    hint: "Чтобы убрать +5, перенеси 5 вправо с минусом.",
    solution: "x + 5 ≥ 1\nx ≥ 1 - 5\nx ≥ -4\nНа прямой: закрашенная точка на -4, штриховка вправо."
  },
  {
    id: "b7-t2",
    blockId: "block-7",
    type: "algebra_build",
    prompt: "Реши неравенство x - 2 ≤ 0, затем построй ответ.",
    inequality: "x - 2 ≤ 0",
    reducedPrompt: "x ≤ ?",
    algebraAnswer: 2,
    correct: ray(2, "closed", "left", -2, 5),
    snapValues: [-2, -1, 0, 1, 2, 3, 4, 5],
    hint: "Чтобы убрать -2, перенеси 2 вправо с плюсом.",
    solution: "x - 2 ≤ 0\nx ≤ 0 + 2\nx ≤ 2\nНа прямой: закрашенная точка на 2, штриховка влево."
  },
  {
    id: "b7-t3",
    blockId: "block-7",
    type: "algebra_build",
    prompt: "Реши неравенство 2x > 6, затем построй ответ.",
    inequality: "2x > 6",
    reducedPrompt: "x > ?",
    algebraAnswer: 3,
    correct: ray(3, "open", "right", 0, 7),
    snapValues: [0, 1, 2, 3, 4, 5, 6, 7],
    hint: "Раздели обе части на 2. Делим на положительное число, знак не меняется.",
    solution: "2x > 6\nx > 6 : 2\nx > 3\nНа прямой: пустая точка на 3, штриховка вправо."
  },
  {
    id: "b7-t4",
    blockId: "block-7",
    type: "algebra_build",
    prompt: "Реши неравенство x + 3 < 5, затем построй ответ.",
    inequality: "x + 3 < 5",
    reducedPrompt: "x < ?",
    algebraAnswer: 2,
    correct: ray(2, "open", "left", -2, 5),
    snapValues: [-2, -1, 0, 1, 2, 3, 4, 5],
    hint: "Перенеси +3 вправо с минусом.",
    solution: "x + 3 < 5\nx < 5 - 3\nx < 2\nНа прямой: пустая точка на 2, штриховка влево."
  },
  {
    id: "b8-t1",
    blockId: "block-8",
    type: "system_basic",
    prompt: "Реши систему: x > -4 и x < -1.",
    systemLabel: "x > -4 и x < -1",
    inequalities: [
      { label: "x > -4", correct: ray(-4, "open", "right", -6, 1), snapValues: [-6, -5, -4, -3, -2, -1, 0, 1] },
      { label: "x < -1", correct: ray(-1, "open", "left", -6, 1), snapValues: [-6, -5, -4, -3, -2, -1, 0, 1] }
    ],
    finalCorrect: segment(-4, -1, "open", "open", -6, 1),
    finalOptions: [
      { label: "(-4; -1)", graph: segment(-4, -1, "open", "open", -6, 1) },
      { label: "[-4; -1]", graph: segment(-4, -1, "closed", "closed", -6, 1) },
      { label: "(-∞; -1)", graph: ray(-1, "open", "left", -6, 1) },
      { label: "Нет решений", graph: emptyGraph(-6, 1) }
    ],
    hint: "Система — ищем общую часть. Здесь надо быть правее -4 и левее -1.",
    solution: "x > -4 даёт штриховку вправо от -4.\nx < -1 даёт штриховку влево от -1.\nПерекрытие находится между -4 и -1: (-4; -1)."
  },
  {
    id: "b8-t2",
    blockId: "block-8",
    type: "system_basic",
    prompt: "Реши систему: x ≥ 2 и x ≤ 5.",
    systemLabel: "x ≥ 2 и x ≤ 5",
    inequalities: [
      { label: "x ≥ 2", correct: ray(2, "closed", "right", 0, 7), snapValues: [0, 1, 2, 3, 4, 5, 6, 7] },
      { label: "x ≤ 5", correct: ray(5, "closed", "left", 0, 7), snapValues: [0, 1, 2, 3, 4, 5, 6, 7] }
    ],
    finalCorrect: segment(2, 5, "closed", "closed", 0, 7),
    finalOptions: [
      { label: "(2; 5)", graph: segment(2, 5, "open", "open", 0, 7) },
      { label: "[2; 5]", graph: segment(2, 5, "closed", "closed", 0, 7) },
      { label: "[2; +∞)", graph: ray(2, "closed", "right", 0, 7) },
      { label: "Нет решений", graph: emptyGraph(0, 7) }
    ],
    hint: "Оба края входят, потому что в обоих знаках есть «равно».",
    solution: "x ≥ 2 даёт всё справа от 2 вместе с 2.\nx ≤ 5 даёт всё слева от 5 вместе с 5.\nОбщая часть: [2; 5]."
  },
  {
    id: "b8-t3",
    blockId: "block-8",
    type: "system_basic",
    prompt: "Реши систему: x > 4 и x < 3.",
    systemLabel: "x > 4 и x < 3",
    inequalities: [
      { label: "x > 4", correct: ray(4, "open", "right", 0, 6), snapValues: [0, 1, 2, 3, 4, 5, 6] },
      { label: "x < 3", correct: ray(3, "open", "left", 0, 6), snapValues: [0, 1, 2, 3, 4, 5, 6] }
    ],
    finalCorrect: emptyGraph(0, 6),
    finalOptions: [
      { label: "(3; 4)", graph: segment(3, 4, "open", "open", 0, 6) },
      { label: "(4; +∞)", graph: ray(4, "open", "right", 0, 6) },
      { label: "(-∞; 3)", graph: ray(3, "open", "left", 0, 6) },
      { label: "Нет решений", graph: emptyGraph(0, 6) }
    ],
    hint: "Нужно одновременно быть больше 4 и меньше 3. Проверь, есть ли такие числа.",
    solution: "Число не может одновременно быть больше 4 и меньше 3. Общей части нет, значит ответ: нет решений."
  }
];

window.GOOGLE_SHEETS_ENDPOINT = GOOGLE_SHEETS_ENDPOINT;
window.OGE13_CONFIG = OGE13_CONFIG;
window.OGE13_BLOCKS = OGE13_BLOCKS;
window.OGE13_TASKS = OGE13_TASKS;
