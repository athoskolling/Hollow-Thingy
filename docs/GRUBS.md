# Grubs: the Grub tracker

**Where:** Trackers > Grubs (`#/trackers/grubs`), and a "Grubs here" card on each Region page. Data: `GRUBS` in `js/data.js` (46 entries, ids `grub-<region>-<n>`). Progress: `state.grubs` (an object of ticked ids). The plain Grubs number (`resources.grubs`, used by the Grubfather rewards, the dashboard and the save importer) **follows the ticks**: ticking or unticking a Grub sets it to the number of ticks. Typing a number by hand or importing a save still works; the tracker then says the two differ. Syncing between devices merges the ticks (union) and keeps the larger number.

## How the list was made (2026-10-21)

Four helper agents researched the Regions in guides read as ordinary web pages (TheGamer, GameRant, VGKami, Indie Game Culture, Game-Checklists, Player Assist, Reddit and Steam text guides). The wiki (blocked to bots) and Fextralife (terms forbid automated access) were not fetched. Every `where` text is written in our own words. Five guides agree on how many Grubs each Region has, and the counts add up to 46:

| Region | Grubs | | Region | Grubs |
|---|---|---|---|---|
| Forgotten Crossroads | 5 | | Resting Grounds | 1 |
| Greenpath | 4 | | Royal Waterways | 3 |
| Fungal Wastes | 2 | | Fog Canyon | 1 |
| City of Tears (5 + the Collector's 3) | 8 | | Ancient Basin | 2 |
| Crystal Peak | 7 | | Kingdom's Edge | 2 |
| Deepnest | 5 | | The Hive | 2 |
| Queen's Gardens | 3 | | Howling Cliffs | 1 |

Dirtmouth, the Abyss, White Palace and Godhome have none.

## What is uncertain

Nothing was checked in the game. The count per Region is solid; the **individual** descriptions and requirements are less so, because guides number the Grubs and name the rooms differently. Each entry has `confidence` (`high`, `medium`, `low`) and, where guides disagree, a `note`; the tracker shows a "Not confirmed by every guide" line on the 16 that are not `high`. Points to check against your own play:

- Watcher's Spire (City of Tears): Monarch Wings, Mantis Claw or neither, depending on the guide (both are listed).
- The high Crossroads ledge above the Ancestral Mound, the Greenpath moss corridor and the Fungal Wastes mushroom-bounce Grub: the guides disagree on the ability, so `needs` is empty and the note names the options.
- Howling Cliffs: four guides give four routes to its one Grub (generic text, `low`).
- The two Crystal Peak masher-room Grubs may be swapped between guides.
- The three Collector Grubs have identical text (the guides do not tell the jars apart).
- Whether the Ancient Basin tram Grub needs the Tram Pass.

To correct one, edit its `G(...)` line in `js/data.js` (keep the order inside a Region: the number in the id comes from it) and run `node tests/run-node-tests.js`.
