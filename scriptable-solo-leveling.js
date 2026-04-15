// Variables used by Scriptable.
// These must be at the very top of the file.
// icon-color: deep-purple; icon-glyph: magic;

const fm = FileManager.iCloud();
const filePath = fm.joinPath(fm.documentsDirectory(), "solo-system-data.json");

const AREAS = {
  strength: { label: "Strength", icon: "⚔️", color: "#8b5cf6" },
  cardio:   { label: "Cardio",   icon: "🏃", color: "#22c55e" },
  self:     { label: "Self",     icon: "📚", color: "#f59e0b" },
  escape:   { label: "Escape",   icon: "🚪", color: "#38bdf8" }
};

const DEFAULT_XP = {
  strength: 15,
  cardio: 12,
  self: 10,
  escape: 20
};

const QUEST_TEMPLATES = [
  { id: "steps5k", title: "5k Steps", xp: 10, area: "cardio" },
  { id: "read20", title: "20 Min Read", xp: 10, area: "self" },
  { id: "build30", title: "30 Min Build", xp: 15, area: "escape" }
];

function currentDateKey() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function cloneQuestTemplates() {
  return QUEST_TEMPLATES.map(function(q) {
    return {
      id: q.id,
      title: q.title,
      xp: q.xp,
      area: q.area,
      done: false
    };
  });
}

function createDefaultData() {
  return {
    player: "Hunter",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalXp: 0,
    level: 1,
    rank: "E",
    today: currentDateKey(),
    todayEntries: 0,
    streak: 0,
    lastCompletedDate: null,
    dailyQuestDate: currentDateKey(),
    dailyQuests: cloneQuestTemplates(),
    areas: {
      strength: { xp: 0, level: 1, logs: [] },
      cardio: { xp: 0, level: 1, logs: [] },
      self: { xp: 0, level: 1, logs: [] },
      escape: { xp: 0, level: 1, logs: [] }
    }
  };
}

function xpNeededForLevel(level) {
  return Math.floor(4 * Math.pow(level + 21, 1.25));
}

function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;

  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level++;
  }

  return level;
}

function progressInLevel(totalXp) {
  let level = 1;
  let remaining = totalXp;

  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level++;
  }

  return {
    level: level,
    currentXp: remaining,
    neededXp: xpNeededForLevel(level),
    pct: Math.max(0, Math.min(1, remaining / xpNeededForLevel(level)))
  };
}

function rankFromLevel(level) {
  if (level >= 80) return "S";
  if (level >= 60) return "A";
  if (level >= 40) return "B";
  if (level >= 25) return "C";
  if (level >= 10) return "D";
  return "E";
}

function areaLevelFromXp(xp) {
  let level = 1;
  let remaining = xp;

  while (remaining >= Math.floor(60 * Math.pow(level, 1.22))) {
    remaining -= Math.floor(60 * Math.pow(level, 1.22));
    level++;
  }

  return level;
}

function areaProgress(xp) {
  let level = 1;
  let remaining = xp;

  while (remaining >= Math.floor(60 * Math.pow(level, 1.22))) {
    remaining -= Math.floor(60 * Math.pow(level, 1.22));
    level++;
  }

  const needed = Math.floor(60 * Math.pow(level, 1.22));

  return {
    level: level,
    currentXp: remaining,
    neededXp: needed,
    pct: Math.max(0, Math.min(1, remaining / needed))
  };
}

async function loadData() {
  if (!fm.fileExists(filePath)) {
    const data = createDefaultData();
    saveData(data);
    return data;
  }

  try {
    await fm.downloadFileFromiCloud(filePath);
  } catch (e) {}

  const raw = fm.readString(filePath);
  return JSON.parse(raw);
}

function saveData(data) {
  data.updatedAt = new Date().toISOString();
  fm.writeString(filePath, JSON.stringify(data, null, 2));
}

function ensureTodayState(data) {
  const today = currentDateKey();
  if (data.today !== today) {
    data.today = today;
    data.todayEntries = 0;
  }
}

