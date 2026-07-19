/* ============================================================
   Evaluasi Mingguan — Pondok Pesantren Jalaluddin Ar-Rumi Jatisari
   Data tersimpan terpusat di Supabase (lihat js/config.js).
   ============================================================ */
const DAYS = ["Sabtu", "Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at"];
const DAY_SHORT = ["Sab", "Ahd", "Sen", "Sel", "Rab", "Kam", "Jum"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DIVISIONS = [
  { id: "pendidikan", name: "Pendidikan", icon: "📚", contoh: true },
  { id: "ubudiyah", name: "Ubudiyah", icon: "🕌", contoh: true },
  { id: "tahfidz", name: "Tahfidz", icon: "📖" },
  { id: "keamanan", name: "Keamanan", icon: "🛡️" },
  { id: "kesejahteraan", name: "Kesejahteraan", icon: "🤝" },
  { id: "kebersihan", name: "Kebersihan", icon: "🧹" },
  { id: "kesehatan", name: "Kesehatan", icon: "🩺" },
  { id: "sarpras", name: "Sarana dan Prasarana", icon: "🏗️" },
  { id: "kewaliasuhan", name: "Kewaliasuhan", icon: "👨‍👩‍👧‍👦" },
];

/* Hari aktif memakai urutan [Sabtu, Ahad, Senin, Selasa, Rabu, Kamis, Jum'at] */
const SEED_PROGRAMS = {
  ubudiyah: [
    { name: "Salat Jama'ah Subuh", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Salat Jama'ah Dhuhur", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Salat Jama'ah Ashar", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Salat Jama'ah Maghrib", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Salat Jama'ah Isya'", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Qiyamul Lail", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Salat Dhuha", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Rotibul Haddad", days: [1, 1, 1, 1, 1, 1, 1] },
    { name: "Pembacaan Tahlil", days: [0, 0, 0, 0, 0, 1, 0] },
  ],
  pendidikan: [
    { name: "Kegiatan Program", days: [1, 0, 1, 1, 1, 1, 0] },
    { name: "Metode Ummi", days: [1, 1, 1, 1, 1, 1, 0] },
    { name: "Metode Al-Fatih", days: [0, 1, 0, 0, 0, 0, 0] },
    { name: "Tahfidzul Hadits", days: [0, 1, 0, 0, 0, 0, 0] },
    { name: "Pengajian Kiai Faiz", days: [0, 0, 1, 0, 0, 0, 0] },
    { name: "Pengajian Pengasuh", days: [0, 0, 0, 0, 1, 0, 0] },
    { name: "Muhadoroh", days: [1, 0, 0, 0, 0, 0, 0] },
    { name: "Speak Up Learning", days: [0, 0, 0, 1, 0, 0, 0] },
  ],
};

const SESSION_KEY = "evaluasi-ja-session";

/* Akun bawaan: satu per divisi + admin pengurus harian.
   Kata sandi awal WAJIB diganti setelah login pertama (menu akun). */
function defaultAccounts() {
  const acc = {
    admin: {
      user: "admin",
      label: "Admin / Pengurus Harian",
      role: "admin",
      divId: null,
      plain: "admin2026",
    },
    sekretaris: {
      user: "sekretaris",
      label: "Sekretaris Pesantren",
      role: "sekretaris",
      divId: null,
      plain: "sekretaris2026",
    },
    pengasuh: {
      user: "pengasuh",
      label: "Pengasuh",
      role: "pengasuh",
      divId: null,
      plain: "pengasuh2026",
    },
  };
  for (const d of DIVISIONS) {
    acc[d.id] = {
      user: d.id,
      label: "Koordinator " + d.name,
      role: "koordinator",
      divId: d.id,
      plain: d.id + "2026", // kata sandi awal, mis. "pendidikan2026"
    };
  }
  return acc;
}

/* ---------------- Autentikasi ---------------- */

async function sha256(text) {
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return "plain:" + text; // fallback bila crypto.subtle tidak tersedia
}

async function verifyPassword(account, input) {
  if (account.hash) return (await sha256(input)) === account.hash;
  return input === account.plain;
}

function session() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
function setSession(s) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else sessionStorage.removeItem(SESSION_KEY);
}
function isAdmin() {
  return session()?.role === "admin";
}
function canEditDiv(divId) {
  const s = session();
  return !!s && (s.role === "admin" || s.divId === divId);
}
/* Catatan rapat evaluasi: admin & sekretaris pesantren */
function canEditWeekNotes() {
  const r = session()?.role;
  return r === "admin" || r === "sekretaris";
}
/* Catatan pengasuh pada program: pengasuh (dan admin) */
function canEditPengasuhNotes() {
  const r = session()?.role;
  return r === "admin" || r === "pengasuh";
}

/* ---------------- State (tersimpan di Supabase) ---------------- */

let state = null; // diisi oleh initData()
const loadedWeeks = new Set(); // minggu yang entri-nya sudah diambil dari server

function seedDivisions() {
  const divisions = {};
  for (const d of DIVISIONS) {
    divisions[d.id] = {
      coordinator: "",
      programs: (SEED_PROGRAMS[d.id] || []).map((p, i) => ({
        id: d.id + "-p" + (i + 1),
        name: p.name,
        days: p.days.slice(),
      })),
    };
  }
  return divisions;
}

/* ---------------- Lapisan Supabase (REST) ---------------- */

const SB_URL = window.SB_CONFIG.url.replace(/\/$/, "");
const SB_KEY = window.SB_CONFIG.anonKey;

