import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";

/* ============================================================================
   BONSPIEL DRAW MANAGER — prototype
   ----------------------------------------------------------------------------
   This is a fully working front-end simulation of the workflow. Two things
   are deliberately mocked because they require a real backend + secrets:

     1. Meta posting: search for "REAL BACKEND CALL GOES HERE" — that's where
        you'd call your own server, which holds the long-lived Page/IG token
        and calls the Graph API. Never call Graph API directly from a browser.

     2. The bracket below is an 8-team TEMPLATE for each event so the
        mechanism (drag teams in, click a winner, watch it advance) is easy
        to see. Swap `initialClubNodes` / `initialWorldNodes` for your full
        28-team / 32-team node lists (see the schema doc) to go live —
        the engine underneath doesn't care how many nodes there are.
   ==========================================================================*/

// ---------- roster data (extracted from the club/world roster sheets) ----------

const CLUB_ROSTER_INITIAL = [
  { id: 1,  femaleFirst: "Melissa",  femaleLast: "Woch",       maleFirst: "Scott",    maleLast: "Moss",       email: "Melissa.woch@gmail.com" },
  { id: 2,  femaleFirst: "Melissa",  femaleLast: "Rutherford", maleFirst: "Kevin",    maleLast: "Rutherford", email: "melissarutherford19@gmail.com" },
  { id: 3,  femaleFirst: "Tracy",    femaleLast: "Sorenson",   maleFirst: "Cameron",  maleLast: "Sorenson",   email: "taltherr03@gmail.com" },
  { id: 4,  femaleFirst: "Jennifer", femaleLast: "Collins",    maleFirst: "Sean",     maleLast: "Aronson",    email: "Jecollins72@gmail.com" },
  { id: 5,  femaleFirst: "Melissa",  femaleLast: "Gaisser",    maleFirst: "Chris",    maleLast: "Hopp",       email: "melissagaisser@gmail.com" },
  { id: 6,  femaleFirst: "Lillian",  femaleLast: "Mignella",   maleFirst: "Joel",     maleLast: "Calhoun",    email: "joel.calhoun@gmail.com" },
  { id: 7,  femaleFirst: "Sylvia",   femaleLast: "Veleker",    maleFirst: "Mason",    maleLast: "Tikkanen",   email: "mason@positionpos.com" },
  { id: 8,  femaleFirst: "Linda",    femaleLast: "Arra",       maleFirst: "Tom",      maleLast: "Arra",       email: "lindaarra4@gmail.com" },
  { id: 9,  femaleFirst: "Flannery", femaleLast: "Allison",    maleFirst: "Michael",  maleLast: "Allison",    email: "flannerallison4@gmail.com" },
  { id: 10, femaleFirst: "Emily",    femaleLast: "Minzel",     maleFirst: "Nick",     maleLast: "DeJongh",    email: "nicholas.j.dejongh@gmail.com" },
  { id: 11, femaleFirst: "Emily",    femaleLast: "Schweitzer", maleFirst: "Blake",    maleLast: "Hagberg",    email: "Blakehagberg@gmail.com" },
  { id: 12, femaleFirst: "Hannah",   femaleLast: "Record",     maleFirst: "Matt",     maleLast: "Record",     email: "matt.record21@gmail.com" },
  { id: 13, femaleFirst: "Tessa",    femaleLast: "Parker",     maleFirst: "Dave",     maleLast: "Hurst",      email: "tessa.n.parker1@gmail.com" },
  { id: 14, femaleFirst: "Maribeth", femaleLast: "Oblander",   maleFirst: "Jason",    maleLast: "Oblander",   email: "rjo4u@yahoo.com" },
  { id: 15, femaleFirst: "Jenna",    femaleLast: "Chapiewsky", maleFirst: "Ryan",     maleLast: "Chapiewsky", email: "Jenna.Chapiewsky@gmail.com" },
  { id: 16, femaleFirst: "Ellyn",    femaleLast: "Subak",      maleFirst: "Andy",     maleLast: "Merlin",     email: "Emsubak@gmail.com" },
  { id: 17, femaleFirst: "Mandy",    femaleLast: "Gangwer",    maleFirst: "Rob",      maleLast: "Binns",      email: "mandy.gangwer@gmail.com" },
  { id: 18, femaleFirst: "Beth",     femaleLast: "Lundquist",  maleFirst: "Brian",    maleLast: "Terwedo",    email: "bethlundquist@comcast.net" },
  { id: 19, femaleFirst: "Katherine",femaleLast: "Stewart",    maleFirst: "Staffan",  maleLast: "Axelsson",   email: "curlingstaffan@gmail.com" },
  { id: 20, femaleFirst: "Rebecca",  femaleLast: "Bergin",     maleFirst: "Jason",    maleLast: "Botterill",  email: "Jason.L.Botterill@gmail.com" },
  { id: 21, femaleFirst: "Jenny",    femaleLast: "Levy",       maleFirst: "Ben",      maleLast: "Levy",       email: "benjaminlevy@gmail.com" },
  { id: 22, femaleFirst: "Megan",    femaleLast: "Gorman",     maleFirst: "Eoin",     maleLast: "Gorman",     email: "thegormans.mke@gmail.com" },
  { id: 23, femaleFirst: "Connie",   femaleLast: "Fernholz",   maleFirst: "Cameron",  maleLast: "Kim",        email: "constance.fernholz@gmail.com" },
  { id: 24, femaleFirst: "Judy",     femaleLast: "Echols",     maleFirst: "Bill",     maleLast: "Echols",     email: "judyechols386@gmail.com" },
  { id: 25, femaleFirst: "Lori",     femaleLast: "Cassidy",    maleFirst: "Greg",     maleLast: "Torkelson",  email: "gtork3@gmail.com" },
  { id: 26, femaleFirst: "Kailey",   femaleLast: "Meyer",      maleFirst: "Scott",    maleLast: "Meyer",      email: "kszalko@gmail.com" },
  { id: 27, femaleFirst: "Tempest",  femaleLast: "McKenzie",   maleFirst: "Kent",     maleLast: "McKenzie",   email: "Kentm@alumni.duke.edu" },
  { id: 28, femaleFirst: "Autumn",   femaleLast: "Wood",       maleFirst: "Cole",     maleLast: "Roberg",     email: "auwo2@icloud.com" },
].map((t) => ({ ...t, display: `${t.femaleLast} / ${t.maleLast}` }));

// World roster: 31 of 32 rows were legible in the standings screenshot — the
// very last (lowest-ranked) row was cropped off. Add it to this array with
// the next seed number once you have it; nothing else needs to change.
const WORLD_ROSTER_INITIAL = [
  { seed: 1,  points: 224.8, rank: 1,   femaleFirst: "Tahli",      femaleLast: "Gill",      maleFirst: "Dean",       maleLast: "Hewitt" },
  { seed: 2,  points: 159.5, rank: 4,   femaleFirst: "Tori",       femaleLast: "Koana",     maleFirst: "Go",         maleLast: "Aoki" },
  { seed: 3,  points: 95,    rank: 10,  femaleFirst: "Therese",    femaleLast: "Westman",   maleFirst: "Robin",      maleLast: "Ahlberg" },
  { seed: 4,  points: 86.3,  rank: 13,  femaleFirst: "Nancy",      femaleLast: "Martin",    maleFirst: "Steve",      maleLast: "Laycock" },
  { seed: 5,  points: 83.5,  rank: 14,  femaleFirst: "Jenny",      femaleLast: "Perret",    maleFirst: "Martin",     maleLast: "Rios" },
  { seed: 6,  points: 76.1,  rank: 19,  femaleFirst: "Sarah",      femaleLast: "Anderson",  maleFirst: "Andrew",     maleLast: "Stopera" },
  { seed: 7,  points: 59.4,  rank: 30,  femaleFirst: "Seon-Yeong", femaleLast: "Kim",       maleFirst: "Yeong-Seok", maleLast: "Jeong" },
  { seed: 8,  points: 55.4,  rank: 32,  femaleFirst: "Katie",      femaleLast: "Ford",      maleFirst: "Oliver",     maleLast: "Campbell" },
  { seed: 9,  points: 54.7,  rank: 33,  femaleFirst: "Pia-Lisa",   femaleLast: "Scholl",    maleFirst: "Joshua",     maleLast: "Sutor" },
  { seed: 10, points: 39.5,  rank: 41,  femaleFirst: "Lotta",      femaleLast: "Immonen",   maleFirst: "Markus",     maleLast: "Sipila" },
  { seed: 11, points: 30.8,  rank: 51,  femaleFirst: "Clare",      femaleLast: "Moores",    maleFirst: "Lance",      maleLast: "Wheeler" },
  { seed: 12, points: 21.3,  rank: 66,  femaleFirst: "BriAnna",    femaleLast: "Weldon",    maleFirst: "Sean",       maleLast: "Franey" },
  { seed: 13, points: 15.6,  rank: 90,  femaleFirst: "Kelsey",     femaleLast: "Ostrowski", maleFirst: "Gabe",       maleLast: "Nickel" },
  { seed: 14, points: 14.7,  rank: 94,  femaleFirst: "Stephanie",  femaleLast: "Senneker",  maleFirst: "Nicholas",   maleLast: "Vishnick" },
  { seed: 15, points: 13.4,  rank: 100, femaleFirst: "Ann",        femaleLast: "Podoll",    maleFirst: "Nathan",     maleLast: "Parry" },
  { seed: 16, points: 13.2,  rank: 101, femaleFirst: "Bella",      femaleLast: "Hagenbuch", maleFirst: "Daniel",     maleLast: "Laufer" },
  { seed: 17, points: 12,    rank: 109, femaleFirst: "Heidi",      femaleLast: "Holt",      maleFirst: "Zach",       maleLast: "Brenden" },
  { seed: 18, points: 10.4,  rank: 115, femaleFirst: "Susan",      femaleLast: "Dudt",      maleFirst: "Daniel",     maleLast: "Dudt" },
  { seed: 19, points: 9.8,   rank: 120, femaleFirst: "Harley",     femaleLast: "Scebbi",    maleFirst: "Vincent",    maleLast: "Scebbi" },
  { seed: 20, points: 6.4,   rank: 151, femaleFirst: "Gloria",     femaleLast: "Chao",      maleFirst: "Anthony",    maleLast: "Fowler" },
  { seed: 21, points: 5.5,   rank: 164, femaleFirst: "Olivia",     femaleLast: "Stella",    maleFirst: "Andy",       maleLast: "Carle" },
  { seed: 22, points: 5.3,   rank: 165, femaleFirst: "Nicole",     femaleLast: "Bookhout",  maleFirst: "Dan",        maleLast: "Wiza" },
  { seed: 23, points: 4.5,   rank: 174, femaleFirst: "Gabrielle",  femaleLast: "Coleman",   maleFirst: "Connor",     maleLast: "Robertson" },
  { seed: 24, points: 4.2,   rank: 183, femaleFirst: "Renee",      femaleLast: "Sobering",  maleFirst: "Darryl",     maleLast: "Sobering" },
  { seed: 25, points: 4.1,   rank: 185, femaleFirst: "Ashley",     femaleLast: "Mayra",     maleFirst: "Jimmy",      maleLast: "Kirby" },
  { seed: 26, points: 3.6,   rank: 195, femaleFirst: "Lorna",      femaleLast: "Sherry",    maleFirst: "Matt",       maleLast: "Sherry" },
  { seed: 27, points: 2,     rank: 222, femaleFirst: "Toni",       femaleLast: "Paisley",   maleFirst: "Jeremy",     maleLast: "Roe" },
  { seed: 28, points: 1.9,   rank: 227, femaleFirst: "Vanessa",    femaleLast: "Williams",  maleFirst: "Thomas",     maleLast: "Straub" },
  { seed: 29, points: 0.2,   rank: 277, femaleFirst: "Kerry",      femaleLast: "Myers",     maleFirst: "Michael",    maleLast: "Lerner" },
  { seed: 30, points: null,  rank: null,femaleFirst: "Anne",       femaleLast: "Pifer",     maleFirst: "Neil",       maleLast: "Pifer" },
  // seed 31 (32nd team) was cropped off the roster screenshot — add it here
].map((t) => ({ ...t, display: `${t.femaleLast} / ${t.maleLast}` }));