function ensureDailyQuests(data) {
  const today = currentDateKey();
  if (!data.dailyQuestDate || data.dailyQuestDate !== today || !Array.isArray(data.dailyQuests)) {
    data.dailyQuestDate = today;
    data.dailyQuests = cloneQuestTemplates();
  }
}

function updateStreakOnPositiveAction(data) {
  const today = currentDateKey();

  if (data.lastCompletedDate === today) return;

  if (!data.lastCompletedDate) {
    data.streak = 1;
    data.lastCompletedDate = today;
    return;
  }

  const prev = new Date(data.lastCompletedDate + "T00:00:00");
  const curr = new Date(today + "T00:00:00");
  const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    data.streak += 1;
  } else if (diffDays > 1) {
    data.streak = 1;
  }

  data.lastCompletedDate = today;
}

function addXp(data, areaKey, amount, note) {
  if (!data.areas[areaKey]) return false;

  ensureTodayState(data);

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum === 0) return false;

  data.areas[areaKey].xp += amountNum;
  if (data.areas[areaKey].xp < 0) data.areas[areaKey].xp = 0;

  data.totalXp += amountNum;
  if (data.totalXp < 0) data.totalXp = 0;

  data.areas[areaKey].level = areaLevelFromXp(data.areas[areaKey].xp);
  data.level = levelFromXp(data.totalXp);
  data.rank = rankFromLevel(data.level);

  data.areas[areaKey].logs.unshift({
    ts: new Date().toISOString(),
    xp: amountNum,
    note: note || ""
  });

  data.areas[areaKey].logs = data.areas[areaKey].logs.slice(0, 30);

  if (amountNum > 0) {
    data.todayEntries += 1;
    updateStreakOnPositiveAction(data);
  }

  return true;
}

function completeQuest(data, id) {
  ensureDailyQuests(data);

  const quest = data.dailyQuests.find(function(q) {
    return q.id === id;
  });

  if (!quest || quest.done) return false;

  quest.done = true;
  return addXp(data, quest.area, quest.xp, "Quest: " + quest.title);
}

function toggleQuestById(data, id) {
  ensureDailyQuests(data);

  const quest = data.dailyQuests.find(function(q) {
    return q.id === id;
  });

  if (!quest) return false;

  if (!quest.done) {
    return completeQuest(data, id);
  } else {
    quest.done = false;
    return true;
  }
}

function buildRunURL(params) {
  let base = URLScheme.forRunningScript();

  const query = Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k]));
  }).join("&");

  return query ? base + "&" + query : base;
}

function bar(pct, length) {
  const len = length || 10;
  const filled = Math.round(pct * len);
  return "█".repeat(filled) + "░".repeat(Math.max(0, len - filled));
}

function getLastLogLine(data) {
  const all = [];

  Object.keys(data.areas).forEach(function(key) {
    const logs = data.areas[key].logs || [];
    logs.forEach(function(log) {
      all.push({
        area: key,
        ts: log.ts,
        xp: log.xp,
        note: log.note
      });
    });
  });

  if (!all.length) return "No entries yet";

  all.sort(function(a, b) {
    return new Date(b.ts) - new Date(a.ts);
  });

  const last = all[0];
  const sign = last.xp >= 0 ? "+" : "";
  const label = AREAS[last.area].label;

  return label + " " + sign + last.xp + " XP" + (last.note ? " · " + last.note : "");
}

function getAreaSummary(data, key) {
  const xp = data.areas[key].xp;
  const p = areaProgress(xp);

  return {
    xp: xp,
    level: p.level,
    pct: p.pct
  };
}

async function handleParams(data) {
  ensureDailyQuests(data);

  const qp = args.queryParameters || {};
  const action = qp.action || "";

  if (action === "add") {
    const area = qp.area;
    const xp = qp.xp || DEFAULT_XP[area] || 10;
    const note = qp.note || "";
    const ok = addXp(data, area, xp, note);
    if (ok) saveData(data);
  }

  if (action === "completeQuest") {
    const id = qp.id;
    const ok = completeQuest(data, id);
    if (ok) saveData(data);
  }

  if (action === "reset" && !config.runsInWidget) {
    const a = new Alert();
    a.title = "Reset all data?";
    a.message = "This will delete all XP, quests and logs.";
    a.addDestructiveAction("Reset");
    a.addCancelAction("Cancel");
    const res = await a.present();

    if (res === 0) {
      const fresh = createDefaultData();
      saveData(fresh);
      return fresh;
    }
  }

  return data;
}