async function sb(path, opts = {}) {
  const res = await fetch(SB_URL + path, {
    method: opts.method || "GET",
    headers: {
      apikey: SB_KEY,
      Authorization: "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      ...(opts.prefer ? { Prefer: opts.prefer } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error("HTTP " + res.status + " — " + txt.slice(0, 300));
    err.status = res.status;
    throw err;
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

function sbUpsert(table, rows, conflictCols) {
  return sb(`/${table}?on_conflict=${conflictCols}`, {
    method: "POST",
    body: Array.isArray(rows) ? rows : [rows],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

/* Muat data global (divisi + akun); jalankan seed bila tabel masih kosong. */
async function initData() {
  const [divRows, accRows] = await Promise.all([
    sb("/divisions?select=*"),
    sb("/accounts?select=*"),
  ]);

  state = {
    divisions: {},
    entries: {},
    weekNotes: {},
    pengasuhNotes: {},
    selectedDate: loadSelectedDate(),
  };

  for (const r of divRows)
    state.divisions[r.id] = {
      coordinator: r.coordinator || "",
      programs: r.programs || [],
    };
  const missingDivs = DIVISIONS.filter((d) => !state.divisions[d.id]);
  if (missingDivs.length) {
    const seed = seedDivisions();
    const rows = missingDivs.map((d) => ({
      id: d.id,
      coordinator: "",
      programs: seed[d.id].programs,
    }));
    await sbUpsert("divisions", rows, "id");
    for (const d of missingDivs) state.divisions[d.id] = seed[d.id];
  }

  state.accounts = {};
  for (const r of accRows)
    state.accounts[r.id] = {
      user: r.id,
      label: r.label,
      role: r.role,
      divId: r.div_id,
      plain: r.plain || undefined,
      hash: r.hash || undefined,
    };
  const defAcc = defaultAccounts();
  const missingAcc = Object.keys(defAcc).filter((id) => !state.accounts[id]);
  if (missingAcc.length) {
    const rows = missingAcc.map((id) => ({
      id,
      label: defAcc[id].label,
      role: defAcc[id].role,
      div_id: defAcc[id].divId,
      plain: defAcc[id].plain,
      hash: null,
    }));
    await sbUpsert("accounts", rows, "id");
    for (const id of missingAcc) state.accounts[id] = defAcc[id];
  }
}

/* Muat data satu minggu (entri, catatan rapat, catatan pengasuh). */
async function loadWeek(weekKey) {
  if (loadedWeeks.has(weekKey)) return;
  const q = "week_key=eq." + weekKey;
  const [entryRows, noteRows, pengRows] = await Promise.all([
    sb("/entries?select=*&" + q),
    sb("/week_notes?select=*&" + q),
    sb("/pengasuh_notes?select=*&" + q),
  ]);
  const ew = {};
  for (const r of entryRows) {
    if (!ew[r.div_id]) ew[r.div_id] = {};
    if (!ew[r.div_id][r.day_idx]) ew[r.div_id][r.day_idx] = {};
    ew[r.div_id][r.day_idx][r.prog_id] = {
      a: r.a,
      b: r.b,
      ket: r.ket,
      kendala: r.kendala,
      solusi: r.solusi,
      absen: r.absen,
    };
  }
  state.entries[weekKey] = ew;
  state.weekNotes[weekKey] = noteRows[0]?.notes || "";
  const pw = {};
  for (const r of pengRows) {
    if (!pw[r.div_id]) pw[r.div_id] = {};
    pw[r.div_id][r.prog_id] = r.note;
  }
  state.pengasuhNotes[weekKey] = pw;
  loadedWeeks.add(weekKey);
}

/* ---------------- Antrean sinkronisasi (debounce) ---------------- */

const syncQueue = new Map();
let syncTimer = null;

function queueSync(key, job) {
  syncQueue.set(key, job);
  const hint = $("#save-hint");
  if (hint) {
    hint.textContent = "Menyimpan…";
    hint.classList.remove("saved");
  }
  clearTimeout(syncTimer);
  syncTimer = setTimeout(flushSync, 600);
}

async function flushSync() {
  const jobs = [...syncQueue.values()];
  syncQueue.clear();
  if (!jobs.length) return;
  try {
    await Promise.all(jobs.map((j) => j()));
    const h = $("#save-hint");
    if (h) {
      h.textContent = "✓ Tersimpan ke server";
      h.classList.add("saved");
    }
  } catch (e) {
    console.error("Sinkronisasi gagal", e);
    const h = $("#save-hint");
    if (h) {
      h.textContent = "⚠️ Gagal menyimpan — periksa koneksi";
      h.classList.remove("saved");
    }
    toast("⚠️ Gagal menyimpan ke server: periksa koneksi internet");
  }
}

function syncEntry(weekKey, divId, dayIdx, progId) {
  const en = getEntry(weekKey, divId, dayIdx, progId);
  const row = {
    week_key: weekKey,
    div_id: divId,
    day_idx: dayIdx,
    prog_id: progId,
    a: en.a ?? "",
    b: en.b ?? "",
    ket: en.ket ?? "",
    kendala: en.kendala ?? "",
    solusi: en.solusi ?? "",
    absen: en.absen ?? "",
    updated_at: new Date().toISOString(),
  };
  queueSync(`entry:${weekKey}:${divId}:${dayIdx}:${progId}`, () =>
    sbUpsert("entries", row, "week_key,div_id,day_idx,prog_id"),
  );
}

function syncDivision(divId) {
  const d = state.divisions[divId];
  const row = {
    id: divId,
    coordinator: d.coordinator || "",
    programs: d.programs,
  };
  queueSync("division:" + divId, () => sbUpsert("divisions", row, "id"));
}

function syncWeekNotes(weekKey) {
  const row = { week_key: weekKey, notes: state.weekNotes[weekKey] || "" };
  queueSync("week_notes:" + weekKey, () =>
    sbUpsert("week_notes", row, "week_key"),
  );
}

function syncPengasuhNote(weekKey, divId, progId) {
  const note = getPengasuhNote(weekKey, divId, progId);
  const key = `pengasuh:${weekKey}:${divId}:${progId}`;
  if (note) {
    queueSync(key, () =>
      sbUpsert(
        "pengasuh_notes",
        { week_key: weekKey, div_id: divId, prog_id: progId, note },
        "week_key,div_id,prog_id",
      ),
    );
  } else {
    queueSync(key, () =>
      sb(
        `/pengasuh_notes?week_key=eq.${weekKey}&div_id=eq.${divId}&prog_id=eq.${progId}`,
        { method: "DELETE" },
      ),
    );
  }
}

function syncAccount(id) {
  const a = state.accounts[id];
  return sbUpsert(
    "accounts",
    {
      id,
      label: a.label,
      role: a.role,
      div_id: a.divId,
      plain: a.plain ?? null,
      hash: a.hash ?? null,
    },
    "id",
  );
}

/* Tanggal terpilih hanya preferensi tampilan — cukup di perangkat ini. */
function loadSelectedDate() {
  return localStorage.getItem("evaluasi-ja-date") || todayISO();
}
function saveSelectedDate() {
  localStorage.setItem("evaluasi-ja-date", state.selectedDate);
}

/* ---------------- Tanggal & minggu ---------------- */

function todayISO() {
  const d = new Date();
  return toISO(d);
}
function toISO(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function fromISO(s) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
}
/* Minggu pesantren dimulai hari Sabtu. */
function weekStartOf(dateStr) {
  const d = fromISO(dateStr);
  const offset = (d.getDay() + 1) % 7; // Sabtu(6)->0, Ahad(0)->1, ... Jum'at(5)->6
  d.setDate(d.getDate() - offset);
  return d;
}
function weekKeyOf(dateStr) {
  return toISO(weekStartOf(dateStr));
}
function weekLabel(weekKey) {
  const start = fromISO(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const n = Math.floor((start.getDate() - 1) / 7) + 1;
  const range =
    fmtShort(start) + " – " + fmtShort(end) + " " + end.getFullYear();
  return {
    title:
      "Minggu ke-" +
      n +
      " " +
      MONTHS[start.getMonth()] +
      " " +
      start.getFullYear(),
    range,
  };
}
function fmtShort(d) {
  return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3);
}
function dayDate(weekKey, i) {
  const d = fromISO(weekKey);
  d.setDate(d.getDate() + i);
  return d;
}
function fmtLong(d) {
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

/* ---------------- Akses data entri ---------------- */

function getEntry(weekKey, divId, dayIdx, progId) {
  return state.entries?.[weekKey]?.[divId]?.[dayIdx]?.[progId] || {};
}
function setEntryField(weekKey, divId, dayIdx, progId, field, value) {
  if (!canEditDiv(divId)) return; // pengaman: hanya koordinator/admin
  const e = state.entries;
  if (!e[weekKey]) e[weekKey] = {};
  if (!e[weekKey][divId]) e[weekKey][divId] = {};
  if (!e[weekKey][divId][dayIdx]) e[weekKey][divId][dayIdx] = {};
  if (!e[weekKey][divId][dayIdx][progId])
    e[weekKey][divId][dayIdx][progId] = {};
  e[weekKey][divId][dayIdx][progId][field] = value;
  syncEntry(weekKey, divId, dayIdx, progId);
}
function getPengasuhNote(weekKey, divId, progId) {
  return state.pengasuhNotes?.[weekKey]?.[divId]?.[progId] || "";
}
function setPengasuhNote(weekKey, divId, progId, value) {
  if (!canEditPengasuhNotes()) return;
  const n = state.pengasuhNotes;
  if (!n[weekKey]) n[weekKey] = {};
  if (!n[weekKey][divId]) n[weekKey][divId] = {};
  if (value) n[weekKey][divId][progId] = value;
  else delete n[weekKey][divId][progId];
  syncPengasuhNote(weekKey, divId, progId);
}

function entryFilled(en) {
  return (
    en &&
    ((en.a !== undefined && en.a !== "") || (en.b !== undefined && en.b !== ""))
  );
}

/* Statistik divisi untuk satu minggu */
function divisionStats(weekKey, divId) {
  const div = state.divisions[divId];
  let active = 0,
    filled = 0,
    sumA = 0,
    nA = 0,
    sumB = 0,
    nB = 0,
    kendala = 0;
  for (const p of div.programs) {
    p.days.forEach((on, di) => {
      if (!on) return;
      active++;
      const en = getEntry(weekKey, divId, di, p.id);
      if (entryFilled(en)) filled++;
      if (en.a !== undefined && en.a !== "") {
        sumA += Number(en.a);
        nA++;
      }
      if (en.b !== undefined && en.b !== "") {
        sumB += Number(en.b);
        nB++;
      }
      if (en.kendala) kendala++;
    });
  }
  return {
    active,
    filled,
    kendala,
    pct: active ? Math.round((filled / active) * 100) : 0,
    avgA: nA ? sumA / nA : null,
    avgB: nB ? sumB / nB : null,
  };
}

/* ---------------- Util ---------------- */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function fmtNum(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.hidden = true;
  }, 2600);
}

/* ---------------- Router ---------------- */

function currentWeekKey() {
  return weekKeyOf(state.selectedDate);
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", async () => {
  bindGlobal();
  const app = $("#app");
  app.innerHTML = `<div class="empty-state"><div class="big">⏳</div><p>Memuat data dari server…</p></div>`;
  try {
    await initData();
    await render();
  } catch (e) {
    console.error("Gagal memuat data awal", e);
    const isMissingTable = e.status === 404 || /PGRST205|schema cache/.test(e.message);
    app.innerHTML = `<div class="card"><div class="empty-state">
      <div class="big">⚠️</div>
      <p><b>Tidak dapat terhubung ke database.</b><br>
      ${
        isMissingTable
          ? "Tabel database belum dibuat. Jalankan isi file <code>supabase-setup.sql</code> di Supabase Dashboard → SQL Editor, lalu muat ulang halaman ini."
          : "Periksa koneksi internet Anda, lalu muat ulang halaman."
      }</p>
      <button class="btn btn-primary" onclick="location.reload()">🔄 Muat Ulang</button>
    </div></div>`;
  }
});

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "divisi" && parts[1]) {
    return {
      page: "divisi",
      divId: parts[1],
      tab: parts[2] || "harian",
      day: parts[3],
    };
  }
  if (parts[0] === "evaluasi") return { page: "evaluasi" };
  return { page: "dashboard" };
}

async function render() {
  if (!state) return; // initData belum selesai
  const route = parseRoute();
  updateAuthUI();
  $$(".mainnav a").forEach((a) =>
    a.classList.toggle(
      "active",
      (route.page === "dashboard" && a.dataset.nav === "dashboard") ||
        (route.page === "evaluasi" && a.dataset.nav === "evaluasi"),
    ),
  );
  const app = $("#app");
  const wk = currentWeekKey();
  if (!loadedWeeks.has(wk)) {
    app.innerHTML = `<div class="empty-state"><div class="big">⏳</div><p>Memuat data minggu…</p></div>`;
    try {
      await loadWeek(wk);
    } catch (e) {
      console.error("Gagal memuat data minggu", e);
      app.innerHTML = `<div class="card"><div class="empty-state"><div class="big">⚠️</div>
        <p><b>Gagal memuat data minggu ini.</b><br>Periksa koneksi internet lalu coba lagi.</p>
        <button class="btn btn-primary" onclick="location.reload()">🔄 Muat Ulang</button></div></div>`;
      return;
    }
  }
  if (route.page === "divisi") {
    const div = DIVISIONS.find((d) => d.id === route.divId);
    if (!div) {
      location.hash = "#/";
      return;
    }
    if (route.tab === "program" && !canEditDiv(div.id)) {
      location.hash = `#/divisi/${div.id}/harian`;
      return;
    }
    app.innerHTML = viewDivision(div, route);
    bindDivision(div, route);
  } else if (route.page === "evaluasi") {
    app.innerHTML = viewEvaluasi();
    bindEvaluasi();
  } else {
    app.innerHTML = viewDashboard();
    bindDashboard();
  }
  window.scrollTo(0, 0);
}

/* ---------------- Komponen bersama ---------------- */

function weekPickerHTML() {
  const wk = currentWeekKey();
  const { title, range } = weekLabel(wk);
  return `
    <div class="week-picker">
      <label for="week-date">Pilih tanggal:</label>
      <input type="date" id="week-date" value="${state.selectedDate}">
      <span class="week-label">${title} <small style="font-weight:400;color:var(--muted)">(${range})</small></span>
    </div>`;
}
function bindWeekPicker() {
  const inp = $("#week-date");
  if (!inp) return;
  inp.addEventListener("change", () => {
    if (!inp.value) return;
    state.selectedDate = inp.value;
    saveSelectedDate();
    render();
  });
}

/* ---------------- Dashboard ---------------- */

function viewDashboard() {
  const wk = currentWeekKey();
  const cards = DIVISIONS.map((d) => {
    const st = divisionStats(wk, d.id);
    const nProg = state.divisions[d.id].programs.length;
    const coord = state.divisions[d.id].coordinator;
    return `
      <a class="division-card" href="#/divisi/${d.id}">
        <span class="icon">${d.icon}</span>
        <h3>Divisi ${esc(d.name)}</h3>
        <div class="meta">
          ${nProg ? nProg + " program" : '<span class="badge badge-empty">Belum ada program</span>'}
          ${coord ? " · Koord: " + esc(coord) : ""}
        </div>
        ${
          nProg
            ? `
          <div class="progressbar"><i style="width:${st.pct}%"></i></div>
          <div class="progress-row">
            <span>Terisi ${st.filled}/${st.active}</span>
            <span>${st.avgA !== null ? "Rata-rata A: " + fmtNum(st.avgA) + "%" : ""}</span>
          </div>`
            : `
          <div class="progress-row"><span>Koordinator divisi dapat menambahkan program</span></div>`
        }
      </a>`;
  }).join("");

  return `
    <div class="page-head">
      <div>
        <h1>Dashboard Divisi</h1>
        <div class="sub">Laporan program kerja harian &amp; mingguan — pekan dimulai hari <b>Sabtu</b>.</div>
      </div>
      ${weekPickerHTML()}
    </div>
    <div class="division-grid">${cards}</div>`;
}

function bindDashboard() {
  bindWeekPicker();
}

/* ---------------- Halaman divisi ---------------- */

function viewDivision(div, route) {
  const tab = route.tab;
  const tabDefs = [
    ["harian", "📝 Laporan Harian"],
    ["mingguan", "📊 Rekap Mingguan"],
  ];
  if (canEditDiv(div.id)) tabDefs.push(["program", "⚙️ Kelola Program"]);
  const tabs = tabDefs
    .map(
      ([id, label]) =>
        `<button class="tab ${tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`,
    )
    .join("");

  let body = "";
  if (tab === "harian") body = viewHarian(div, route);
  else if (tab === "mingguan") body = viewMingguan(div);
  else body = viewProgram(div);

  return `
    <div class="page-head">
      <div>
        <a href="#/" class="back-link">← Kembali ke Dashboard</a>
        <h1>${div.icon} Divisi ${esc(div.name)}</h1>
      </div>
      ${weekPickerHTML()}
    </div>
    <div class="tabs">${tabs}</div>
    ${body}`;
}

function bindDivision(div, route) {
  bindWeekPicker();
  $$(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = `#/divisi/${div.id}/${b.dataset.tab}`;
    }),
  );
  if (route.tab === "harian") bindHarian(div, route);
  else if (route.tab === "mingguan") bindMingguan(div);
  else bindProgram(div);
}

/* ----- Tab: Laporan Harian ----- */

function activeDayIdx(route) {
  const n = Number(route.day);
  if (!Number.isNaN(n) && n >= 0 && n <= 6 && route.day !== undefined) return n;
  // default: hari ini bila masuk minggu terpilih, kalau tidak Sabtu
  const wk = currentWeekKey();
  const today = todayISO();
  for (let i = 0; i < 7; i++) if (toISO(dayDate(wk, i)) === today) return i;
  return 0;
}

function viewHarian(div, route) {
  const wk = currentWeekKey();
  const di = activeDayIdx(route);
  const divData = state.divisions[div.id];
  const progs = divData.programs.filter((p) => p.days[di]);

  const chips = DAYS.map((d, i) => {
    const date = dayDate(wk, i);
    const anyProg = divData.programs.some((p) => p.days[i]);
    const anyFilled = divData.programs.some(
      (p) => p.days[i] && entryFilled(getEntry(wk, div.id, i, p.id)),
    );
    return `
      <button class="day-chip ${i === di ? "active" : ""} ${anyFilled ? "filled" : ""}" data-day="${i}" ${anyProg ? "" : 'title="Tidak ada program terjadwal"'}>
        <strong>${d}</strong><small>${date.getDate()}/${date.getMonth() + 1}</small>
      </button>`;
  }).join("");

  const editable = canEditDiv(div.id);

  if (!divData.programs.length) {
    return `${`<div class="day-chips">${chips}</div>`}
      <div class="card"><div class="empty-state">
        <div class="big">${div.icon}</div>
        <p><b>Divisi ${esc(div.name)} belum memiliki program.</b><br>
        ${
          editable
            ? "Susun daftar program kerja terlebih dahulu di tab <b>Kelola Program</b>."
            : "Koordinator divisi belum menyusun daftar program kerja."
        }</p>
        ${editable ? '<button class="btn btn-primary" id="goto-program">⚙️ Kelola Program Sekarang</button>' : ""}
      </div></div>`;
  }

  const date = dayDate(wk, di);

  /* Tampilan publik: data statis (baca-saja) */
  if (!editable) {
    const staticRows = progs
      .map((p, idx) => {
        const en = getEntry(wk, div.id, di, p.id);
        return `<tr>
        <td>${idx + 1}</td>
        <td class="prog-name">${esc(p.name)}</td>
        <td>${en.a !== undefined && en.a !== "" ? fmtNum(en.a) : ""}</td>
        <td>${en.b !== undefined && en.b !== "" ? fmtNum(en.b) : ""}</td>
        <td style="text-align:left">${esc(en.ket)}</td>
        <td style="text-align:left">${esc(en.kendala)}</td>
        <td style="text-align:left">${esc(en.solusi)}</td>
        <td style="text-align:left">${esc(en.absen)}</td>
      </tr>`;
      })
      .join("");
    return `
      <div class="day-chips">${chips}</div>
      <div class="card">
        <div class="page-head" style="margin-bottom:10px">
          <div>
            <h2>Laporan Harian — ${DAYS[di]}, ${fmtLong(date)}</h2>
            <div class="sub">Tampilan publik (baca-saja). Pengisian hanya oleh Koordinator ${esc(div.name)} setelah <b>masuk akun</b>.</div>
          </div>
          <div class="toolbar">
            <button class="btn btn-outline" id="btn-print-daily">🖨️ Cetak Harian</button>
          </div>
        </div>
        ${
          progs.length
            ? `
        <div class="table-wrap">
          <table class="recap">
            <thead>
              <tr><th rowspan="2">No</th><th rowspan="2">Program</th><th colspan="2">Prosentase</th>
                  <th rowspan="2">Keterangan</th><th rowspan="2">Kendala</th><th rowspan="2">Solusi/Langkah Konkrit</th>
                  <th rowspan="2">Santri Tidak Mengikuti</th></tr>
              <tr><th>A (%)</th><th>B (%)</th></tr>
            </thead>
            <tbody>${staticRows}</tbody>
          </table>
        </div>`
            : `<div class="empty-state"><div class="big">😴</div><p>Tidak ada program terjadwal pada hari ${DAYS[di]}.</p></div>`
        }
      </div>`;
  }
  const rows = progs
    .map((p, idx) => {
      const en = getEntry(wk, div.id, di, p.id);
      return `
      <div class="program-entry" data-prog="${p.id}">
        <div class="program-entry-head">
          <h4>${idx + 1}. ${esc(p.name)}</h4>
          <div class="pct-inputs">
            <div class="pct-field">
              <label title="Kuantitatif">A</label>
              <input type="number" min="0" max="100" inputmode="numeric" data-field="a" value="${en.a ?? ""}" placeholder="0"><span>%</span>
            </div>
            <div class="pct-field">
              <label title="Kualitatif">B</label>
              <input type="number" min="0" max="100" inputmode="numeric" data-field="b" value="${en.b ?? ""}" placeholder="0"><span>%</span>
            </div>
          </div>
        </div>
        <div class="entry-fields">
          <div class="field"><label>Keterangan</label><textarea data-field="ket">${esc(en.ket)}</textarea></div>
          <div class="field"><label>Kendala</label><textarea data-field="kendala">${esc(en.kendala)}</textarea></div>
          <div class="field"><label>Solusi / Langkah Konkrit</label><textarea data-field="solusi">${esc(en.solusi)}</textarea></div>
          <div class="field"><label>Nama Santri yang Tidak Mengikuti Kegiatan</label><textarea data-field="absen">${esc(en.absen)}</textarea></div>
        </div>
      </div>`;
    })
    .join("");

  return `
    <div class="day-chips">${chips}</div>
    <div class="card">
      <div class="page-head" style="margin-bottom:10px">
        <div>
          <h2>Laporan Harian — ${DAYS[di]}, ${fmtLong(date)}</h2>
          <div class="sub">Prosentase: <b>A</b> = Kuantitatif (kehadiran) · <b>B</b> = Kualitatif (mutu pelaksanaan). Isian tersimpan otomatis.</div>
        </div>
        <div class="toolbar">
          <span class="save-hint" id="save-hint"></span>
          <button class="btn btn-outline" id="btn-print-daily">🖨️ Cetak Harian</button>
        </div>
      </div>
      ${progs.length ? rows : `<div class="empty-state"><div class="big">😴</div><p>Tidak ada program terjadwal pada hari ${DAYS[di]}.</p></div>`}
    </div>`;
}

function bindHarian(div, route) {
  const wk = currentWeekKey();
  const di = activeDayIdx(route);
  $$(".day-chip").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = `#/divisi/${div.id}/harian/${b.dataset.day}`;
    }),
  );
  const goto = $("#goto-program");
  if (goto)
    goto.addEventListener("click", () => {
      location.hash = `#/divisi/${div.id}/program`;
    });

  $$(".program-entry").forEach((card) => {
    const progId = card.dataset.prog;
    $$("input,textarea", card).forEach((inp) => {
      inp.addEventListener("input", () => {
        let v = inp.value;
        if (inp.type === "number" && v !== "") {
          let n = Math.max(0, Math.min(100, Number(v)));
          if (String(n) !== v) {
            inp.value = n;
          }
          v = String(n);
        }
        setEntryField(wk, div.id, di, progId, inp.dataset.field, v);
      });
    });
  });

  const btnPrint = $("#btn-print-daily");
  if (btnPrint)
    btnPrint.addEventListener("click", () => printDaily(div, wk, di));
}