// Duplicate-number detection + auto-sort, shared by both roster tables.
function sortAndFlag(rows, numberField) {
  const counts = {};
  rows.forEach((r) => {
    const k = r[numberField];
    counts[k] = (counts[k] || 0) + 1;
  });
  return [...rows]
    .map((r) => ({ ...r, __dup: counts[r[numberField]] > 1 }))
    .sort((a, b) => (a[numberField] ?? 999) - (b[numberField] ?? 999));
}
function withDisplay(row) {
  return { ...row, display: `${row.femaleLast || "?"} / ${row.maleLast || "?"}` };
}


// ---------- paste / copy support for the rosters ----------
// Paste straight from a spreadsheet (tab-separated) or a CSV. A header row is
// optional: with one, columns are matched by name in any order; without one,
// the column order is the same as "Copy roster" produces.

const CLUB_COLUMNS = [
  { key: "id",          label: "#",            aliases: ["#", "no", "number", "team #", "team number", "id"] },
  { key: "femaleFirst", label: "Female first", aliases: ["female first", "female first name", "woman first", "f first"] },
  { key: "femaleLast",  label: "Female last",  aliases: ["female last", "female last name", "woman last", "f last"] },
  { key: "maleFirst",   label: "Male first",   aliases: ["male first", "male first name", "man first", "m first"] },
  { key: "maleLast",    label: "Male last",    aliases: ["male last", "male last name", "man last", "m last"] },
  { key: "email",       label: "Contact email", aliases: ["contact email", "email", "e-mail"] },
];
const WORLD_COLUMNS = [
  { key: "seed",        label: "Seed",         aliases: ["seed", "#", "no", "number"] },
  { key: "points",      label: "Points",       aliases: ["points", "pts", "week 17 points"] },
  { key: "rank",        label: "Rank",         aliases: ["rank", "rank (wk 17)", "world rank", "wk 17 rank"] },
  { key: "femaleFirst", label: "Female first", aliases: ["female first", "female first name", "woman first", "f first"] },
  { key: "femaleLast",  label: "Female last",  aliases: ["female last", "female last name", "woman last", "f last"] },
  { key: "maleFirst",   label: "Male first",   aliases: ["male first", "male first name", "man first", "m first"] },
  { key: "maleLast",    label: "Male last",    aliases: ["male last", "male last name", "man last", "m last"] },
];

// Small delimited-text parser (handles quoted cells and embedded newlines).
function parseDelimited(text) {
  const delim = text.includes("\t") ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", inQ = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") inQ = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}

const normHeader = (h) => h.toLowerCase().replace(/\s+/g, " ").trim();

// Returns { rows, warnings, error }.
function parseRosterText(text, columns, numberField) {
  const grid = parseDelimited(text);
  if (grid.length === 0) return { rows: [], warnings: [], error: "Nothing to import — paste some rows first." };

  // Header row = first row whose first cell isn't a number.
  const firstCell = grid[0][0] ?? "";
  const hasHeader = firstCell !== "" && isNaN(Number(firstCell));
  let colIndex = {}; // key -> column position
  const warnings = [];

  if (hasHeader) {
    const headers = grid[0].map(normHeader);
    columns.forEach((c) => {
      const i = headers.findIndex((h) => c.aliases.includes(h));
      if (i !== -1) colIndex[c.key] = i;
    });
    const needed = ["femaleLast", "maleLast"];
    const missing = needed.filter((k) => colIndex[k] === undefined);
    if (missing.length) {
      return { rows: [], warnings, error: `Couldn't find a column for: ${missing.join(", ")}. Check the header row (expected: ${columns.map((c) => c.label).join(", ")}).` };
    }
  } else {
    columns.forEach((c, i) => { colIndex[c.key] = i; });
  }

  const body = hasHeader ? grid.slice(1) : grid;
  const numeric = (v) => (v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v));
  const rows = body.map((r, n) => {
    const get = (k) => (colIndex[k] === undefined ? "" : (r[colIndex[k]] ?? ""));
    const row = {};
    columns.forEach((c) => {
      if (c.key === numberField) {
        row[c.key] = numeric(get(c.key));
      } else if (c.key === "points" || c.key === "rank") {
        row[c.key] = numeric(get(c.key));
      } else {
        row[c.key] = get(c.key);
      }
    });
    if (row[numberField] === null) {
      row[numberField] = n + 1;
      if (colIndex[numberField] !== undefined || !hasHeader) warnings.push(`Row ${n + 1} had no valid ${numberField === "id" ? "#" : "seed"} — numbered ${n + 1} by position.`);
    }
    return row;
  });

  const bad = rows.filter((r) => !r.femaleLast && !r.maleLast);
  if (bad.length) warnings.push(`${bad.length} row${bad.length === 1 ? " has" : "s have"} no last names and will show as "? / ?".`);
  if (!hasHeader) warnings.push("No header row detected — columns were read in the Copy roster order.");
  return { rows, warnings, error: null };
}

const csvCell = (v) => String(v ?? "");
function rosterToText(roster, columns) {
  const head = columns.map((c) => c.label).join("\t");
  const lines = roster.map((r) => columns.map((c) => csvCell(r[c.key]).replace(/[\t\r\n]+/g, " ")).join("\t"));
  return [head, ...lines].join("\n");
}

// Old team name -> new team name, matched by team number / seed. Used to keep
// existing draw & bracket assignments pointing at the right team after an import.
function buildRenameMap(oldRoster, newRoster, numberField) {
  const map = {};
  const oldByNum = {}, newByNum = {};
  const count = (arr) => arr.reduce((m, r) => ((m[r[numberField]] = (m[r[numberField]] || 0) + 1), m), {});
  const oc = count(oldRoster), nc = count(newRoster);
  oldRoster.forEach((r) => { if (oc[r[numberField]] === 1) oldByNum[r[numberField]] = r; });
  newRoster.forEach((r) => { if (nc[r[numberField]] === 1) newByNum[r[numberField]] = r; });
  Object.keys(oldByNum).forEach((n) => {
    if (newByNum[n] && oldByNum[n].display !== newByNum[n].display) map[oldByNum[n].display] = newByNum[n].display;
  });
  return map;
}

// ---------- autosave (browser localStorage) ----------
// Bump STORAGE_VERSION whenever the shape of saved data changes.
const STORAGE_VERSION = 1;
const STORAGE_KEY = `bonspiel-draw-manager:v${STORAGE_VERSION}`;

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

const SHEETS = [1, 2, 3, 4, 5, 6].map((id) => ({
  id,
  youtube: `https://youtube.com/live/sheet-${id}-placeholder`,
}));

const FEATURED_YOUTUBE = "https://youtube.com/live/FEATURED-placeholder";

// Draws: the real 24-draw schedule from draws.pdf (Thu-Sun, 6 sheets each).
const DAY_INFO = {
  Thu: { full: "Thursday", date: "Oct 8" },
  Fri: { full: "Friday", date: "Oct 9" },
  Sat: { full: "Saturday", date: "Oct 10" },
  Sun: { full: "Sunday", date: "Oct 11" },
};

const DRAWS = [
  { id: "d1",  label: "Draw 1",  day: "Thu", time: "8:00 AM" },
  { id: "d2",  label: "Draw 2",  day: "Thu", time: "9:45 AM" },
  { id: "d3",  label: "Draw 3",  day: "Thu", time: "12:30 PM" },
  { id: "d4",  label: "Draw 4",  day: "Thu", time: "2:15 PM" },
  { id: "d5",  label: "Draw 5",  day: "Thu", time: "5:00 PM" },
  { id: "d6",  label: "Draw 6",  day: "Thu", time: "6:45 PM" },
  { id: "d7",  label: "Draw 7",  day: "Thu", time: "8:30 PM" },
  { id: "d8",  label: "Draw 8",  day: "Fri", time: "8:00 AM" },
  { id: "d9",  label: "Draw 9",  day: "Fri", time: "9:45 AM" },
  { id: "d10", label: "Draw 10", day: "Fri", time: "12:30 PM" },
  { id: "d11", label: "Draw 11", day: "Fri", time: "2:15 PM" },
  { id: "d12", label: "Draw 12", day: "Fri", time: "4:00 PM" },
  { id: "d13", label: "Draw 13", day: "Fri", time: "6:45 PM" },
  { id: "d14", label: "Draw 14", day: "Fri", time: "8:30 PM" },
  { id: "d15", label: "Draw 15", day: "Fri", time: "10:15 PM" },
  { id: "d16", label: "Draw 16", day: "Sat", time: "8:30 AM" },
  { id: "d17", label: "Draw 17", day: "Sat", time: "10:15 AM" },
  { id: "d18", label: "Draw 18", day: "Sat", time: "1:00 PM" },
  { id: "d19", label: "Draw 19", day: "Sat", time: "2:45 PM" },
  { id: "d20", label: "Draw 20", day: "Sat", time: "5:30 PM" },
  { id: "d21", label: "Draw 21", day: "Sat", time: "7:15 PM" },
  { id: "d22", label: "Draw 22", day: "Sun", time: "8:30 AM" },
  { id: "d23", label: "Draw 23", day: "Sun", time: "10:15 AM" },
  { id: "d24", label: "Draw 24", day: "Sun", time: "1:00 PM" },
].map((d) => ({
  ...d,
  date: DAY_INFO[d.day].date,
  dayFull: DAY_INFO[d.day].full,
  time: `${d.day} ${d.time}`,
}));