function styleText(txt, color, size, opacity, bold) {
  txt.textColor = new Color(color, opacity == null ? 1 : opacity);
  txt.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
}

function addQuestSection(widget, data) {
  ensureDailyQuests(data);

  const doneCount = data.dailyQuests.filter(function(q) {
    return q.done;
  }).length;

  const titleRow = widget.addStack();
  titleRow.layoutHorizontally();

  const title = titleRow.addText("Daily Quests");
  styleText(title, "#ffffff", 12, 1, true);

  titleRow.addSpacer();

  const count = titleRow.addText(doneCount + "/" + data.dailyQuests.length);
  styleText(count, "#94a3b8", 10, 1, true);

  widget.addSpacer(4);

  data.dailyQuests.forEach(function(quest) {
    const row = widget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    if (!quest.done) {
      row.url = buildRunURL({
        action: "completeQuest",
        id: quest.id
      });
    }

    const check = row.addText(quest.done ? "☑" : "☐");
    styleText(check, quest.done ? "#22c55e" : "#f8fafc", 14, 1, true);

    row.addSpacer(6);

    const main = row.addStack();
    main.layoutVertically();
    main.size = new Size(150, 0);

    const qTitle = main.addText(quest.title);
    styleText(qTitle, quest.done ? "#94a3b8" : "#e2e8f0", 11, 1, !quest.done);
    qTitle.lineLimit = 1;

    const qSub = main.addText(AREAS[quest.area].label);
    styleText(qSub, "#7c89b3", 9, 1, false);

    row.addSpacer();

    const xp = row.addText("+" + quest.xp);
    styleText(xp, quest.done ? "#64748b" : "#67e8f9", 10, 1, true);

    widget.addSpacer(4);
  });
}

function addAreaRow(widget, data, key) {
  const meta = AREAS[key];
  const summary = getAreaSummary(data, key);

  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.url = buildRunURL({
    action: "add",
    area: key,
    xp: DEFAULT_XP[key]
  });

  const left = row.addStack();
  left.layoutVertically();
  left.size = new Size(120, 0);

  const title = left.addText(meta.icon + " " + meta.label);
  styleText(title, "#f5f7ff", 12, 0.95, true);

  const sub = left.addText("Lv " + summary.level + " · " + data.areas[key].xp + " XP");
  styleText(sub, "#aeb6d9", 10, 0.9, false);

  row.addSpacer(6);

  const mid = row.addStack();
  mid.layoutVertically();

  const progress = mid.addText(bar(summary.pct, 10));
  styleText(progress, meta.color, 11, 1, true);

  const pct = mid.addText(Math.round(summary.pct * 100) + "%");
  styleText(pct, "#97a0c3", 9, 0.9, false);

  row.addSpacer();

  const plus = row.addText("+" + DEFAULT_XP[key]);
  styleText(plus, meta.color, 12, 1, true);

  widget.addSpacer(5);
}