/* ----- Tab: Rekap Mingguan ----- */

function viewMingguan(div) {
  const wk = currentWeekKey();
  const divData = state.divisions[div.id];
  if (!divData.programs.length) {
    return `<div class="card"><div class="empty-state">
      <div class="big">${div.icon}</div>
      <p><b>Belum ada program untuk direkap.</b><br>Tambahkan program di tab Kelola Program.</p>
    </div></div>`;
  }

  const headDays = DAYS.map((d) => `<th colspan="2">${d}</th>`).join("");
  const headAB = DAYS.map(() => "<th>A</th><th>B</th>").join("");

  const rows = divData.programs
    .map((p, i) => {
      let sumA = 0,
        nA = 0,
        sumB = 0,
        nB = 0;
      const cells = DAYS.map((_, dIdx) => {
        if (!p.days[dIdx]) return '<td class="na">–</td><td class="na">–</td>';
        const en = getEntry(wk, div.id, dIdx, p.id);
        if (en.a !== undefined && en.a !== "") {
          sumA += Number(en.a);
          nA++;
        }
        if (en.b !== undefined && en.b !== "") {
          sumB += Number(en.b);
          nB++;
        }
        return `<td>${en.a !== undefined && en.a !== "" ? fmtNum(en.a) : ""}</td><td>${en.b !== undefined && en.b !== "" ? fmtNum(en.b) : ""}</td>`;
      }).join("");
      const avgA = nA ? sumA / nA : null,
        avgB = nB ? sumB / nB : null;
      return `<tr>
      <td>${i + 1}</td><td class="prog-name">${esc(p.name)}</td>${cells}
      <td class="avg">${fmtNum(avgA)}</td><td class="avg">${fmtNum(avgB)}</td>
    </tr>`;
    })
    .join("");

  // catatan kendala sepanjang minggu
  const issues = [];
  divData.programs.forEach((p) => {
    DAYS.forEach((dName, dIdx) => {
      if (!p.days[dIdx]) return;
      const en = getEntry(wk, div.id, dIdx, p.id);
      if (en.kendala || en.absen) {
        issues.push({
          day: dName,
          prog: p.name,
          kendala: en.kendala,
          solusi: en.solusi,
          absen: en.absen,
        });
      }
    });
  });

  const st = divisionStats(wk, div.id);

  return `
    <div class="card">
      <div class="page-head" style="margin-bottom:10px">
        <div>
          <h2>Rekap Mingguan</h2>
          <div class="sub">Terisi otomatis dari laporan harian. <b>A</b> Kuantitatif · <b>B</b> Kualitatif (%).</div>
        </div>
        <div class="toolbar">
          <button class="btn btn-primary" id="btn-print-weekly">🖨️ Cetak Form Mingguan</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="recap">
          <thead>
            <tr><th rowspan="2">No</th><th rowspan="2">Program</th>${headDays}<th colspan="2">Rata-rata</th></tr>
            <tr>${headAB}<th>A</th><th>B</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="progress-row" style="margin-top:10px">
        <span>Kelengkapan pengisian: <b>${st.pct}%</b> (${st.filled}/${st.active} sel)</span>
        <span>Rata-rata minggu ini — A: <b>${fmtNum(st.avgA)}%</b> · B: <b>${fmtNum(st.avgB)}%</b></span>
      </div>
    </div>

    <div class="card">
      <h2>Kendala &amp; Tindak Lanjut Minggu Ini</h2>
      <div class="sub">Dirangkum dari isian kendala dan santri yang tidak mengikuti kegiatan.</div>
      ${
        issues.length
          ? `<ul class="kendala-list">${issues
              .map(
                (it) => `
        <li>
          <span class="who">${it.day} · ${esc(it.prog)}</span>
          ${it.kendala ? `<b>Kendala:</b> ${esc(it.kendala)}<br>` : ""}
          ${it.solusi ? `<b>Solusi:</b> ${esc(it.solusi)}<br>` : ""}
          ${it.absen ? `<b>Tidak mengikuti:</b> ${esc(it.absen)}` : ""}
        </li>`,
              )
              .join("")}</ul>`
          : '<p class="sub" style="margin:0">Tidak ada kendala tercatat pada minggu ini. 🎉</p>'
      }
    </div>

    ${viewPengasuhNotes(div, wk)}`;
}

