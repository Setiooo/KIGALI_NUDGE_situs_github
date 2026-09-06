/*************************************************************************
 * KIGALI NUDGE - API JSON (Google Apps Script)  [untuk situs GitHub]
 *
 * API agregat untuk dashboard GitHub Pages.
 *
 * OUTPUT:
 * - KPI
 * - Papan Skor
 * - Energi
 * - Mutu Data
 * - Ruang
 * - Tren
 * - Literasi Ozon & Kigali
 *
 * Tidak mengeluarkan nama siswa / data mentah siswa.
 *************************************************************************/

function doGet(e) {
  var payload;

  try {
    payload = getDashboardData();

    // Penanda agar frontend tahu data benar-benar berasal dari API
    payload.mode = 'LIVE';
    payload.source = 'Google Sheet';

  } catch (err) {
    payload = {
      error: String(err),
      mode: 'ERROR',
      source: 'Apps Script'
    };
  }

  var json = JSON.stringify(payload);
  var cb = e && e.parameter && e.parameter.callback;

  if (cb) {
    // JSONP untuk GitHub Pages
    return ContentService
      .createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


/** ============================================================
 * Mengumpulkan data agregat dari Spreadsheet
 * ============================================================ */
function getDashboardData() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Pastikan perubahan formula sudah selesai dihitung
  SpreadsheetApp.flush();

  var out = {
    updated: Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd MMM yyyy HH:mm:ss'
    ),

    mode: 'LIVE',
    source: 'Google Sheet'
  };


  /* ============================================================
   * 1. KPI
   * ============================================================ */

  var kpi = ss.getSheetByName('KPI');

  if (kpi) {

    var lastKpiRow = kpi.getLastRow();

    if (lastKpiRow >= 4) {

      var jumlahBaris = Math.min(lastKpiRow - 3, 4);

      var kv = kpi
        .getRange(4, 2, jumlahBaris, 7)
        .getValues();

      var pack = function (r) {

        return {
          intB: toNumber_(r[0]),
          intP: toNumber_(r[1]),
          ktB: toNumber_(r[2]),
          ktP: toNumber_(r[3]),
          dInt: toNumber_(r[4]),
          dKt: toNumber_(r[5]),
          did: toNumber_(r[6])
        };

      };

      out.kpi = {

        setpoint: kv[0] ? pack(kv[0]) : {},
        ackosong: kv[1] ? pack(kv[1]) : {},
        pintu: kv[2] ? pack(kv[2]) : {},
        keluhan: kv[3] ? pack(kv[3]) : {}

      };

    } else {

      out.kpi = {};

    }
  }


  /* ============================================================
   * 2. PAPAN SKOR
   * ============================================================ */

  var ps = ss.getSheetByName('Papan_Skor');

  if (ps) {

    var lastPsRow = ps.getLastRow();

    if (lastPsRow >= 2) {

      var jumlahPs = Math.min(lastPsRow - 1, 200);

      out.papan = ps
        .getRange(2, 1, jumlahPs, 6)
        .getValues()

        .filter(function (r) {
          return r[0] !== '' && r[0] != null;
        })

        .map(function (r) {

          return {
            kelas: String(r[0]),
            skor: toNumber_(r[4]),
            rank: toNumber_(r[5])
          };

        })

        .sort(function (a, b) {

          var ra = a.rank == null ? 999 : a.rank;
          var rb = b.rank == null ? 999 : b.rank;

          return ra - rb;

        });

    } else {

      out.papan = [];

    }
  }


  /* ============================================================
   * 3. ESTIMASI ENERGI
   * ============================================================ */

  var pe = ss.getSheetByName('Perhitungan_Energi');

  if (pe) {

    var lastPeRow = pe.getLastRow();

    var kWh = 0;
    var rp = 0;
    var co2 = 0;

    if (lastPeRow >= 2) {

      var jumlahEnergi = Math.min(lastPeRow - 1, 2000);

      var en = pe
        .getRange(2, 11, jumlahEnergi, 5)
        .getValues();

      en.forEach(function (r) {

        var vKwh = toNumber_(r[0]);
        var vRp = toNumber_(r[3]);
        var vCo2 = toNumber_(r[4]);

        if (vKwh !== null) {
          kWh += vKwh;
        }

        if (vRp !== null) {
          rp += vRp;
        }

        if (vCo2 !== null) {
          co2 += vCo2;
        }

      });
    }

    out.energi = {
      kWh: kWh,
      rp: rp,
      co2: co2
    };
  }


  /* ============================================================
   * 4. MUTU DATA
   * ============================================================ */

  var el = ss.getSheetByName('Error_Log');

  if (el) {

    var lastElRow = el.getLastRow();

    if (lastElRow >= 4) {

      var jumlahMutu = Math.min(lastElRow - 3, 6);

      var v = el
        .getRange(4, 2, jumlahMutu, 1)
        .getValues()
        .map(function (r) {

          return toNumber_(r[0]);

        });

      out.mutu = {

        terisi: v.length > 0 ? v[0] : null,
        duplikat: v.length > 1 ? v[1] : null,
        kurang: v.length > 2 ? v[2] : null,
        outlier: v.length > 3 ? v[3] : null,
        periksa: v.length > 4 ? v[4] : null,
        kesesuaian: v.length > 5 ? v[5] : null

      };

    } else {

      out.mutu = {};

    }
  }


  /* ============================================================
   * 5. MASTER RUANG
   * ============================================================ */

  var mr = ss.getSheetByName('Master_Ruang');

  if (mr) {

    var lastMrRow = mr.getLastRow();

    var intervensi = 0;
    var kontrol = 0;

    if (lastMrRow >= 2) {

      var jumlahRuang = Math.min(lastMrRow - 1, 2000);

      var g = mr
        .getRange(2, 8, jumlahRuang, 1)
        .getValues()

        .map(function (r) {
          return String(r[0] || '').trim().toLowerCase();
        });

      intervensi = g.filter(function (x) {
        return x === 'intervensi';
      }).length;

      kontrol = g.filter(function (x) {
        return x === 'kontrol';
      }).length;
    }

    out.ruang = {
      intervensi: intervensi,
      kontrol: kontrol
    };
  }


  /* ============================================================
   * 6. TREN MINGGUAN
   * ============================================================ */

  var tr = ss.getSheetByName('Tren_Mingguan');

  if (tr) {

    var lastTrRow = tr.getLastRow();

    if (lastTrRow >= 4) {

      var jumlahTren = lastTrRow - 3;

      var trenRaw = tr
        .getRange(4, 1, jumlahTren, 11)
        .getValues();

      out.tren = trenRaw

        .filter(function (r) {

          return r[0] !== '' && r[0] != null;

        })

        .map(function (r) {

          return {

            minggu: String(r[0]),

            sp_int: toNumber_(r[3]),
            sp_ktr: toNumber_(r[4]),

            ack_int: toNumber_(r[5]),
            ack_ktr: toNumber_(r[6]),

            pin_int: toNumber_(r[7]),
            pin_ktr: toNumber_(r[8]),

            kel_int: toNumber_(r[9]),
            kel_ktr: toNumber_(r[10])

          };

        });

    } else {

      out.tren = [];

    }
  }


  /* ============================================================
   * 7. LITERASI OZON & KIGALI
   *
   * Struktur Pre_Post:
   * A = ID_Siswa
   * B = Kelas
   * C = Kelompok
   * D = Skor_pre
   * E = Skor_post
   * F = Selisih
   * ============================================================ */

  out.literasi = {
    pre: null,
    post: null,
    delta: null
  };

  var pp = ss.getSheetByName('Pre_Post');

  if (pp) {

    var lastPPRow = pp.getLastRow();

    if (lastPPRow >= 2) {

      // getDisplayValues dipakai agar angka yang tersimpan
      // sebagai teks tetap bisa dibaca.
      var rowsPP = pp
        .getRange(2, 1, lastPPRow - 1, 6)
        .getDisplayValues();

      var intervensiPre = [];
      var intervensiPost = [];

      var semuaPre = [];
      var semuaPost = [];

      rowsPP.forEach(function (r) {

        var kelompok = String(r[2] || '')
          .trim()
          .toLowerCase();

        var pre = parseScore_(r[3]);
        var post = parseScore_(r[4]);

        if (pre !== null) {

          semuaPre.push(pre);

          if (kelompok === 'intervensi') {
            intervensiPre.push(pre);
          }

        }

        if (post !== null) {

          semuaPost.push(post);

          if (kelompok === 'intervensi') {
            intervensiPost.push(post);
          }

        }

      });

      // Prioritaskan intervensi.
      // Kalau belum ada data intervensi,
      // gunakan seluruh data yang tersedia.
      var preData = intervensiPre.length
        ? intervensiPre
        : semuaPre;

      var postData = intervensiPost.length
        ? intervensiPost
        : semuaPost;


      if (preData.length > 0) {

        out.literasi.pre =
          average_(preData);

      }

      if (postData.length > 0) {

        out.literasi.post =
          average_(postData);

      }

      if (
        out.literasi.pre !== null &&
        out.literasi.post !== null
      ) {

        out.literasi.delta =
          out.literasi.post -
          out.literasi.pre;

      }

    }

  }


  return out;
}


