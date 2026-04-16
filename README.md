# Solo System — Scriptable iOS Widget

A Solo Leveling-inspired personal leveling system for iOS, built entirely in Scriptable.
Track daily habits, skill progress, and long-term goals across four life areas —
with a large homescreen widget as your command center.

---

## Features

- **4 Skill Areas**: Strength, Cardio, Self, Escape
- **Daily Quests**: 3 fixed quests that reset every day
- **Quick Add**: Tap any area row to log XP instantly
- **Streak Tracking**: Tracks consecutive active days
- **Rank System**: E → D → C → B → A → S based on global level
- **Persistent Storage**: All data saved as JSON in iCloud Drive
- **Large Widget**: Full overview on your homescreen

---

## Installation

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) on your iPhone.
2. Open Scriptable and create a new script.
3. Paste the complete `scriptable-solo-leveling.js` code into the editor.
4. Save the script as **`SoloSystem`**.
5. Run the script once manually so it creates `solo-system-data.json` in iCloud Drive.
6. Add a **Large Scriptable Widget** to your homescreen.
7. Long-press the widget → **Edit Widget** → set **Script** to `SoloSystem`.
8. Leave the **Parameter** field **empty**.

---

## Widget Layout


```
SYSTEM
LV 7 · Rank D                        42 TOTAL XP

████████████████░░░░
Next level: 72% · Today 3 entries · Streak 5

Daily Quests                               2/3
☑  5k Steps           Cardio            +10
☐  20 Min Read        Self              +10
☑  30 Min Build       Escape            +15

Quick Add
⚔️  Strength    Lv 2 · 30 XP    ████░░░░░░  40%   +15
🏃  Cardio      Lv 1 · 12 XP    ██░░░░░░░░  20%   +12
📚  Self        Lv 1 · 10 XP    █░░░░░░░░░  17%   +10
🚪  Escape      Lv 3 · 75 XP    █████░░░░░  52%   +20

Last: Escape +20 XP · Quest: 30 Min Build
```

***


---

## How to Use

### Daily Quests

Tap a quest row to mark it as done. Quests reset automatically each day.

| Quest | Area | XP | Meaning |
|---|---|---|---|
| 5k Steps | Cardio | +10 | Daily baseline movement |
| 20 Min Read | Self | +10 | Reading, finance or nutrition learning |
| 30 Min Build | Escape | +15 | Coding, side project, certification work |

### Quick Add

Tap an area row to add the default XP for that area.
Use this for extra effort beyond the daily quest minimum.

| Area | Default XP | Examples |
|---|---|---|
| Strength | +15 | Calisthenics, workout session |
| Cardio | +12 | Zone 2 walk, running, cycling |
| Self | +10 | Deep reading, financial study, nutrition learning |
| Escape | +20 | side project, business building, anything that could escape you from something you dislike e.g. the 9-5 |

### In-App Menu

Open Scriptable and run the script manually to access the full menu:

- Add XP to any area with a custom amount and optional note
- Toggle quests manually
- Preview the widget before adding it to the homescreen
- Reset all data

---

## System Rules

### When to Use Daily Quest vs. Quick Add

| Situation | Action |
|---|---|
| 5k Steps reached | Daily Quest only |
| 30 Min Code | Daily Quest only |
| 1h+ Code | Daily Quest + Add Escape |
| Extra coding session same day | Add Escape only |
| 20 Min Reading | Daily Quest only |
| 45 Min+ Reading | Daily Quest + Add Self |
| Any workout | Add Strength |
| Zone 3 / Cardio session | Add Cardio |

**Rule of thumb:** Daily Quest = minimum done. Quick Add = extra effort rewarded.

Strength and Cardio have no daily quest intentionally —
rest days are part of good training.
The 5k Steps quest covers daily baseline movement on all days including recovery days.

---

## Level & Rank System

### Global Level

XP required to reach the next level:

```js
Math.floor(4 * Math.pow(level + 21, 1.25))
```

| Level | XP to next level |
|---|---|
| 1 | 190 |
| 2 | 201 |
| 3 | 212 |
| 5 | 234 |
| 10 | 292 |
| 20 | 414 |
| 30 | 545 |
| 50 | 824 |

The curve is intentionally flat — early levels feel achievable without heavy grinding.

### Rank Thresholds

| Rank | Level Required |
|---|---|
| E | 1–9 |
| D | 10–24 |
| C | 25–39 |
| B | 40–59 |
| A | 60–79 |
| S | 80+ |

### Area Level

Each skill area has its own level curve:

```js
Math.floor(60 * Math.pow(level, 1.22))
```

| Area Level | XP to next level |
|---|---|
| 1 | 60 |
| 2 | 139 |
| 3 | 229 |
| 4 | 325 |
| 5 | 427 |
| 10 | 995 |

