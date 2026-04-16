# Solo System — Scriptable iOS Widget

A Solo Leveling–inspired personal leveling system for iOS, built entirely in Scriptable. Track daily habits, skill progress, and long-term goals across four life areas — with a large homescreen widget as your command center.

***

## Features

- **4 Skill Areas**: Strength, Cardio, Self Improvement, Escape (Career Capital)
- **Daily Quests**: 3 fixed quests that reset every day
- **Quick Add**: Tap any area row to log XP instantly
- **Streak Tracking**: Tracks consecutive active days
- **Rank System**: E → D → C → B → A → S based on global level
- **Persistent Storage**: All data saved as JSON in iCloud Drive
- **Large Widget**: Full overview on your homescreen

***

## Installation

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) (free) on your iPhone.
2. Open Scriptable and create a new script.
3. Paste the complete `SoloSystem.js` code into the editor.
4. Save the script as **`SoloSystem`** (exact name matters for URL scheme).
5. Run the script once manually — this creates the `solo-system-data.json` file in iCloud Drive.
6. Add a **Large Scriptable Widget** to your homescreen.
7. Long-press the widget → **Edit Widget** → set **Script** to `SoloSystem`.
8. Leave the **Parameter** field empty.

***

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

## How to Use
Click the widget and scriptable will open. Sometimes the menue to add xp will be shown but you can also press the script to show the buttons to add XP or toggle daily quests.
Alternative: Open Scriptable and run the script manually to access the full menu:

- Add XP to any area with a custom amount and optional note
- Toggle quests manually
- Preview the widget before adding it to the homescreen
- Reset all data

***

## System Rules

### When to use Daily Quest vs. Quick Add

| Situation | Action |
|---|---|
| 5k Steps reached | Daily Quest only |
| 30 Min Code (minimum) | Daily Quest only |
| 1h+ Code (above minimum) | Daily Quest + Add Escape |
| Extra coding session same day | Add Escape only |
| 20 Min Reading | Daily Quest only |
| 45 Min+ Reading | Daily Quest + Add Self |
| Any workout | Add Strength |
| Zone 3 / Cardio session | Add Cardio |

**Rule of thumb:** Daily Quest = minimum done. Quick Add = extra effort rewarded.

Strength and Cardio have no daily quest intentionally — rest days are part of good training. The 5k Steps quest covers daily movement on all days including recovery days.

***

## Level & Rank System

### Global Level

XP required to advance to the next level:

$$
\text{XP}_{\text{needed}}(n) = \lfloor 100 \times n^{1.35} \rfloor
$$

| Level | XP to next level |
|---|---|
| 1 | 100 |
| 2 | 254 |
| 3 | 440 |
| 5 | 873 |
| 10 | 2,239 |
| 20 | 6,063 |

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

Each skill area has its own level with a slightly faster curve:

$$
\text{XP}_{\text{needed}}(n) = \lfloor 60 \times n^{1.22} \rfloor
$$

| Area Level | XP to next level |
|---|---|
| 1 | 60 |
| 2 | 139 |
| 3 | 229 |
| 4 | 325 |
| 5 | 426 |

***

## Customization

### Change Default XP Values

Edit the `DEFAULT_XP` block at the top of the script:

```javascript
const DEFAULT_XP = {
  strength: 15,
  cardio: 12,
  self: 10,
  escape: 20
};
```

### Change Daily Quests

Edit the `QUEST_TEMPLATES` block:

```javascript
const QUEST_TEMPLATES = [
  { id: "steps5k",  title: "5k Steps",     xp: 10, area: "cardio" },
  { id: "read20",   title: "20 Min Read",   xp: 10, area: "self"   },
  { id: "build30",  title: "30 Min Build",  xp: 15, area: "escape" }
];
```

Each quest needs a unique `id`, a `title`, an `xp` value, and an `area` key (`strength`, `cardio`, `self`, or `escape`).

### Rename Areas

Edit the `AREAS` object:

```javascript
const AREAS = {
  strength: { label: "Strength", icon: "⚔️", color: "#8b5cf6" },
  cardio:   { label: "Cardio",   icon: "🏃", color: "#22c55e" },
  self:     { label: "Self",     icon: "📚", color: "#f59e0b" },
  escape:   { label: "Escape",   icon: "🚪", color: "#38bdf8" }
};
```

Labels, icons and colors can all be changed freely. The `area` keys themselves (`strength`, `cardio`, `self`, `escape`) must match the keys used in `DEFAULT_XP` and `QUEST_TEMPLATES`.

***

## Data Storage

All data is saved to `solo-system-data.json` in the Scriptable iCloud Drive folder:

```
iCloud Drive / Scriptable / solo-system-data.json
```

The JSON structure contains:

```json
{
  "totalXp": 145,
  "level": 3,
  "rank": "E",
  "streak": 5,
  "lastCompletedDate": "2026-04-16",
  "dailyQuestDate": "2026-04-16",
  "dailyQuests": [...],
  "areas": {
    "strength": { "xp": 45, "level": 2, "logs": [...] },
    "cardio":   { "xp": 34, "level": 1, "logs": [...] },
    "self":     { "xp": 30, "level": 1, "logs": [...] },
    "escape":   { "xp": 60, "level": 2, "logs": [...] }
  }
}
```

***

## Known Limitations

- **Widget refresh is not instant.** iOS controls the actual refresh timing; `refreshAfterDate` sets the earliest possible refresh, not a guaranteed interval. After tapping a quest or quick add, Scriptable opens briefly, saves the data, and the widget updates on the next system-triggered refresh.
- **No automatic step count sync.** 5k Steps is a manual tap — the widget does not read Apple Health data directly. Tap the quest when you have reached your step goal.
- **Medium and Small widgets** will only show partial content. For the full layout, always use the **Large** widget size.

***

## Reset

To reset all data, open Scriptable, run `SoloSystem` manually, and choose **Reset** from the menu. This deletes all XP, logs, streaks and quest progress.

***

## Stack

- **Runtime**: [Scriptable](https://scriptable.app) (iOS, free)
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
- **XP Curve** — edit `xpNeededForLevel` if leveling feels too slow or too fast; a flatter exponent (e.g. `1.2` instead of `1.35`) means faster early levels, a steeper one (e.g. `1.5`) means more grind per level

```javascript
function xpNeededForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.35)); // adjust 1.35 to your taste
}
```

The system is only as good as how well it reflects your actual goals. If a category stops being relevant, replace it. If a quest feels too easy or too hard, change the XP. The JSON resets cleanly if you ever want a fresh start.
