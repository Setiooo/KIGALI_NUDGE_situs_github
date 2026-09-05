/* KIGALI NUDGE - frontend. Ambil data dari Apps Script (JSONP) lalu tampilkan. */
(function () {
  var CFG = window.KIGALI_CONFIG || {};
  var SAMPLE = {
    updated: 'contoh',
    kpi: { setpoint: { intB: 22.2, intP: 24.3, ktB: 22.0, ktP: 22.5, dInt: 2.1, did: 1.58 },
           ackosong: { did: -1.0 }, pintu: { did: 1.0 }, keluhan: { did: 0.17 } },
    papan: [{ kelas: '7B', skor: 0.86, rank: 1 }, { kelas: '7A', skor: 0.81, rank: 2 },
            { kelas: '7C', skor: 0.74, rank: 3 }, { kelas: '7D', skor: 0.69, rank: 4 }],
    energi: { kWh: 594, rp: 891000, co2: 416 },
    mutu: { terisi: 120, periksa: 3, kesesuaian: 0.88 }, ruang: { intervensi: 3, kontrol: 3 },
    tren: [
      { minggu: 'Minggu 1', sp_int: 22.25, sp_ktr: 22.0, ack_int: 1.0, ack_ktr: 1.0, pin_int: 0.0, pin_ktr: 0.0 },
      { minggu: 'Minggu 2', sp_int: 24.33, sp_ktr: 22.5, ack_int: 0.0, ack_ktr: 1.0, pin_int: 1.0, pin_ktr: 0.0 },
      { minggu: 'Minggu 3', sp_int: 24.5, sp_ktr: 22.5, ack_int: 0.0, ack_ktr: 1.0, pin_int: 1.0, pin_ktr: 0.0 }
    ]
  };
  var num = function (v) { return typeof v === 'number' && isFinite(v); };
  function $(id) { return document.getElementById(id); }
  function nf(v, d) { return num(v) ? v.toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : '0'; }
  function pctS(v) { return num(v) ? (v >= 0 ? '+' : '') + Math.round(v * 100) + '%' : '0'; }
  function pctP(v) { return num(v) ? Math.round(v * 100) + '%' : '0'; }
  function degS(v) { return num(v) ? (v >= 0 ? '+' : '') + v.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '°C' : '0'; }
  function setW(id, v) { $(id).style.width = (num(v) ? Math.max(0, Math.min(100, v / 30 * 100)) : 0) + '%'; }

  function setStatus(live) {
    var c = $('status');
    $('status-t').textContent = live ? 'Live' : 'Contoh';
    c.className = live ? 'chip' : 'chip off';
  }

  function fill(d, live) {
    setStatus(!!live);
    if (!d) d = SAMPLE;
    if (CFG.sekolah) $('sekolah').textContent = CFG.sekolah;
    $('updated').textContent = d.updated || 'contoh';

    var k = d.kpi || {};
    $('kpi-setpoint').textContent = degS(k.setpoint && k.setpoint.did);
    $('kpi-ackosong').textContent = pctS(k.ackosong && k.ackosong.did);
    $('kpi-pintu').textContent = pctS(k.pintu && k.pintu.did);

    var s = k.setpoint || {};
    $('v-intB').textContent = nf(s.intB, 1); setW('b-intB', s.intB);
    $('v-intP').textContent = nf(s.intP, 1); setW('b-intP', s.intP);
    $('v-ktB').textContent = nf(s.ktB, 1); setW('b-ktB', s.ktB);
    $('v-ktP').textContent = nf(s.ktP, 1); setW('b-ktP', s.ktP);

    var tb = $('papan'); tb.innerHTML = '';
    (d.papan || []).forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="rank">' + (r.rank != null ? r.rank : '') + '</td><td>' + r.kelas +
        '</td><td class="tnum">' + (num(r.skor) ? Math.round(r.skor * 100) + '%' : '') + '</td>';
      tb.appendChild(tr);
    });
    if (!tb.children.length) tb.innerHTML = '<tr><td colspan="3">belum ada data</td></tr>';

    var e = d.energi || {};
    $('en-kwh').innerHTML = nf(e.kWh, 0) + ' <span class="u">kWh</span>';
    $('en-rp').innerHTML = '<span class="u">Rp</span> ' + nf(e.rp, 0);
    $('en-co2').innerHTML = nf(e.co2, 0) + ' <span class="u">kg</span>';

    var m = d.mutu || {};
    $('mt-sesuai').textContent = num(m.kesesuaian) ? Math.round(m.kesesuaian * 100) + '%' : '0';
    $('mt-periksa').textContent = nf(m.periksa, 0);
    $('mt-terisi').textContent = nf(m.terisi, 0);

    renderTren(d.tren || []);
  }

  function svgLineChart(rows, gInt, gKtr, ymin, ymax) {
    var W = 560, H = 250, padL = 34, padR = 52, padT = 16, padB = 30;
    var n = rows.length, pw = W - padL - padR, ph = H - padT - padB, baseY = padT + ph;
    var xAt = function (i) { return padL + (n <= 1 ? pw / 2 : pw * i / (n - 1)); };
    var yAt = function (v) { return padT + ph * (1 - (v - ymin) / (ymax - ymin)); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="tren mingguan">';
    var i, gv, gy;
    for (i = 0; i <= 4; i++) {
      gv = ymin + (ymax - ymin) * i / 4; gy = yAt(gv);
      s += '<line class="c-grid" x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '"/>';
      s += '<text class="c-axis" x="' + (padL - 6) + '" y="' + (gy + 3) + '" text-anchor="end">' + gv.toFixed(0) + '</text>';
    }
    var ip = []; rows.forEach(function (r, i) { var v = gInt(r); if (num(v)) ip.push({ x: xAt(i), y: yAt(v) }); });
    if (ip.length) {
      var area = 'M' + ip[0].x + ',' + baseY + ' L' + ip.map(function (p) { return p.x + ',' + p.y; }).join(' L') + ' L' + ip[ip.length - 1].x + ',' + baseY + ' Z';
      s += '<path class="c-area-int" d="' + area + '"/>';
    }
    function series(get, lineC, dotC) {
      var pts = []; rows.forEach(function (r, i) { var v = get(r); if (num(v)) pts.push(xAt(i) + ',' + yAt(v)); });
      var out = '<polyline class="' + lineC + '" points="' + pts.join(' ') + '"/>';
      rows.forEach(function (r, i) { var v = get(r); if (num(v)) out += '<circle class="' + dotC + '" cx="' + xAt(i) + '" cy="' + yAt(v) + '" r="4.5"/>'; });
      return out;
    }
    s += series(gKtr, 'c-line-ktr', 'c-dot-ktr') + series(gInt, 'c-line-int', 'c-dot-int');
    // label nilai di titik akhir
    function endLabel(get, dy) {
      for (var i = rows.length - 1; i >= 0; i--) { var v = get(rows[i]); if (num(v)) { return '<text class="c-val" x="' + (xAt(i) + 8) + '" y="' + (yAt(v) + dy) + '">' + v.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '</text>'; } }
      return '';
    }
    s += endLabel(gInt, -6) + endLabel(gKtr, 14);
    rows.forEach(function (r, i) {
      var a = (i === 0) ? 'start' : (i === n - 1) ? 'end' : 'middle';
      s += '<text class="c-axis" x="' + xAt(i) + '" y="' + (H - 10) + '" text-anchor="' + a + '">' + r.minggu + '</text>';
    });
    return s + '</svg>';
  }

  function renderTren(tren) {
    var box = $('tren-chart'), tb = $('tren-tbody');
    if (!tren.length) { if (box) box.innerHTML = '<p class="lbl">belum ada data mingguan</p>'; if (tb) tb.innerHTML = ''; return; }
    if (box) box.innerHTML = svgLineChart(tren, function (r) { return r.sp_int; }, function (r) { return r.sp_ktr; }, 20, 26);
    if (tb) {
      tb.innerHTML = '';
      var d1 = function (a, b) { return (num(a) ? a.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '0') + ' / ' + (num(b) ? b.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '0'); };
      var dp = function (a, b) { return (num(a) ? Math.round(a * 100) + '%' : '0') + ' / ' + (num(b) ? Math.round(b * 100) + '%' : '0'); };
      tren.forEach(function (r) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + r.minggu + '</td><td class="tnum">' + d1(r.sp_int, r.sp_ktr) +
          '</td><td class="tnum">' + dp(r.ack_int, r.ack_ktr) + '</td><td class="tnum">' + dp(r.pin_int, r.pin_ktr) + '</td>';
        tb.appendChild(tr);
      });
    }
  }

  var timer;
  window.__kigaliCb = function (data) { clearTimeout(timer); fill(data, true); };
  function load() {
    var url = CFG.apiUrl;
    if (!url || url.indexOf('PASTE_URL') === 0) { fill(SAMPLE, false); return; }
    var old = $('jsonp'); if (old) old.remove();
    var sc = document.createElement('script'); sc.id = 'jsonp';
    sc.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'callback=__kigaliCb&t=' + Date.now();
    sc.onerror = function () { fill(SAMPLE, false); };
    document.body.appendChild(sc);
    timer = setTimeout(function () { fill(SAMPLE, false); }, 8000);
  }
  window.addEventListener('DOMContentLoaded', function () {
    var b = $('refresh'); if (b) b.addEventListener('click', load);
    load();
    if (CFG.autoRefreshDetik && CFG.autoRefreshDetik >= 10) setInterval(load, CFG.autoRefreshDetik * 1000);
  });
})();