// Every sheet, every draw, exactly as printed on draws.pdf. "club" cells were
// orange on the sheet, "world" cells were white. "G1" = an un-numbered club
// Round-1 game (there's no individual code for those on the sheet). null =
// no game scheduled on that sheet for that draw (blacked-out cells).
const DRAW_SHEET_CODES = {
  d1:  ["A3:world","A11:world","A10:world","A6:world","A2:world","A7:world"],
  d2:  ["A4:world","A12:world","A9:world","A5:world","A1:world","A8:world"],
  d3:  ["B31:world","A14:world","A15:world","A16:world","B32:world","A13:world"],
  d4:  ["B35:world","A21:world","B36:world","B34:world","A22:world","B33:world"],
  d5:  ["A17:world","B38:world","B37:world","A20:world","A18:world","A19:world"],
  d6:  ["A23:world","A24:world","B44:world","B43:world","B45:world","B39:world"],
  d7:  ["G1:club","G1:club","G1:club","G1:club","G1:club","G1:club"],
  d8:  ["B46:world","A26:world","B40:world","A25:world","A28:world","A27:world"],
  d9:  ["B42:world","G1:club","C60:world","B41:world","G1:club","C59:world"],
  d10: ["B48:world","B47:world","A29:world","A30:world","B52:world","B51:world"],
  d11: ["C61:world","B49:world","B50:world","C62:world","C64:world","C63:world"],
  d12: ["A4:club","G1:club","G1:club","A3:club","G1:club","G1:club"],
  d13: ["B54:world","B55:world","B53:world","B56:world","C67:world","C68:world"],
  d14: ["C65:world","C66:world","C69:world","C72:world","C70:world","C71:world"],
  d15: ["G1:club","B3:club","G1:club","A2:club","B2:club","B4:club"],
  d16: ["C74:world","C77:world","B58:world","B57:world","C75:world","C76:world"],
  d17: ["A5:club","B6:club","C78:world","C73:world","B7:club","B5:club"],
  d18: ["A7:club","A6:club","C80:world","C81:world","C82:world","C79:world"],
  d19: ["B9:club","B1:club","B8:club","A1:club","A9:club","A8:club"],
  d20: ["B10:club","Quarterfinal:world","Quarterfinal:world","Quarterfinal:world","Quarterfinal:world","A10:club"],
  d21: ["D2:club","C1:club","C2:club","D1:club","C3:club","D3:club"],
  d22: [null,"D4:club","Semifinal:world","D5:club","Semifinal:world",null],
  d23: ["B11:club","A11:club","B12:club","A12:club","C4:club","C5:club"],
  d24: [null,"C6:club","A13:club","Final:world","B13:club","D6:club"],
};

function slotKey(drawId, sheetId) {
  return `${drawId}_${sheetId}`;
}

// Club's un-lettered qualifying games print simply as "G1" on the draw
// sheet — keep that exact label here too (the round they're in is implied
// by which draw they're on, visible in the chronological bracket view).
function parseCode(cell) {
  if (!cell) return { label: null, event: null };
  const [label, event] = cell.split(":");
  return { label, event };
}

function buildInitialSlots() {
  const slots = {};
  Object.entries(DRAW_SHEET_CODES).forEach(([drawId, cells]) => {
    cells.forEach((cell, i) => {
      const sheetId = i + 1;
      const { label, event } = parseCode(cell);
      if (!label) return;
      slots[slotKey(drawId, sheetId)] = {
        event,
        bracketLabel: label,
        teamA: "",
        teamB: "",
      };
    });
  });
  return slots;
}

// ---------- real club bracket (52 games), extracted from club.pdf + draws.pdf ----------
function findDrawId(day, time) {
  const full = `${day} ${time}`;
  const d = DRAWS.find((x) => x.time === full);
  return d ? d.id : null;
}

// winnerTo / loserTo are always one of:
//   { id, slot }        - a specific next game + which of its two slots
//   [{id,slot},{id,slot}] - genuinely ambiguous on the printed sheet
//                           (needs a manual pick when it happens)
//   "Out" | "Runner-up (1st)" | "Runner-up (2nd)" | null (= champion)
function buildClubTemplate() {
  const nodes = [];
  const push = (id, bracket, day, time, sheet, winnerTo, loserTo) => {
    nodes.push({
      id, event: "club", bracket, label: id.startsWith("cL") ? "G1" : id,
      day, time, sheet, drawId: findDrawId(day, time),
      teamA: "", teamB: "", winnerTo, loserTo,
      manual: id.startsWith("cL"), // only G1 games are hand-assigned from the roster
    });
  };

  // 14 G1 games (7 pairs) — winners meet at A_n, losers meet at B_n.
  const LEAF_PAIRS = [
    { n: 1, a: ["Fri", "10:15 PM", 1], b: ["Fri", "10:15 PM", 3] },
    { n: 2, a: ["Thu", "8:30 PM", 1], b: ["Thu", "8:30 PM", 2] },
    { n: 3, a: ["Thu", "8:30 PM", 6], b: ["Thu", "8:30 PM", 5] },
    { n: 4, a: ["Thu", "8:30 PM", 3], b: ["Thu", "8:30 PM", 4] },
    { n: 5, a: ["Fri", "9:45 AM", 2], b: ["Fri", "9:45 AM", 5] },
    { n: 6, a: ["Fri", "4:00 PM", 5], b: ["Fri", "4:00 PM", 6] },
    { n: 7, a: ["Fri", "4:00 PM", 3], b: ["Fri", "4:00 PM", 2] },
  ];
  LEAF_PAIRS.forEach(({ n, a, b }) => {
    push(`cL${n}a`, "G1 (qualifying)", a[0], a[1], a[2], { id: `A${n}`, slot: "A" }, { id: `B${n}`, slot: "A" });
    push(`cL${n}b`, "G1 (qualifying)", b[0], b[1], b[2], { id: `A${n}`, slot: "B" }, { id: `B${n}`, slot: "B" });
  });

  // A1-A7 / B1-B7 — winners continue in their letter bracket, losers drop to C/D.
  const AB = [
    // n, [day,time,sheet]A, winnerTo(A), loserTo(A),        [day,time,sheet]B, winnerTo(B), loserTo(B)
    [1, ["Sat","2:45 PM",4], {id:"A11",slot:"A"}, {id:"C3",slot:"A"},         ["Sat","2:45 PM",2], {id:"B11",slot:"A"}, {id:"D3",slot:"A"}],
    [2, ["Fri","10:15 PM",4], {id:"A8",slot:"A"}, {id:"C1",slot:"A"},        ["Fri","10:15 PM",5], {id:"B8",slot:"A"}, {id:"D1",slot:"A"}],
    [3, ["Fri","4:00 PM",4], {id:"A8",slot:"B"}, {id:"C1",slot:"B"},         ["Fri","10:15 PM",2], {id:"B8",slot:"B"}, {id:"D1",slot:"B"}],
    [4, ["Fri","4:00 PM",1], {id:"A9",slot:"A"}, {id:"C2",slot:"A"},         ["Fri","10:15 PM",6], {id:"B9",slot:"A"}, {id:"D2",slot:"A"}],
    [5, ["Sat","10:15 AM",1], {id:"A9",slot:"B"}, {id:"C2",slot:"B"},        ["Sat","10:15 AM",6], {id:"B9",slot:"B"}, {id:"D2",slot:"B"}],
    [6, ["Sat","1:00 PM",2], {id:"A10",slot:"A"}, [{id:"C3",slot:"B"},{id:"C5",slot:"B"}],  ["Sat","10:15 AM",2], {id:"B10",slot:"A"}, [{id:"D3",slot:"B"},{id:"D5",slot:"B"}]],
    [7, ["Sat","1:00 PM",1], {id:"A10",slot:"B"}, [{id:"C3",slot:"B"},{id:"C5",slot:"B"}],  ["Sat","10:15 AM",5], {id:"B10",slot:"B"}, [{id:"D3",slot:"B"},{id:"D5",slot:"B"}]],
  ];
  AB.forEach(([n, aSlot, aWin, aLose, bSlot, bWin, bLose]) => {
    push(`A${n}`, "A · 1st place", aSlot[0], aSlot[1], aSlot[2], aWin, aLose);
    push(`B${n}`, "B · 2nd place", bSlot[0], bSlot[1], bSlot[2], bWin, bLose);
  });

  push("A8",  "A · 1st place", "Sat", "2:45 PM", 6, { id: "A11", slot: "B" }, "Out");
  push("A9",  "A · 1st place", "Sat", "2:45 PM", 5, { id: "A12", slot: "A" }, "Out");
  push("A10", "A · 1st place", "Sat", "5:30 PM", 6, { id: "A12", slot: "B" }, "Out");
  push("A11", "A · 1st place", "Sun", "10:15 AM", 2, { id: "A13", slot: "A" }, "Out");
  push("A12", "A · 1st place", "Sun", "10:15 AM", 4, { id: "A13", slot: "B" }, "Out");
  push("A13", "A · 1st place CHAMPIONSHIP", "Sun", "1:00 PM", 3, null, "Runner-up (1st)");

  push("B8",  "B · 2nd place", "Sat", "2:45 PM", 3, { id: "B11", slot: "B" }, "Out");
  push("B9",  "B · 2nd place", "Sat", "2:45 PM", 1, { id: "B12", slot: "A" }, "Out");
  push("B10", "B · 2nd place", "Sat", "5:30 PM", 1, { id: "B12", slot: "B" }, "Out");
  push("B11", "B · 2nd place", "Sun", "10:15 AM", 1, { id: "B13", slot: "A" }, "Out");
  push("B12", "B · 2nd place", "Sun", "10:15 AM", 3, { id: "B13", slot: "B" }, "Out");
  push("B13", "B · 2nd place CHAMPIONSHIP", "Sun", "1:00 PM", 5, null, "Runner-up (2nd)");

  push("C1", "C · 3rd place", "Sat", "7:15 PM", 2, { id: "C4", slot: "A" }, "Out");
  push("C2", "C · 3rd place", "Sat", "7:15 PM", 3, { id: "C4", slot: "B" }, "Out");
  push("C3", "C · 3rd place", "Sat", "7:15 PM", 5, { id: "C5", slot: "A" }, "Out");
  push("C4", "C · 3rd place", "Sun", "10:15 AM", 5, { id: "C6", slot: "A" }, "Out");
  push("C5", "C · 3rd place", "Sun", "10:15 AM", 6, { id: "C6", slot: "B" }, "Out");
  push("C6", "C · 3rd place CHAMPIONSHIP", "Sun", "1:00 PM", 2, null, "Out");

  push("D1", "D · 4th place", "Sat", "7:15 PM", 4, { id: "D4", slot: "A" }, "Out");
  push("D2", "D · 4th place", "Sat", "7:15 PM", 1, { id: "D4", slot: "B" }, "Out");
  push("D3", "D · 4th place", "Sat", "7:15 PM", 6, { id: "D5", slot: "A" }, "Out");
  push("D4", "D · 4th place", "Sun", "8:30 AM", 2, { id: "D6", slot: "A" }, "Out");
  push("D5", "D · 4th place", "Sun", "8:30 AM", 4, { id: "D6", slot: "B" }, "Out");
  push("D6", "D · 4th place CHAMPIONSHIP", "Sun", "1:00 PM", 6, null, "Out");

  return nodes;
}

