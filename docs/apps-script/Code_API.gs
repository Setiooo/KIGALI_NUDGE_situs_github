/*************************************************************************
 * KIGALI NUDGE - API JSON (Google Apps Script)  [untuk situs GitHub]
 *
 * File ini membuat Spreadsheet bisa dibaca oleh situs statis (GitHub Pages)
 * sebagai API. doGet mengembalikan JSON (atau JSONP bila ada ?callback=).
 *
 * PASANG:
 * 1. Pastikan Code.gs (form + trigger) sudah terpasang & workbook MVP diunggah.
 * 2. Tambah file ini ke proyek Apps Script yang sama (biarkan Code.gs tetap ada).
 * 3. Deploy > New deployment > tipe "Web app":
 *      Execute as: Me  |  Who has access: Anyone
 *    Deploy, izinkan, SALIN URL /exec. Tempel URL itu ke config.js situs GitHub.
 * 4. Uji cepat: buka URL /exec di browser -> harus tampil JSON.
 *
 * Catatan privasi: API ini HANYA mengeluarkan data agregat (KPI, papan skor,
 * ringkasan energi & mutu). Tidak ada nama siswa / baris mentah yang dikirim.
 *************************************************************************/

function doGet(e) {
  var payload;
  try {
    payload = getDashboardData();
  } catch (err) {
    payload = { error: String(err) };
  }
  var json = JSON.stringify(payload);
  var cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    // JSONP -> bebas CORS untuk situs GitHub Pages
    return ContentService.createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/** Mengumpulkan data agregat dari Spreadsheet. */
function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = { updated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm') };

  var kpi = ss.getSheetByName('KPI');
  if (kpi) {
    var kv = kpi.getRange(4, 2, 4, 7).getValues();
    var pack = function (r) { return { intB: cell_(r[0]), intP: cell_(r[1]), ktB: cell_(r[2]), ktP: cell_(r[3]), dInt: cell_(r[4]), dKt: cell_(r[5]), did: cell_(r[6]) }; };
    out.kpi = { setpoint: pack(kv[0]), ackosong: pack(kv[1]), pintu: pack(kv[2]), keluhan: pack(kv[3]) };
  }

  var ps = ss.getSheetByName('Papan_Skor');
  if (ps) {
    out.papan = ps.getRange(2, 1, 12, 6).getValues()
      .filter(function (r) { return r[0] !== '' && r[0] != null; })
      .map(function (r) { return { kelas: r[0], skor: cell_(r[4]), rank: cell_(r[5]) }; })
      .sort(function (a, b) { return (a.rank == null ? 99 : a.rank) - (b.rank == null ? 99 : b.rank); });
  }

  var pe = ss.getSheetByName('Perhitungan_Energi');
  if (pe) {
    var en = pe.getRange(2, 11, 40, 5).getValues(), kWh = 0, rp = 0, co2 = 0;
    en.forEach(function (r) {
      if (typeof r[0] === 'number') kWh += r[0];
      if (typeof r[3] === 'number') rp += r[3];
      if (typeof r[4] === 'number') co2 += r[4];
    });
    out.energi = { kWh: kWh, rp: rp, co2: co2 };
  }

  var el = ss.getSheetByName('Error_Log');
  if (el) {
    var v = el.getRange(4, 2, 6, 1).getValues().map(function (r) { return r[0]; });
    out.mutu = { terisi: cell_(v[0]), duplikat: cell_(v[1]), kurang: cell_(v[2]), outlier: cell_(v[3]), periksa: cell_(v[4]), kesesuaian: cell_(v[5]) };
  }

  var mr = ss.getSheetByName('Master_Ruang');
  if (mr) {
    var g = mr.getRange(2, 8, 2000, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); });
    out.ruang = {
      intervensi: g.filter(function (x) { return x === 'intervensi'; }).length,
      kontrol: g.filter(function (x) { return x === 'kontrol'; }).length
    };
  }

  var tr = ss.getSheetByName('Tren_Mingguan');
  if (tr) {
    out.tren = tr.getRange(4, 1, 3, 11).getValues()
      .filter(function (r) { return r[0] !== '' && r[0] != null; })
      .map(function (r) {
        return {
          minggu: r[0], sp_int: cell_(r[3]), sp_ktr: cell_(r[4]),
          ack_int: cell_(r[5]), ack_ktr: cell_(r[6]),
          pin_int: cell_(r[7]), pin_ktr: cell_(r[8]),
          kel_int: cell_(r[9]), kel_ktr: cell_(r[10])
        };
      });
  }
  return out;
}

/** Kosong ("") -> null supaya bersih di JSON; angka tetap angka. */
function cell_(v) { return (v === '' || v == null) ? null : v; }
