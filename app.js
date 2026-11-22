(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * PressLight · 轻压记 — local-first health log
   * ------------------------------------------------------------------ */

  const KEY = 'presslight.state.v1';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const pad2 = (n) => String(n).padStart(2, '0');

  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));

  const icon = (name, extra = '') =>
    `<svg class="icon ${extra}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const mean = (list) =>
    list.length ? list.reduce((sum, n) => sum + n, 0) / list.length : null;

  const round1 = (n) => Math.round(n * 10) / 10;

  const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1);

  const parseNumber = (value, fallback = null) => {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const dateKey = (date = new Date()) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const keyToDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const shiftKey = (key, delta) => {
    const date = keyToDate(key);
    date.setDate(date.getDate() + delta);
    return dateKey(date);
  };

  const TODAY = () => dateKey(new Date());

  const diffDays = (a, b) =>
    Math.round((keyToDate(a) - keyToDate(b)) / 86400000);

  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const cnDate = (key) => {
    const d = keyToDate(key);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const weekday = (key) => WEEKDAYS[keyToDate(key).getDay()];

  const dotDate = (key) => key.slice(5).replace('-', '.');

  const nowTime = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const timeToMinutes = (time) => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const sleepMinutes = (sleepTime, wakeTime) => {
    let start = timeToMinutes(sleepTime);
    let end = timeToMinutes(wakeTime);
    if (start == null || end == null) return 0;
    if (end <= start) end += 1440;
    return end - start;
  };

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return { short: `${h}h${pad2(m)}`, long: `${h} 小时 ${m} 分` };
  };

  /* ------------------------------------------------------------------ *
   * constants
   * ------------------------------------------------------------------ */

  const FOODS = [
    { id: 'bread-cream', name: '奶油面包', serving: '1 个', kcal: 400, sodium: 'high', potassium: 'low', type: 'processed' },
    { id: 'bread-hotdog', name: '热狗面包', serving: '1 个', kcal: 400, sodium: 'high', potassium: 'low', type: 'processed' },
    { id: 'pancake', name: '手抓饼', serving: '1 张', kcal: 325, sodium: 'high', potassium: 'low', type: 'processed' },
    { id: 'meigancai', name: '梅干菜包', serving: '1 个', kcal: 225, sodium: 'high', potassium: 'mid', type: 'processed' },
    { id: 'egg', name: '鸡蛋', serving: '1 个', kcal: 70, sodium: 'low', potassium: 'mid', type: 'homemade' },
    { id: 'milk', name: '牛奶', serving: '250 ml', kcal: 150, sodium: 'low', potassium: 'mid', type: 'processed' },
    { id: 'rice', name: '米饭', serving: '1 碗', kcal: 200, sodium: 'low', potassium: 'low', type: 'homemade' },
    { id: 'meat-steam', name: '肉（清蒸/煮）', serving: '1 份', kcal: 200, sodium: 'low', potassium: 'mid', type: 'homemade' },
    { id: 'meat-fry', name: '肉（炒/红烧）', serving: '1 份', kcal: 300, sodium: 'high', potassium: 'mid', type: 'homemade' },
    { id: 'veg-light', name: '蔬菜（少油）', serving: '1 份', kcal: 65, sodium: 'low', potassium: 'high', type: 'homemade' },
    { id: 'veg-heavy', name: '蔬菜（多油/酱油）', serving: '1 份', kcal: 125, sodium: 'high', potassium: 'high', type: 'homemade' },
    { id: 'apple', name: '苹果', serving: '1 个', kcal: 80, sodium: 'low', potassium: 'high', type: 'fruit' },
    { id: 'orange', name: '橙子', serving: '1 个', kcal: 60, sodium: 'low', potassium: 'high', type: 'fruit' },
    { id: 'coffee-black', name: '黑咖啡', serving: '1 杯', kcal: 5, sodium: 'low', potassium: 'mid', type: 'drink' },
    { id: 'coffee-milk', name: '加奶/加糖咖啡', serving: '1 杯', kcal: 100, sodium: 'low', potassium: 'mid', type: 'drink' },
    { id: 'soup', name: '汤类', serving: '1 碗', kcal: 80, sodium: 'high', potassium: 'mid', type: 'soup' },
  ];
  const FOOD_MAP = new Map(FOODS.map((f) => [f.id, f]));

  const COMBOS = [
    { id: 'breakfastA', label: '早餐 A', desc: '奶油面包 + 鸡蛋 + 牛奶', mealType: 'breakfast', foods: ['bread-cream', 'egg', 'milk'] },
    { id: 'breakfastB', label: '早餐 B', desc: '手抓饼 + 鸡蛋 + 牛奶', mealType: 'breakfast', foods: ['pancake', 'egg', 'milk'] },
    { id: 'breakfastC', label: '早餐 C', desc: '梅干菜包 + 鸡蛋 + 牛奶', mealType: 'breakfast', foods: ['meigancai', 'egg', 'milk'] },
    { id: 'lunch', label: '午餐', desc: '米饭 + 炒肉 + 少油蔬菜', mealType: 'lunch', foods: ['rice', 'meat-fry', 'veg-light'] },
    { id: 'dinner', label: '晚餐', desc: '米饭 + 清蒸肉 + 蔬菜', mealType: 'dinner', foods: ['rice', 'meat-steam', 'veg-heavy'] },
    { id: 'fruit', label: '水果', desc: '苹果一个，也可以再选橙子', mealType: 'snack', foods: ['apple'] },
  ];

  const MEAL_LABEL = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
  const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

  const SODIUM_LABEL = { high: '高钠', mid: '中钠', low: '低钠' };
  const POTASSIUM_LABEL = { high: '高钾', mid: '一般', low: '低钾' };

  const CONDITIONS = ['服药前', '排尿后', '运动后30分钟内', '失眠后', '情绪紧张', '咖啡后2小时内', '正常'];
  const SYMPTOMS = ['无', '头晕', '头痛', '胸闷'];
  const SODIUM_DRINKS = ['汤', '电解质水', '风味水', '罐装饮料'];
  const COFFEE_TYPES = ['黑咖啡', '加奶', '加糖'];

  /* ------------------------------------------------------------------ *
   * state
   * ------------------------------------------------------------------ */

  const emptyState = () => ({
    version: 1,
    demo: false,
    settings: {
      targetSys: 130,
      targetDia: 80,
      targetWeight: 65,
      morningReminder: '07:00',
      nightReminder: '22:30',
      medsEnabled: false,
      alcoholHidden: true,
    },
    bp: [],
    meals: [],
    water: {},
    caffeine: [],
    exercise: [],
    sleep: [],
    weight: [],
    daily: [],
  });

  const normalizeState = (raw) => {
    const base = emptyState();
    if (!raw || typeof raw !== 'object') return base;
    base.settings = Object.assign(base.settings, raw.settings || {});
    ['bp', 'meals', 'caffeine', 'exercise', 'sleep', 'weight', 'daily'].forEach((key) => {
      if (Array.isArray(raw[key])) base[key] = raw[key];
    });
    if (raw.water && typeof raw.water === 'object' && !Array.isArray(raw.water)) {
      base.water = raw.water;
    }
    base.demo = Boolean(raw.demo);
    return base;
  };

  let state = emptyState();

  const saveState = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      showToast('本地存储不可用，记录无法保存');
    }
  };

  const loadStoredState = () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? normalizeState(JSON.parse(raw)) : null;
    } catch (error) {
      return null;
    }
  };

  /* ------------------------------------------------------------------ *
   * selectors / summaries
   * ------------------------------------------------------------------ */

  const recordsFor = (key, date) =>
    Array.isArray(state[key]) ? state[key].filter((r) => r.date === date) : [];

  const latestBP = (date, period) => {
    const list = state.bp
      .filter((r) => r.date === date && r.period === period)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
    return list.length ? list[list.length - 1] : null;
  };

  const latestBPAny = (date) => {
    const list = state.bp
      .filter((r) => r.date === date)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
    return list.length ? list[list.length - 1] : null;
  };

  const mealsFor = (date) => recordsFor('meals', date);

  const sleepFor = (date) =>
    state.sleep.find((r) => r.date === date) || null;

  const waterFor = (date) => state.water[date] || null;

  const exerciseFor = (date) => recordsFor('exercise', date);

  const caffeineFor = (date) => recordsFor('caffeine', date);

  const weightFor = (date) => {
    const list = state.weight.filter((r) => r.date === date && r.weightKg != null);
    return list.length ? list[list.length - 1] : null;
  };

  const weightLatest = () => {
    const list = state.weight
      .filter((r) => r.weightKg != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return list.length ? list[list.length - 1] : null;
  };

  const firstWeight = () => {
    const list = state.weight
      .filter((r) => r.weightKg != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return list.length ? list[0] : null;
  };

  const latestWaist = () => {
    const list = state.weight
      .filter((r) => r.waistCm != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return list.length ? list[list.length - 1] : null;
  };

  const foodOf = (id) => FOOD_MAP.get(id) || null;

  const mealFoodNames = (meal) =>
    meal.items
      .map((item) => foodOf(item.foodId))
      .filter(Boolean)
      .map((food) => food.name)
      .join(' + ');

  const mealName = (meal) => `${MEAL_LABEL[meal.mealType] || '饮食'} · ${mealFoodNames(meal)}`;

  const daySummary = (date) => {
    const meals = mealsFor(date);
    const foodItems = [];
    let highSodium = 0;
    let midSodium = 0;
    let processed = 0;
    meals.forEach((meal) => {
      meal.items.forEach((item) => {
        const food = foodOf(item.foodId);
        if (!food) return;
        foodItems.push({ food, servings: item.servings || 1 });
        if (food.sodium === 'high') highSodium += 1;
        if (food.sodium === 'mid') midSodium += 1;
        if (['processed', 'soup'].includes(food.type)) processed += 1;
      });
    });

    let sodiumLevel = null;
    if (meals.length) {
      if (highSodium >= 2) sodiumLevel = 'high';
      else if (highSodium >= 1 || midSodium >= 2) sodiumLevel = 'mid';
      else sodiumLevel = 'low';
    }

    const sleep = sleepFor(date);
    const sleepMins = sleep ? sleepMinutes(sleep.sleepTime, sleep.wakeTime) : null;

    const exercise = exerciseFor(date);
    const exerciseMin = exercise.reduce((sum, r) => sum + (parseNumber(r.minutes, 0) || 0), 0);
    const exerciseKcal = exercise.reduce((sum, r) => sum + (parseNumber(r.kcalEst, 0) || 0), 0);

    const caffeine = caffeineFor(date);
    const coffeeLateCups = caffeine
      .filter((r) => (timeToMinutes(r.time) ?? 0) >= 14 * 60)
      .reduce((sum, r) => sum + (parseNumber(r.cups, 0) || 0), 0);
    const coffeeCups = caffeine.reduce((sum, r) => sum + (parseNumber(r.cups, 0) || 0), 0);

    const water = waterFor(date);
    const weight = weightFor(date);
    const morning = latestBP(date, 'morning');
    const night = latestBP(date, 'night');
    const daily = state.daily.find((r) => r.date === date) || null;

    return {
      date,
      meals,
      foodItems,
      highSodium,
      midSodium,
      processed,
      sodiumLevel,
      hasMeals: meals.length > 0,
      sleep,
      sleepMins,
      exercise,
      exerciseMin,
      exerciseKcal,
      caffeine,
      coffeeCups,
      coffeeLateCups,
      water,
      weight,
      bpMorning: morning,
      bpNight: night,
      daily,
      hasData: Boolean(
        morning || night || meals.length || sleep || exercise.length ||
        caffeine.length || water || weight || daily
      ),
    };
  };

  const allDates = () => {
    const set = new Set();
    state.bp.forEach((r) => set.add(r.date));
    state.meals.forEach((r) => set.add(r.date));
    state.caffeine.forEach((r) => set.add(r.date));
    state.exercise.forEach((r) => set.add(r.date));
    state.sleep.forEach((r) => set.add(r.date));
    state.weight.forEach((r) => set.add(r.date));
    state.daily.forEach((r) => set.add(r.date));
    Object.keys(state.water).forEach((d) => set.add(d));
    return Array.from(set).filter(Boolean).sort();
  };

  const recordsCount = () =>
    state.bp.length + state.meals.length + state.caffeine.length +
    state.exercise.length + state.sleep.length + state.weight.length +
    state.daily.length + Object.keys(state.water).length;

  /* ------------------------------------------------------------------ *
   * demo data
   * ------------------------------------------------------------------ */

  const mulberry32 = (seed) => {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const makeDemoState = () => {
    const demo = emptyState();
    demo.demo = true;
    const rand = mulberry32(20261121);
    const today = TODAY();
    const days = [];

    for (let i = 20; i >= 0; i -= 1) {
      const date = shiftKey(today, -i);
      const n = 20 - i;
      const highSodium = ((n * 7 + 3) % 10) < 5;
      const shortSleep = ((n * 5 + 2) % 9) < 3;
      const exerciseMin = n % 3 === 0 && n !== 20 ? 30 + Math.round(rand() * 9) : 0;
      const coffeeLate = highSodium ? n % 2 === 0 : n % 3 === 0;
      days.push({ date, n, highSodium, shortSleep, exerciseMin, coffeeLate });
    }

    // weight + waist every three days
    days.forEach((day) => {
      if (day.n % 3 !== 0 || day.n === 20) return;
      const weightKg = 75.4 - day.n * 0.12 + (rand() * 0.16 - 0.08);
      demo.weight.push({
        id: uid(), date: day.date,
        weightKg: Math.round(weightKg * 10) / 10,
        waistCm: day.n === 0 ? 92 : (day.n === 9 ? 91.2 : (day.n === 18 ? 90.4 : null)),
      });
    });

    // sleep, meals, water, caffeine, exercise
    days.forEach((day, index) => {
      const prev = days[index - 1] || null;

      let sys = 127 + (prev && prev.highSodium ? 3.4 : 0) +
        (day.shortSleep ? 2.1 : 0) - (prev && prev.exerciseMin ? 1.6 : 0) +
        (rand() * 3 - 1.5) + day.n * 0.03;
      let dia = 78 + (prev && prev.highSodium ? 1.7 : 0) +
        (day.shortSleep ? 1.0 : 0) - (prev && prev.exerciseMin ? 0.8 : 0) +
        (rand() * 2 - 1) + day.n * 0.02;

      sys = Math.round(sys);
      dia = Math.round(dia);

      if (day.n !== 2 && day.n !== 11 && day.n !== 20) {
        demo.bp.push({
          id: uid(), date: day.date, time: `07:${pad2(5 + Math.round(rand() * 9))}`,
          period: 'morning', systolic: sys, diastolic: dia,
          heartRate: 68 + Math.round(rand() * 8),
          conditions: ['排尿后'], symptoms: ['无'], note: '', isAverage: true,
        });
      }

      if (day.n === 20) {
        // today: only a morning reading so the dashboard shows open items
        demo.bp.push({
          id: uid(), date: day.date, time: '07:12', period: 'morning',
          systolic: sys, diastolic: dia, heartRate: 72,
          conditions: ['排尿后'], symptoms: ['无'], note: '', isAverage: true,
        });
      }

      if (day.n !== 1 && day.n !== 7 && day.n !== 20) {
        demo.bp.push({
          id: uid(), date: day.date, time: `22:${pad2(10 + Math.round(rand() * 15))}`,
          period: 'night', systolic: sys + 2 + Math.round(rand() * 3),
          diastolic: dia + 2 + Math.round(rand() * 2),
          heartRate: 66 + Math.round(rand() * 7),
          conditions: ['正常'], symptoms: ['无'], note: '', isAverage: true,
        });
      }

      const sleepTime = day.shortSleep ? '23:48' : (rand() > 0.6 ? '23:18' : '23:02');
      const wakeTime = day.shortSleep ? '06:28' : '06:45';
      demo.sleep.push({
        id: uid(), date: day.date, sleepTime, wakeTime,
        wakeCount: day.shortSleep ? 2 : (rand() > 0.55 ? 1 : 0),
        quality1to5: day.shortSleep ? 3 : 4,
        napMin: rand() > 0.8 ? 20 : 0,
        note: '',
      });

      if (day.n === 20) {
        demo.meals.push({
          id: uid(), date: day.date, mealType: 'breakfast',
          items: [{ foodId: 'bread-cream', servings: 1 }, { foodId: 'egg', servings: 1 }, { foodId: 'milk', servings: 1 }],
          note: '',
        });
      } else {
        const breakfast = day.highSodium
          ? ['bread-cream', 'egg', 'milk']
          : (day.n % 2 === 0 ? ['egg', 'milk'] : ['meigancai', 'egg', 'milk']);
        demo.meals.push({
          id: uid(), date: day.date, mealType: 'breakfast',
          items: breakfast.map((foodId) => ({ foodId, servings: 1 })), note: '',
        });

        demo.meals.push({
          id: uid(), date: day.date, mealType: 'lunch',
          items: [
            { foodId: 'rice', servings: 1 },
            { foodId: day.highSodium ? 'meat-fry' : 'meat-steam', servings: 1 },
            { foodId: day.highSodium ? 'veg-heavy' : 'veg-light', servings: 1 },
          ],
          note: '',
        });
        demo.meals.push({
          id: uid(), date: day.date, mealType: 'dinner',
          items: [
            { foodId: 'rice', servings: 1 },
            { foodId: 'meat-steam', servings: 1 },
            { foodId: 'veg-light', servings: 1 },
          ],
          note: '',
        });
        demo.meals.push({
          id: uid(), date: day.date, mealType: 'snack',
          items: [{ foodId: rand() > 0.5 ? 'apple' : 'orange', servings: 1 }],
          note: '',
        });
      }

      if (day.n === 20) {
        demo.water[day.date] = { totalMl: 750, sodiumDrinkTypes: [], nightUrineCount: 0 };
      } else {
        demo.water[day.date] = {
          totalMl: Math.round((1150 + rand() * 850) / 50) * 50,
          sodiumDrinkTypes: day.n % 4 === 0 ? ['汤'] : [],
          nightUrineCount: day.shortSleep ? 1 : 0,
        };
      }

      demo.caffeine.push({
        id: uid(), date: day.date, cups: 1, type: '黑咖啡',
        time: `08:${pad2(10 + Math.round(rand() * 20))}`,
      });
      if (day.coffeeLate && day.n !== 20) {
        demo.caffeine.push({
          id: uid(), date: day.date, cups: 1, type: '加奶',
          time: `15:${pad2(5 + Math.round(rand() * 20))}`,
        });
      }

      if (day.exerciseMin) {
        const weight = day.n <= 18 ? 75.4 - day.n * 0.12 : 75;
        demo.exercise.push({
          id: uid(), date: day.date, type: '跑步机慢跑',
          minutes: day.exerciseMin, speed: 7 + Math.round(rand() * 4) / 10,
          incline: 0, intensity: '中等',
          kcalEst: Math.round(7.5 * weight * (day.exerciseMin / 60)),
          discomfort: '无', note: '',
        });
      }

      if (day.n % 4 === 0) {
        demo.daily.push({
          id: uid(), date: day.date, mood1to5: 3 + Math.round(rand() * 2),
          note: day.highSodium ? '今天外卖有点咸。' : '状态还可以。',
        });
      }
    });

    return demo;
  };

  /* ------------------------------------------------------------------ *
   * today
   * ------------------------------------------------------------------ */

  const renderToday = () => {
    const today = TODAY();
    const summary = daySummary(today);
    const settings = state.settings;

    $('#today-date').textContent = cnDate(today);
    $('#today-weekday').textContent = weekday(today);
    $('#goal-bp').textContent = `${settings.targetSys}/${settings.targetDia}`;
    $('#goal-weight').textContent = `${settings.targetWeight} kg`;
    $('#demo-tag').hidden = !state.demo;

    const weight = weightLatest();
    const weightRecent = Boolean(weight && diffDays(today, weight.date) <= 7);
    const waist = latestWaist();
    const doneItems = [
      Boolean(summary.bpMorning),
      summary.meals.length > 0,
      Boolean(summary.water && summary.water.totalMl > 0),
      summary.exerciseMin > 0,
      Boolean(summary.sleep),
      weightRecent,
    ];
    const doneCount = doneItems.filter(Boolean).length;
    $('#today-score').innerHTML = `<b>${doneCount}</b>/6 已记`;

    const level = summary.sodiumLevel;
    const levelText = level ? `${SODIUM_LABEL[level]}日` : null;
    const totalWater = summary.water ? summary.water.totalMl || 0 : 0;
    const sodiumDrinks = summary.water ? summary.water.sodiumDrinkTypes.length : 0;
    const sleep = summary.sleep;
    const sleepDur = sleep ? formatDuration(summary.sleepMins) : null;
    const exerciseMinutes = Math.round(summary.exerciseMin);
    const exerciseKcal = Math.round(summary.exerciseKcal);
    const exerciseIntensity = summary.exercise.length
      ? summary.exercise[summary.exercise.length - 1].intensity
      : '中等';
    const weightDiff = weight ? round1(weight.weightKg - settings.targetWeight) : null;
    const mealTypes = summary.meals
      .map((m) => MEAL_LABEL[m.mealType])
      .filter((v, i, arr) => v && arr.indexOf(v) === i);
    const mealSub = summary.meals.length
      ? [
          mealTypes.join('、'),
          summary.coffeeCups ? `咖啡 ${summary.coffeeCups} 杯` : '',
          summary.highSodium ? `高钠 ${summary.highSodium} 个` : '',
        ].filter(Boolean).join(' · ')
      : '早、午、晚都还没记';
    const waterSub = totalWater
      ? `含钠饮料 ${sodiumDrinks} 次${summary.water.nightUrineCount ? ` · 夜尿 ${summary.water.nightUrineCount} 次` : ''}`
      : '点一下，从一杯水开始';
    const exerciseSub = exerciseMinutes
      ? `约 ${exerciseKcal} kcal · 强度 ${exerciseIntensity}`
      : '慢跑 30 分钟就很好';
    const sleepSub = sleep
      ? `${sleep.sleepTime} – ${sleep.wakeTime} · 质量 ${sleep.quality1to5}/5`
      : '昨晚睡得怎么样？';
    const weightSub = weight
      ? [
          weightRecent ? '' : '该记了',
          waist ? `腰围 ${waist.waistCm.toFixed(1)} cm` : '',
          weightDiff > 0 ? `距目标 ${fmt1(weightDiff)} kg` : '已达目标',
        ].filter(Boolean).join(' · ')
      : `目标 ${settings.targetWeight} kg`;

    const bpStatus = summary.bpMorning
      ? (summary.bpNight ? '早晚已记' : '睡前未记')
      : '晨起未记';
    const bpStatusClass = summary.bpMorning && summary.bpNight
      ? 'is-done'
      : (summary.bpMorning ? 'is-partial' : 'is-missing');

    const bpReading = (label, bp, placeholder) => `
      <div class="bp-reading ${bp ? '' : 'is-empty'}">
        <span class="bp-when">${label}</span>
        <b class="bp-number">${bp ? `${bp.systolic}/${bp.diastolic}` : '未测'}</b>
        <small>${bp
          ? `${bp.time}${bp.heartRate ? ` · 心率 ${bp.heartRate}` : ''}`
          : placeholder}</small>
      </div>`;

    const rows = [
      {
        type: 'meal', icon: 'bowl', title: '饮食',
        value: levelText || '待记', sub: mealSub,
        done: summary.meals.length > 0,
      },
      {
        type: 'water', icon: 'drop', title: '饮水',
        value: totalWater ? `${totalWater} ml` : '待记', sub: waterSub,
        done: totalWater > 0,
      },
      {
        type: 'exercise', icon: 'run', title: '运动',
        value: exerciseMinutes ? `${exerciseMinutes} 分钟` : '待记', sub: exerciseSub,
        done: exerciseMinutes > 0,
      },
      {
        type: 'sleep', icon: 'moon', title: '睡眠',
        value: sleepDur ? sleepDur.short : '待记', sub: sleepSub,
        done: Boolean(sleep),
      },
      {
        type: 'weight', icon: 'scale', title: '体重',
        value: weight ? `${weight.weightKg.toFixed(1)} kg` : '待记', sub: weightSub,
        done: weightRecent,
      },
    ];

    $('#today-cards').innerHTML = `
      <button class="bp-panel" type="button" data-record="bp" aria-label="记录血压">
        <div class="bp-panel-head">
          <span class="panel-label">${icon('pulse')} 血压</span>
          <span class="panel-status ${bpStatusClass}">${bpStatus}</span>
        </div>
        <div class="bp-readings">
          ${bpReading('晨起', summary.bpMorning, '还没有记录')}
          ${bpReading('睡前', summary.bpNight, '睡前再测一次')}
        </div>
        <div class="bp-panel-foot">
          <span>目标 ${settings.targetSys}/${settings.targetDia} mmHg</span>
          <span class="panel-cta">记录血压 ${icon('chevron')}</span>
        </div>
      </button>

      <div class="section-head">
        <h2>今日记录</h2>
        <span class="${doneCount === 6 ? 'is-done' : ''}">${doneCount === 6 ? '今天记齐了' : `还差 ${6 - doneCount} 项`}</span>
      </div>

      <div class="today-list">
        ${rows.map((row) => `
          <button class="today-row ${row.done ? '' : 'is-missing'}" type="button" data-record="${row.type}" aria-label="${row.title}">
            <span class="row-icon">${icon(row.icon)}</span>
            <span class="row-main">
              <b>${row.title}</b>
              <small>${esc(row.sub)}</small>
            </span>
            <span class="row-value">${esc(row.value)}</span>
            <span class="row-chevron">${icon('chevron')}</span>
          </button>`).join('')}
      </div>`;

    renderTodayAlerts(today, summary);
  };

  const renderTodayAlerts = (today, summary) => {
    const container = $('#today-alerts');
    const settings = state.settings;
    const boxes = [];

    const morningKeys = Array.from({ length: 7 }, (_, i) => shiftKey(today, i - 6));
    const morningRecords = morningKeys.map((key) => latestBP(key, 'morning')).filter(Boolean);
    if (morningRecords.length >= 7) {
      const sys = mean(morningRecords.map((r) => r.systolic));
      const dia = mean(morningRecords.map((r) => r.diastolic));
      if (sys != null && dia != null && (sys >= settings.targetSys || dia >= settings.targetDia)) {
        boxes.push(`<div class="notice today-alert">${icon('info')}<p>近 7 天晨压均值 ${Math.round(sys)}/${Math.round(dia)}。建议带着这 7 天记录去看医生评估，不用自己下结论。</p></div>`);
      }
    }

    const lastRead = latestBPAny(today) || (state.bp.length
      ? state.bp.slice().sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]
      : null);
    if (!boxes.length && lastRead && (lastRead.systolic >= 140 || lastRead.diastolic >= 90) && lastRead.date === today) {
      boxes.push(`<div class="notice today-alert">${icon('info')}<p>最近一次血压偏高，先安静休息 5 分钟再复测；如果伴随头晕、胸闷，请及时就医。</p></div>`);
    }

    if (!boxes.length) {
      const last3 = Array.from({ length: 3 }, (_, i) => daySummary(shiftKey(today, i - 2)));
      if (last3.every((day) => day.hasMeals && day.sodiumLevel === 'high')) {
        boxes.push(`<div class="notice today-alert">${icon('info')}<p>连续 3 天高钠了。明天早餐可以换成鸡蛋加牛奶，午餐少一点酱油和汤。</p></div>`);
      } else if (last3.every((day) => day.sleep && day.sleepMins < 420)) {
        boxes.push(`<div class="notice today-alert">${icon('info')}<p>连续 3 天睡眠不足 7 小时。今晚试试 23:00 前躺下，先把睡眠补回来。</p></div>`);
      }
    }

    container.innerHTML = boxes.slice(0, 1).join('');
  };

  /* ------------------------------------------------------------------ *
   * sheet system
   * ------------------------------------------------------------------ */

  let sheetCloseTimer = null;

  const openSheet = ({ title, sub = '', body = '', footer = '', onMount }) => {
    clearTimeout(sheetCloseTimer);
    const overlay = $('#overlay');
    $('#sheet-title').textContent = title;
    $('#sheet-sub').textContent = sub;
    const bodyEl = $('#sheet-body');
    bodyEl.innerHTML = body;
    bodyEl.scrollTop = 0;
    bodyEl.onclick = null;
    bodyEl.oninput = null;
    bodyEl.onchange = null;
    bodyEl.onkeydown = null;

    const footEl = $('#sheet-foot');
    footEl.innerHTML = footer;
    footEl.hidden = !footer;

    overlay.hidden = false;
    if (onMount) onMount(bodyEl);
    requestAnimationFrame(() => overlay.classList.add('is-open'));
  };

  const closeSheet = () => {
    const overlay = $('#overlay');
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('is-open');
    clearTimeout(sheetCloseTimer);
    sheetCloseTimer = setTimeout(() => {
      overlay.hidden = true;
    }, 280);
  };

  const sheetSave = (label) =>
    `<button class="btn btn--primary" type="button" id="sheet-save">${label}</button>`;

  const bindSave = (handler) => {
    const btn = $('#sheet-save');
    if (btn) btn.onclick = handler;
  };

  const bindSeg = (root, callback) => {
    if (!root) return;
    root.onclick = (event) => {
      const btn = event.target.closest('button[data-val]');
      if (!btn || !root.contains(btn)) return;
      $$('button', root).forEach((el) => el.classList.toggle('is-active', el === btn));
      if (callback) callback(btn.dataset.val, btn);
    };
  };

  const selectedChips = (root) =>
    $$('.chip.is-on', root).map((chip) => chip.dataset.val);

  const bindChips = (root, callback) => {
    if (!root) return;
    root.onclick = (event) => {
      const chip = event.target.closest('.chip');
      if (!chip || !root.contains(chip)) return;
      chip.classList.toggle('is-on');
      chip.setAttribute('aria-pressed', chip.classList.contains('is-on') ? 'true' : 'false');
      if (callback) callback(chip);
    };
  };

  /* ------------------------------------------------------------------ *
   * blood pressure form
   * ------------------------------------------------------------------ */

  const openBPForm = (record = null) => {
    const editing = Boolean(record);
    const today = TODAY();
    const todayMorning = latestBP(today, 'morning');
    const todayNight = latestBP(today, 'night');
    const hour = new Date().getHours();
    let defaultPeriod = hour < 12 ? 'morning' : 'night';
    if (!editing && todayMorning && !todayNight) defaultPeriod = 'night';
    const period = record?.period || defaultPeriod;
    const conditions = record?.conditions || (period === 'morning' ? ['排尿后'] : ['正常']);
    const symptoms = record?.symptoms || ['无'];

    const chipHTML = (list, selected, cls = '') =>
      list.map((name) =>
        `<button class="chip ${cls} ${selected.includes(name) ? 'is-on' : ''}" type="button" data-val="${esc(name)}" aria-pressed="${selected.includes(name)}">${esc(name)}</button>`
      ).join('');

    openSheet({
      title: editing ? '编辑血压' : '记血压',
      sub: '坐位休息 5 分钟，测 2 次取平均；偏高先复测。',
      body: `
        <div class="form-section">
          <div class="form-label">时段</div>
          <div class="seg" id="bp-period" role="group" aria-label="测量时段">
            <button type="button" data-val="morning" class="${period === 'morning' ? 'is-active' : ''}">晨起</button>
            <button type="button" data-val="night" class="${period === 'night' ? 'is-active' : ''}">睡前</button>
          </div>
          <div class="inline-row">
            <span>测量时间</span>
            <input class="time-input" id="bp-time" type="time" value="${esc(record?.time || nowTime())}" aria-label="测量时间" />
          </div>
        </div>
        <div class="form-section">
          <div class="vital-grid">
            <label class="vital"><span>收缩压 <em>mmHg</em></span>
              <input id="bp-sys" type="number" inputmode="numeric" min="60" max="260" placeholder="120" value="${record?.systolic ?? ''}" aria-label="收缩压" />
            </label>
            <label class="vital"><span>舒张压 <em>mmHg</em></span>
              <input id="bp-dia" type="number" inputmode="numeric" min="30" max="160" placeholder="80" value="${record?.diastolic ?? ''}" aria-label="舒张压" />
            </label>
          </div>
          <label class="vital vital--wide"><span>心率 <em>次/分</em></span>
            <input id="bp-hr" type="number" inputmode="numeric" min="30" max="220" placeholder="选填" value="${record?.heartRate ?? ''}" aria-label="心率" />
          </label>
        </div>
        <div class="form-section">
          <button class="details-toggle" type="button" id="bp-more" aria-expanded="${editing}">
            <span>补充信息 <small>测量条件、症状、备注</small></span>
            <span class="details-arrow">${icon('chevron')}</span>
          </button>
        </div>
        <div class="extra-fields" id="bp-extra" ${editing ? '' : 'hidden'}>
          <div class="form-section">
            <div class="form-label">测量条件 <small>可多选</small></div>
            <div class="chips" id="bp-conditions">${chipHTML(CONDITIONS, conditions)}</div>
          </div>
          <div class="form-section">
            <div class="form-label">症状</div>
            <div class="chips" id="bp-symptoms">${chipHTML(SYMPTOMS, symptoms)}</div>
          </div>
          <div class="form-section">
            <div class="form-label">备注 <small>选填</small></div>
            <input id="bp-note" class="input" type="text" maxlength="60" placeholder="比如：今天有点紧张" value="${esc(record?.note || '')}" />
          </div>
        </div>`,
      footer: sheetSave(editing ? '保存修改' : '保存血压'),
      onMount: (root) => {
        bindSeg($('#bp-period', root));
        bindChips($('#bp-conditions', root));
        const symptomBox = $('#bp-symptoms', root);
        bindChips(symptomBox, (chip) => {
          if (chip.dataset.val === '无' && chip.classList.contains('is-on')) {
            $$('.chip', symptomBox).forEach((el) => {
              if (el !== chip) {
                el.classList.remove('is-on');
                el.setAttribute('aria-pressed', 'false');
              }
            });
          } else if (chip.dataset.val !== '无' && chip.classList.contains('is-on')) {
            const none = $('.chip[data-val="无"]', symptomBox);
            if (none) {
              none.classList.remove('is-on');
              none.setAttribute('aria-pressed', 'false');
            }
          }
        });

        const more = $('#bp-more', root);
        const extra = $('#bp-extra', root);
        more.onclick = () => {
          const open = extra.hidden;
          extra.hidden = !open;
          more.setAttribute('aria-expanded', open ? 'true' : 'false');
          more.classList.toggle('is-open', open);
        };
        more.classList.toggle('is-open', !extra.hidden);
      },
    });

    bindSave(() => {
      const sys = parseNumber($('#bp-sys').value);
      const dia = parseNumber($('#bp-dia').value);
      const hr = parseNumber($('#bp-hr').value);
      if (sys == null || sys < 60 || sys > 260) return showToast('请填写 60–260 之间的收缩压');
      if (dia == null || dia < 30 || dia > 160) return showToast('请填写 30–160 之间的舒张压');
      if (sys <= dia) return showToast('收缩压应高于舒张压');
      if (hr != null && (hr < 30 || hr > 220)) return showToast('请检查心率数值');

      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        time: $('#bp-time').value || record?.time || nowTime(),
        period: $('#bp-period .is-active')?.dataset.val || 'morning',
        systolic: Math.round(sys),
        diastolic: Math.round(dia),
        heartRate: hr == null ? null : Math.round(hr),
        conditions: selectedChips($('#bp-conditions')),
        symptoms: selectedChips($('#bp-symptoms')),
        note: $('#bp-note').value.trim(),
        isAverage: true,
      };
      const index = state.bp.findIndex((r) => r.id === item.id);
      if (index >= 0) state.bp[index] = item;
      else state.bp.push(item);
      saveState();
      renderAll();
      closeSheet();
      if (sys >= 140 || dia >= 90) {
        showToast('已保存。先休息 5 分钟，再复测一次吧', 3400);
      } else {
        showToast(editing ? '血压已更新' : '血压已记录');
      }
    });
  };

  /* ------------------------------------------------------------------ *
   * meal form
   * ------------------------------------------------------------------ */

  const defaultMealType = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 21) return 'dinner';
    return 'snack';
  };

  const openMealForm = (record = null) => {
    const editing = Boolean(record);
    let mealType = record?.mealType || defaultMealType();
    let items = record ? record.items.map((item) => ({ ...item })) : [];

    const foodGrid = FOODS.map((food) => `
      <button class="food-btn" type="button" data-food="${food.id}">
        <b>${esc(food.name)}</b>
        <small>${esc(food.serving)} · ${food.kcal} kcal</small>
        <span class="tags">
          <span class="food-tag sodium-${food.sodium}">${SODIUM_LABEL[food.sodium]}钠</span>
          <span class="food-tag ${food.potassium === 'high' ? 'potassium-high' : ''}">${POTASSIUM_LABEL[food.potassium]}</span>
        </span>
      </button>`).join('');

    const combos = COMBOS.map((combo) => `
      <button class="combo" type="button" data-combo="${combo.id}">
        <b>${esc(combo.label)}</b>
        <span>${esc(combo.desc)}</span>
      </button>`).join('');

    openSheet({
      title: editing ? '编辑饮食' : '记一餐',
      sub: '先点快捷组合，也可以自己挑食物',
      body: `
        <div class="form-section">
          <div class="form-label">餐次</div>
          <div class="seg" id="meal-type" role="group" aria-label="餐次">
            ${MEAL_ORDER.map((type) =>
              `<button type="button" data-val="${type}" class="${mealType === type ? 'is-active' : ''}">${MEAL_LABEL[type]}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">已选 <small id="sel-count"></small></div>
          <div class="selected-box" id="selected-box"></div>
        </div>
        <div class="form-section">
          <div class="meal-tabs" id="meal-tabs" role="tablist">
            <button type="button" data-pane="combo" class="is-active">快捷组合</button>
            <button type="button" data-pane="foods">自选食物</button>
          </div>
          <div class="meal-pane" id="meal-pane-combo">
            <div class="combo-grid">${combos}</div>
          </div>
          <div class="meal-pane" id="meal-pane-foods" hidden>
            <div class="food-grid" id="food-grid">${foodGrid}</div>
          </div>
        </div>`,
      footer: `<div class="sheet-summary" id="meal-foot-summary"><span>已选 0 份</span><b>高钠 0 个</b></div>${sheetSave(editing ? '保存修改' : '保存饮食')}`,
      onMount: (root) => {
        const seg = $('#meal-type', root);
        bindSeg(seg, (value) => { mealType = value; sync(); });

        const addFood = (foodId) => {
          const existing = items.find((item) => item.foodId === foodId);
          if (existing) existing.servings = Math.min(9, (existing.servings || 1) + 1);
          else items.push({ foodId, servings: 1 });
        };

        const sync = () => {
          const box = $('#selected-box', root);
          if (!items.length) {
            box.innerHTML = '<div class="selected-empty">还没有选择食物</div>';
          } else {
            box.innerHTML = `<div class="selected-list">${items.map((item) => {
              const food = foodOf(item.foodId);
              if (!food) return '';
              return `
                <div class="selected-item">
                  <span class="name">${esc(food.name)}</span>
                  <span class="servings">
                    <button type="button" data-serv="-1" data-id="${food.id}" aria-label="减少份数">−</button>
                    <span>${item.servings || 1}</span>
                    <button type="button" data-serv="1" data-id="${food.id}" aria-label="增加份数">＋</button>
                  </span>
                  <button class="remove-item" type="button" data-remove="${food.id}" aria-label="移除">${icon('x')}</button>
                </div>`;
            }).join('')}</div>`;
          }
          const servings = items.reduce((sum, item) => sum + (item.servings || 1), 0);
          const highCount = items.reduce((sum, item) => {
            const food = foodOf(item.foodId);
            return sum + (food && food.sodium === 'high' ? 1 : 0);
          }, 0);
          $('#sel-count', root).textContent = `${servings} 份 · 高钠食物 ${highCount} 个`;
          const footSummary = $('#meal-foot-summary');
          if (footSummary) {
            footSummary.innerHTML = `<span>已选 ${servings} 份 · ${MEAL_LABEL[mealType]}</span><b>${highCount ? `高钠 ${highCount} 个` : '清淡'}</b>`;
          }
          $$('.food-btn', root).forEach((btn) => {
            btn.classList.toggle('is-on', items.some((item) => item.foodId === btn.dataset.food));
          });
        };

        const tabs = $('#meal-tabs', root);
        const panes = {
          combo: $('#meal-pane-combo', root),
          foods: $('#meal-pane-foods', root),
        };
        tabs.onclick = (event) => {
          const btn = event.target.closest('[data-pane]');
          if (!btn) return;
          const pane = btn.dataset.pane;
          $$('button', tabs).forEach((el) => el.classList.toggle('is-active', el === btn));
          Object.entries(panes).forEach(([key, el]) => { el.hidden = key !== pane; });
        };

        root.onclick = (event) => {
          const combo = event.target.closest('[data-combo]');
          if (combo) {
            const preset = COMBOS.find((c) => c.id === combo.dataset.combo);
            if (!preset) return;
            mealType = preset.mealType;
            $$('button', seg).forEach((btn) => btn.classList.toggle('is-active', btn.dataset.val === mealType));
            preset.foods.forEach(addFood);
            sync();
            return;
          }

          const foodBtn = event.target.closest('[data-food]');
          if (foodBtn) {
            const foodId = foodBtn.dataset.food;
            if (items.some((item) => item.foodId === foodId)) {
              items = items.filter((item) => item.foodId !== foodId);
            } else {
              items.push({ foodId, servings: 1 });
            }
            sync();
            return;
          }

          const step = event.target.closest('[data-serv]');
          if (step) {
            const item = items.find((entry) => entry.foodId === step.dataset.id);
            if (!item) return;
            item.servings = clamp((item.servings || 1) + Number(step.dataset.serv), 1, 9);
            sync();
            return;
          }

          const remove = event.target.closest('[data-remove]');
          if (remove) {
            items = items.filter((item) => item.foodId !== remove.dataset.remove);
            sync();
          }
        };

        sync();
      },
    });

    bindSave(() => {
      if (!items.length) return showToast('先选一点食物再保存');
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        mealType,
        items: items.map((entry) => ({ foodId: entry.foodId, servings: entry.servings || 1 })),
        note: record?.note || '',
      };
      const index = state.meals.findIndex((r) => r.id === item.id);
      if (index >= 0) state.meals[index] = item;
      else state.meals.push(item);
      saveState();
      renderAll();
      closeSheet();
      showToast(editing ? '饮食已更新' : `已记入${MEAL_LABEL[mealType]}`);
    });
  };

  /* ------------------------------------------------------------------ *
   * water form
   * ------------------------------------------------------------------ */

  const openWaterForm = (date = TODAY()) => {
    const current = state.water[date] || {};
    const editing = Boolean(state.water[date]);
    let total = current.totalMl || 0;
    let sodiumDrinks = Array.isArray(current.sodiumDrinkTypes) ? [...current.sodiumDrinkTypes] : [];

    openSheet({
      title: editing ? '编辑饮水' : '记饮水',
      sub: `${cnDate(date)} · 少量多次，慢慢喝`,
      body: `
        <div class="form-section">
          <div class="form-label">今日饮水 <small>点按快速增减</small></div>
          <div class="stepper">
            <button type="button" data-water-add="-250" aria-label="减少 250 毫升">−</button>
            <input id="water-total" type="number" inputmode="numeric" min="0" max="6000" step="50" value="${total}" aria-label="饮水总量（毫升）" />
            <em>ml</em>
            <button type="button" data-water-add="250" aria-label="增加 250 毫升">＋</button>
          </div>
          <div class="chips" style="margin-top:9px">
            <button class="chip" type="button" data-water-add="250">+ 250 ml</button>
            <button class="chip" type="button" data-water-add="500">+ 500 ml</button>
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">含钠饮料 <small>选填，可多选</small></div>
          <div class="chips" id="water-sodium">
            ${SODIUM_DRINKS.map((name) =>
              `<button class="chip ${sodiumDrinks.includes(name) ? 'is-on' : ''}" type="button" data-val="${esc(name)}" aria-pressed="${sodiumDrinks.includes(name)}">${name}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">夜尿次数 <small>选填</small></div>
          <div class="seg" id="water-urine" role="group" aria-label="夜尿次数">
            ${['0', '1', '2+'].map((n) =>
              `<button type="button" data-val="${n}" class="${String(current.nightUrineCount ?? 0) === n || (n === '2+' && current.nightUrineCount >= 2) ? 'is-active' : ''}">${n}</button>`
            ).join('')}
          </div>
        </div>
        <div class="hint">${icon('info')}<span>含钠饮料也算在总饮水量里。当天重复记录会覆盖，不会叠加。</span></div>`,
      footer: sheetSave(editing ? '保存修改' : '保存饮水'),
      onMount: (root) => {
        const input = $('#water-total', root);
        const setTotal = (next) => {
          total = clamp(Math.round(next / 50) * 50, 0, 6000);
          input.value = total;
        };
        root.onclick = (event) => {
          const adder = event.target.closest('[data-water-add]');
          if (adder) {
            setTotal(total + Number(adder.dataset.waterAdd));
            return;
          }
          const chip = event.target.closest('#water-sodium .chip');
          if (chip) {
            chip.classList.toggle('is-on');
            chip.setAttribute('aria-pressed', chip.classList.contains('is-on') ? 'true' : 'false');
          }
        };
        input.oninput = () => { total = parseNumber(input.value, 0) || 0; };
        bindSeg($('#water-urine', root));
      },
    });

    bindSave(() => {
      const parsed = parseNumber($('#water-total').value, 0) || 0;
      if (parsed < 0 || parsed > 6000) return showToast('请检查饮水总量');
      const sodium = selectedChips($('#water-sodium'));
      const urineValue = $('#water-urine .is-active')?.dataset.val || '0';
      const item = {
        totalMl: Math.round(parsed),
        sodiumDrinkTypes: sodium,
        nightUrineCount: urineValue === '2+' ? 2 : Number(urineValue),
      };
      if (!item.totalMl && !sodium.length && !item.nightUrineCount) {
        delete state.water[date];
      } else {
        state.water[date] = item;
      }
      saveState();
      renderAll();
      closeSheet();
      showToast(parsed ? `今日饮水 ${Math.round(parsed)} ml` : '饮水记录已清除');
    });
  };

  /* ------------------------------------------------------------------ *
   * coffee form
   * ------------------------------------------------------------------ */

  const openCoffeeForm = (record = null) => {
    const editing = Boolean(record);
    let cups = record?.cups || 1;
    let type = record?.type || '黑咖啡';
    let time = record?.time || nowTime();

    openSheet({
      title: editing ? '编辑咖啡' : '记咖啡',
      sub: '记录杯数和时间，14 点后留意一下睡眠',
      body: `
        <div class="form-section">
          <div class="form-label">杯数</div>
          <div class="stepper">
            <button type="button" id="coffee-minus" aria-label="减少一杯">−</button>
            <input id="coffee-cups" type="number" inputmode="numeric" min="1" max="6" value="${cups}" aria-label="咖啡杯数" />
            <em>杯</em>
            <button type="button" id="coffee-plus" aria-label="增加一杯">＋</button>
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">类型</div>
          <div class="seg" id="coffee-type" role="group" aria-label="咖啡类型">
            ${COFFEE_TYPES.map((name) =>
              `<button type="button" data-val="${esc(name)}" class="${type === name ? 'is-active' : ''}">${name}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">饮用时间</div>
          <input id="coffee-time" class="input" type="time" value="${esc(time)}" />
        </div>
        <div class="hint" id="coffee-hint"></div>`,
      footer: sheetSave(editing ? '保存修改' : '保存咖啡'),
      onMount: (root) => {
        const input = $('#coffee-cups', root);
        const hint = $('#coffee-hint', root);
        const timeInput = $('#coffee-time', root);
        const refresh = () => {
          time = timeInput.value || nowTime();
          const late = (timeToMinutes(time) ?? 0) >= 14 * 60;
          hint.className = `hint ${late ? 'is-warm' : ''}`;
          hint.innerHTML = `${icon(late ? 'info' : 'moon')}<span>${late
            ? '已过 14 点。今晚可能会睡得浅一点，睡前 6 小时尽量不再喝。'
            : '14 点前喝比较友好，睡前 6 小时尽量不再喝。'}</span>`;
        };
        root.onclick = (event) => {
          if (event.target.closest('#coffee-minus')) {
            cups = clamp(cups - 1, 1, 6);
            input.value = cups;
          } else if (event.target.closest('#coffee-plus')) {
            cups = clamp(cups + 1, 1, 6);
            input.value = cups;
          }
        };
        input.oninput = () => { cups = clamp(parseNumber(input.value, 1) || 1, 1, 6); };
        timeInput.oninput = refresh;
        bindSeg($('#coffee-type', root), (value) => { type = value; });
        refresh();
      },
    });

    bindSave(() => {
      const count = clamp(parseNumber($('#coffee-cups').value, 1) || 1, 1, 6);
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        cups: count,
        type: $('#coffee-type .is-active')?.dataset.val || '黑咖啡',
        time: $('#coffee-time').value || nowTime(),
      };
      const index = state.caffeine.findIndex((r) => r.id === item.id);
      if (index >= 0) state.caffeine[index] = item;
      else state.caffeine.push(item);
      saveState();
      renderAll();
      closeSheet();
      showToast(editing ? '咖啡记录已更新' : `已记 ${count} 杯咖啡`);
    });
  };

  /* ------------------------------------------------------------------ *
   * exercise form
   * ------------------------------------------------------------------ */

  const openExerciseForm = (record = null) => {
    const editing = Boolean(record);
    let minutes = record?.minutes || 30;
    let intensity = record?.intensity || '中等';
    let discomfort = record?.discomfort || '无';

    const estimate = () => {
      const latest = weightLatest();
      const kg = latest ? latest.weightKg : 75;
      return Math.round(7.5 * kg * (minutes / 60));
    };

    openSheet({
      title: editing ? '编辑慢跑' : '记慢跑',
      sub: '中等强度、持续 30 分钟以上就很好',
      body: `
        <div class="form-section">
          <div class="form-label">类型</div>
          <div class="seg" id="run-type" role="group" aria-label="运动类型">
            <button type="button" data-val="跑步机慢跑" class="is-active">跑步机慢跑</button>
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">时长 <small>分钟</small></div>
          <div class="stepper">
            <button type="button" id="run-minus" aria-label="减少五分钟">−</button>
            <input id="run-minutes" type="number" inputmode="numeric" min="5" max="180" step="5" value="${minutes}" aria-label="运动时长（分钟）" />
            <em>分钟</em>
            <button type="button" id="run-plus" aria-label="增加五分钟">＋</button>
          </div>
        </div>
        <div class="form-section">
          <div class="vital-grid">
            <label class="vital"><span>速度 <em>km/h</em></span>
              <input id="run-speed" type="number" inputmode="decimal" min="3" max="15" step="0.1" value="${record?.speed ?? '7.0'}" aria-label="速度" />
            </label>
            <label class="vital"><span>坡度 <em>%</em></span>
              <input id="run-incline" type="number" inputmode="numeric" min="0" max="20" value="${record?.incline ?? 0}" aria-label="坡度" />
            </label>
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">强度感受</div>
          <div class="seg" id="run-intensity" role="group" aria-label="强度感受">
            ${['轻松', '中等', '吃力'].map((name) =>
              `<button type="button" data-val="${name}" class="${intensity === name ? 'is-active' : ''}">${name}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">运动后不适</div>
          <div class="seg" id="run-discomfort" role="group" aria-label="运动后不适">
            ${['无', '头晕', '胸闷'].map((name) =>
              `<button type="button" data-val="${name}" class="${discomfort === name ? 'is-active' : ''}">${name}</button>`
            ).join('')}
          </div>
        </div>
        <div class="energy" id="run-energy"></div>
        <div class="hint">${icon('info')}<span>如果运动后出现胸闷、头晕，请先停下休息；反复出现时及时就医。</span></div>`,
      footer: sheetSave(editing ? '保存修改' : '保存慢跑'),
      onMount: (root) => {
        const input = $('#run-minutes', root);
        const energy = $('#run-energy', root);
        const refresh = () => {
          energy.innerHTML = `<span>估算消耗</span><b>约 ${estimate()} kcal</b>`;
        };
        root.onclick = (event) => {
          if (event.target.closest('#run-minus')) {
            minutes = clamp(minutes - 5, 5, 180);
            input.value = minutes;
            refresh();
          } else if (event.target.closest('#run-plus')) {
            minutes = clamp(minutes + 5, 5, 180);
            input.value = minutes;
            refresh();
          }
        };
        input.oninput = () => {
          minutes = clamp(parseNumber(input.value, 5) || 5, 5, 180);
          refresh();
        };
        bindSeg($('#run-intensity', root), (value) => { intensity = value; });
        bindSeg($('#run-discomfort', root), (value) => { discomfort = value; });
        refresh();
      },
    });

    bindSave(() => {
      const mins = clamp(parseNumber($('#run-minutes').value, 30) || 30, 5, 180);
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        type: '跑步机慢跑',
        minutes: Math.round(mins),
        speed: parseNumber($('#run-speed').value),
        incline: parseNumber($('#run-incline').value),
        intensity: $('#run-intensity .is-active')?.dataset.val || '中等',
        kcalEst: Math.round(7.5 * ((weightLatest()?.weightKg) || 75) * (mins / 60)),
        discomfort: $('#run-discomfort .is-active')?.dataset.val || '无',
        note: record?.note || '',
      };
      const index = state.exercise.findIndex((r) => r.id === item.id);
      if (index >= 0) state.exercise[index] = item;
      else state.exercise.push(item);
      saveState();
      renderAll();
      closeSheet();
      if (item.discomfort !== '无') {
        showToast('已保存。运动后不适请先休息，必要时就医', 3400);
      } else {
        showToast(editing ? '慢跑记录已更新' : '慢跑已记录');
      }
    });
  };

  /* ------------------------------------------------------------------ *
   * sleep form
   * ------------------------------------------------------------------ */

  const openSleepForm = (record = null) => {
    const editing = Boolean(record);
    let wakeCount = record?.wakeCount ?? 0;
    let quality = record?.quality1to5 ?? 4;
    let napMin = record?.napMin ?? 0;

    openSheet({
      title: editing ? '编辑睡眠' : '记睡眠',
      sub: '记录昨晚的入睡、醒来和质量',
      body: `
        <div class="form-section">
          <div class="vital-grid">
            <label class="vital"><span>入睡 <em>时间</em></span>
              <input id="sleep-time" type="time" value="${esc(record?.sleepTime || '23:00')}" aria-label="入睡时间" />
            </label>
            <label class="vital"><span>起床 <em>时间</em></span>
              <input id="sleep-wake" type="time" value="${esc(record?.wakeTime || '06:40')}" aria-label="起床时间" />
            </label>
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">夜间醒来</div>
          <div class="seg" id="sleep-wake-count" role="group" aria-label="夜间醒来次数">
            ${['0', '1', '2+'].map((n) =>
              `<button type="button" data-val="${n}" class="${String(wakeCount) === n || (n === '2+' && wakeCount >= 2) ? 'is-active' : ''}">${n}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">主观质量 <small>1 差 · 5 好</small></div>
          <div class="quality" id="sleep-quality">
            ${[1, 2, 3, 4, 5].map((n) =>
              `<button type="button" data-val="${n}" class="${String(quality) === String(n) ? 'is-on' : ''}">${n}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">午睡 <small>分钟，选填</small></div>
          <div class="stepper">
            <button type="button" id="nap-minus" aria-label="减少十分钟">−</button>
            <input id="nap-min" type="number" inputmode="numeric" min="0" max="180" step="10" value="${napMin}" aria-label="午睡分钟" />
            <em>分钟</em>
            <button type="button" id="nap-plus" aria-label="增加十分钟">＋</button>
          </div>
        </div>
        <div class="hint" id="sleep-tags"></div>`,
      footer: sheetSave(editing ? '保存修改' : '保存睡眠'),
      onMount: (root) => {
        const sleepInput = $('#sleep-time', root);
        const wakeInput = $('#sleep-wake', root);
        const napInput = $('#nap-min', root);
        const tags = $('#sleep-tags', root);

        const refresh = () => {
          const mins = sleepMinutes(sleepInput.value, wakeInput.value);
          const dur = formatDuration(mins);
          const list = [];
          if (mins && mins < 420) list.push('睡眠不足 7h');
          if (TimeLaterThan(sleepInput.value, '23:30')) list.push('入睡偏晚');
          if (wakeCount >= 2) list.push('夜醒偏多');
          tags.className = `hint ${list.length ? 'is-warm' : ''}`;
          tags.innerHTML = `${icon(list.length ? 'info' : 'check')}<span>睡眠 ${dur.long}。${list.length ? list.join(' · ') : '看起来不错，继续保持。'}</span>`;
        };

        const TimeLaterThan = (time, target) => {
          const value = timeToMinutes(time);
          return value != null && value > timeToMinutes(target);
        };

        root.onclick = (event) => {
          if (event.target.closest('#nap-minus')) {
            napMin = clamp(napMin - 10, 0, 180);
            napInput.value = napMin;
          } else if (event.target.closest('#nap-plus')) {
            napMin = clamp(napMin + 10, 0, 180);
            napInput.value = napMin;
          }
          const qualityBtn = event.target.closest('#sleep-quality button');
          if (qualityBtn) {
            quality = Number(qualityBtn.dataset.val);
            $$('#sleep-quality button', root).forEach((btn) => btn.classList.toggle('is-on', btn === qualityBtn));
            refresh();
          }
        };

        bindSeg($('#sleep-wake-count', root), (value) => {
          wakeCount = value === '2+' ? 2 : Number(value);
          refresh();
        });
        sleepInput.oninput = refresh;
        wakeInput.oninput = refresh;
        napInput.oninput = () => { napMin = clamp(parseNumber(napInput.value, 0) || 0, 0, 180); };
        refresh();
      },
    });

    bindSave(() => {
      const sleepTime = $('#sleep-time').value || '23:00';
      const wakeTime = $('#sleep-wake').value || '06:40';
      const mins = sleepMinutes(sleepTime, wakeTime);
      if (mins < 120 || mins > 960) return showToast('请检查入睡和起床时间');
      const wakeValue = $('#sleep-wake-count .is-active')?.dataset.val || '0';
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        sleepTime,
        wakeTime,
        wakeCount: wakeValue === '2+' ? 2 : Number(wakeValue),
        quality1to5: quality,
        napMin: Math.round(napMin),
        note: record?.note || '',
      };
      const index = state.sleep.findIndex((r) => r.id === item.id);
      if (index >= 0) state.sleep[index] = item;
      else {
        const sameDay = state.sleep.findIndex((r) => r.date === item.date);
        if (sameDay >= 0) state.sleep[sameDay] = item;
        else state.sleep.push(item);
      }
      saveState();
      renderAll();
      closeSheet();
      showToast(editing ? '睡眠记录已更新' : '睡眠已记录');
    });
  };

  /* ------------------------------------------------------------------ *
   * weight form
   * ------------------------------------------------------------------ */

  const openWeightForm = (record = null) => {
    const editing = Boolean(record);
    const latest = weightLatest();
    const initial = record?.weightKg ?? latest?.weightKg ?? '';
    let waistInit = editing ? (record.waistCm ?? '') : (latestWaist()?.waistCm ?? '');

    openSheet({
      title: editing ? '编辑体重' : '记体重腰围',
      sub: '晨起排尿后，每周 2–3 次；腰围每周 1 次',
      body: `
        <div class="form-section">
          <div class="vital-grid">
            <label class="vital"><span>体重 <em>kg</em></span>
              <input id="weight-kg" type="number" inputmode="decimal" min="30" max="200" step="0.1" value="${initial ? Number(initial).toFixed(1) : ''}" placeholder="—" aria-label="体重" />
            </label>
            <label class="vital"><span>腰围 <em>cm</em></span>
              <input id="weight-waist" type="number" inputmode="decimal" min="40" max="200" step="0.1" value="${waistInit !== '' ? Number(waistInit).toFixed(1) : ''}" placeholder="选填" aria-label="腰围" />
            </label>
          </div>
        </div>
        <div class="goal-card">
          <div>
            <span>目标体重</span>
            <b>${state.settings.targetWeight} kg</b>
          </div>
          <div>
            <span>当前距离</span>
            <b id="weight-gap">—</b>
          </div>
        </div>
        <div class="hint">${icon('info')}<span>体重会自然波动，看周均更有意义。每周记录 2–3 次即可。</span></div>`,
      footer: sheetSave(editing ? '保存修改' : '保存体重'),
      onMount: (root) => {
        const kgInput = $('#weight-kg', root);
        const gap = $('#weight-gap', root);
        const refresh = () => {
          const kg = parseNumber(kgInput.value);
          if (kg == null) {
            gap.textContent = '—';
          } else {
            const diff = round1(kg - state.settings.targetWeight);
            gap.textContent = diff > 0 ? `还差 ${fmt1(diff)} kg` : '已达到目标';
          }
        };
        kgInput.oninput = refresh;
        refresh();
      },
    });

    bindSave(() => {
      const kg = parseNumber($('#weight-kg').value);
      const waist = parseNumber($('#weight-waist').value);
      if (kg == null || kg < 30 || kg > 200) return showToast('请填写 30–200 之间的体重');
      if (waist != null && (waist < 40 || waist > 200)) return showToast('请检查腰围数值');
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        weightKg: Math.round(kg * 10) / 10,
        waistCm: waist == null ? null : Math.round(waist * 10) / 10,
      };
      const index = state.weight.findIndex((r) => r.id === item.id);
      if (index >= 0) {
        state.weight[index] = item;
      } else {
        const sameDay = state.weight.findIndex((r) => r.date === item.date);
        if (sameDay >= 0) state.weight[sameDay] = item;
        else state.weight.push(item);
      }
      saveState();
      renderAll();
      closeSheet();
      showToast(editing ? '体重记录已更新' : '体重已记录');
    });
  };

  /* ------------------------------------------------------------------ *
   * daily mood
   * ------------------------------------------------------------------ */

  const openMoodForm = (record = null) => {
    let mood = record?.mood1to5 ?? 3;
    openSheet({
      title: '每日快评',
      sub: '给今天的心情或压力打个分',
      body: `
        <div class="form-section">
          <div class="form-label">情绪 / 压力 <small>1 紧绷 · 5 轻松</small></div>
          <div class="quality" id="mood-value">
            ${[1, 2, 3, 4, 5].map((n) =>
              `<button type="button" data-val="${n}" class="${String(mood) === String(n) ? 'is-on' : ''}">${n}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-section">
          <div class="form-label">一句话 <small>选填</small></div>
          <textarea id="mood-note" class="textarea" maxlength="120" placeholder="今天感觉怎么样？">${esc(record?.note || '')}</textarea>
        </div>`,
      footer: sheetSave('保存快评'),
      onMount: (root) => {
        root.onclick = (event) => {
          const btn = event.target.closest('#mood-value button');
          if (!btn) return;
          mood = Number(btn.dataset.val);
          $$('#mood-value button', root).forEach((el) => el.classList.toggle('is-on', el === btn));
        };
      },
    });

    bindSave(() => {
      const item = {
        id: record?.id || uid(),
        date: record?.date || TODAY(),
        mood1to5: mood,
        note: $('#mood-note').value.trim(),
      };
      const index = state.daily.findIndex((r) => r.id === item.id);
      if (index >= 0) state.daily[index] = item;
      else {
        const sameDay = state.daily.findIndex((r) => r.date === item.date);
        if (sameDay >= 0) state.daily[sameDay] = item;
        else state.daily.push(item);
      }
      saveState();
      renderAll();
      closeSheet();
      showToast('今日快评已保存');
    });
  };

  /* ------------------------------------------------------------------ *
   * quick panel
   * ------------------------------------------------------------------ */

  const openSleepEntry = () => openSleepForm(sleepFor(TODAY()));
  const openWeightEntry = () => openWeightForm(weightFor(TODAY()));

  const QUICK_ITEMS = [
    { key: 'bp', label: '血压', icon: 'pulse', theme: 'bp' },
    { key: 'meal', label: '一餐', icon: 'bowl', theme: 'diet' },
    { key: 'water', label: '饮水', icon: 'drop', theme: 'water' },
    { key: 'coffee', label: '咖啡', icon: 'coffee', theme: 'diet' },
    { key: 'exercise', label: '慢跑', icon: 'run', theme: 'exercise' },
    { key: 'sleep', label: '睡眠', icon: 'moon', theme: 'sleep' },
    { key: 'weight', label: '体重', icon: 'scale', theme: 'weight' },
    { key: 'mood', label: '快评', icon: 'spark', theme: 'mood' },
  ];

  const openQuickPanel = () => {
    openSheet({
      title: '快速记录',
      sub: '今天想先记哪一项？',
      body: `<div class="quick-grid">${QUICK_ITEMS.map((item) => `
        <button class="quick-item" type="button" data-quick="${item.key}">
          <span class="quick-ico">${icon(item.icon)}</span>
          <span>${item.label}</span>
        </button>`).join('')}</div>
        <div class="hint" style="margin-top:14px">${icon('info')}<span>所有记录只保存在本机浏览器，可以随时导出备份。</span></div>`,
      footer: '',
      onMount: (root) => {
        root.onclick = (event) => {
          const btn = event.target.closest('[data-quick]');
          if (!btn) return;
          const key = btn.dataset.quick;
          if (key === 'bp') openBPForm();
          if (key === 'meal') openMealForm();
          if (key === 'water') openWaterForm();
          if (key === 'coffee') openCoffeeForm();
          if (key === 'exercise') openExerciseForm();
          if (key === 'sleep') openSleepEntry();
          if (key === 'weight') openWeightEntry();
          if (key === 'mood') openMoodForm();
        };
      },
    });
  };

  /* ------------------------------------------------------------------ *
   * trends
   * ------------------------------------------------------------------ */

  let trendRange = 7;
  let trendMetric = 'bp';
  let trendBPSub = 'sys';

  const lastKeys = (count) =>
    Array.from({ length: count }, (_, i) => shiftKey(TODAY(), i - (count - 1)));

  const trendSeries = () => {
    const keys = lastKeys(trendRange);
    if (trendMetric === 'bp') {
      const field = trendBPSub === 'sys' ? 'systolic' : 'diastolic';
      return {
        keys,
        series: [
          { name: '晨压', color: '#2f6a5f', values: keys.map((key) => latestBP(key, 'morning')?.[field] ?? null) },
          { name: '晚压', color: '#b08a67', values: keys.map((key) => latestBP(key, 'night')?.[field] ?? null) },
        ],
        goal: trendBPSub === 'sys' ? state.settings.targetSys : state.settings.targetDia,
        unit: 'mmHg',
        decimals: 0,
      };
    }
    if (trendMetric === 'weight') {
      return {
        keys,
        series: [{
          name: '体重', color: '#2f6a5f',
          values: keys.map((key) => weightFor(key)?.weightKg ?? null),
        }],
        goal: state.settings.targetWeight,
        unit: 'kg',
        decimals: 1,
      };
    }
    return {
      keys,
      series: [{
        name: '腰围', color: '#9a6b52',
        values: keys.map((key) => weightFor(key)?.waistCm ?? null),
      }],
      goal: null,
      unit: 'cm',
      decimals: 1,
    };
  };

  const avgPair = (records) => {
    if (!records.length) return null;
    return {
      sys: Math.round(mean(records.map((r) => r.systolic))),
      dia: Math.round(mean(records.map((r) => r.diastolic))),
      n: records.length,
    };
  };

  const renderTrends = () => {
    $$('#range-seg button').forEach((btn) =>
      btn.classList.toggle('is-active', Number(btn.dataset.range) === trendRange));
    $$('#metric-seg button').forEach((btn) =>
      btn.classList.toggle('is-active', btn.dataset.metric === trendMetric));

    const subToggle = $('#bp-subtoggle');
    subToggle.hidden = trendMetric !== 'bp';
    subToggle.textContent = trendBPSub === 'sys' ? '收缩压' : '舒张压';

    const legend = $('#chart-legend');
    if (trendMetric === 'bp') {
      legend.innerHTML = `
        <span><i style="--c:#2f6a5f"></i>晨压</span>
        <span><i style="--c:#b08a67"></i>晚压</span>
        <span><i class="line" style="--c:#c3ab8d"></i>目标 ${trendBPSub === 'sys' ? state.settings.targetSys : state.settings.targetDia}</span>`;
    } else if (trendMetric === 'weight') {
      legend.innerHTML = `<span><i style="--c:#2f6a5f"></i>体重</span>
        <span><i class="line" style="--c:#c3ab8d"></i>目标 ${state.settings.targetWeight} kg</span>`;
    } else {
      legend.innerHTML = '<span><i style="--c:#9a6b52"></i>腰围</span>';
    }

    renderTrendStats();
    renderReport();
    if ($('#page-trends').classList.contains('is-active')) requestAnimationFrame(drawChart);
  };

  const renderTrendStats = () => {
    const box = $('#chart-stats');
    const keys = lastKeys(trendRange);

    if (trendMetric === 'bp') {
      const mornings = keys.map((key) => latestBP(key, 'morning')).filter(Boolean);
      const nights = keys.map((key) => latestBP(key, 'night')).filter(Boolean);
      const avgM = avgPair(mornings);
      const avgN = avgPair(nights);
      const targetDays = mornings.filter((r) =>
        r.systolic < state.settings.targetSys && r.diastolic < state.settings.targetDia).length;
      box.innerHTML = `
        <div><small>晨压均值</small><b>${avgM ? `${avgM.sys}/${avgM.dia}` : '—'}</b></div>
        <div><small>晚压均值</small><b>${avgN ? `${avgN.sys}/${avgN.dia}` : '—'}</b></div>
        <div><small>达标天数</small><b>${mornings.length ? `${targetDays}/${mornings.length}` : '—'}</b></div>`;
      return;
    }

    if (trendMetric === 'weight') {
      const records = keys.map((key) => weightFor(key)).filter(Boolean);
      const avg = mean(records.map((r) => r.weightKg));
      const latest = weightLatest();
      const diff = latest ? round1(latest.weightKg - state.settings.targetWeight) : null;
      box.innerHTML = `
        <div><small>最新体重</small><b>${latest ? `${latest.weightKg.toFixed(1)}` : '—'}</b></div>
        <div><small>区间均值</small><b>${avg != null ? avg.toFixed(1) : '—'}</b></div>
        <div><small>距目标</small><b>${diff != null ? (diff > 0 ? `${fmt1(diff)}` : '已达成') : '—'}</b></div>`;
      return;
    }

    const records = keys.map((key) => weightFor(key)).filter((r) => r && r.waistCm != null);
    const latest = records.length ? records[records.length - 1] : null;
    const first = records.length ? records[0] : null;
    const change = latest && first ? round1(latest.waistCm - first.waistCm) : null;
    box.innerHTML = `
      <div><small>最新腰围</small><b>${latest ? `${latest.waistCm.toFixed(1)}` : '—'}</b></div>
      <div><small>区间变化</small><b>${change != null ? `${change > 0 ? '+' : ''}${fmt1(change)}` : '—'}</b></div>
      <div><small>记录次数</small><b>${records.length}</b></div>`;
  };

  const niceScale = (min, max, tickCount = 4) => {
    let span = max - min;
    if (!Number.isFinite(span) || span <= 0) span = 10;
    const rough = span / (tickCount - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / magnitude;
    let step;
    if (normalized <= 1) step = 1;
    else if (normalized <= 2) step = 2;
    else if (normalized <= 2.5) step = 2.5;
    else if (normalized <= 5) step = 5;
    else step = 10;
    step *= magnitude;
    return {
      lo: Math.floor(min / step) * step,
      hi: Math.ceil(max / step) * step,
      step,
    };
  };

  const drawChart = () => {
    const canvas = $('#trend-chart');
    if (!canvas || !$('#page-trends').classList.contains('is-active')) return;
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 20) return;

    const W = rect.width;
    const H = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const data = trendSeries();
    const values = data.series.flatMap((s) => s.values).filter((v) => v != null);
    const empty = $('#chart-empty');
    if (!values.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const all = data.goal != null ? [...values, data.goal] : values.slice();
    let min = Math.min(...all);
    let max = Math.max(...all);
    if (max - min < (data.decimals ? 1 : 8)) {
      const pad = data.decimals ? 1 : 5;
      min -= pad;
      max += pad;
    }
    const padSize = trendMetric === 'bp' ? 6 : 1;
    min = Math.floor(min - padSize);
    max = Math.ceil(max + padSize);
    if (trendMetric === 'bp') min = Math.max(40, min);

    const scale = niceScale(min, max, 4);
    const plot = { l: 34, r: 12, t: 14, b: 24 };
    const plotW = W - plot.l - plot.r;
    const plotH = H - plot.t - plot.b;
    const n = data.keys.length;
    const xFor = (index) => plot.l + (n <= 1 ? plotW / 2 : (index / (n - 1)) * plotW);
    const yFor = (value) => plot.t + plotH - ((value - scale.lo) / (scale.hi - scale.lo)) * plotH;

    ctx.font = '9px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';

    // horizontal grid + y labels
    for (let value = scale.lo; value <= scale.hi + scale.step / 2; value += scale.step) {
      const y = yFor(value);
      ctx.beginPath();
      ctx.strokeStyle = '#edf0e9';
      ctx.lineWidth = 1;
      ctx.moveTo(plot.l, y);
      ctx.lineTo(W - plot.r, y);
      ctx.stroke();
      ctx.fillStyle = '#a6ada8';
      ctx.textAlign = 'right';
      const label = data.decimals ? value.toFixed(1) : String(Math.round(value));
      ctx.fillText(label, plot.l - 7, y);
    }

    // x labels
    const tickIndices = n <= 7
      ? Array.from({ length: n }, (_, i) => i)
      : [0, 7, 14, 21, n - 1].filter((v, i, arr) => v < n && arr.indexOf(v) === i);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a6ada8';
    tickIndices.forEach((index) => {
      const key = data.keys[index];
      const label = index === n - 1 && trendRange === 7 && key === TODAY() ? '今天' : dotDate(key);
      ctx.fillText(label, xFor(index), H - 10);
    });

    // goal line
    if (data.goal != null && data.goal >= scale.lo && data.goal <= scale.hi) {
      const y = yFor(data.goal);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#c3ab8d';
      ctx.lineWidth = 1.2;
      ctx.moveTo(plot.l, y);
      ctx.lineTo(W - plot.r, y);
      ctx.stroke();
      ctx.restore();
    }

    // fills + lines
    const bridgeGaps = trendMetric !== 'bp';
    data.series.forEach((series, index) => {
      const segments = [];
      let current = [];
      series.values.forEach((value, i) => {
        if (value == null) {
          if (!bridgeGaps && current.length) {
            segments.push(current);
            current = [];
          }
        } else {
          current.push({ value, i });
        }
      });
      if (current.length) segments.push(current);

      if (index === 0 && (trendMetric !== 'bp' || segments.length === 1)) {
        segments.forEach((segment) => {
          if (segment.length < 2) return;
          const gradient = ctx.createLinearGradient(0, plot.t, 0, plot.t + plotH);
          gradient.addColorStop(0, 'rgba(47, 106, 95, 0.12)');
          gradient.addColorStop(1, 'rgba(47, 106, 95, 0.01)');
          ctx.beginPath();
          ctx.moveTo(xFor(segment[0].i), yFor(segment[0].value));
          segment.slice(1).forEach((point) => ctx.lineTo(xFor(point.i), yFor(point.value)));
          ctx.lineTo(xFor(segment[segment.length - 1].i), plot.t + plotH);
          ctx.lineTo(xFor(segment[0].i), plot.t + plotH);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      }

      ctx.strokeStyle = series.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      segments.forEach((segment) => {
        ctx.beginPath();
        segment.forEach((point, i) => {
          const x = xFor(point.i);
          const y = yFor(point.value);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });

      segments.forEach((segment) => {
        segment.forEach((point) => {
          ctx.beginPath();
          ctx.arc(xFor(point.i), yFor(point.value), 2.4, 0, Math.PI * 2);
          ctx.fillStyle = '#fcfcf9';
          ctx.fill();
          ctx.strokeStyle = series.color;
          ctx.lineWidth = 1.7;
          ctx.stroke();
        });
      });
    });
  };

  const renderReport = () => {
    const keys = lastKeys(7);
    const mornings = keys.map((key) => latestBP(key, 'morning')).filter(Boolean);
    const nights = keys.map((key) => latestBP(key, 'night')).filter(Boolean);
    const avgM = avgPair(mornings);
    const avgN = avgPair(nights);
    const targetDays = mornings.filter((r) =>
      r.systolic < state.settings.targetSys && r.diastolic < state.settings.targetDia).length;

    const summaries = keys.map((key) => daySummary(key));
    const highSodiumDays = summaries.filter((s) => s.hasMeals && s.sodiumLevel === 'high').length;
    const shortSleepDays = summaries.filter((s) => s.sleep && s.sleepMins < 420).length;
    const runMinutes = summaries.reduce((sum, s) => sum + s.exerciseMin, 0);
    const lateCoffee = state.caffeine.filter((r) =>
      keys.includes(r.date) && (timeToMinutes(r.time) ?? 0) >= 14 * 60).length;
    const weightRecords = keys.map((key) => weightFor(key)).filter(Boolean);
    const weightAvg = mean(weightRecords.map((r) => r.weightKg));

    $('#report-range').textContent = `${dotDate(keys[0])} – ${dotDate(keys[6])}`;
    $('#report-grid').innerHTML = `
      <div class="report-item"><small>晨压周均</small><b>${avgM ? `${avgM.sys}/${avgM.dia}` : '—'}<em>mmHg</em></b></div>
      <div class="report-item"><small>晚压周均</small><b>${avgN ? `${avgN.sys}/${avgN.dia}` : '—'}<em>mmHg</em></b></div>
      <div class="report-item"><small>血压达标</small><b>${mornings.length ? `${targetDays}` : '—'}<em> / ${mornings.length} 天</em></b></div>
      <div class="report-item"><small>高钠天数</small><b>${highSodiumDays}<em>天</em></b></div>
      <div class="report-item"><small>睡眠 &lt; 7h</small><b>${shortSleepDays}<em>天</em></b></div>
      <div class="report-item"><small>慢跑总时长</small><b>${Math.round(runMinutes)}<em>分钟</em></b></div>
      <div class="report-item"><small>咖啡 14 点后</small><b>${lateCoffee}<em>次</em></b></div>
      <div class="report-item"><small>体重周均</small><b>${weightAvg != null ? weightAvg.toFixed(1) : '—'}<em>kg</em></b></div>`;
  };

  /* ------------------------------------------------------------------ *
   * analysis
   * ------------------------------------------------------------------ */

  const morningPairs = (classify, { sameDay = false } = {}) => {
    const dates = state.bp
      .filter((r) => r.period === 'morning')
      .map((r) => r.date)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort();

    const pairs = [];
    dates.forEach((date) => {
      const bp = latestBP(date, 'morning');
      if (!bp) return;
      const source = sameDay ? daySummary(date) : daySummary(shiftKey(date, -1));
      if (!source.hasData) return;
      const group = classify(source);
      if (group == null) return;
      pairs.push({
        date,
        group,
        value: bp.systolic,
        sleepQuality: sameDay ? (source.sleep?.quality1to5 ?? null) : (daySummary(date).sleep?.quality1to5 ?? null),
      });
    });
    return pairs;
  };

  const compareCard = ({ tag, tagClass, title, groupA, groupB, aLabel, bLabel, unit = 'mmHg', extra = '' }) => {
    const a = groupA.filter((v) => v != null);
    const b = groupB.filter((v) => v != null);
    const total = a.length + b.length;
    const enough = total >= 7 && a.length >= 2 && b.length >= 2;
    const avgA = mean(a);
    const avgB = mean(b);
    const delta = avgA != null && avgB != null ? avgA - avgB : null;

    let compare;
    if (enough && delta != null) {
      const cls = delta > 0.4 ? 'is-up' : (delta < -0.4 ? 'is-down' : '');
      const sign = delta > 0 ? '+' : '';
      compare = `
        <div class="compare">
          <div class="compare-col"><span>${aLabel}</span><b>${fmt1(avgA)}</b><small>n=${a.length}</small></div>
          <div class="delta ${cls}">${sign}${fmt1(delta)}<small>${unit}</small></div>
          <div class="compare-col"><span>${bLabel}</span><b>${fmt1(avgB)}</b><small>n=${b.length}</small></div>
        </div>`;
    } else {
      compare = `
        <div class="insufficient">
          ${icon('info')}
          <div style="flex:1;min-width:0">
            <p>样本不足，继续记录 7 天后再看。</p>
            <div class="node-progress"><span>已配对 ${total} 天</span><b>${Math.min(total, 7)}/7</b></div>
            <div class="meter"><i style="width:${clamp(total / 7 * 100, 0, 100)}%"></i></div>
          </div>
        </div>`;
    }

    return `
      <section class="card analysis-card">
        <div class="analysis-head">
          <span class="tag ${tagClass || ''}">${tag}</span>
          <h3>${title}</h3>
        </div>
        ${compare}
        ${extra}
      </section>`;
  };

  const renderAnalysis = () => {
    const sodiumPairs = morningPairs((prev) =>
      prev.hasMeals ? (prev.sodiumLevel === 'high' ? 'high' : 'other') : null);
    const sleepPairs = morningPairs((day) =>
      day.sleep ? (day.sleepMins < 420 ? 'short' : 'ok') : null, { sameDay: true });
    const runPairs = morningPairs((prev) =>
      prev.hasData ? (prev.exerciseMin >= 20 ? 'run' : 'none') : null);
    const coffeePairs = morningPairs((prev) =>
      prev.caffeine.length ? (prev.coffeeLateCups > 0 ? 'late' : 'early') : null);

    const pick = (pairs, group) => pairs.filter((p) => p.group === group).map((p) => p.value);
    const coffeeLateSleep = coffeePairs.filter((p) => p.group === 'late' && p.sleepQuality != null).map((p) => p.sleepQuality);
    const coffeeEarlySleep = coffeePairs.filter((p) => p.group === 'early' && p.sleepQuality != null).map((p) => p.sleepQuality);
    const lateSleepAvg = mean(coffeeLateSleep);
    const earlySleepAvg = mean(coffeeEarlySleep);
    const coffeeExtra = lateSleepAvg != null && earlySleepAvg != null
      ? `<p class="analysis-desc">当晚睡眠质量：14 点后平均 ${fmt1(lateSleepAvg)} 分，14 点前平均 ${fmt1(earlySleepAvg)} 分。</p>`
      : '';

    const cards = [];
    cards.push(compareCard({
      tag: '饮食', tagClass: 'tag--sand', title: '高钠日 → 次日晨压',

      groupA: pick(sodiumPairs, 'high'), groupB: pick(sodiumPairs, 'other'),
      aLabel: '高钠日', bLabel: '非高钠日',
    }));
    cards.push(compareCard({
      tag: '睡眠', tagClass: 'tag--blue', title: '睡眠 < 7h → 次日晨压',

      groupA: pick(sleepPairs, 'short'), groupB: pick(sleepPairs, 'ok'),
      aLabel: '睡眠 < 7h', bLabel: '睡眠 ≥ 7h',
    }));
    cards.push(compareCard({
      tag: '运动', tagClass: 'tag--green', title: '慢跑日 → 次日晨压',

      groupA: pick(runPairs, 'run'), groupB: pick(runPairs, 'none'),
      aLabel: '慢跑日', bLabel: '非慢跑日',
    }));
    cards.push(compareCard({
      tag: '咖啡', tagClass: 'tag--sand', title: '咖啡 14 点后 → 睡眠与晨压',

      groupA: pick(coffeePairs, 'late'), groupB: pick(coffeePairs, 'early'),
      aLabel: '14 点后', bLabel: '14 点前',
      extra: coffeeExtra,
    }));

    // weight node card
    const weights = state.weight
      .filter((r) => r.weightKg != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    let weightCard;
    if (weights.length < 2) {
      weightCard = `
        <section class="card analysis-card">
          <div class="analysis-head"><span class="tag tag--rose">体重</span><h3>体重下降节点 → 晨压</h3></div>
          <p class="analysis-desc">至少记录两次体重后，才能对比下降 2 kg 前后的晨压变化。</p>
          <div class="insufficient">${icon('info')}<div style="flex:1"><p>还没有足够体重记录。</p></div></div>
        </section>`;
    } else {
      const first = weights[0];
      const latest = weights[weights.length - 1];
      const drop = round1(first.weightKg - latest.weightKg);
      if (drop < 2) {
        weightCard = `
          <section class="card analysis-card">
            <div class="analysis-head"><span class="tag tag--rose">体重</span><h3>体重下降节点 → 晨压</h3></div>
            <p class="analysis-desc">体重累计下降 2 kg 后，再对比节点前后的晨压均值。</p>
            <div class="insufficient">
              ${icon('info')}
              <div style="flex:1;min-width:0">
                <p>尚未达到 2 kg 节点，继续慢慢来。</p>
                <div class="node-progress"><span>已下降 ${fmt1(drop)} kg</span><b>距节点 ${fmt1(Math.max(0, 2 - drop))} kg</b></div>
                <div class="meter"><i style="width:${clamp(drop / 2 * 100, 0, 100)}%"></i></div>
              </div>
            </div>
          </section>`;
      } else {
        const node = weights.find((r) => first.weightKg - r.weightKg >= 2);
        const nodeDate = node ? node.date : latest.date;
        const before = state.bp.filter((r) => {
          const diff = diffDays(r.date, nodeDate);
          return r.period === 'morning' && diff < 0 && diff >= -14;
        });
        const after = state.bp.filter((r) => {
          const diff = diffDays(r.date, nodeDate);
          return r.period === 'morning' && diff >= 0 && diff <= 13;
        });
        const avgBefore = mean(before.map((r) => r.systolic));
        const avgAfter = mean(after.map((r) => r.systolic));
        const enough = before.length >= 3 && after.length >= 3;
        const delta = avgBefore != null && avgAfter != null ? avgAfter - avgBefore : null;
        const compare = enough && delta != null
          ? `<div class="compare">
              <div class="compare-col"><span>节点前 14 天</span><b>${fmt1(avgBefore)}</b><small>n=${before.length}</small></div>
              <div class="delta ${delta < -0.4 ? 'is-down' : (delta > 0.4 ? 'is-up' : '')}">${delta > 0 ? '+' : ''}${fmt1(delta)}<small>mmHg</small></div>
              <div class="compare-col"><span>节点后</span><b>${fmt1(avgAfter)}</b><small>n=${after.length}</small></div>
            </div>`
          : `<div class="insufficient">${icon('info')}<div style="flex:1"><p>节点前后的晨压记录还不够，继续记录一段时间。</p></div></div>`;
        weightCard = `
          <section class="card analysis-card">
            <div class="analysis-head"><span class="tag tag--rose">体重</span><h3>体重下降节点 → 晨压</h3></div>
            <p class="analysis-desc">已下降 ${fmt1(drop)} kg，达到 2 kg 节点（${cnDate(nodeDate)}）前后 14 天的晨压均值对比。</p>
            ${compare}
          </section>`;
      }
    }
    cards.push(weightCard);

    $('#analysis-list').innerHTML = cards.join('');
  };

  /* ------------------------------------------------------------------ *
   * records sheet
   * ------------------------------------------------------------------ */

  const recordIcon = (type) => {
    if (type === 'bp') return { icon: 'pulse', theme: 'bp' };
    if (type === 'meal') return { icon: 'bowl', theme: 'diet' };
    if (type === 'water') return { icon: 'drop', theme: 'water' };
    if (type === 'caffeine') return { icon: 'coffee', theme: 'diet' };
    if (type === 'exercise') return { icon: 'run', theme: 'exercise' };
    if (type === 'sleep') return { icon: 'moon', theme: 'sleep' };
    if (type === 'weight') return { icon: 'scale', theme: 'weight' };
    return { icon: 'spark', theme: 'mood' };
  };

  const collectRecords = () => {
    const list = [];
    state.bp.forEach((r) => list.push({
      type: 'bp', id: r.id, date: r.date, time: r.time,
      title: `${r.period === 'morning' ? '晨起' : '睡前'}血压`,
      detail: `${r.systolic}/${r.diastolic} mmHg${r.heartRate ? ` · 心率 ${r.heartRate}` : ''}${r.conditions?.length ? ` · ${r.conditions.join('/')}` : ''}`,
    }));
    state.meals.forEach((r) => list.push({
      type: 'meal', id: r.id, date: r.date, time: '',
      title: `${MEAL_LABEL[r.mealType] || '饮食'}`,
      detail: mealFoodNames(r),
    }));
    Object.entries(state.water).forEach(([date, r]) => list.push({
      type: 'water', id: date, date, time: '',
      title: '饮水',
      detail: `${r.totalMl || 0} ml${r.sodiumDrinkTypes?.length ? ` · 含钠：${r.sodiumDrinkTypes.join('/')}` : ''}`,
    }));
    state.caffeine.forEach((r) => list.push({
      type: 'caffeine', id: r.id, date: r.date, time: r.time,
      title: `咖啡 ${r.cups} 杯`,
      detail: `${r.type}${(timeToMinutes(r.time) ?? 0) >= 840 ? ' · 14 点后' : ''}`,
    }));
    state.exercise.forEach((r) => list.push({
      type: 'exercise', id: r.id, date: r.date, time: '',
      title: `慢跑 ${r.minutes} 分钟`,
      detail: `${r.intensity || '中等'} · 约 ${r.kcalEst || 0} kcal${r.discomfort && r.discomfort !== '无' ? ` · ${r.discomfort}` : ''}`,
    }));
    state.sleep.forEach((r) => list.push({
      type: 'sleep', id: r.id, date: r.date, time: '',
      title: `睡眠 ${formatDuration(sleepMinutes(r.sleepTime, r.wakeTime)).short}`,
      detail: `${r.sleepTime} – ${r.wakeTime} · 醒来 ${r.wakeCount} 次 · 质量 ${r.quality1to5}/5`,
    }));
    state.weight.forEach((r) => list.push({
      type: 'weight', id: r.id, date: r.date, time: '',
      title: `体重 ${r.weightKg != null ? r.weightKg.toFixed(1) : '—'} kg`,
      detail: r.waistCm != null ? `腰围 ${r.waistCm.toFixed(1)} cm` : '未记腰围',
    }));
    state.daily.forEach((r) => list.push({
      type: 'daily', id: r.id, date: r.date, time: '',
      title: '每日快评',
      detail: `情绪/压力 ${r.mood1to5}/5${r.note ? ` · ${r.note}` : ''}`,
    }));
    return list.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  };

  const openRecordsSheet = () => {
    const rows = collectRecords();
    if (!rows.length) {
      openSheet({
        title: '记录明细',
        sub: '所有记录都可以在这里查看和修改',
        body: `<div class="empty-state" style="margin-top:12px"><h3>还没有任何记录</h3><p>先从一次晨起血压开始吧。</p></div>`,
      });
      return;
    }

    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.date)) groups.set(row.date, []);
      groups.get(row.date).push(row);
    });

    const body = Array.from(groups.entries()).map(([date, items]) => `
      <div class="record-day">
        <div class="record-date">${cnDate(date)} · ${weekday(date)}${date === TODAY() ? '<span>今天</span>' : ''}</div>
        <div class="record-list">
          ${items.map((row) => {
            const meta = recordIcon(row.type);
            return `
              <div class="record-row">
                <span class="record-ico">${icon(meta.icon)}</span>
                <div class="record-main">
                  <b>${esc(row.title)}${row.time ? `<span class="muted" style="font-weight:400"> · ${esc(row.time)}</span>` : ''}</b>
                  <small>${esc(row.detail)}</small>
                </div>
                <div class="row-actions">
                  <button type="button" data-edit="${row.type}" data-id="${esc(row.id)}" aria-label="编辑">${icon('pencil')}</button>
                  <button type="button" data-del="${row.type}" data-id="${esc(row.id)}" aria-label="删除">${icon('trash')}</button>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`).join('');

    openSheet({
      title: '记录明细',
      sub: `${rows.length} 条记录 · 点铅笔修改，点垃圾桶删除`,
      body,
      onMount: (root) => {
        root.onclick = async (event) => {
          const editBtn = event.target.closest('[data-edit]');
          if (editBtn) {
            const type = editBtn.dataset.edit;
            const id = editBtn.dataset.id;
            if (type === 'bp') openBPForm(state.bp.find((r) => r.id === id));
            if (type === 'meal') openMealForm(state.meals.find((r) => r.id === id));
            if (type === 'water') openWaterForm(id);
            if (type === 'caffeine') openCoffeeForm(state.caffeine.find((r) => r.id === id));
            if (type === 'exercise') openExerciseForm(state.exercise.find((r) => r.id === id));
            if (type === 'sleep') openSleepForm(state.sleep.find((r) => r.id === id));
            if (type === 'weight') openWeightForm(state.weight.find((r) => r.id === id));
            if (type === 'daily') openMoodForm(state.daily.find((r) => r.id === id));
            return;
          }

          const delBtn = event.target.closest('[data-del]');
          if (delBtn) {
            const type = delBtn.dataset.del;
            const id = delBtn.dataset.id;
            const confirmed = await confirmDialog({
              title: '删除这条记录？',
              message: '删除后无法恢复，确定要删除吗？',
              confirmText: '删除',
              danger: true,
            });
            if (!confirmed) return;
            deleteRecord(type, id);
            renderAll();
            openRecordsSheet();
            showToast('记录已删除');
          }
        };
      },
    });
  };

  const deleteRecord = (type, id) => {
    if (type === 'water') {
      delete state.water[id];
    } else {
      const key = type === 'meal' ? 'meals' : type === 'caffeine' ? 'caffeine' : type;
      if (Array.isArray(state[key])) state[key] = state[key].filter((r) => r.id !== id);
    }
    saveState();
  };

  const openFoodLibrarySheet = () => {
    openSheet({
      title: '常吃食物库',
      sub: `${FOODS.length} 项预设 · 钠 / 钾用于趋势估算`,
      body: `
        <div class="food-list">
          ${FOODS.map((food) => `
            <div class="food-row">
              <div class="food-row-main">
                <b>${esc(food.name)}</b>
                <small>${esc(food.serving)} · ${food.kcal} kcal</small>
              </div>
              <div class="food-row-tags">
                <span class="food-tag sodium-${food.sodium}">${SODIUM_LABEL[food.sodium]}钠</span>
                <span class="food-tag ${food.potassium === 'high' ? 'potassium-high' : ''}">${POTASSIUM_LABEL[food.potassium]}</span>
              </div>
            </div>`).join('')}
        </div>
        <div class="hint">${icon('info')}<span>热量和钠 / 钾为估算值，只用于观察趋势，不作精确营养计算。</span></div>`,
    });
  };

  /* ------------------------------------------------------------------ *
   * settings
   * ------------------------------------------------------------------ */

  const renderSettings = () => {
    const s = state.settings;

    $('#settings-body').innerHTML = `
      <section class="settings-group">
        <div class="group-title">目标</div>
        <div class="setting-row">
          <div class="setting-label"><b>目标血压</b><small>请以医生确认值为准</small></div>
          <div class="target-inputs">
            <input type="number" inputmode="numeric" min="90" max="180" data-setting="targetSys" value="${s.targetSys}" aria-label="目标收缩压" />
            <span>/</span>
            <input type="number" inputmode="numeric" min="50" max="120" data-setting="targetDia" value="${s.targetDia}" aria-label="目标舒张压" />
            <em>mmHg</em>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><b>目标体重</b><small>慢慢来，看长期趋势</small></div>
          <div class="target-inputs">
            <input type="number" inputmode="decimal" min="40" max="150" step="0.1" data-setting="targetWeight" value="${s.targetWeight}" aria-label="目标体重" />
            <em>kg</em>
          </div>
        </div>
      </section>

      <section class="settings-group">
        <div class="group-title">提醒</div>
        <div class="setting-row">
          <div class="setting-label"><b>晨起血压</b><small>起床排尿后测量</small></div>
          <input class="time-input" type="time" data-setting="morningReminder" value="${esc(s.morningReminder)}" aria-label="晨起血压提醒时间" />
        </div>
        <div class="setting-row">
          <div class="setting-label"><b>睡前血压</b><small>坐位休息 5 分钟后测</small></div>
          <input class="time-input" type="time" data-setting="nightReminder" value="${esc(s.nightReminder)}" aria-label="睡前血压提醒时间" />
        </div>
        <button class="setting-row setting-row--button" type="button" data-action="toggle-meds" aria-pressed="${s.medsEnabled}">
          <div class="setting-label"><b>用药记录</b><small>默认关闭，保留入口</small></div>
          <span class="switch" aria-hidden="true" aria-checked="${s.medsEnabled}"></span>
        </button>
      </section>

      <section class="settings-group">
        <div class="group-title">数据与备份</div>
        <button class="setting-row setting-row--button" type="button" data-action="records">
          <div class="setting-label"><b>记录明细</b><small>查看、修改或删除</small></div>
          <span class="setting-value">${recordsCount()} 条 ${icon('chevron')}</span>
        </button>
        <button class="setting-row setting-row--button" type="button" data-action="food-library">
          <div class="setting-label"><b>常吃食物库</b><small>钠 / 钾标签与热量估算</small></div>
          <span class="setting-value">${FOODS.length} 项 ${icon('chevron')}</span>
        </button>
        <button class="setting-row setting-row--button" type="button" data-action="export-csv">
          <div class="setting-label"><b>导出 CSV</b><small>可用表格软件打开</small></div>
          <span class="setting-value">${icon('download')}</span>
        </button>
        <button class="setting-row setting-row--button" type="button" data-action="export-json">
          <div class="setting-label"><b>导出 JSON</b><small>完整备份，可用于恢复</small></div>
          <span class="setting-value">${icon('download')}</span>
        </button>
        <button class="setting-row setting-row--button" type="button" data-action="import-json">
          <div class="setting-label"><b>导入恢复</b><small>选择之前导出的 JSON 文件</small></div>
          <span class="setting-value">${icon('upload')}</span>
        </button>
        <button class="setting-row setting-row--button setting-row--danger" type="button" data-action="clear">
          <div class="setting-label"><b>清空数据</b><small>删除本机全部记录，无法撤销</small></div>
          <span class="setting-value">${icon('trash')}</span>
        </button>
      </section>

      <div class="settings-foot">
        <button class="text-link" type="button" data-action="load-demo">载入示例数据预览</button>
        <p>数据只保存在本机浏览器，换机前记得导出备份。<br/>网页版不会主动推送提醒，提醒时间仅作保存。</p>
      </div>`;
  };

  /* ------------------------------------------------------------------ *
   * dialogs, toast, files
   * ------------------------------------------------------------------ */

  const confirmDialog = ({ title, message, confirmText = '确认', danger = false }) =>
    new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'dialog-wrap';
      wrap.innerHTML = `
        <div class="dialog-scrim" data-cancel></div>
        <div class="dialog" role="alertdialog" aria-modal="true">
          <h3>${esc(title)}</h3>
          <p>${esc(message)}</p>
          <div class="dialog-actions">
            <button class="btn btn--ghost" type="button" data-cancel>取消</button>
            <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-confirm>${esc(confirmText)}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);

      const finish = (value) => {
        document.removeEventListener('keydown', onKey);
        wrap.remove();
        resolve(value);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') finish(false);
      };
      wrap.addEventListener('click', (event) => {
        if (event.target.closest('[data-cancel]')) finish(false);
        if (event.target.closest('[data-confirm]')) finish(true);
      });
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(() => $('[data-confirm]', wrap)?.focus());
    });

  let toastTimer = null;
  const showToast = (message, duration = 2300) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), duration);
  };

  const downloadFile = (name, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const exportCSV = () => {
    const rows = [['日期', '类型', '时间', '内容', '详情']];
    const push = (date, type, time, content, detail) =>
      rows.push([date, type, time, content, detail]);

    state.bp.forEach((r) => push(r.date, '血压', r.time,
      `${r.period === 'morning' ? '晨起' : '睡前'} ${r.systolic}/${r.diastolic} mmHg`,
      `心率 ${r.heartRate ?? '—'}；条件 ${r.conditions?.join('/') || '—'}；症状 ${r.symptoms?.join('/') || '—'}${r.note ? `；${r.note}` : ''}`));
    state.meals.forEach((r) => push(r.date, '饮食', '', MEAL_LABEL[r.mealType] || '',
      `${mealFoodNames(r)}${r.note ? `；${r.note}` : ''}`));
    Object.entries(state.water).forEach(([date, r]) => push(date, '饮水', '',
      `${r.totalMl || 0} ml`, `含钠饮料 ${r.sodiumDrinkTypes?.join('/') || '无'}；夜尿 ${r.nightUrineCount ?? 0}`));
    state.caffeine.forEach((r) => push(r.date, '咖啡', r.time, `${r.cups} 杯`, r.type));
    state.exercise.forEach((r) => push(r.date, '运动', '', `慢跑 ${r.minutes} 分钟`,
      `约 ${r.kcalEst || 0} kcal；强度 ${r.intensity || '—'}；不适 ${r.discomfort || '—'}`));
    state.sleep.forEach((r) => push(r.date, '睡眠', `${r.sleepTime}–${r.wakeTime}`,
      `睡眠 ${formatDuration(sleepMinutes(r.sleepTime, r.wakeTime)).long}`,
      `醒来 ${r.wakeCount} 次；质量 ${r.quality1to5}/5；午睡 ${r.napMin || 0} 分`));
    state.weight.forEach((r) => push(r.date, '体重', '',
      `${r.weightKg != null ? r.weightKg.toFixed(1) : '—'} kg`,
      r.waistCm != null ? `腰围 ${r.waistCm.toFixed(1)} cm` : '腰围未记'));
    state.daily.forEach((r) => push(r.date, '快评', '', `情绪/压力 ${r.mood1to5}/5`, r.note || ''));

    rows.sort((a, b) => `${b[0]}${b[2]}`.localeCompare(`${a[0]}${a[2]}`));
    const csv = '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    downloadFile(`presslight-${TODAY()}.csv`, csv, 'text/csv;charset=utf-8');
    showToast('CSV 已导出');
  };

  const exportJSON = () => {
    const payload = {
      app: 'PressLight',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    downloadFile(`presslight-${TODAY()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showToast('JSON 备份已导出');
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const raw = parsed.data || parsed;
        if (!raw || !Array.isArray(raw.bp) || !Array.isArray(raw.meals)) {
          throw new Error('invalid');
        }
        const confirmed = await confirmDialog({
          title: '导入并覆盖当前数据？',
          message: '当前记录会被导入文件替换，建议先导出一份备份。',
          confirmText: '导入',
        });
        if (!confirmed) return;
        state = normalizeState(raw);
        state.demo = false;
        saveState();
        renderAll();
        closeSheet();
        showToast('数据已恢复');
      } catch (error) {
        showToast('文件格式不正确，请选择轻压记导出的 JSON');
      }
    };
    input.click();
  };

  /* ------------------------------------------------------------------ *
   * navigation & global events
   * ------------------------------------------------------------------ */

  let currentPage = 'today';

  const switchPage = (name) => {
    if (!['today', 'trends', 'analysis', 'settings'].includes(name)) return;
    currentPage = name;
    $$('.page').forEach((page) => page.classList.toggle('is-active', page.dataset.page === name));
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === name));
    $('#viewport').scrollTop = 0;
    if (name === 'today') renderToday();
    if (name === 'trends') {
      renderTrends();
      requestAnimationFrame(drawChart);
    }
    if (name === 'analysis') renderAnalysis();
    if (name === 'settings') renderSettings();
  };

  const renderAll = () => {
    renderToday();
    renderAnalysis();
    renderSettings();
    renderTrends();
    if (currentPage === 'trends') requestAnimationFrame(drawChart);
  };

  const handleAction = async (action) => {
    if (action === 'records') return openRecordsSheet();
    if (action === 'food-library') return openFoodLibrarySheet();
    if (action === 'export-csv') return exportCSV();
    if (action === 'export-json') return exportJSON();
    if (action === 'import-json') return importJSON();
    if (action === 'load-demo') {
      const confirmed = await confirmDialog({
        title: '载入示例数据？',
        message: '示例数据会覆盖当前记录，仅用于预览页面效果。',
        confirmText: '载入',
      });
      if (!confirmed) return;
      state = makeDemoState();
      saveState();
      renderAll();
      switchPage('today');
      showToast('已载入示例数据');
      return;
    }
    if (action === 'clear') {
      const confirmed = await confirmDialog({
        title: '清空全部记录？',
        message: '本机上的所有记录都会被删除，且无法撤销。建议先导出备份。',
        confirmText: '清空',
        danger: true,
      });
      if (!confirmed) return;
      const settings = { ...state.settings };
      state = emptyState();
      state.settings = settings;
      saveState();
      renderAll();
      switchPage('today');
      showToast('已清空全部记录');
      return;
    }
    if (action === 'toggle-meds') {
      state.settings.medsEnabled = !state.settings.medsEnabled;
      saveState();
      renderSettings();
      showToast(state.settings.medsEnabled ? '用药记录已开启' : '用药记录已关闭');
    }
  };

  const bindGlobalEvents = () => {
    document.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) {
        switchPage(tab.dataset.tab);
        return;
      }

      const go = event.target.closest('[data-go]');
      if (go) {
        switchPage(go.dataset.go);
        return;
      }

      if (event.target.closest('#fab')) {
        openQuickPanel();
        return;
      }

      const record = event.target.closest('[data-record]');
      if (record) {
        const type = record.dataset.record;
        if (type === 'bp') openBPForm();
        if (type === 'meal') openMealForm();
        if (type === 'water') openWaterForm();
        if (type === 'exercise') openExerciseForm();
        if (type === 'sleep') openSleepEntry();
        if (type === 'weight') openWeightEntry();
        return;
      }

      const close = event.target.closest('[data-close]');
      if (close) {
        closeSheet();
        return;
      }

      const action = event.target.closest('[data-action]');
      if (action) {
        handleAction(action.dataset.action);
      }
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-setting]');
      if (!input) return;
      const key = input.dataset.setting;
      let value = input.value;

      if (key === 'targetSys' || key === 'targetDia' || key === 'targetWeight') {
        value = Number(value);
        const ranges = {
          targetSys: [90, 180],
          targetDia: [50, 120],
          targetWeight: [40, 150],
        };
        const [min, max] = ranges[key];
        if (!Number.isFinite(value) || value < min || value > max) {
          showToast('这个数值看起来不太对，请检查一下');
          input.value = state.settings[key];
          return;
        }
        if (key === 'targetWeight') value = Math.round(value * 10) / 10;
      }

      state.settings[key] = value;
      saveState();
      renderToday();
      showToast('设置已保存');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSheet();
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (currentPage === 'trends') drawChart();
      }, 120);
    });

    $('#range-seg').addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-range]');
      if (!btn) return;
      trendRange = Number(btn.dataset.range);
      renderTrends();
    });

    $('#metric-seg').addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-metric]');
      if (!btn) return;
      trendMetric = btn.dataset.metric;
      renderTrends();
    });

    $('#bp-subtoggle').addEventListener('click', () => {
      trendBPSub = trendBPSub === 'sys' ? 'dia' : 'sys';
      renderTrends();
    });

    $('#start-demo').addEventListener('click', () => {
      state = makeDemoState();
      saveState();
      $('#welcome').hidden = true;
      renderAll();
      switchPage('today');
      showToast('这是示例数据，可在设置中清空');
    });

    $('#start-blank').addEventListener('click', () => {
      state = emptyState();
      saveState();
      $('#welcome').hidden = true;
      renderAll();
      switchPage('today');
    });
  };

  /* ------------------------------------------------------------------ *
   * boot
   * ------------------------------------------------------------------ */

  const init = () => {
    const params = new URLSearchParams(window.location.search);
    const autoDemo = params.get('demo') === '1';
    const autoBlank = params.get('blank') === '1';
    const stored = loadStoredState();

    if (autoDemo) {
      state = makeDemoState();
      saveState();
    } else if (autoBlank) {
      state = emptyState();
      saveState();
    } else if (stored) {
      state = stored;
    } else {
      state = emptyState();
      $('#welcome').hidden = false;
    }

    bindGlobalEvents();
    renderAll();
    switchPage('today');

    let lastDay = TODAY();
    setInterval(() => {
      if (TODAY() !== lastDay) {
        lastDay = TODAY();
        renderAll();
        switchPage(currentPage);
      }
    }, 60000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