/* Kartu "Catatan Pengasuh" per program (tab Rekap Mingguan) */
function viewPengasuhNotes(div, wk) {
  const divData = state.divisions[div.id];
  const editable = canEditPengasuhNotes();
  if (editable) {
    const rows = divData.programs
      .map(
        (p) => `
      <div class="field" style="margin-bottom:10px">
        <label>${esc(p.name)}</label>
        <textarea class="pengasuh-note" data-prog="${p.id}" placeholder="Catatan pengasuh untuk program ini…">${esc(getPengasuhNote(wk, div.id, p.id))}</textarea>
      </div>`,
      )
      .join("");
    return `
      <div class="card">
        <div class="page-head" style="margin-bottom:10px">
          <div>
            <h2>🖋️ Catatan Pengasuh</h2>
            <div class="sub">Arahan/catatan langsung dari Pengasuh untuk tiap program divisi ini, berlaku untuk minggu terpilih. Tersimpan otomatis.</div>
          </div>
          <span class="save-hint" id="save-hint"></span>
        </div>
        ${rows}
      </div>`;
  }
  const notes = divData.programs
    .map((p) => ({ name: p.name, note: getPengasuhNote(wk, div.id, p.id) }))
    .filter((x) => x.note);
  return `
    <div class="card">
      <h2>🖋️ Catatan Pengasuh</h2>
      <div class="sub">Arahan langsung dari Pengasuh untuk program divisi ini pada minggu terpilih.</div>
      ${
        notes.length
          ? `<ul class="pengasuh-list">${notes
              .map(
                (x) => `
        <li><span class="who">${esc(x.name)}</span>${esc(x.note)}</li>`,
              )
              .join("")}</ul>`
          : '<p class="sub" style="margin:0">Belum ada catatan dari Pengasuh untuk minggu ini.</p>'
      }
    </div>`;
}