// World: 8-team, 3-game-elimination shape -> reseeded QFs -> final
function buildWorldTemplate() {
  const n = [];
  const g = (id, round, label, drawId, sheetId) =>
    n.push({ id, event: "world", round, label, drawId, sheetId, teamA: "", teamB: "", winnerTo: null, loserTo: null, winner: null });

  g("w-r1-1", 1, "R1 Game 1", "d1", 5);
  g("w-r1-2", 1, "R1 Game 2", "d1", 6);
  g("w-r1-3", 1, "R1 Game 3", "d2", 5);
  g("w-r1-4", 1, "R1 Game 4", "d2", 6);

  g("w-r2-1", 2, "R2 Game 1", "d3", 5);
  g("w-r2-2", 2, "R2 Game 2", "d3", 6);
  g("w-elim-1", 2, "Elimination G1", "d4", 5);
  g("w-elim-2", 2, "Elimination G2", "d4", 6);

  g("w-qf-1", 3, "Reseeded QF 1", "d6", 5);
  g("w-qf-2", 3, "Reseeded QF 2", "d6", 6);

  g("w-final", 4, "World Final", "d9", 6);

  const link = (fromId, winnerToId, winnerSlot, loserToId, loserSlot) => {
    const node = n.find((x) => x.id === fromId);
    node.winnerTo = winnerToId ? { id: winnerToId, slot: winnerSlot } : null;
    node.loserTo = loserToId ? { id: loserToId, slot: loserSlot } : null;
  };
  link("w-r1-1", "w-r2-1", "A", "w-elim-1", "A");
  link("w-r1-2", "w-r2-1", "B", "w-elim-1", "B");
  link("w-r1-3", "w-r2-2", "A", "w-elim-2", "A");
  link("w-r1-4", "w-r2-2", "B", "w-elim-2", "B");
  link("w-r2-1", "w-qf-1", "A", "w-elim-2", "A"); // reseed simplification
  link("w-r2-2", "w-qf-2", "A", "w-elim-1", "A");
  link("w-elim-1", "w-qf-1", "B", null, null);
  link("w-elim-2", "w-qf-2", "B", null, null);
  link("w-qf-1", "w-final", "A", null, null);
  link("w-qf-2", "w-final", "B", null, null);
  return n;
}

// ---------- small UI atoms ----------

function StatusPill({ status }) {
  const map = {
    building: { bg: "#eef1f4", fg: "#5b6672", label: "Building" },
    draft: { bg: "#fff0d6", fg: "#8a5a00", label: "Draft saved" },
    scheduled: { bg: "#dcecff", fg: "#1c5aa8", label: "Scheduled" },
    submitted: { bg: "#dcf5e3", fg: "#1c7a3d", label: "Submitted" },
  };
  const s = map[status] || map.building;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        letterSpacing: 0.2,
      }}
    >
      {s.label}
    </span>
  );
}