/* ============================================================
 * KONVERSI ANGKA
 * ============================================================ */

function toNumber_(v) {

  if (v === '' || v == null) {
    return null;
  }

  if (typeof v === 'number') {

    return isFinite(v) ? v : null;

  }

  var s = String(v)
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');

  var n = Number(s);

  return isFinite(n) ? n : null;
}


/* ============================================================
 * PARSE SKOR LITERASI
 * Mendukung:
 * 58
 * "58"
 * "58.0"
 * "58,0"
 * ============================================================ */

function parseScore_(v) {

  if (v === '' || v == null) {
    return null;
  }

  var s = String(v)
    .trim()
    .replace(',', '.');

  var n = parseFloat(s);

  return isFinite(n) ? n : null;
}


/* ============================================================
 * RATA-RATA
 * ============================================================ */

function average_(arr) {

  if (!arr || !arr.length) {
    return null;
  }

  var total = arr.reduce(function (sum, v) {

    return sum + Number(v);

  }, 0);

  return total / arr.length;
}


/* ============================================================
 * TEST API
 * Jalankan fungsi ini dari Apps Script
 * ============================================================ */

function testDashboardAPI() {

  var data = getDashboardData();

  Logger.log(JSON.stringify(data, null, 2));

  Logger.log(
    'LITERASI = ' +
    JSON.stringify(data.literasi)
  );

  Logger.log(
    'ENERGI = ' +
    JSON.stringify(data.energi)
  );

  Logger.log(
    'PAPAN = ' +
    JSON.stringify(data.papan)
  );

}


/* ============================================================
 * HEALTH CHECK
 * ============================================================ */

function healthCheck() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var hasil = [];

  hasil.push(
    'Spreadsheet: ' + ss.getName()
  );

  hasil.push(
    'Spreadsheet ID: ' + ss.getId()
  );

  hasil.push(
    'Timezone: ' +
    Session.getScriptTimeZone()
  );

  var sheets = [
    'KPI',
    'Papan_Skor',
    'Perhitungan_Energi',
    'Error_Log',
    'Master_Ruang',
    'Tren_Mingguan',
    'Pre_Post'
  ];

  sheets.forEach(function (name) {

    var sh = ss.getSheetByName(name);

    if (sh) {

      hasil.push(
        name +
        ': OK (' +
        sh.getLastRow() +
        ' rows)'
      );

    } else {

      hasil.push(
        name + ': TIDAK ADA'
      );

    }

  });

  Logger.log(
    hasil.join('\n')
  );

  return hasil.join('\n');
}