function bindMingguan(div) {
  const btn = $("#btn-print-weekly");
  if (btn)
    btn.addEventListener("click", () => printWeekly(div, currentWeekKey()));
  const wk = currentWeekKey();
  $$(".pengasuh-note").forEach((ta) =>
    ta.addEventListener("input", () => {
      setPengasuhNote(wk, div.id, ta.dataset.prog, ta.value);
    }),
  );
}

/* ----- Tab: Kelola Program ----- */

function viewProgram(div) {
  const divData = state.divisions[div.id];
  const rows = divData.programs
    .map(
      (p, i) => `
    <tr data-prog="${p.id}">
      <td>${i + 1}</td>
      <td><input type="text" class="prog-name-input" value="${esc(p.name)}" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font:inherit"></td>
      <td>
        <div class="day-checks">
          ${DAY_SHORT.map(
            (d, dIdx) => `
            <label><input type="checkbox" data-day="${dIdx}" ${p.days[dIdx] ? "checked" : ""}>${d}</label>`,
          ).join("")}
        </div>
      </td>
      <td><button class="btn btn-danger btn-sm btn-del">Hapus</button></td>
    </tr>`,
    )
    .join("");

  return `
    <div class="card">
      <h2>Identitas Divisi</h2>
      <div class="sub">Nama koordinator akan tercantum pada form cetak.</div>
      <div class="coordinator-inline">
        <label for="coord-name"><b>Koordinator Divisi:</b></label>
        <input type="text" id="coord-name" placeholder="Nama koordinator…" value="${esc(divData.coordinator)}">
      </div>
    </div>

    <div class="card">
      <div class="page-head" style="margin-bottom:10px">
        <div>
          <h2>Daftar Program Kerja</h2>
          <div class="sub">${
            div.contoh
              ? "Program divisi ini sudah diisi sesuai form contoh. Koordinator tetap dapat mengubah atau menambah."
              : "Silakan koordinator divisi menyusun program kerja beserta hari pelaksanaannya."
          }</div>
        </div>
      </div>
      ${
        divData.programs.length
          ? `
      <div class="table-wrap">
        <table class="prog-table">
          <thead><tr><th style="width:36px">No</th><th>Nama Program</th><th>Hari Pelaksanaan</th><th style="width:80px"></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
          : `<div class="empty-state"><div class="big">📋</div><p>Belum ada program. Tambahkan program pertama di bawah ini.</p></div>`
      }

      <hr style="border:none;border-top:1px solid var(--line);margin:16px 0">
      <h2 style="font-size:1rem">➕ Tambah Program Baru</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px">
        <input type="text" id="new-prog-name" placeholder="Nama program…" style="flex:1;min-width:200px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit">
        <div class="day-checks" id="new-prog-days">
          ${DAY_SHORT.map((d, dIdx) => `<label><input type="checkbox" data-day="${dIdx}" checked>${d}</label>`).join("")}
        </div>
        <button class="btn btn-primary" id="btn-add-prog">Tambah</button>
      </div>
    </div>`;
}

function bindProgram(div) {
  const divData = state.divisions[div.id];

  $("#coord-name").addEventListener("input", (e) => {
    divData.coordinator = e.target.value;
    syncDivision(div.id);
  });

  $$("tr[data-prog]").forEach((tr) => {
    const prog = divData.programs.find((p) => p.id === tr.dataset.prog);
    if (!prog) return;
    $(".prog-name-input", tr).addEventListener("input", (e) => {
      prog.name = e.target.value;
      syncDivision(div.id);
    });
    $$('input[type="checkbox"]', tr).forEach((cb) =>
      cb.addEventListener("change", () => {
        prog.days[Number(cb.dataset.day)] = cb.checked ? 1 : 0;
        syncDivision(div.id);
      }),
    );
    $(".btn-del", tr).addEventListener("click", () => {
      if (
        !confirm(
          `Hapus program "${prog.name}"?\nData laporan program ini tidak akan tampil lagi.`,
        )
      )
        return;
      divData.programs = divData.programs.filter((p) => p.id !== prog.id);
      syncDivision(div.id);
      render();
      toast("Program dihapus");
    });
  });

  $("#btn-add-prog").addEventListener("click", () => {
    const nameInp = $("#new-prog-name");
    const name = nameInp.value.trim();
    if (!name) {
      toast("Isi nama program terlebih dahulu");
      nameInp.focus();
      return;
    }
    const days = $$("#new-prog-days input").map((cb) => (cb.checked ? 1 : 0));
    if (!days.some(Boolean)) {
      toast("Pilih minimal satu hari pelaksanaan");
      return;
    }
    divData.programs.push({ id: div.id + "-" + Date.now(), name, days });
    syncDivision(div.id);
    render();
    toast('Program "' + name + '" ditambahkan');
  });
}

/* ---------------- Evaluasi Mingguan (semua divisi) ---------------- */

function viewEvaluasi() {
  const wk = currentWeekKey();
  const { title } = weekLabel(wk);

  let totA = 0,
    nA = 0,
    totB = 0,
    nB = 0,
    totKendala = 0,
    aktif = 0;
  const rows = DIVISIONS.map((d) => {
    const st = divisionStats(wk, d.id);
    const nProg = state.divisions[d.id].programs.length;
    if (nProg) aktif++;
    if (st.avgA !== null) {
      totA += st.avgA;
      nA++;
    }
    if (st.avgB !== null) {
      totB += st.avgB;
      nB++;
    }
    totKendala += st.kendala;
    return `<tr>
      <td class="prog-name">${d.icon} ${esc(d.name)}</td>
      <td>${nProg || "—"}</td>
      <td>${nProg ? st.pct + "%" : "—"}</td>
      <td>${fmtNum(st.avgA)}</td>
      <td>${fmtNum(st.avgB)}</td>
      <td>${st.kendala || "—"}</td>
      <td><a class="back-link" href="#/divisi/${d.id}/mingguan">Lihat rekap →</a></td>
    </tr>`;
  }).join("");

  const allIssues = [];
  for (const d of DIVISIONS) {
    for (const p of state.divisions[d.id].programs) {
      DAYS.forEach((dName, dIdx) => {
        if (!p.days[dIdx]) return;
        const en = getEntry(wk, d.id, dIdx, p.id);
        if (en.kendala)
          allIssues.push({
            div: d.name,
            day: dName,
            prog: p.name,
            kendala: en.kendala,
            solusi: en.solusi,
          });
      });
    }
  }

  return `
    <div class="page-head">
      <div>
        <h1>Evaluasi Mingguan Gabungan</h1>
        <div class="sub">${title} — ringkasan seluruh divisi untuk rapat evaluasi.</div>
      </div>
      ${weekPickerHTML()}
    </div>

    <div class="summary-grid">
      <div class="stat-card"><div class="label">Divisi dengan program</div><div class="value">${aktif} / ${DIVISIONS.length}</div></div>
      <div class="stat-card"><div class="label">Rata-rata Kuantitatif (A)</div><div class="value">${nA ? fmtNum(totA / nA) + "%" : "—"}</div></div>
      <div class="stat-card"><div class="label">Rata-rata Kualitatif (B)</div><div class="value">${nB ? fmtNum(totB / nB) + "%" : "—"}</div></div>
      <div class="stat-card"><div class="label">Kendala tercatat</div><div class="value">${totKendala}</div></div>
    </div>

    <div class="card">
      <div class="page-head" style="margin-bottom:10px">
        <h2>Ringkasan per Divisi</h2>
        <button class="btn btn-primary" id="btn-print-eval">🖨️ Cetak Evaluasi</button>
      </div>
      <div class="table-wrap">
        <table class="recap">
          <thead><tr><th>Divisi</th><th>Program</th><th>Kelengkapan</th><th>Rata-rata A (%)</th><th>Rata-rata B (%)</th><th>Kendala</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Daftar Kendala Semua Divisi</h2>
      ${
        allIssues.length
          ? `<ul class="kendala-list">${allIssues
              .map(
                (it) => `
        <li><span class="who">Divisi ${esc(it.div)} · ${it.day} · ${esc(it.prog)}</span>
        <b>Kendala:</b> ${esc(it.kendala)}${it.solusi ? `<br><b>Solusi:</b> ${esc(it.solusi)}` : ""}</li>`,
              )
              .join("")}</ul>`
          : '<p class="sub" style="margin:0">Belum ada kendala tercatat minggu ini.</p>'
      }
    </div>

    <div class="card">
      <h2>Catatan Rapat Evaluasi</h2>
      <div class="sub">Kesimpulan, keputusan, dan tindak lanjut rapat mingguan. Tersimpan per minggu.${canEditWeekNotes() ? "" : " Hanya dapat diubah oleh Sekretaris Pesantren / Admin."}</div>
      ${
        canEditWeekNotes()
          ? `
      <div class="field">
        <textarea id="week-notes" style="min-height:110px" placeholder="Tulis catatan evaluasi minggu ini…">${esc(state.weekNotes[wk])}</textarea>
      </div>
      <div class="save-hint" id="save-hint" style="margin-top:6px"></div>`
          : `
      <p style="white-space:pre-wrap;margin:0;font-size:.92rem">${state.weekNotes[wk] ? esc(state.weekNotes[wk]) : '<i style="color:var(--muted)">Belum ada catatan untuk minggu ini.</i>'}</p>`
      }
    </div>`;
}

function bindEvaluasi() {
  bindWeekPicker();
  const wk = currentWeekKey();
  const notes = $("#week-notes");
  if (notes)
    notes.addEventListener("input", (e) => {
      state.weekNotes[wk] = e.target.value;
      syncWeekNotes(wk);
    });
  $("#btn-print-eval").addEventListener("click", () => printEvaluasi(wk));
}

/* ---------------- Cetak ---------------- */

function printHeaderHTML(divName) {
  return `
    <div class="ph">
      <div class="l1">FORM LAPORAN PROGRAM KERJA DIVISI</div>
      <div class="l2">PONDOK PESANTREN JALALUDDIN AR-RUMI</div>
      ${divName ? `<div class="l3">DIVISI ${esc(divName).toUpperCase()}</div>` : ""}
    </div>`;
}

function signRowHTML(divName, coordinator) {
  return `
    <div class="sign-row">
      <div class="sign">Mengetahui,<br>Pengurus Harian<div class="space"></div>( ............................ )</div>
      <div class="sign">Koordinator Divisi ${esc(divName)}<div class="space"></div>( ${coordinator ? esc(coordinator) : "............................"} )</div>
    </div>`;
}

function doPrint(html) {
  $("#print-area").innerHTML = `<div class="print-form">${html}</div>`;
  window.print();
}

function printDaily(div, weekKey, dayIdx) {
  const divData = state.divisions[div.id];
  const progs = divData.programs.filter((p) => p.days[dayIdx]);
  const date = dayDate(weekKey, dayIdx);
  const rows = progs
    .map((p, i) => {
      const en = getEntry(weekKey, div.id, dayIdx, p.id);
      return `<tr>
      <td>${i + 1}</td>
      <td class="left">${esc(p.name)}</td>
      <td>${en.a !== undefined && en.a !== "" ? fmtNum(en.a) + "%" : ""}</td>
      <td>${en.b !== undefined && en.b !== "" ? fmtNum(en.b) + "%" : ""}</td>
      <td class="left">${esc(en.ket)}</td>
      <td class="left">${esc(en.kendala)}</td>
      <td class="left">${esc(en.solusi)}</td>
      <td class="left">${esc(en.absen)}</td>
    </tr>`;
    })
    .join("");
  doPrint(`
    ${printHeaderHTML(div.name)}
    <div class="meta-line"><b>Hari, Tanggal :</b> ${DAYS[dayIdx]}, ${fmtLong(date)}</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width:24px">No</th><th rowspan="2">Program</th>
          <th colspan="2">Prosentase</th>
          <th rowspan="2">Keterangan</th><th rowspan="2">Kendala</th>
          <th rowspan="2">Solusi/Langkah Konkrit</th>
          <th rowspan="2">Nama Santri Yang Tidak Mengikuti Kegiatan</th>
        </tr>
        <tr><th style="width:40px">A</th><th style="width:40px">B</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="legend"><b>Keterangan Prosentase :</b><br>Huruf A → Kuantitatif<br>Huruf B → Kualitatif</div>
    ${signRowHTML(div.name, divData.coordinator)}
  `);
}

function printWeekly(div, weekKey) {
  const divData = state.divisions[div.id];
  const { title } = weekLabel(weekKey);
  const headDays = DAYS.map((d) => `<th colspan="2">${d}</th>`).join("");
  const headAB = DAYS.map(
    () => '<th style="width:26px">A</th><th style="width:26px">B</th>',
  ).join("");
  const rows = divData.programs
    .map((p, i) => {
      const cells = DAYS.map((_, dIdx) => {
        if (!p.days[dIdx]) return "<td>–</td><td>–</td>";
        const en = getEntry(weekKey, div.id, dIdx, p.id);
        return `<td>${en.a !== undefined && en.a !== "" ? fmtNum(en.a) : ""}</td><td>${en.b !== undefined && en.b !== "" ? fmtNum(en.b) : ""}</td>`;
      }).join("");
      return `<tr><td>${i + 1}</td><td class="left">${esc(p.name)}</td>${cells}</tr>`;
    })
    .join("");
  const pengasuhNotes = divData.programs
    .map((p) => ({
      name: p.name,
      note: getPengasuhNote(weekKey, div.id, p.id),
    }))
    .filter((x) => x.note);
  doPrint(`
    ${printHeaderHTML(div.name)}
    <div class="meta-line"><b>Bulan/Minggu :</b> ${title}</div>
    <table>
      <thead>
        <tr><th rowspan="2" style="width:24px">No</th><th rowspan="2">Program</th>${headDays}</tr>
        <tr>${headAB}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="legend"><b>Keterangan Prosentase :</b><br>Huruf A → Kuantitatif<br>Huruf B → Kualitatif</div>
    ${pengasuhNotes.length ? `<div class="legend"><b>Catatan Pengasuh :</b><br>${pengasuhNotes.map((x) => "• <b>" + esc(x.name) + ":</b> " + esc(x.note)).join("<br>")}</div>` : ""}
    ${signRowHTML(div.name, divData.coordinator)}
  `);
}

function printEvaluasi(weekKey) {
  const { title } = weekLabel(weekKey);
  const rows = DIVISIONS.map((d) => {
    const st = divisionStats(weekKey, d.id);
    const nProg = state.divisions[d.id].programs.length;
    return `<tr>
      <td class="left">Divisi ${esc(d.name)}</td>
      <td>${nProg || "—"}</td>
      <td>${nProg ? st.pct + "%" : "—"}</td>
      <td>${fmtNum(st.avgA)}</td>
      <td>${fmtNum(st.avgB)}</td>
      <td>${st.kendala || "—"}</td>
    </tr>`;
  }).join("");
  const notes = state.weekNotes[weekKey];
  doPrint(`
    ${printHeaderHTML("")}
    <div class="ph"><div class="l3">REKAP EVALUASI MINGGUAN SELURUH DIVISI</div></div>
    <div class="meta-line"><b>Bulan/Minggu :</b> ${title}</div>
    <table>
      <thead><tr><th>Divisi</th><th>Jumlah Program</th><th>Kelengkapan Laporan</th><th>Rata-rata A (%)</th><th>Rata-rata B (%)</th><th>Kendala</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${notes ? `<div class="legend"><b>Catatan Rapat Evaluasi :</b><br>${esc(notes).replace(/\n/g, "<br>")}</div>` : ""}
    ${signRowHTML("", "")}
  `);
}

/* ---------------- Global (auth, backup, dialog) ---------------- */

function updateAuthUI() {
  const s = session();
  const btnAuth = $("#btn-auth");
  const btnBackup = $("#btn-backup");
  if (s) {
    const acc = state.accounts[s.id];
    btnAuth.textContent = "👤 " + (acc ? acc.label : s.user);
    btnBackup.hidden = false;
  } else {
    btnAuth.textContent = "🔑 Masuk";
    btnBackup.hidden = true;
  }
}

function accountOptionsHTML(selectEl, includeAdmin) {
  const opts = [];
  for (const d of DIVISIONS) {
    const acc = state.accounts[d.id];
    if (acc) opts.push(`<option value="${d.id}">${esc(acc.label)}</option>`);
  }
  for (const id of ["sekretaris", "pengasuh"]) {
    const acc = state.accounts[id];
    if (acc) opts.push(`<option value="${id}">${esc(acc.label)}</option>`);
  }
  if (includeAdmin && state.accounts.admin) {
    opts.push(
      `<option value="admin">${esc(state.accounts.admin.label)}</option>`,
    );
  }
  selectEl.innerHTML = opts.join("");
}

function bindAuth() {
  const loginDialog = $("#login-dialog");
  const accountDialog = $("#account-dialog");

  $("#btn-auth").addEventListener("click", () => {
    if (session()) {
      // dialog akun
      const s = session();
      const acc = state.accounts[s.id];
      $("#account-title").textContent = "👤 " + (acc ? acc.label : s.user);
      $("#account-info").textContent =
        acc && acc.plain
          ? "⚠️ Akun ini masih memakai kata sandi awal. Segera ganti demi keamanan."
          : "Anda dapat mengganti kata sandi atau keluar dari akun.";
      $("#chg-old").value = "";
      $("#chg-new").value = "";
      const msg = $("#chg-msg");
      msg.hidden = true;
      const adminBox = $("#admin-reset");
      adminBox.hidden = !isAdmin();
      if (isAdmin()) accountOptionsHTML($("#reset-user"), false);
      accountDialog.showModal();
    } else {
      accountOptionsHTML($("#login-user"), true);
      $("#login-pass").value = "";
      $("#login-error").hidden = true;
      loginDialog.showModal();
    }
  });

  $("#btn-login-close").addEventListener("click", () => loginDialog.close());

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#login-user").value;
    const acc = state.accounts[id];
    const pass = $("#login-pass").value;
    if (!acc || !(await verifyPassword(acc, pass))) {
      $("#login-error").hidden = false;
      return;
    }
    setSession({ id, user: acc.user, role: acc.role, divId: acc.divId });
    loginDialog.close();
    render();
    toast("Selamat datang, " + acc.label);
    // arahkan sesuai peran
    if (acc.role === "koordinator") location.hash = "#/divisi/" + acc.divId;
    else if (acc.role === "sekretaris") location.hash = "#/evaluasi";
  });

  $("#btn-account-close").addEventListener("click", () =>
    accountDialog.close(),
  );

  $("#btn-logout").addEventListener("click", () => {
    setSession(null);
    accountDialog.close();
    render();
    toast("Anda telah keluar. Tampilan kembali ke mode publik.");
  });

  $("#btn-change-pass").addEventListener("click", async () => {
    const s = session();
    const acc = state.accounts[s.id];
    const oldP = $("#chg-old").value,
      newP = $("#chg-new").value;
    const msg = $("#chg-msg");
    msg.hidden = false;
    if (!(await verifyPassword(acc, oldP))) {
      msg.style.color = "var(--danger)";
      msg.textContent = "Kata sandi lama salah.";
      return;
    }
    if (newP.length < 5) {
      msg.style.color = "var(--danger)";
      msg.textContent = "Kata sandi baru minimal 5 karakter.";
      return;
    }
    acc.hash = await sha256(newP);
    delete acc.plain;
    try {
      await syncAccount(s.id);
    } catch (err) {
      msg.style.color = "var(--danger)";
      msg.textContent = "Gagal menyimpan ke server — coba lagi.";
      return;
    }
    msg.style.color = "var(--green-700)";
    msg.textContent = "✓ Kata sandi berhasil diganti.";
    $("#chg-old").value = "";
    $("#chg-new").value = "";
  });

  $("#btn-reset-pass").addEventListener("click", async () => {
    if (!isAdmin()) return;
    const id = $("#reset-user").value;
    const newP = $("#reset-pass").value;
    if (newP.length < 5) {
      toast("Kata sandi baru minimal 5 karakter");
      return;
    }
    const acc = state.accounts[id];
    acc.hash = await sha256(newP);
    delete acc.plain;
    try {
      await syncAccount(id);
    } catch (err) {
      toast("Gagal menyimpan ke server — coba lagi");
      return;
    }
    $("#reset-pass").value = "";
    toast("Kata sandi " + acc.label + " berhasil direset");
  });
}

function bindGlobal() {
  bindAuth();
  const dialog = $("#backup-dialog");
  $("#btn-backup").addEventListener("click", () => {
    $("#lbl-import").hidden = !isAdmin();
    dialog.showModal();
  });
  $("#btn-close-dialog").addEventListener("click", () => dialog.close());

  $("#btn-export").addEventListener("click", async () => {
    try {
      toast("Mengambil seluruh data dari server…");
      const [divisions, entries, weekNotes, pengasuhNotes, accounts] =
        await Promise.all([
          sb("/divisions?select=*"),
          sb("/entries?select=*"),
          sb("/week_notes?select=*"),
          sb("/pengasuh_notes?select=*"),
          sb("/accounts?select=*"),
        ]);
      const backup = {
        format: "evaluasi-ja-supabase-v1",
        exportedAt: new Date().toISOString(),
        divisions,
        entries,
        weekNotes,
        pengasuhNotes,
        accounts,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "evaluasi-ja-backup-" + todayISO() + ".json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Data berhasil diekspor");
    } catch (err) {
      alert("Gagal mengambil data dari server: " + err.message);
    }
  });

  $("#file-import").addEventListener("change", (e) => {
    if (!isAdmin()) {
      toast("Impor data hanya untuk Admin");
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const rows = backupToRows(data);
        if (
          !confirm(
            "Impor akan menimpa data server dengan isi cadangan ini " +
              `(${rows.entries.length} entri laporan). Lanjutkan?`,
          )
        )
          return;
        toast("Mengunggah data ke server…");
        if (rows.divisions.length) await sbUpsert("divisions", rows.divisions, "id");
        if (rows.accounts.length) await sbUpsert("accounts", rows.accounts, "id");
        if (rows.weekNotes.length) await sbUpsert("week_notes", rows.weekNotes, "week_key");
        if (rows.pengasuhNotes.length)
          await sbUpsert("pengasuh_notes", rows.pengasuhNotes, "week_key,div_id,prog_id");
        for (let i = 0; i < rows.entries.length; i += 500) {
          await sbUpsert(
            "entries",
            rows.entries.slice(i, i + 500),
            "week_key,div_id,day_idx,prog_id",
          );
        }
        dialog.close();
        // muat ulang semuanya dari server
        loadedWeeks.clear();
        await initData();
        await render();
        toast("Data berhasil diimpor ke server");
      } catch (err) {
        alert("File tidak valid / gagal impor: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
}

/* Konversi file cadangan (format lama localStorage ATAU format baru) menjadi
   baris-baris tabel Supabase. */
function backupToRows(data) {
  if (!data.divisions) throw new Error("Format tidak dikenali");
  const rows = { divisions: [], entries: [], weekNotes: [], pengasuhNotes: [], accounts: [] };

  if (data.format === "evaluasi-ja-supabase-v1") {
    return {
      divisions: data.divisions || [],
      entries: data.entries || [],
      weekNotes: data.weekNotes || [],
      pengasuhNotes: data.pengasuhNotes || [],
      accounts: data.accounts || [],
    };
  }

  // format lama (localStorage): objek bersarang
  for (const [id, d] of Object.entries(data.divisions)) {
    rows.divisions.push({ id, coordinator: d.coordinator || "", programs: d.programs || [] });
  }
  for (const [wk, byDiv] of Object.entries(data.entries || {})) {
    for (const [divId, byDay] of Object.entries(byDiv)) {
      for (const [dayIdx, byProg] of Object.entries(byDay)) {
        for (const [progId, en] of Object.entries(byProg)) {
          rows.entries.push({
            week_key: wk, div_id: divId, day_idx: Number(dayIdx), prog_id: progId,
            a: en.a ?? "", b: en.b ?? "", ket: en.ket ?? "",
            kendala: en.kendala ?? "", solusi: en.solusi ?? "", absen: en.absen ?? "",
          });
        }
      }
    }
  }
  for (const [wk, notes] of Object.entries(data.weekNotes || {})) {
    if (notes) rows.weekNotes.push({ week_key: wk, notes });
  }
  for (const [wk, byDiv] of Object.entries(data.pengasuhNotes || {})) {
    for (const [divId, byProg] of Object.entries(byDiv)) {
      for (const [progId, note] of Object.entries(byProg)) {
        if (note) rows.pengasuhNotes.push({ week_key: wk, div_id: divId, prog_id: progId, note });
      }
    }
  }
  for (const [id, a] of Object.entries(data.accounts || {})) {
    rows.accounts.push({
      id, label: a.label, role: a.role, div_id: a.divId ?? null,
      plain: a.plain ?? null, hash: a.hash ?? null,
    });
  }
  return rows;
}