function Modal({ title, children, onClose, width }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,14,20,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14, padding: 24, width: width || 420, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 17, color: "#12202e" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ---------- main app ----------

export default function App() {
  const [tab, setTab] = useState("draws");
  const [selectedDrawId, setSelectedDrawId] = useState(DRAWS[0].id);

  // Everything below is restored from the browser's saved copy if one exists.
  const [saved] = useState(loadSaved);
  const [saveStatus, setSaveStatus] = useState(saved ? "restored" : "idle"); // idle | restored | saved | error

  const [clubRoster, setClubRoster] = useState(() =>
    sortAndFlag(saved?.clubRoster || CLUB_ROSTER_INITIAL, "id"));
  const [worldRoster, setWorldRoster] = useState(() =>
    sortAndFlag(saved?.worldRoster || WORLD_ROSTER_INITIAL, "seed"));

  const updateClubRow = (idx, patch) => {
    setClubRoster((prev) => {
      const next = prev.map((r, i) => (i === idx ? withDisplay({ ...r, ...patch }) : r));
      return sortAndFlag(next, "id");
    });
  };
  const updateWorldRow = (idx, patch) => {
    setWorldRoster((prev) => {
      const next = prev.map((r, i) => (i === idx ? withDisplay({ ...r, ...patch }) : r));
      return sortAndFlag(next, "seed");
    });
  };

  // Replace a whole roster from pasted text, and carry existing assignments
  // over to renamed teams (matched by team number / seed).
  const importRoster = (which, rows) => {
    const isClub = which === "club";
    const field = isClub ? "id" : "seed";
    const oldRoster = isClub ? clubRoster : worldRoster;
    const next = sortAndFlag(rows.map(withDisplay), field);
    const renames = buildRenameMap(oldRoster, next, field);
    const rn = (name) => (name && renames[name] ? renames[name] : name);

    if (Object.keys(renames).length) {
      setSlots((prev) => {
        const out = {};
        Object.keys(prev).forEach((k) => {
          const sl = prev[k];
          out[k] = { ...sl, teamA: rn(sl.teamA), teamB: rn(sl.teamB) };
        });
        return out;
      });
      if (!isClub) {
        setWorldNodes((prev) => prev.map((n) => ({ ...n, teamA: rn(n.teamA), teamB: rn(n.teamB), winner: rn(n.winner) })));
      }
    }
    (isClub ? setClubRoster : setWorldRoster)(next);
    return Object.keys(renames).length;
  };

  const resetSavedData = () => {
    if (!window.confirm("Clear the saved copy in this browser and start over from the built-in data? This can't be undone.")) return;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    window.location.reload();
  };

  // Autosave (debounced) whenever any saved piece of state changes.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          clubRoster, worldRoster, slots, posts, worldNodes, featuredSheetId,
        }));
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("error"); // storage full (photos are the usual cause) or unavailable
      }
    }, 400);
    return () => clearTimeout(t);
  }, [clubRoster, worldRoster, slots, posts, worldNodes, featuredSheetId]);

  const clubTeams = useMemo(() => clubRoster.map((t) => t.display), [clubRoster]);
  const worldTeams = useMemo(() => worldRoster.map((t) => t.display), [worldRoster]);

  // slots: shared source of truth for who's playing where.
  // key = `${drawId}_${sheetId}` -> { event, bracketLabel, teamA, teamB, nodeId }
  const [slots, setSlots] = useState(() => saved?.slots || buildInitialSlots());

  // per-draw post state
  const [posts, setPosts] = useState(() => saved?.posts || {}); // drawId -> {text, photos:[dataUrl], status, scheduledAt, generatedOnce}

  const [clubNodes, setClubNodes] = useState(buildClubTemplate());
  const [worldNodes, setWorldNodes] = useState(() => saved?.worldNodes || buildWorldTemplate());

  const [featuredSheetId, setFeaturedSheetId] = useState(saved?.featuredSheetId ?? 3);

  const [confirmRegenDraw, setConfirmRegenDraw] = useState(null);
  const [scheduleModalDraw, setScheduleModalDraw] = useState(null);

  const setSlot = useCallback((drawId, sheetId, patch) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey(drawId, sheetId)]: { ...(prev[slotKey(drawId, sheetId)] || {}), ...patch },
    }));
  }, []);

  const getSlot = (drawId, sheetId) => slots[slotKey(drawId, sheetId)] || {};

  // ---- club bracket engine: real 52-node propagation ----
  const clubNodesById = useMemo(() => {
    const m = {};
    clubNodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [clubNodes]);

  const setClubTeam = (nodeId, side, value) => {
    const node = clubNodesById[nodeId];
    if (!node) return;
    setSlot(node.drawId, node.sheet, { event: "club", bracketLabel: node.label, [side]: value });
  };

  const setClubWinner = (nodeId, side) => {
    const node = clubNodesById[nodeId];
    if (!node) return;
    const slot = getSlot(node.drawId, node.sheet);
    const winnerTeam = side === "A" ? slot.teamA : slot.teamB;
    const loserTeam = side === "A" ? slot.teamB : slot.teamA;
    if (!winnerTeam || !loserTeam) return;

    setSlot(node.drawId, node.sheet, { winnerSide: side });

    if (node.winnerTo && !Array.isArray(node.winnerTo)) {
      const target = clubNodesById[node.winnerTo.id];
      if (target) {
        setSlot(target.drawId, target.sheet, {
          event: "club", bracketLabel: target.label,
          [node.winnerTo.slot === "A" ? "teamA" : "teamB"]: winnerTeam,
        });
      }
    }
    if (node.loserTo && typeof node.loserTo === "object" && !Array.isArray(node.loserTo)) {
      const target = clubNodesById[node.loserTo.id];
      if (target) {
        setSlot(target.drawId, target.sheet, {
          event: "club", bracketLabel: target.label,
          [node.loserTo.slot === "A" ? "teamA" : "teamB"]: loserTeam,
        });
      }
    }
  };

  const chooseClubLoserDestination = (nodeId, chosenId) => {
    const node = clubNodesById[nodeId];
    if (!node || !Array.isArray(node.loserTo)) return;
    const slot = getSlot(node.drawId, node.sheet);
    if (!slot.winnerSide) return;
    const loserTeam = slot.winnerSide === "A" ? slot.teamB : slot.teamA;
    const choice = node.loserTo.find((c) => c.id === chosenId);
    const target = choice && clubNodesById[choice.id];
    if (!target) return;
    setSlot(target.drawId, target.sheet, {
      event: "club", bracketLabel: target.label,
      [choice.slot === "A" ? "teamA" : "teamB"]: loserTeam,
    });
    setSlot(node.drawId, node.sheet, { loserChoice: chosenId });
  };

  // Clears a manually-set G1 game back to empty — both team pickers, its
  // winner selection, and (since we know exactly where it wrote) retracts
  // whatever it had already pushed into the games it feeds.
  const clearClubG1 = (nodeId) => {
    const node = clubNodesById[nodeId];
    if (!node || !node.manual) return;
    setSlot(node.drawId, node.sheet, { teamA: "", teamB: "", winnerSide: null, loserChoice: null });
    if (node.winnerTo && !Array.isArray(node.winnerTo)) {
      const target = clubNodesById[node.winnerTo.id];
      if (target) setSlot(target.drawId, target.sheet, { [node.winnerTo.slot === "A" ? "teamA" : "teamB"]: "" });
    }
    if (node.loserTo && typeof node.loserTo === "object" && !Array.isArray(node.loserTo)) {
      const target = clubNodesById[node.loserTo.id];
      if (target) setSlot(target.drawId, target.sheet, { [node.loserTo.slot === "A" ? "teamA" : "teamB"]: "" });
    }
  };

  // ---- world/demo bracket engine (drag & drop, unrelated to club above) ----
  const advanceWinner = (event, nodeId, winnerSide) => {
    const setNodes = event === "club" ? setClubNodes : setWorldNodes;
    const nodesRef = event === "club" ? clubNodes : worldNodes;
    const node = nodesRef.find((n) => n.id === nodeId);
    if (!node || !node.teamA || !node.teamB) return;
    const winner = winnerSide === "A" ? node.teamA : node.teamB;
    const loser = winnerSide === "A" ? node.teamB : node.teamA;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) return { ...n, winner };
        if (node.winnerTo && n.id === node.winnerTo.id) {
          return node.winnerTo.slot === "A" ? { ...n, teamA: winner } : { ...n, teamB: winner };
        }
        if (node.loserTo && n.id === node.loserTo.id) {
          return node.loserTo.slot === "A" ? { ...n, teamA: loser } : { ...n, teamB: loser };
        }
        return n;
      })
    );

    // push the completed matchup into the draw/sheet slot it was assigned to
    setSlot(node.drawId, node.sheetId, {
      event,
      bracketLabel: node.label,
      teamA: node.teamA,
      teamB: node.teamB,
      nodeId,
    });

    // push newly-known teams into whatever draw/sheet the next games live on
    [node.winnerTo, node.loserTo].forEach((adv) => {
      if (!adv) return;
      const targetNode = nodesRef.find((n) => n.id === adv.id);
      if (!targetNode) return;
      const advancingTeam = adv === node.winnerTo ? winner : loser;
      const patch = adv.slot === "A" ? { teamA: advancingTeam } : { teamB: advancingTeam };
      setSlot(targetNode.drawId, targetNode.sheetId, {
        event,
        bracketLabel: targetNode.label,
        ...patch,
        nodeId: targetNode.id,
      });
    });
  };

  // when a bracket node's drawId/sheetId assignment changes
  const reassignNode = (event, nodeId, drawId, sheetId) => {
    const setNodes = event === "club" ? setClubNodes : setWorldNodes;
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, drawId, sheetId } : n)));
  };

  // manual team pick directly on a bracket R1 node (drag-and-drop target)
  const dropTeamOnNode = (event, nodeId, side, teamName) => {
    const setNodes = event === "club" ? setClubNodes : setWorldNodes;
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, [side === "A" ? "teamA" : "teamB"]: teamName } : n)));
  };

  // ---- draws tab: manual sheet editing (independent of bracket, or overriding it) ----
  const setSheetTeam = (drawId, sheetId, side, value, event) => {
    setSlot(drawId, sheetId, { [side]: value, event: event || getSlot(drawId, sheetId).event });
  };

  const buildPostText = (drawId) => {
    const draw = DRAWS.find((d) => d.id === drawId);
    let text = `🥌 ${draw.label} — ${draw.dayFull} ${draw.date}, ${draw.time.replace(`${draw.day} `, "")}\n\n`;
    SHEETS.forEach((sheet) => {
      const s = getSlot(drawId, sheet.id);
      const isFeatured = sheet.id === featuredSheetId;
      const link = isFeatured ? FEATURED_YOUTUBE : sheet.youtube;
      if (s.teamA || s.teamB) {
        const evTag = s.event ? `[${s.event === "club" ? "Club" : "World"}]` : "";
        const bracket = s.bracketLabel ? ` (${s.bracketLabel})` : "";
        text += `Sheet ${sheet.id}${isFeatured ? " ⭐ FEATURED" : ""}: ${evTag} ${s.teamA || "TBD"} vs ${s.teamB || "TBD"}${bracket}\n📺 ${link}\n\n`;
      }
    });
    text += `#Bonspiel #Curling #${draw.label.replace(/\s+/g, "")}`;
    return text;
  };

  const generate = (drawId) => {
    const existing = posts[drawId];
    if (existing && existing.generatedOnce) {
      setConfirmRegenDraw(drawId);
      return;
    }
    doGenerate(drawId);
  };

  const doGenerate = (drawId) => {
    setPosts((prev) => ({
      ...prev,
      [drawId]: {
        ...(prev[drawId] || { photos: [], status: "building" }),
        text: buildPostText(drawId),
        generatedOnce: true,
        status: prev[drawId]?.status === "submitted" ? "submitted" : "draft",
      },
    }));
    setConfirmRegenDraw(null);
  };

  const updatePostText = (drawId, text) => {
    setPosts((prev) => ({ ...prev, [drawId]: { ...(prev[drawId] || {}), text } }));
  };

  const addPhotos = (drawId, fileList) => {
    const files = Array.from(fileList);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPosts((prev) => {
          const cur = prev[drawId] || { photos: [], status: "building" };
          return { ...prev, [drawId]: { ...cur, photos: [...(cur.photos || []), reader.result] } };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (drawId, idx) => {
    setPosts((prev) => {
      const cur = prev[drawId];
      if (!cur) return prev;
      const photos = cur.photos.filter((_, i) => i !== idx);
      return { ...prev, [drawId]: { ...cur, photos } };
    });
  };

  const submitNow = (drawId) => {
    const p = posts[drawId];
    if (!p || !p.text) return alert("Generate the post text first.");
    if (!p.photos || p.photos.length === 0) return alert("Instagram requires at least one photo — add one before submitting.");

    // -----------------------------------------------------------------
    // REAL BACKEND CALL GOES HERE.
    // e.g. await fetch("/api/posts/publish", { method:"POST", body: JSON.stringify({
    //        drawId, text: p.text, photos: p.photos }) })
    // Your backend holds the long-lived Page/IG token and calls:
    //   POST /{ig-user-id}/media            (image_url or upload, caption)
    //   POST /{ig-user-id}/media_publish
    //   POST /{page-id}/photos              (for Facebook)
    // -----------------------------------------------------------------
    setPosts((prev) => ({ ...prev, [drawId]: { ...prev[drawId], status: "submitted", scheduledAt: null } }));
  };

  const scheduleSubmit = (drawId, whenLocal) => {
    setPosts((prev) => ({ ...prev, [drawId]: { ...prev[drawId], status: "scheduled", scheduledAt: whenLocal } }));
    setScheduleModalDraw(null);
    // REAL BACKEND CALL: enqueue a scheduled job that calls the same
    // publish endpoint at `whenLocal`.
  };

  const isLocked = (drawId) => posts[drawId]?.status === "submitted";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f3f6f9", minHeight: "100vh" }}>
      <TopBar tab={tab} setTab={setTab} saveStatus={saveStatus} onReset={resetSavedData} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 80px" }}>
        {tab === "roster-club" && (
          <ClubRosterTab roster={clubRoster} onChange={updateClubRow} onImport={(rows) => importRoster("club", rows)} />
        )}
        {tab === "roster-world" && (
          <WorldRosterTab roster={worldRoster} onChange={updateWorldRow} onImport={(rows) => importRoster("world", rows)} />
        )}
        {tab === "draws" && (
          <DrawsTab
            selectedDrawId={selectedDrawId}
            setSelectedDrawId={setSelectedDrawId}
            getSlot={getSlot}
            setSheetTeam={setSheetTeam}
            featuredSheetId={featuredSheetId}
            setFeaturedSheetId={setFeaturedSheetId}
            posts={posts}
            generate={generate}
            updatePostText={updatePostText}
            addPhotos={addPhotos}
            removePhoto={removePhoto}
            submitNow={submitNow}
            openSchedule={(id) => setScheduleModalDraw(id)}
            isLocked={isLocked}
            clubTeams={clubTeams}
            worldTeams={worldTeams}
          />
        )}
        {tab === "bracket-club" && (
          <ClubBracketTab
            nodes={clubNodes}
            getSlot={getSlot}
            setSlot={setSlot}
            setClubTeam={setClubTeam}
            setClubWinner={setClubWinner}
            chooseClubLoserDestination={chooseClubLoserDestination}
            clearClubG1={clearClubG1}
            clubTeams={clubTeams}
            clubRoster={clubRoster}
            isLocked={isLocked}
          />
        )}
        {tab === "bracket-world" && (
          <BracketTab
            title="World Bracket — 3-Game Elimination + Reseeded Playoffs"
            note="Template shows 8 teams. Extend worldNodes with your full 32-team node list to go live."
            teams={worldTeams}
            nodes={worldNodes}
            advanceWinner={(id, side) => advanceWinner("world", id, side)}
            reassignNode={(id, d, s) => reassignNode("world", id, d, s)}
            dropTeamOnNode={(id, side, t) => dropTeamOnNode("world", id, side, t)}
          />
        )}
      </div>

      {confirmRegenDraw && (
        <Modal title="Overwrite generated text?" onClose={() => setConfirmRegenDraw(null)}>
          <p style={{ color: "#4a5561", fontSize: 14, lineHeight: 1.5 }}>
            This draw already has generated text — possibly edited by hand. Generating again will
            replace it completely. This can't be undone.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button style={btnGhost} onClick={() => setConfirmRegenDraw(null)}>Cancel</button>
            <button style={btnDanger} onClick={() => doGenerate(confirmRegenDraw)}>Overwrite</button>
          </div>
        </Modal>
      )}

      {scheduleModalDraw && (
        <ScheduleModal
          drawId={scheduleModalDraw}
          onClose={() => setScheduleModalDraw(null)}
          onConfirm={(when) => scheduleSubmit(scheduleModalDraw, when)}
        />
      )}
    </div>
  );
}

function ScheduleModal({ drawId, onClose, onConfirm }) {
  const [val, setVal] = useState("");
  return (
    <Modal title="Schedule this post" onClose={onClose}>
      <p style={{ color: "#4a5561", fontSize: 14, marginTop: 0 }}>
        Pick a date & time. The interface will publish automatically then — you don't need to be
        watching the clock.
      </p>
      <input
        type="datetime-local"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cfd8e0", fontSize: 14 }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button style={btnPrimary} disabled={!val} onClick={() => onConfirm(val)}>Schedule</button>
      </div>
    </Modal>
  );
}

function TopBar({ tab, setTab, saveStatus, onReset }) {
  const tabs = [
    { id: "roster-club", label: "Club Roster" },
    { id: "roster-world", label: "World Roster" },
    { id: "draws", label: "Draws & Posting" },
    { id: "bracket-club", label: "Club Bracket" },
    { id: "bracket-world", label: "World Bracket" },
  ];
  return (
    <div style={{ background: "#12202e", padding: "0 20px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", gap: 26, height: 62 }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: 0.2 }}>
          🥌 Bonspiel Ops
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "#233649" : "transparent",
                color: tab === t.id ? "#fff" : "#9db0c2",
                border: "none",
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, fontSize: 12.5 }}>
          <span style={{ color: saveStatus === "error" ? "#ff9d92" : "#9db0c2", fontWeight: 600 }}>
            {saveStatus === "saved" && "✓ Saved in this browser"}
            {saveStatus === "restored" && "Restored from saved copy"}
            {saveStatus === "error" && "⚠ Couldn't save — storage full (try removing photos)"}
          </span>
          <button
            onClick={onReset}
            style={{ background: "transparent", color: "#9db0c2", border: "1px solid #3a5068", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  background: "#1c5aa8", color: "#fff", border: "none", padding: "9px 16px",
  borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
};
const btnGhost = {
  background: "#fff", color: "#3a4552", border: "1px solid #cfd8e0", padding: "9px 16px",
  borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
};
const btnDanger = {
  background: "#c0392b", color: "#fff", border: "none", padding: "9px 16px",
  borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
};
const btnSmall = {
  background: "#eef1f4", color: "#334", border: "none", padding: "5px 10px",
  borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer",
};

// ------------------------------------------------------------------

function DrawsTab({
  selectedDrawId, setSelectedDrawId, getSlot, setSheetTeam, featuredSheetId, setFeaturedSheetId,
  posts, generate, updatePostText, addPhotos, removePhoto, submitNow, openSchedule, isLocked,
  clubTeams, worldTeams,
}) {
  const draw = DRAWS.find((d) => d.id === selectedDrawId);
  const post = posts[selectedDrawId] || {};
  const locked = isLocked(selectedDrawId);
  const fileRef = useRef();

  const dayGroups = useMemo(() => {
    const groups = [];
    const seen = {};
    DRAWS.forEach((d) => {
      if (!seen[d.day]) {
        seen[d.day] = { day: d.day, dayFull: d.dayFull, date: d.date, items: [] };
        groups.push(seen[d.day]);
      }
      seen[d.day].items.push(d);
    });
    return groups;
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 20 }}>
      {/* draw picker */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 12, height: "fit-content", boxShadow: "0 1px 3px rgba(20,30,40,0.08)", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a0", padding: "4px 8px 10px", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Draws
        </div>
        {dayGroups.map((g) => (
          <div key={g.day} style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 800, color: "#5b6672", padding: "6px 10px",
              background: "#f3f6f9", borderRadius: 6, marginBottom: 4,
            }}>
              {g.dayFull} · {g.date}
            </div>
            {g.items.map((d) => {
              const st = posts[d.id]?.status || "building";
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDrawId(d.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", border: "none",
                    background: d.id === selectedDrawId ? "#eaf1fb" : "transparent",
                    borderRadius: 8, padding: "9px 10px", marginBottom: 2, cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#22303e" }}>{d.label}</div>
                  <div style={{ fontSize: 11.5, color: "#8492a0", marginBottom: 4 }}>{d.time}</div>
                  <StatusPill status={st} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* draw detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(20,30,40,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#12202e" }}>{draw.label}</div>
              <div style={{ fontSize: 13, color: "#7c8794" }}>{draw.dayFull} {draw.date} · {draw.time.replace(`${draw.day} `, "")}</div>
            </div>
            {locked && <StatusPill status="submitted" />}
          </div>

          <div style={{ fontSize: 12, color: "#8a94a0", marginBottom: 8 }}>
            Featured stream sheet:{" "}
            <select
              value={featuredSheetId}
              disabled={locked}
              onChange={(e) => setFeaturedSheetId(Number(e.target.value))}
              style={{ fontSize: 12, padding: "2px 6px" }}
            >
              <option value={3}>Sheet 3</option>
              <option value={4}>Sheet 4</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {SHEETS.map((sheet) => {
              const s = getSlot(draw.id, sheet.id);
              const teams = s.event === "world" ? worldTeams : s.event === "club" ? clubTeams : [...clubTeams, ...worldTeams];
              const isFeatured = sheet.id === featuredSheetId;
              const noGame = !s.event && !s.bracketLabel;
              if (noGame) {
                return (
                  <div key={sheet.id} style={{ border: "1px dashed #d7dee5", borderRadius: 10, padding: 10, background: "#fafcfd", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 118 }}>
                    <div style={{ fontSize: 11.5, color: "#b0b8c0", textAlign: "center" }}>Sheet {sheet.id}<br />No game this draw</div>
                  </div>
                );
              }
              return (
                <div key={sheet.id} style={{ border: "1px solid #e3e8ee", borderRadius: 10, padding: 10, background: isFeatured ? "#fff9ef" : "#fafcfd" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#3a4552", marginBottom: 4 }}>
                    <span>Sheet {sheet.id}{isFeatured && " ⭐"}</span>
                    <select
                      value={s.event || ""}
                      disabled={locked}
                      onChange={(e) => setSheetTeam(draw.id, sheet.id, "event", e.target.value, e.target.value)}
                      style={{ fontSize: 10.5, border: "none", background: "transparent", color: "#8a94a0" }}
                    >
                      <option value="">event…</option>
                      <option value="club">Club</option>
                      <option value="world">World</option>
                    </select>
                  </div>
                  {s.bracketLabel && (
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginBottom: 6, padding: "3px 8px", borderRadius: 999,
                      display: "inline-block",
                      background: s.event === "world" ? "#eaf1fb" : "#fff0d6",
                      color: s.event === "world" ? "#1c5aa8" : "#8a5a00",
                    }}>
                      {s.bracketLabel}
                    </div>
                  )}
                  <select
                    value={s.teamA || ""}
                    disabled={locked}
                    onChange={(e) => setSheetTeam(draw.id, sheet.id, "teamA", e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Team A…</option>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ textAlign: "center", fontSize: 10.5, color: "#aab4bd", margin: "3px 0" }}>vs</div>
                  <select
                    value={s.teamB || ""}
                    disabled={locked}
                    onChange={(e) => setSheetTeam(draw.id, sheet.id, "teamB", e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Team B…</option>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* post generation */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(20,30,40,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#12202e" }}>Post</div>
            {!locked && (
              <button style={btnPrimary} onClick={() => generate(draw.id)}>
                {post.generatedOnce ? "Regenerate text" : "Generate text"}
              </button>
            )}
          </div>

          <textarea
            value={post.text || ""}
            disabled={locked}
            onChange={(e) => updatePostText(draw.id, e.target.value)}
            placeholder="Generate text above, or write it here."
            style={{
              width: "100%", minHeight: 200, borderRadius: 8, border: "1px solid #d7dee5",
              padding: 12, fontSize: 13.5, fontFamily: "inherit", lineHeight: 1.5, resize: "vertical",
              background: locked ? "#f6f8fa" : "#fff",
            }}
          />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6672", marginBottom: 6 }}>
              Photos {(!post.photos || post.photos.length === 0) && <span style={{ color: "#c0392b" }}>(Instagram requires at least 1)</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(post.photos || []).map((src, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={src} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }} />
                  {!locked && (
                    <button
                      onClick={() => removePhoto(draw.id, i)}
                      style={{ position: "absolute", top: -6, right: -6, background: "#c0392b", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer" }}
                    >×</button>
                  )}
                </div>
              ))}
              {!locked && (
                <button
                  onClick={() => fileRef.current.click()}
                  style={{ width: 72, height: 72, borderRadius: 8, border: "1px dashed #b7c1cb", background: "#fafcfd", color: "#8a94a0", cursor: "pointer", fontSize: 22 }}
                >+</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(draw.id, e.target.files)} />
            </div>
          </div>

          {!locked && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              {post.scheduledAt && (
                <span style={{ fontSize: 12, color: "#1c5aa8", alignSelf: "center" }}>
                  Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                </span>
              )}
              <button style={btnGhost} onClick={() => openSchedule(draw.id)}>Submit at time…</button>
              <button style={btnPrimary} onClick={() => submitNow(draw.id)}>Submit now</button>
            </div>
          )}
          {locked && (
            <div style={{ marginTop: 14, fontSize: 12.5, color: "#1c7a3d", fontWeight: 600 }}>
              ✓ Submitted — this draw is locked and won't be touched again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%", fontSize: 12.5, padding: "5px 6px", borderRadius: 6,
  border: "1px solid #d7dee5", background: "#fff",
};

// ------------------------------------------------------------------
// Roster tabs — fully editable. Every row here is what feeds the team
// dropdowns on the Draws tab, so edits show up there immediately.
// The # / Seed cell is a dropdown; changing it re-sorts the table and,
// if two rows now share a number, flags both red until you fix it.

const rosterTableWrap = {
  background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(20,30,40,0.08)",
  overflow: "hidden",
};
const rosterTh = {
  textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#8a94a0",
  textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 14px",
  borderBottom: "1px solid #e3e8ee", background: "#fafcfd", position: "sticky", top: 0,
};
const rosterTd = {
  fontSize: 13.5, color: "#22303e", padding: "6px 10px", borderBottom: "1px solid #eef1f4",
};
const cellInput = {
  width: "100%", fontSize: 13.5, padding: "5px 6px", borderRadius: 6,
  border: "1px solid transparent", background: "transparent", color: "#22303e",
  fontFamily: "inherit",
};
const cellInputFocusable = {
  ...cellInput,
};

function EditableText({ value, onCommit, width, align }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onCommit(v); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
      style={{ ...cellInputFocusable, width: width || "100%", textAlign: align || "left" }}
      onFocus={(e) => (e.target.style.border = "1px solid #b7c6d6")}
      onBlurCapture={(e) => (e.target.style.border = "1px solid transparent")}
    />
  );
}

function NumberSelect({ value, max, onChange, dup }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 62, fontSize: 13, fontWeight: 700, padding: "5px 4px", borderRadius: 6,
        border: dup ? "1px solid #c0392b" : "1px solid #d7dee5",
        background: dup ? "#fdecea" : "#fff", color: dup ? "#c0392b" : "#22303e",
      }}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}

function RosterHeader({ title, count, subtitle, dupCount }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#12202e" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#7c8794", marginTop: 2 }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#5b6672", background: "#eef1f4", padding: "4px 10px", borderRadius: 999 }}>
        {count} teams
      </span>
    </div>
  );
}

function DupBanner({ dupCount, label }) {
  if (!dupCount) return null;
  return (
    <div style={{
      background: "#fdecea", border: "1px solid #f3c6c1", color: "#a33327",
      borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, marginBottom: 12,
    }}>
      ⚠ {dupCount} {label}{dupCount === 1 ? "" : "s"} shared by more than one team — highlighted rows below need a unique number.
    </div>
  );
}

// Paste-to-replace dialog shared by both roster tabs.
function RosterImportModal({ title, columns, numberField, currentCount, onClose, onImport }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(null);
  const result = useMemo(
    () => (text.trim() ? parseRosterText(text, columns, numberField) : null),
    [text, columns, numberField]
  );
  const ok = result && !result.error && result.rows.length > 0;

  return (
    <Modal title={title} onClose={onClose} width={620}>
      {done === null ? (
        <>
          <p style={{ color: "#4a5561", fontSize: 13.5, lineHeight: 1.5, marginTop: 0 }}>
            Paste rows copied from your spreadsheet (or CSV). <b>This replaces the whole roster</b> — currently {currentCount} teams.
            A header row is optional; if you include one, use: <i>{columns.map((c) => c.label).join(", ")}</i>.
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={columns.map((c) => c.label).join("\t")}
            spellCheck={false}
            style={{
              width: "100%", height: 200, boxSizing: "border-box", padding: 10, borderRadius: 8,
              border: "1px solid #cfd8e0", fontSize: 12.5, fontFamily: "ui-monospace, Menlo, monospace", resize: "vertical",
            }}
          />
          {result?.error && (
            <div style={{ color: "#a33327", background: "#fdecea", border: "1px solid #f3c6c1", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 10 }}>
              {result.error}
            </div>
          )}
          {ok && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#33404b" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Ready to import {result.rows.length} team{result.rows.length === 1 ? "" : "s"}
                {result.rows.length !== currentCount && ` (was ${currentCount})`}
              </div>
              <div style={{ color: "#6b7682" }}>
                First: {withDisplay(result.rows[0]).display}
                {result.rows.length > 1 && <> &nbsp;·&nbsp; Last: {withDisplay(result.rows[result.rows.length - 1]).display}</>}
              </div>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ color: "#8a5a00", marginTop: 4 }}>⚠ {w}</div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button style={btnGhost} onClick={onClose}>Cancel</button>
            <button
              style={{ ...btnPrimary, opacity: ok ? 1 : 0.5, cursor: ok ? "pointer" : "not-allowed" }}
              disabled={!ok}
              onClick={() => setDone(onImport(result.rows))}
            >
              Replace roster
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: "#33404b", fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>
            Roster updated.
            {done > 0
              ? ` ${done} team${done === 1 ? "" : "s"} with a changed name had their existing draw and bracket assignments updated to match (matched by number).`
              : " No existing draw or bracket assignments needed renaming."}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button style={btnPrimary} onClick={onClose}>Done</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function RosterActions({ onPaste, onCopy }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <button style={btnPrimary} onClick={onPaste}>Paste new roster…</button>
      <button
        style={btnGhost}
        onClick={async () => {
          try { await navigator.clipboard.writeText(onCopy()); setCopied(true); setTimeout(() => setCopied(false), 1800); }
          catch (e) { window.alert("Couldn't access the clipboard in this browser."); }
        }}
      >
        {copied ? "Copied ✓" : "Copy roster"}
      </button>
    </div>
  );
}

function ClubRosterTab({ roster, onChange, onImport }) {
  const [showImport, setShowImport] = useState(false);
  const dupCount = new Set(roster.filter((r) => r.__dup).map((r) => r.id)).size;
  return (
    <div>
      <RosterHeader
        title="Club Roster"
        count={roster.length}
        subtitle="Team display name = Female last name / Male last name. Change # to reorder — duplicates are allowed but flagged."
      />
      <RosterActions onPaste={() => setShowImport(true)} onCopy={() => rosterToText(roster, CLUB_COLUMNS)} />
      {showImport && (
        <RosterImportModal
          title="Paste club roster"
          columns={CLUB_COLUMNS}
          numberField="id"
          currentCount={roster.length}
          onClose={() => setShowImport(false)}
          onImport={onImport}
        />
      )}
      <DupBanner dupCount={dupCount} label="team number" />
      <div style={{ ...rosterTableWrap, maxHeight: 640, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...rosterTh, width: 60 }}>#</th>
              <th style={rosterTh}>Team</th>
              <th style={rosterTh}>Female first</th>
              <th style={rosterTh}>Female last</th>
              <th style={rosterTh}>Male first</th>
              <th style={rosterTh}>Male last</th>
              <th style={rosterTh}>Contact email</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((t, idx) => (
              <tr key={idx} style={t.__dup ? { background: "#fff5f4" } : undefined}>
                <td style={rosterTd}>
                  <NumberSelect value={t.id} max={Math.max(28, roster.length, ...roster.map((r) => r.id || 0))} dup={t.__dup} onChange={(v) => onChange(idx, { id: v })} />
                </td>
                <td style={{ ...rosterTd, fontWeight: 700 }}>{t.display}</td>
                <td style={rosterTd}><EditableText value={t.femaleFirst} onCommit={(v) => onChange(idx, { femaleFirst: v })} /></td>
                <td style={rosterTd}><EditableText value={t.femaleLast} onCommit={(v) => onChange(idx, { femaleLast: v })} /></td>
                <td style={rosterTd}><EditableText value={t.maleFirst} onCommit={(v) => onChange(idx, { maleFirst: v })} /></td>
                <td style={rosterTd}><EditableText value={t.maleLast} onCommit={(v) => onChange(idx, { maleLast: v })} /></td>
                <td style={rosterTd}><EditableText value={t.email} onCommit={(v) => onChange(idx, { email: v })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorldRosterTab({ roster, onChange, onImport }) {
  const [showImport, setShowImport] = useState(false);
  const dupCount = new Set(roster.filter((r) => r.__dup).map((r) => r.seed)).size;
  return (
    <div>
      <RosterHeader
        title="World Roster"
        count={roster.length}
        subtitle="Ranked by Week 17 points. Change Seed to reorder — duplicates are allowed but flagged."
      />
      <RosterActions onPaste={() => setShowImport(true)} onCopy={() => rosterToText(roster, WORLD_COLUMNS)} />
      {showImport && (
        <RosterImportModal
          title="Paste world roster"
          columns={WORLD_COLUMNS}
          numberField="seed"
          currentCount={roster.length}
          onClose={() => setShowImport(false)}
          onImport={onImport}
        />
      )}
      <DupBanner dupCount={dupCount} label="seed number" />
      <div style={{ ...rosterTableWrap, maxHeight: 640, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...rosterTh, width: 66 }}>Seed</th>
              <th style={rosterTh}>Points</th>
              <th style={rosterTh}>Rank (Wk 17)</th>
              <th style={rosterTh}>Team</th>
              <th style={rosterTh}>Female first</th>
              <th style={rosterTh}>Female last</th>
              <th style={rosterTh}>Male first</th>
              <th style={rosterTh}>Male last</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((t, idx) => (
              <tr key={idx} style={t.__dup ? { background: "#fff5f4" } : undefined}>
                <td style={rosterTd}>
                  <NumberSelect value={t.seed} max={Math.max(32, roster.length, ...roster.map((r) => r.seed || 0))} dup={t.__dup} onChange={(v) => onChange(idx, { seed: v })} />
                </td>
                <td style={rosterTd}>
                  <EditableText value={t.points ?? ""} align="right" width={70} onCommit={(v) => onChange(idx, { points: v === "" ? null : Number(v) })} />
                </td>
                <td style={rosterTd}>
                  <EditableText value={t.rank ?? ""} align="right" width={70} onCommit={(v) => onChange(idx, { rank: v === "" ? null : Number(v) })} />
                </td>
                <td style={{ ...rosterTd, fontWeight: 700 }}>{t.display}</td>
                <td style={rosterTd}><EditableText value={t.femaleFirst} onCommit={(v) => onChange(idx, { femaleFirst: v })} /></td>
                <td style={rosterTd}><EditableText value={t.femaleLast} onCommit={(v) => onChange(idx, { femaleLast: v })} /></td>
                <td style={rosterTd}><EditableText value={t.maleFirst} onCommit={(v) => onChange(idx, { maleFirst: v })} /></td>
                <td style={rosterTd}><EditableText value={t.maleLast} onCommit={(v) => onChange(idx, { maleLast: v })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {roster.length < 32 && (
        <div style={{ fontSize: 12, color: "#b0784a", marginTop: 10 }}>
          {roster.length} of 32 teams loaded — paste the full roster (or add the missing teams) to complete it.
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Club Bracket — chronological, read-only view. Games are listed in the
// exact order they're played (grouped by draw), each one showing where its
// winner advances to and where its loser drops to, so the whole path
// through the tournament is traceable draw by draw. Team pickers here are
// the same shared slots as the Draws tab, so filling one in fills the other.

function describeClubDestination(nodesById, val) {
  if (!val) return "🏆 Tournament champion";
  if (val === "Out") return "❌ Eliminated";
  if (typeof val === "string" && val.startsWith("Runner-up")) return `🥈 ${val}`;
  if (Array.isArray(val)) {
    return val.map((c) => describeClubDestination(nodesById, c)).join("  —or—  ");
  }
  if (typeof val === "object" && val.id) {
    const node = nodesById[val.id];
    if (!node) return val.id;
    return `${node.label} (slot ${val.slot}) · ${node.day} ${node.time} · Sheet ${node.sheet}`;
  }
  return String(val);
}

function TeamPool({ clubRoster, assignedNames }) {
  const remaining = clubRoster.filter((t) => !assignedNames.has(t.display)).length;
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 1px 3px rgba(20,30,40,0.08)", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#12202e" }}>Club teams</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#5b6672", background: "#eef1f4", padding: "3px 10px", borderRadius: 999 }}>
          {remaining} not yet placed in a G1 game
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {clubRoster.map((t) => {
          const placed = assignedNames.has(t.display);
          return (
            <span
              key={t.id}
              style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 999,
                background: placed ? "#f3f5f7" : "#eaf1fb",
                color: placed ? "#aab4bd" : "#1c5aa8",
                textDecoration: placed ? "line-through" : "none",
                fontWeight: 600,
              }}
            >
              {t.display}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WinnerRadio({ checked, onSelect, disabled, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: disabled ? "default" : "pointer" }}>
      <input type="radio" checked={!!checked} disabled={disabled} onChange={onSelect} style={{ accentColor: "#1c7a3d", width: 14, height: 14 }} />
      <span style={{ fontSize: 10.5, color: checked ? "#1c7a3d" : "#9aa5af", fontWeight: checked ? 700 : 500 }}>{label}</span>
    </label>
  );
}

function ClubBracketTab({ nodes, getSlot, setSlot, setClubTeam, setClubWinner, chooseClubLoserDestination, clearClubG1, clubTeams, clubRoster, isLocked }) {
  const nodesById = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const ordered = useMemo(() => {
    const drawIndex = {};
    DRAWS.forEach((d, i) => { drawIndex[d.id] = i; });
    return [...nodes].sort((a, b) => {
      const ia = drawIndex[a.drawId] ?? 999;
      const ib = drawIndex[b.drawId] ?? 999;
      if (ia !== ib) return ia - ib;
      return (a.sheet || 0) - (b.sheet || 0);
    });
  }, [nodes]);

  const groups = useMemo(() => {
    const byDraw = [];
    const seen = {};
    ordered.forEach((n) => {
      if (!seen[n.drawId]) {
        seen[n.drawId] = { drawId: n.drawId, draw: DRAWS.find((d) => d.id === n.drawId), items: [] };
        byDraw.push(seen[n.drawId]);
      }
      seen[n.drawId].items.push(n);
    });
    return byDraw;
  }, [ordered]);

  // which teams currently sit in a G1 slot, for the crossed-off pool above
  const assignedNames = useMemo(() => {
    const set = new Set();
    nodes.filter((n) => n.manual).forEach((n) => {
      const slot = getSlot(n.drawId, n.sheet);
      if (slot.teamA) set.add(slot.teamA);
      if (slot.teamB) set.add(slot.teamB);
    });
    return set;
  }, [nodes, getSlot]);

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 17, fontWeight: 800, color: "#12202e" }}>
        Club Bracket — chronological order
      </div>
      <div style={{ fontSize: 12.5, color: "#8a94a0", marginBottom: 16 }}>
        G1 games are set by hand from the roster below. Every game after that fills in automatically — pick the winner
        with the radio button and it advances into its next game (and the loser drops into its next game) on its own.
        If advancement ever gets a matchup wrong, check <strong>Override</strong> on that game to hand-pick the teams instead.
      </div>

      <TeamPool clubRoster={clubRoster} assignedNames={assignedNames} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.map((g) => (
          <div key={g.drawId}>
            <div style={{
              fontSize: 12.5, fontWeight: 800, color: "#5b6672", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ background: "#eef1f4", padding: "3px 10px", borderRadius: 999 }}>
                {g.draw ? `${g.draw.label} · ${g.draw.time}` : g.drawId}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {g.items.map((n) => {
                const slot = getSlot(n.drawId, n.sheet) || {};
                const locked = isLocked(n.drawId);
                const bothFilled = !!slot.teamA && !!slot.teamB;
                const isAmbiguousLoser = Array.isArray(n.loserTo);
                const editable = n.manual || slot.override;
                return (
                  <div key={n.id} style={{ border: "1px solid " + (slot.override ? "#e8b84b" : "#e3e8ee"), borderRadius: 10, padding: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#12202e" }}>{n.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {n.manual && (slot.teamA || slot.teamB) && !locked && (
                          <button
                            onClick={() => clearClubG1(n.id)}
                            title="Clear both teams from this G1 game"
                            style={{
                              fontSize: 10.5, fontWeight: 700, color: "#a33327", background: "#fdecea",
                              border: "1px solid #f3c6c1", borderRadius: 999, padding: "2px 8px", cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        )}
                        <span style={{ fontSize: 11, color: "#9aa5af" }}>Sheet {n.sheet}</span>
                      </div>
                    </div>
                    {n.bracket && (
                      <div style={{ fontSize: 10.5, color: "#8a94a0", marginBottom: 8 }}>{n.bracket}</div>
                    )}
                    {!n.manual && (
                      <label style={{
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: locked ? "default" : "pointer",
                        fontSize: 10.5, fontWeight: 700, color: slot.override ? "#8a5a00" : "#9aa5af",
                      }}>
                        <input
                          type="checkbox"
                          checked={!!slot.override}
                          disabled={locked}
                          onChange={(e) => setSlot(n.drawId, n.sheet, { override: e.target.checked })}
                          style={{ accentColor: "#e8b84b", width: 13, height: 13 }}
                        />
                        Override — hand-pick teams (use only if the advancement got it wrong)
                      </label>
                    )}

                    {/* Team A row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {editable ? (
                        <select
                          value={slot.teamA || ""}
                          disabled={locked}
                          onChange={(e) => setClubTeam(n.id, "teamA", e.target.value)}
                          style={{ ...selectStyle, flex: 1 }}
                        >
                          <option value="">Team A…</option>
                          {clubTeams.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <div style={{ flex: 1, fontSize: 12.5, color: slot.teamA ? "#22303e" : "#b0b8c0", fontWeight: slot.teamA ? 600 : 400 }}>
                          {slot.teamA || "TBD (advances automatically)"}
                        </div>
                      )}
                      <WinnerRadio
                        checked={slot.winnerSide === "A"}
                        disabled={locked || !bothFilled}
                        onSelect={() => setClubWinner(n.id, "A")}
                        label="Winner"
                      />
                    </div>

                    <div style={{ textAlign: "center", fontSize: 10.5, color: "#aab4bd", margin: "3px 0" }}>vs</div>

                    {/* Team B row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      {editable ? (
                        <select
                          value={slot.teamB || ""}
                          disabled={locked}
                          onChange={(e) => setClubTeam(n.id, "teamB", e.target.value)}
                          style={{ ...selectStyle, flex: 1 }}
                        >
                          <option value="">Team B…</option>
                          {clubTeams.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <div style={{ flex: 1, fontSize: 12.5, color: slot.teamB ? "#22303e" : "#b0b8c0", fontWeight: slot.teamB ? 600 : 400 }}>
                          {slot.teamB || "TBD (advances automatically)"}
                        </div>
                      )}
                      <WinnerRadio
                        checked={slot.winnerSide === "B"}
                        disabled={locked || !bothFilled}
                        onSelect={() => setClubWinner(n.id, "B")}
                        label="Winner"
                      />
                    </div>

                    <div style={{ marginTop: 6, paddingTop: 8, borderTop: "1px solid #eef1f4", fontSize: 11.5, lineHeight: 1.6 }}>
                      <div style={{ color: "#1c7a3d" }}>
                        <strong>Winner →</strong> {describeClubDestination(nodesById, n.winnerTo)}
                      </div>
                      <div style={{ color: "#a33327" }}>
                        <strong>Loser →</strong> {describeClubDestination(nodesById, n.loserTo)}
                      </div>
                      {isAmbiguousLoser && slot.winnerSide && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: "#8a94a0" }}>Send loser to:</span>
                          {n.loserTo.map((c) => (
                            <button
                              key={c.id}
                              disabled={locked}
                              onClick={() => chooseClubLoserDestination(n.id, c.id)}
                              style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, cursor: "pointer",
                                border: "1px solid " + (slot.loserChoice === c.id ? "#a33327" : "#d7dee5"),
                                background: slot.loserChoice === c.id ? "#fdecea" : "#fff",
                                color: slot.loserChoice === c.id ? "#a33327" : "#5b6672",
                              }}
                            >
                              {c.id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------

function BracketTab({ title, note, teams, nodes, advanceWinner, reassignNode, dropTeamOnNode }) {
  const rounds = [...new Set(nodes.map((n) => n.round))].sort((a, b) => a - b);
  const [dragTeam, setDragTeam] = useState(null);

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 17, fontWeight: 800, color: "#12202e" }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "#8a94a0", marginBottom: 16 }}>{note}</div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* team pool */}
        <div style={{ width: 190, background: "#fff", borderRadius: 12, padding: 12, height: "fit-content", boxShadow: "0 1px 3px rgba(20,30,40,0.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a0", marginBottom: 8, textTransform: "uppercase" }}>
            Drag onto Round 1
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 520, overflowY: "auto" }}>
            {teams.map((t) => (
              <div
                key={t}
                draggable
                onDragStart={() => setDragTeam(t)}
                style={{
                  padding: "6px 8px", background: "#f3f6f9", borderRadius: 6, fontSize: 12.5,
                  cursor: "grab", border: "1px solid #e3e8ee",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* rounds */}
        <div style={{ display: "flex", gap: 18, overflowX: "auto", flex: 1 }}>
          {rounds.map((r) => (
            <div key={r} style={{ minWidth: 230, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a0", textTransform: "uppercase", textAlign: "center" }}>
                Round {r}
              </div>
              {nodes.filter((n) => n.round === r).map((n) => (
                <BracketNode
                  key={n.id}
                  node={n}
                  onDrop={(side) => {
                    if (dragTeam) dropTeamOnNode(n.id, side, dragTeam);
                    setDragTeam(null);
                  }}
                  onWinner={(side) => advanceWinner(n.id, side)}
                  onReassign={(drawId, sheetId) => reassignNode(n.id, drawId, sheetId)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BracketNode({ node, onDrop, onWinner, onReassign }) {
  const draw = DRAWS.find((d) => d.id === node.drawId);
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 10, boxShadow: "0 1px 3px rgba(20,30,40,0.08)", border: node.winner ? "1px solid #b8e2c4" : "1px solid #e3e8ee" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#3a4552", marginBottom: 4 }}>{node.label}</div>

      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <select value={node.drawId} onChange={(e) => onReassign(e.target.value, node.sheetId)} style={{ fontSize: 10, flex: 1 }}>
          {DRAWS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <select value={node.sheetId} onChange={(e) => onReassign(node.drawId, Number(e.target.value))} style={{ fontSize: 10, width: 56 }}>
          {SHEETS.map((s) => <option key={s.id} value={s.id}>Sh{s.id}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 9.5, color: "#aab4bd", marginBottom: 6 }}>{draw?.time}</div>

      {["A", "B"].map((side) => {
        const teamName = side === "A" ? node.teamA : node.teamB;
        const isWinner = node.winner && node.winner === teamName;
        return (
          <div
            key={side}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(side)}
            onClick={() => teamName && node.teamA && node.teamB && !node.winner && onWinner(side)}
            style={{
              padding: "6px 8px", marginBottom: 4, borderRadius: 6, fontSize: 12,
              background: isWinner ? "#e5f7ea" : "#f7f9fb",
              border: "1px dashed #d7dee5", cursor: teamName ? "pointer" : "default",
              fontWeight: isWinner ? 700 : 500, color: isWinner ? "#1c7a3d" : "#33404b",
            }}
            title={node.teamA && node.teamB && !node.winner ? "Click to mark as winner" : ""}
          >
            {teamName || "— drop team —"}
          </div>
        );
      })}
      {node.winner && <div style={{ fontSize: 10, color: "#1c7a3d", fontWeight: 700 }}>Winner: {node.winner}</div>}
    </div>
  );
}