async function createWidget(data) {
  ensureDailyQuests(data);

  const w = new ListWidget();
  w.setPadding(14, 14, 14, 14);

  const grad = new LinearGradient();
  grad.locations = [0, 1];
  grad.colors = [new Color("#0b1020"), new Color("#121a30")];
  w.backgroundGradient = grad;

  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const left = header.addStack();
  left.layoutVertically();

  const title = left.addText("SYSTEM");
  styleText(title, "#c4b5fd", 11, 0.95, true);

  const p = progressInLevel(data.totalXp);

  const lvl = left.addText("LV " + data.level + " · Rank " + data.rank);
  styleText(lvl, "#ffffff", 20, 1, true);

  const xp = left.addText(p.currentXp + "/" + p.neededXp + " XP");
  styleText(xp, "#aeb6d9", 10, 1, false);

  header.addSpacer();

  const right = header.addStack();
  right.layoutVertically();
  right.centerAlignContent();

  const total = right.addText(String(data.totalXp));
  styleText(total, "#67e8f9", 18, 1, true);

  const totalLabel = right.addText("TOTAL XP");
  styleText(totalLabel, "#aeb6d9", 9, 0.9, false);

  w.addSpacer(8);

  const bigBar = w.addText(bar(p.pct, 20));
  styleText(bigBar, "#8b5cf6", 12, 1, true);

  const bigBarSub = w.addText(
    "Next level: " + Math.round(p.pct * 100) +
    "% · Today " + data.todayEntries +
    " entries · Streak " + data.streak
  );
  styleText(bigBarSub, "#97a0c3", 9, 1, false);

  w.addSpacer(10);

  addQuestSection(w, data);

  w.addSpacer(6);

  const sec = w.addText("Quick Add");
  styleText(sec, "#ffffff", 12, 1, true);

  w.addSpacer(4);

  addAreaRow(w, data, "strength");
  addAreaRow(w, data, "cardio");
  addAreaRow(w, data, "self");
  addAreaRow(w, data, "escape");

  w.addSpacer(2);

  const footer = w.addStack();
  footer.layoutVertically();

  const last = footer.addText("Last: " + getLastLogLine(data));
  styleText(last, "#dbe4ff", 8, 0.95, false);
  last.lineLimit = 2;

  w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  return w;
}

async function promptAdd(data, area) {
  const a = new Alert();
  a.title = "Add XP: " + AREAS[area].label;
  a.addTextField("XP", String(DEFAULT_XP[area]));
  a.addTextField("Note", "");
  a.addAction("Save");
  a.addCancelAction("Cancel");

  const res = await a.present();
  if (res === -1) return;

  const xp = a.textFieldValue(0);
  const note = a.textFieldValue(1);

  const ok = addXp(data, area, xp, note);
  if (ok) {
    saveData(data);

    const done = new Alert();
    done.title = "Saved";
    done.message = AREAS[area].label + ": +" + xp + " XP";
    done.addAction("OK");
    await done.present();
  }
}

async function runMenu(data) {
  ensureDailyQuests(data);

  const a = new Alert();
  a.title = "Solo System";
  a.message =
    "Level " + data.level +
    " · Rank " + data.rank +
    " · Total XP " + data.totalXp +
    " · Streak " + data.streak;

  a.addAction("Add Strength");
  a.addAction("Add Cardio");
  a.addAction("Add Self");
  a.addAction("Add Escape");
  a.addAction("Toggle Quest: 5k Steps");
  a.addAction("Toggle Quest: 20 Min Read");
  a.addAction("Toggle Quest: 30 Min Build");
  a.addAction("Preview Widget");
  a.addAction("Reset");
  a.addCancelAction("Close");

  const res = await a.present();

  if (res === 0) return await promptAdd(data, "strength");
  if (res === 1) return await promptAdd(data, "cardio");
  if (res === 2) return await promptAdd(data, "self");
  if (res === 3) return await promptAdd(data, "escape");

  if (res === 4) {
    toggleQuestById(data, "steps5k");
    saveData(data);
    return;
  }

  if (res === 5) {
    toggleQuestById(data, "read20");
    saveData(data);
    return;
  }

  if (res === 6) {
    toggleQuestById(data, "build30");
    saveData(data);
    return;
  }

  if (res === 7) {
    const widget = await createWidget(data);
    await widget.presentLarge();
    return;
  }

  if (res === 8) {
    const confirm = new Alert();
    confirm.title = "Reset all data?";
    confirm.message = "This will delete all XP, quests and logs.";
    confirm.addDestructiveAction("Reset");
    confirm.addCancelAction("Cancel");
    const answer = await confirm.present();

    if (answer === 0) {
      const fresh = createDefaultData();
      saveData(fresh);
    }
    return;
  }
}

let data = await loadData();
ensureTodayState(data);
ensureDailyQuests(data);
data = await handleParams(data);
saveData(data);

if (config.runsInWidget) {
  const widget = await createWidget(data);
  Script.setWidget(widget);
  Script.complete();
} else {
  await runMenu(data);
}
