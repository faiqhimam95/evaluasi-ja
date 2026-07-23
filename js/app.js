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
    if (d.id === "kewaliasuhan") continue; // digantikan 11 akun wali asuh di bawah
    acc[d.id] = {
      user: d.id,
      label: "Koordinator " + d.name,
      role: "koordinator",
      divId: d.id,
      plain: d.id + "2026", // kata sandi awal, mis. "pendidikan2026"
    };
  }
  for (let i = 1; i <= 11; i++) {
    const id = "wali" + i;
    acc[id] = {
      user: id,
      label: "Wali Asuh " + i,
      role: "wali",
      divId: "kewaliasuhan",
      plain: id + "2026", // kata sandi awal, mis. "wali12026"
    };
  }
  return acc;
}

/* Daftar id akun wali asuh yang benar-benar ada saat ini (dinamis — admin
   dapat menambah/menghapus lewat tab Kelola Santri & Aspek). */
function waliIds() {
  return Object.keys(state.accounts)
    .filter((id) => state.accounts[id].role === "wali")
    .sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return na - nb || a.localeCompare(b);
    });
}

/* Id baru untuk wali asuh berikutnya, mis. "wali12" bila sudah ada wali1..wali11 */
function nextWaliId() {
  const nums = waliIds().map((id) => parseInt(id.replace(/\D/g, ""), 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "wali" + next;
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
/* Kelola aspek penilaian & daftar santri Kewaliasuhan: khusus admin */
function canManageKewaliasuhan() {
  return isAdmin();
}
/* Mengisi nilai/catatan seorang santri: admin, atau wali asuh yang bersangkutan */
function canEditWaliStudent(waliId) {
  const s = session();
  return !!s && (s.role === "admin" || (s.role === "wali" && s.id === waliId));
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
  // Tabel Kewaliasuhan bersifat tambahan (mungkin belum dibuat via supabase-setup.sql
  // di project lama) — jangan sampai kegagalannya menjatuhkan seluruh aplikasi.
  let aspectRows = [],
    studentRows = [],
    kewaliasuhanTablesReady = true;
  try {
    [aspectRows, studentRows] = await Promise.all([
      sb("/kewaliasuhan_aspects?select=*&order=order_no.asc"),
      sb("/kewaliasuhan_students?select=*&order=order_no.asc"),
    ]);
  } catch (e) {
    console.warn("Tabel Kewaliasuhan belum tersedia:", e.message);
    kewaliasuhanTablesReady = false;
  }

  state = {
    divisions: {},
    entries: {},
    weekNotes: {},
    pengasuhNotes: {},
    kewaliasuhanScores: {},
    kewaliasuhanNotes: {},
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

  state.kewaliasuhanTablesReady = kewaliasuhanTablesReady;
  state.kewaliasuhan = {
    aspects: aspectRows.map((r) => ({ id: r.id, name: r.name, order: r.order_no })),
    students: studentRows.map((r) => ({
      id: r.id,
      waliId: r.wali_id,
      name: r.name,
      order: r.order_no,
    })),
  };
  if (kewaliasuhanTablesReady && !state.kewaliasuhan.aspects.length) {
    const seedNames = [
      "Akhlak",
      "Kedisiplinan",
      "Ibadah",
      "Kebersihan Diri",
      "Kerjasama",
      "Tanggung Jawab",
    ];
    const seedAspects = seedNames.map((name, i) => ({
      id: "aspek-seed-" + (i + 1),
      name,
      order: i,
    }));
    try {
      await sbUpsert(
        "kewaliasuhan_aspects",
        seedAspects.map((a) => ({ id: a.id, name: a.name, order_no: a.order })),
        "id",
      );
      state.kewaliasuhan.aspects = seedAspects;
    } catch (e) {
      console.warn("Gagal menyemai aspek Kewaliasuhan:", e.message);
    }
  }
}

/* Muat data satu minggu (entri, catatan rapat, catatan pengasuh, penilaian kewaliasuhan). */
async function loadWeek(weekKey) {
  if (loadedWeeks.has(weekKey)) return;
  const q = "week_key=eq." + weekKey;
  const [entryRows, noteRows, pengRows] = await Promise.all([
    sb("/entries?select=*&" + q),
    sb("/week_notes?select=*&" + q),
    sb("/pengasuh_notes?select=*&" + q),
  ]);
  let kwScoreRows = [],
    kwNoteRows = [];
  if (state.kewaliasuhanTablesReady) {
    try {
      [kwScoreRows, kwNoteRows] = await Promise.all([
        sb("/kewaliasuhan_scores?select=*&" + q),
        sb("/kewaliasuhan_notes?select=*&" + q),
      ]);
    } catch (e) {
      console.warn("Gagal memuat data Kewaliasuhan minggu ini:", e.message);
    }
  }
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

  const ks = {};
  for (const r of kwScoreRows) {
    if (!ks[r.student_id]) ks[r.student_id] = {};
    ks[r.student_id][r.aspect_id] = r.score;
  }
  state.kewaliasuhanScores[weekKey] = ks;
  const kn = {};
  for (const r of kwNoteRows) kn[r.student_id] = r.note;
  state.kewaliasuhanNotes[weekKey] = kn;

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
      h.textContent = "Tersimpan";
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

/* ---------------- Kewaliasuhan: nilai & catatan santri ---------------- */

function getKwScore(weekKey, studentId, aspectId) {
  return state.kewaliasuhanScores?.[weekKey]?.[studentId]?.[aspectId] ?? "";
}
function setKwScore(weekKey, studentId, aspectId, value) {
  const student = state.kewaliasuhan.students.find((s) => s.id === studentId);
  if (!student || !canEditWaliStudent(student.waliId)) return;
  if (!state.kewaliasuhanScores[weekKey]) state.kewaliasuhanScores[weekKey] = {};
  if (!state.kewaliasuhanScores[weekKey][studentId])
    state.kewaliasuhanScores[weekKey][studentId] = {};
  state.kewaliasuhanScores[weekKey][studentId][aspectId] = value;
  queueSync(`kw-score:${weekKey}:${studentId}:${aspectId}`, () =>
    sbUpsert(
      "kewaliasuhan_scores",
      { week_key: weekKey, student_id: studentId, aspect_id: aspectId, score: value },
      "week_key,student_id,aspect_id",
    ),
  );
}
function getKwNote(weekKey, studentId) {
  return state.kewaliasuhanNotes?.[weekKey]?.[studentId] ?? "";
}
function setKwNote(weekKey, studentId, value) {
  const student = state.kewaliasuhan.students.find((s) => s.id === studentId);
  if (!student || !canEditWaliStudent(student.waliId)) return;
  if (!state.kewaliasuhanNotes[weekKey]) state.kewaliasuhanNotes[weekKey] = {};
  state.kewaliasuhanNotes[weekKey][studentId] = value;
  queueSync(`kw-note:${weekKey}:${studentId}`, () =>
    sbUpsert(
      "kewaliasuhan_notes",
      { week_key: weekKey, student_id: studentId, note: value },
      "week_key,student_id",
    ),
  );
}

/* Statistik Kewaliasuhan untuk satu minggu (semua kelompok wali digabung) */
function kewaliasuhanStats(weekKey) {
  const aspects = state.kewaliasuhan.aspects;
  const students = state.kewaliasuhan.students;
  const total = students.length * aspects.length;
  let filled = 0,
    sum = 0,
    n = 0;
  for (const st of students) {
    for (const a of aspects) {
      const v = getKwScore(weekKey, st.id, a.id);
      if (v !== "") {
        filled++;
        sum += Number(v);
        n++;
      }
    }
  }
  return {
    total,
    filled,
    pct: total ? Math.round((filled / total) * 100) : 0,
    avg: n ? sum / n : null,
  };
}

/* Warna nilai ala rapor: merah (kurang) → kuning (cukup) → hijau (baik) → hijau tua (sangat baik) */
function kwScoreGradeClass(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  if (n < 60) return "grade-d";
  if (n < 75) return "grade-c";
  if (n < 90) return "grade-b";
  return "grade-a";
}

function syncKwAspect(aspect) {
  queueSync("kw-aspect:" + aspect.id, () =>
    sbUpsert(
      "kewaliasuhan_aspects",
      { id: aspect.id, name: aspect.name, order_no: aspect.order },
      "id",
    ),
  );
}
function deleteKwAspect(aspectId) {
  queueSync("kw-del-aspect:" + aspectId, () =>
    sb(`/kewaliasuhan_aspects?id=eq.${aspectId}`, { method: "DELETE" }),
  );
}
function syncKwStudent(student) {
  queueSync("kw-student:" + student.id, () =>
    sbUpsert(
      "kewaliasuhan_students",
      {
        id: student.id,
        wali_id: student.waliId,
        name: student.name,
        order_no: student.order,
      },
      "id",
    ),
  );
}
function deleteKwStudent(studentId) {
  queueSync("kw-del-student:" + studentId, () =>
    sb(`/kewaliasuhan_students?id=eq.${studentId}`, { method: "DELETE" }),
  );
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
    if (div.id === "kewaliasuhan" && route.tab === "kelola" && !canManageKewaliasuhan()) {
      location.hash = "#/divisi/kewaliasuhan/penilaian";
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

function kewaliasuhanDashboardCardHTML(wk, d) {
  const st = kewaliasuhanStats(wk);
  const nStudents = state.kewaliasuhan.students.length;
  return `
    <a class="division-card" href="#/divisi/${d.id}">
      <span class="icon">${d.icon}</span>
      <h3>Divisi ${esc(d.name)}</h3>
      <div class="meta">${state.kewaliasuhan.aspects.length} aspek · ${nStudents} santri · ${waliIds().length} wali asuh</div>
      ${
        nStudents
          ? `
      <div class="progressbar"><i style="width:${st.pct}%"></i></div>
      <div class="progress-row">
        <span>Terisi ${st.filled}/${st.total}</span>
        <span>${st.avg !== null ? "Rata-rata: " + fmtNum(st.avg) : ""}</span>
      </div>`
          : `
      <div class="progress-row"><span>Admin dapat menambahkan santri asuhan</span></div>`
      }
    </a>`;
}

function viewDashboard() {
  const wk = currentWeekKey();
  const cards = DIVISIONS.map((d) => {
    if (d.id === "kewaliasuhan") return kewaliasuhanDashboardCardHTML(wk, d);
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
  if (div.id === "kewaliasuhan") return viewKewaliasuhan(div, route);
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
  if (div.id === "kewaliasuhan") return bindKewaliasuhan(div, route);
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
    // isian nama santri memakai format daftar bernomor otomatis
    const absenTa = $('textarea[data-field="absen"]', card);
    if (absenTa) setupNumberedList(absenTa);
  });

  const btnPrint = $("#btn-print-daily");
  if (btnPrint)
    btnPrint.addEventListener("click", () => printDaily(div, wk, di));
}

/* Susun ulang teks menjadi daftar bernomor "1. Nama" per baris */
function renumberList(text) {
  let n = 0;
  return text
    .split("\n")
    .map((l) => {
      const t = l
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim();
      if (!t) return null;
      n++;
      return n + ". " + t;
    })
    .filter((l) => l !== null)
    .join("\n");
}

/* Textarea dengan penomoran otomatis: Enter membuat nomor berikutnya,
   penomoran dirapikan ulang saat keluar dari isian. */
function setupNumberedList(ta) {
  ta.addEventListener("focus", () => {
    if (!ta.value.trim()) {
      ta.value = "1. ";
      ta.setSelectionRange(3, 3);
    }
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const MARK = "\u0000";
    const combined =
      ta.value.slice(0, ta.selectionStart) +
      "\n" +
      MARK +
      ta.value.slice(ta.selectionEnd);
    let n = 0;
    let cursorPos = 0;
    const out = [];
    for (const line of combined.split("\n")) {
      const isCursor = line.includes(MARK);
      const t = line
        .replace(MARK, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim();
      if (!t && !isCursor) continue;
      n++;
      out.push(n + ". " + t);
      if (isCursor) cursorPos = out.join("\n").length;
    }
    ta.value = out.join("\n");
    ta.setSelectionRange(cursorPos, cursorPos);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  ta.addEventListener("blur", () => {
    const v = renumberList(ta.value);
    if (v !== ta.value) {
      ta.value = v;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
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

/* ---------------- Divisi Kewaliasuhan (khusus) ---------------- */
/* Form berbentuk daftar nama santri × aspek penilaian, bukan program kerja
   biasa. Aspek & daftar santri dikelola admin; 11 akun wali asuh (wali1..11)
   masing-masing hanya mengisi nilai kelompok asuhannya sendiri. */

function viewKewaliasuhan(div, route) {
  if (!state.kewaliasuhanTablesReady) {
    return `
      <div class="page-head">
        <div>
          <a href="#/" class="back-link">← Kembali ke Dashboard</a>
          <h1>${div.icon} Divisi ${esc(div.name)}</h1>
        </div>
      </div>
      <div class="card"><div class="empty-state">
        <div class="big">⚠️</div>
        <p><b>Tabel data Kewaliasuhan belum dibuat di database.</b><br>
        Admin perlu menjalankan isi terbaru file <code>supabase-setup.sql</code> di
        Supabase Dashboard → SQL Editor (bagian "Tambahan: Kewaliasuhan"), lalu muat ulang halaman ini.</p>
        <button class="btn btn-primary" onclick="location.reload()">🔄 Muat Ulang</button>
      </div></div>`;
  }
  const tab = route.tab === "harian" || !route.tab ? "penilaian" : route.tab;
  const tabDefs = [["penilaian", "📋 Penilaian Santri"]];
  if (canManageKewaliasuhan()) tabDefs.push(["kelola", "⚙️ Kelola Santri & Aspek"]);
  const tabs = tabDefs
    .map(
      ([id, label]) =>
        `<button class="tab ${tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`,
    )
    .join("");

  const body =
    tab === "kelola" ? viewKewaliasuhanKelola(route) : viewKewaliasuhanPenilaian(route);

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

function bindKewaliasuhan(div, route) {
  const tab = route.tab === "harian" || !route.tab ? "penilaian" : route.tab;
  $$(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = `#/divisi/${div.id}/${b.dataset.tab}`;
    }),
  );
  if (tab === "kelola") bindKewaliasuhanKelola(route);
  else bindKewaliasuhanPenilaian(route);
}

/* ----- Tab: Penilaian Santri ----- */

function viewKewaliasuhanPenilaian(route) {
  const wk = currentWeekKey();
  const s = session();
  if (s && s.role === "wali") {
    return kwGroupCardHTML(s.id, wk, true);
  }
  if (canManageKewaliasuhan()) {
    const ids = waliIds();
    if (!ids.length) {
      return `<div class="card"><p class="sub" style="margin:0">Belum ada akun Wali Asuh. Tambahkan di tab <b>Kelola Santri & Aspek</b>.</p></div>`;
    }
    const selected = ids.includes(route.day) ? route.day : ids[0];
    const options = ids
      .map(
        (id) =>
          `<option value="${id}" ${id === selected ? "selected" : ""}>${esc(state.accounts[id]?.label || id)}</option>`,
      )
      .join("");
    return `
      <div class="card">
        <label for="kw-wali-view" style="font-weight:700;font-size:.85rem;color:var(--muted)">Pilih Wali Asuh:</label>
        <select id="kw-wali-view" style="margin-left:8px;border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit">${options}</select>
      </div>
      ${kwGroupCardHTML(selected, wk, true)}`;
  }
  // publik / peran lain: baca-saja, tampilkan semua kelompok
  const ids = waliIds();
  if (!ids.length) {
    return `<div class="card"><p class="sub" style="margin:0">Belum ada akun Wali Asuh yang dibentuk.</p></div>`;
  }
  return ids.map((id) => kwGroupCardHTML(id, wk, false)).join("");
}

function kwGroupCardHTML(waliId, weekKey, allowEdit) {
  const acc = state.accounts[waliId];
  const label = acc ? acc.label : waliId;
  const students = state.kewaliasuhan.students
    .filter((s) => s.waliId === waliId)
    .sort((a, b) => a.order - b.order);
  const aspects = state.kewaliasuhan.aspects;
  const editable = allowEdit && canEditWaliStudent(waliId);

  if (!students.length || !aspects.length) {
    const msg = !aspects.length
      ? "Belum ada aspek penilaian ditentukan."
      : "Belum ada santri pada kelompok ini.";
    return `<div class="card"><h2>${esc(label)}</h2><p class="sub" style="margin:0">${msg}${canManageKewaliasuhan() ? " Atur di tab Kelola Santri & Aspek." : ""}</p></div>`;
  }

  const head = aspects.map((a) => `<th>${esc(a.name)}</th>`).join("") + "<th>Catatan</th>";
  const rows = students
    .map((st, i) => {
      const cells = aspects
        .map((a) => {
          const val = getKwScore(weekKey, st.id, a.id);
          const gradeClass = kwScoreGradeClass(val);
          return editable
            ? `<td><input type="number" min="0" max="100" inputmode="numeric" class="kw-score ${gradeClass}" data-student="${st.id}" data-aspect="${a.id}" value="${val}"></td>`
            : `<td class="kw-cell ${gradeClass}">${val !== "" ? fmtNum(val) : ""}</td>`;
        })
        .join("");
      const note = getKwNote(weekKey, st.id);
      const noteCell = editable
        ? `<td><textarea class="kw-note" data-student="${st.id}">${esc(note)}</textarea></td>`
        : `<td style="text-align:left">${esc(note)}</td>`;
      return `<tr><td>${i + 1}</td><td class="prog-name">${esc(st.name)}</td>${cells}${noteCell}</tr>`;
    })
    .join("");

  return `
    <div class="card">
      <div class="page-head" style="margin-bottom:10px">
        <h2>${esc(label)}</h2>
        <div class="toolbar">
          ${editable ? '<span class="save-hint" id="save-hint"></span>' : ""}
          <button class="btn btn-outline btn-print-kw" data-wali="${waliId}">🖨️ Cetak</button>
        </div>
      </div>
      <div class="sub">A = 90–100 (sangat baik) 🟢 Hijau tua tebal; B = 75–89 (baik) 🟢 Hijau; C = 60–74 (cukup) 🟡 Kuning; D = di bawah 60 (kurang) 🔴 Merah</div>
      <div class="table-wrap">
        <table class="recap">
          <thead><tr><th>No</th><th>Nama Santri</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function bindKewaliasuhanPenilaian(route) {
  const wk = currentWeekKey();
  const sel = $("#kw-wali-view");
  if (sel)
    sel.addEventListener("change", () => {
      location.hash = `#/divisi/kewaliasuhan/penilaian/${sel.value}`;
    });
  $$(".kw-score").forEach((inp) =>
    inp.addEventListener("input", () => {
      let v = inp.value;
      if (v !== "") {
        const n = Math.max(0, Math.min(100, Number(v)));
        if (String(n) !== v) inp.value = n;
        v = String(n);
      }
      inp.classList.remove("grade-a", "grade-b", "grade-c", "grade-d");
      const cls = kwScoreGradeClass(v);
      if (cls) inp.classList.add(cls);
      setKwScore(wk, inp.dataset.student, inp.dataset.aspect, v);
    }),
  );
  $$(".kw-note").forEach((ta) =>
    ta.addEventListener("input", () => {
      setKwNote(wk, ta.dataset.student, ta.value);
    }),
  );
  $$(".btn-print-kw").forEach((b) =>
    b.addEventListener("click", () => printKewaliasuhan(b.dataset.wali, wk)),
  );
}

/* ----- Tab: Kelola Santri & Aspek (admin) ----- */

function viewKewaliasuhanKelola(route) {
  const aspects = state.kewaliasuhan.aspects;
  const aspectRows = aspects
    .map(
      (a, i) => `
    <tr data-aspect="${a.id}">
      <td>${i + 1}</td>
      <td><input type="text" class="kw-aspect-name" value="${esc(a.name)}" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font:inherit"></td>
      <td><button class="btn btn-danger btn-sm btn-del-aspect">Hapus</button></td>
    </tr>`,
    )
    .join("");

  const ids = waliIds();
  const selected = ids.includes(route.day) ? route.day : ids[0];
  const students = selected
    ? state.kewaliasuhan.students
        .filter((s) => s.waliId === selected)
        .sort((a, b) => a.order - b.order)
    : [];
  const studentRows = students
    .map(
      (s, i) => `
    <tr data-student="${s.id}">
      <td>${i + 1}</td>
      <td><input type="text" class="kw-student-name" value="${esc(s.name)}" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font:inherit"></td>
      <td><button class="btn btn-danger btn-sm btn-del-student">Hapus</button></td>
    </tr>`,
    )
    .join("");
  const waliAcc = selected ? state.accounts[selected] : null;
  const waliManageRows = ids
    .map((id) => {
      const acc = state.accounts[id];
      const n = state.kewaliasuhan.students.filter((s) => s.waliId === id).length;
      return `
    <tr data-wali="${id}" class="${id === selected ? "wali-row-active" : ""}">
      <td>${esc(acc?.label || id)}</td>
      <td>${n} santri</td>
      <td><button class="btn btn-outline btn-sm btn-pilih-wali" data-wali="${id}">${id === selected ? "Terpilih" : "Kelola"}</button></td>
    </tr>`;
    })
    .join("");

  return `
    <div class="card">
      <h2>Aspek Penilaian</h2>
      <div class="sub">Aspek ini berlaku untuk seluruh kelompok wali asuh.</div>
      <div class="table-wrap">
        <table class="prog-table">
          <thead><tr><th style="width:36px">No</th><th>Nama Aspek</th><th style="width:80px"></th></tr></thead>
          <tbody>${aspectRows || '<tr><td colspan="3" class="sub">Belum ada aspek.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <input type="text" id="new-aspect-name" placeholder="Nama aspek baru…" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit">
        <button class="btn btn-primary" id="btn-add-aspect">Tambah</button>
      </div>
    </div>

    <div class="card">
      <h2>Akun Wali Asuh</h2>
      <div class="sub">Setiap wali hanya bisa mengisi nilai kelompoknya sendiri. Tambah, ganti nama, atau hapus akun di sini.</div>
      <div class="table-wrap">
        <table class="prog-table">
          <thead><tr><th>Nama Wali</th><th style="width:90px">Santri</th><th style="width:100px"></th></tr></thead>
          <tbody>${waliManageRows || '<tr><td colspan="3" class="sub">Belum ada akun Wali Asuh.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <input type="text" id="new-wali-name" placeholder="Nama Wali Asuh baru…" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit">
        <button class="btn btn-primary" id="btn-add-wali">+ Tambah Wali Asuh</button>
      </div>
    </div>

    <div class="card">
      <h2>Santri Asuhan${waliAcc ? " — " + esc(waliAcc.label) : ""}</h2>
      ${
        selected
          ? `
      <div class="coordinator-inline" style="margin-bottom:12px">
        <label for="kw-wali-label"><b>Nama Wali:</b></label>
        <input type="text" id="kw-wali-label" value="${esc(waliAcc?.label || "")}">
        <button class="btn btn-danger btn-sm" id="btn-del-wali" style="margin-left:auto">Hapus Akun Wali Ini</button>
      </div>
      <div class="table-wrap">
        <table class="prog-table">
          <thead><tr><th style="width:36px">No</th><th>Nama Santri</th><th style="width:80px"></th></tr></thead>
          <tbody>${studentRows || '<tr><td colspan="3" class="sub">Belum ada santri pada kelompok ini.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <input type="text" id="new-student-name" placeholder="Nama santri baru…" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit">
        <button class="btn btn-primary" id="btn-add-student">Tambah</button>
      </div>
      <p class="sub" style="margin-top:10px">Kata sandi awal akun wali: <code>${selected}2026</code> — segera minta wali menggantinya lewat menu akun 👤. Admin dapat mereset lewat menu 👤 → Reset Kata Sandi Akun.</p>`
          : `<p class="sub" style="margin:0">Tambahkan akun Wali Asuh terlebih dahulu di atas untuk mulai mengisi santri asuhan.</p>`
      }
    </div>`;
}

function bindKewaliasuhanKelola(route) {
  const ids = waliIds();
  const selected = ids.includes(route.day) ? route.day : ids[0];

  $("#btn-add-aspect").addEventListener("click", () => {
    const inp = $("#new-aspect-name");
    const name = inp.value.trim();
    if (!name) {
      toast("Isi nama aspek terlebih dahulu");
      inp.focus();
      return;
    }
    const order = state.kewaliasuhan.aspects.length;
    const aspect = { id: "aspek-" + Date.now(), name, order };
    state.kewaliasuhan.aspects.push(aspect);
    syncKwAspect(aspect);
    render();
    toast('Aspek "' + name + '" ditambahkan');
  });

  $$("tr[data-aspect]").forEach((tr) => {
    const aspect = state.kewaliasuhan.aspects.find((a) => a.id === tr.dataset.aspect);
    if (!aspect) return;
    $(".kw-aspect-name", tr).addEventListener("input", (e) => {
      aspect.name = e.target.value;
      syncKwAspect(aspect);
    });
    $(".btn-del-aspect", tr).addEventListener("click", () => {
      if (
        !confirm(
          `Hapus aspek "${aspect.name}"?\nNilai yang sudah diisi pada aspek ini tidak akan tampil lagi.`,
        )
      )
        return;
      state.kewaliasuhan.aspects = state.kewaliasuhan.aspects.filter((a) => a.id !== aspect.id);
      deleteKwAspect(aspect.id);
      render();
      toast("Aspek dihapus");
    });
  });

  $$(".btn-pilih-wali").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = `#/divisi/kewaliasuhan/kelola/${b.dataset.wali}`;
    }),
  );

  $("#btn-add-wali").addEventListener("click", async () => {
    const inp = $("#new-wali-name");
    const name = inp.value.trim();
    if (!name) {
      toast("Isi nama wali asuh terlebih dahulu");
      inp.focus();
      return;
    }
    const id = nextWaliId();
    const acc = { user: id, label: name, role: "wali", divId: "kewaliasuhan", plain: id + "2026" };
    state.accounts[id] = acc;
    try {
      await syncAccount(id);
    } catch (e) {
      delete state.accounts[id];
      toast("Gagal menambah wali asuh — periksa koneksi lalu coba lagi");
      return;
    }
    toast(`Wali Asuh "${name}" ditambahkan. Sandi awal: ${acc.plain}`);
    location.hash = `#/divisi/kewaliasuhan/kelola/${id}`;
  });

  const kwWaliLabel = $("#kw-wali-label");
  if (kwWaliLabel)
    kwWaliLabel.addEventListener("input", (e) => {
      const acc = state.accounts[selected];
      if (!acc) return;
      acc.label = e.target.value;
      queueSync("kw-wali-label:" + selected, () => syncAccount(selected));
    });

  const btnDelWali = $("#btn-del-wali");
  if (btnDelWali)
    btnDelWali.addEventListener("click", async () => {
      const nStudents = state.kewaliasuhan.students.filter((s) => s.waliId === selected).length;
      if (nStudents > 0) {
        toast(`Pindahkan atau hapus dulu ${nStudents} santri kelompok ini sebelum menghapus akun wali`);
        return;
      }
      const label = state.accounts[selected]?.label || selected;
      if (!confirm(`Hapus akun Wali Asuh "${label}"? Akun ini tidak akan bisa masuk lagi.`)) return;
      try {
        await sb(`/accounts?id=eq.${selected}`, { method: "DELETE" });
      } catch (e) {
        toast("Gagal menghapus wali asuh — periksa koneksi lalu coba lagi");
        return;
      }
      delete state.accounts[selected];
      toast("Akun Wali Asuh dihapus");
      if (location.hash === "#/divisi/kewaliasuhan/kelola") render();
      else location.hash = "#/divisi/kewaliasuhan/kelola";
    });

  $$("tr[data-student]").forEach((tr) => {
    const student = state.kewaliasuhan.students.find((s) => s.id === tr.dataset.student);
    if (!student) return;
    $(".kw-student-name", tr).addEventListener("input", (e) => {
      student.name = e.target.value;
      syncKwStudent(student);
    });
    $(".btn-del-student", tr).addEventListener("click", () => {
      if (!confirm(`Hapus santri "${student.name}" dari daftar asuhan?`)) return;
      state.kewaliasuhan.students = state.kewaliasuhan.students.filter(
        (s) => s.id !== student.id,
      );
      deleteKwStudent(student.id);
      render();
      toast("Santri dihapus dari daftar");
    });
  });

  const btnAddStudent = $("#btn-add-student");
  if (btnAddStudent)
    btnAddStudent.addEventListener("click", () => {
      const inp = $("#new-student-name");
      const name = inp.value.trim();
      if (!name) {
        toast("Isi nama santri terlebih dahulu");
        inp.focus();
        return;
      }
      const order = state.kewaliasuhan.students.filter((s) => s.waliId === selected).length;
      const student = { id: "santri-" + Date.now(), waliId: selected, name, order };
      state.kewaliasuhan.students.push(student);
      syncKwStudent(student);
      render();
      toast('Santri "' + name + '" ditambahkan');
    });
}

function printKewaliasuhan(waliId, weekKey) {
  const label = state.accounts[waliId]?.label || waliId;
  const students = state.kewaliasuhan.students
    .filter((s) => s.waliId === waliId)
    .sort((a, b) => a.order - b.order);
  const aspects = state.kewaliasuhan.aspects;
  const { title } = weekLabel(weekKey);
  const headAspects = aspects.map((a) => `<th>${esc(a.name)}</th>`).join("");
  const rows = students
    .map((s, i) => {
      const cells = aspects
        .map((a) => {
          const v = getKwScore(weekKey, s.id, a.id);
          return `<td>${v !== "" ? fmtNum(v) : ""}</td>`;
        })
        .join("");
      const note = getKwNote(weekKey, s.id);
      return `<tr><td>${i + 1}</td><td class="left">${esc(s.name)}</td>${cells}<td class="left">${esc(note)}</td></tr>`;
    })
    .join("");
  doPrint(`
    ${printHeaderHTML("Kewaliasuhan")}
    <div class="meta-line"><b>Bulan/Minggu :</b> ${title}</div>
    <div class="meta-line"><b>Wali Asuh :</b> ${esc(label)}</div>
    <table>
      <thead><tr><th style="width:24px">No</th><th>Nama Santri</th>${headAspects}<th>Catatan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign-row">
      <div class="sign">Mengetahui,<br>Pengasuh<div class="space"></div>( ............................ )</div>
      <div class="sign">Wali Asuh<div class="space"></div>( ${esc(label)} )</div>
    </div>
  `);
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
    if (d.id === "kewaliasuhan") {
      const kst = kewaliasuhanStats(wk);
      const nStudents = state.kewaliasuhan.students.length;
      if (nStudents) aktif++;
      return `<tr>
        <td class="prog-name">${d.icon} ${esc(d.name)}</td>
        <td>${nStudents || "—"}</td>
        <td>${nStudents ? kst.pct + "%" : "—"}</td>
        <td>${fmtNum(kst.avg)}</td>
        <td>—</td>
        <td>—</td>
        <td><a class="back-link" href="#/divisi/${d.id}">Lihat penilaian →</a></td>
      </tr>`;
    }
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

/* ---------------- Global (auth, dialog) ---------------- */

function updateAuthUI() {
  const s = session();
  const btnAuth = $("#btn-auth");
  if (s) {
    const acc = state.accounts[s.id];
    btnAuth.textContent = "👤 " + (acc ? acc.label : s.user);
  } else {
    btnAuth.textContent = "🔑 Masuk";
  }
}

function accountOptionsHTML(selectEl, includeAdmin) {
  const opts = [];
  for (const d of DIVISIONS) {
    const acc = state.accounts[d.id];
    if (acc) opts.push(`<option value="${d.id}">${esc(acc.label)}</option>`);
  }
  for (const id of waliIds()) {
    const acc = state.accounts[id];
    if (acc) opts.push(`<option value="${id}">${esc(acc.label)}</option>`);
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
    else if (acc.role === "wali") location.hash = "#/divisi/kewaliasuhan";
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
}