---

## Customization

### Change Default XP Values

```javascript
const DEFAULT_XP = {
  strength: 15,
  cardio: 12,
  self: 10,
  escape: 20
};
```

### Change Daily Quests

```javascript
const QUEST_TEMPLATES = [
  { id: "steps5k",  title: "5k Steps",    xp: 10, area: "cardio" },
  { id: "read20",   title: "20 Min Read",  xp: 10, area: "self"   },
  { id: "build30",  title: "30 Min Build", xp: 15, area: "escape" }
];
```

Each quest needs a unique `id`, a `title`, an `xp` value,
and an `area` key matching one of the four areas.

### Rename Areas

```javascript
const AREAS = {
  strength: { label: "Strength", icon: "⚔️", color: "#8b5cf6" },
  cardio:   { label: "Cardio",   icon: "🏃", color: "#22c55e" },
  self:     { label: "Self",     icon: "📚", color: "#f59e0b" },
  escape:   { label: "Escape",   icon: "🚪", color: "#38bdf8" }
};
```

Keep internal keys (`strength`, `cardio`, `self`, `escape`) consistent
across `AREAS`, `DEFAULT_XP`, and `QUEST_TEMPLATES`.

---

## Data Storage


All data is saved to `solo-system-data.json` in the Scriptable iCloud Drive folder:

```
iCloud Drive / Scriptable / solo-system-data.json
```


Example structure:

```json
{
  "totalXp": 114,
  "level": 1,
  "rank": "E",
  "streak": 5,
  "lastCompletedDate": "2026-04-16",
  "dailyQuestDate": "2026-04-16",
  "dailyQuests": [...],
  "areas": {
    "strength": { "xp": 15, "level": 1, "logs": [...] },
    "cardio":   { "xp": 22, "level": 1, "logs": [...] },
    "self":     { "xp": 10, "level": 1, "logs": [...] },
    "escape":   { "xp": 67, "level": 2, "logs": [...] }
  }
}
```

---

## Known Limitations

- **Widget refresh is not instant.** iOS controls the actual refresh timing;
  `refreshAfterDate` sets the earliest possible refresh, not a guaranteed interval.
- **No automatic step sync.** 5k Steps is a manual tap — the widget does not
  read Apple Health data.
- **Large widget required.** Medium and Small widgets will not display the full layout.
- **Formula change resets level display.** If you change `xpNeededForLevel`, add
  any XP once to force a recalculation of the stored level value.

---

## Reset

Run `SoloSystem` manually in Scriptable and choose **Reset** from the menu.
This deletes all XP, streaks, logs, and quest progress.

---

## Build Your Own System Dashboard

Currently at player level 1, so not everything like the XP curve might be
perfectly calibrated yet. This is a personal Solo Leveling system, so treat
every value as a starting point, not a fixed rule.

Feel free to adapt:

- **Daily Quests** — swap the defaults for actions that actually move your life forward
- **Areas** — rename Strength, Cardio, Self, Escape to match your own goals
- **XP Values** — tune `DEFAULT_XP` and quest XP until the pacing feels right for your day
- **XP Curve** — edit `xpNeededForLevel` if leveling feels too slow or too fast

```javascript
function xpNeededForLevel(level) {
  return Math.floor(4 * Math.pow(level + 21, 1.25)); // adjust to your taste
}
```

A smaller exponent means faster progression, a larger one means more grind per level.
The system is only as good as how well it reflects your actual goals.

---

## Stack

- **Runtime**: [Scriptable](https://scriptable.app)
- **Language**: JavaScript
- **Storage**: JSON via `FileManager.iCloud()`
- **Widget API**: `ListWidget`, `WidgetStack`, `WidgetText`
- **Interactivity**: `URLScheme.forRunningScript()` + `args.queryParameters`

---

## Build Your Own System Dashboard

Currently at player level 2, so not everything — like the XP curve — might be perfectly calibrated yet. This is a personal Solo Leveling system, so treat every value as a starting point, not a fixed rule.

Feel free to adapt:

- **Daily Quests** — swap out the three default quests for whatever fits your actual goals and schedule
- **Areas** — rename or recolor Strength, Cardio, Self and Escape to match your own life categories
- **XP Values** — adjust `DEFAULT_XP` and quest XP until the pacing feels right for your day
- **XP Curve** — edit `xpNeededForLevel` if leveling feels too slow or too fast

```javascript
function xpNeededForLevel(level) {
  return Math.floor(4 * Math.pow(level + 21, 1.25));  // adjust to your own pace
}
```

The system is only as good as how well it reflects your actual goals. If a category stops being relevant, replace it. If a quest feels too easy or too hard, change the XP. The JSON resets cleanly if you ever want a fresh start.
