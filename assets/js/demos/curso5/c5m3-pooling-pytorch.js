/* Experimento: nn.MaxPool2d, nn.AvgPool2d y nn.AdaptiveAvgPool2d sobre un mapa de 7x7, con sus argumentos:
   kernel_size, stride (por defecto = kernel_size), padding y ceil_mode. Las cuentas siguen las reglas de PyTorch. */
(function () {
  var MAP = [[1, 3, 2, 0, 5, 1, 2],
             [4, 2, 1, 1, 3, 2, 0],
             [0, 1, 7, 2, 1, 0, 4],
             [3, 2, 1, 8, 0, 6, 1],
             [2, 0, 3, 1, 2, 1, 5],
             [1, 4, 0, 2, 6, 3, 2],
             [5, 1, 2, 0, 1, 2, 3]];

  /* longitud de salida (dilatación 1) */
  function outLen(n, k, s, p, ceil) {
    var v = (n + 2 * p - k) / s, o = (ceil ? Math.ceil(v) : Math.floor(v)) + 1;
    if (ceil && (o - 1) * s >= n + p) o -= 1;
    return o;
  }
  /* una ventana de max/avg pooling. Devuelve {vals, value, div, cells:[[i,j]...]} */
  function window2d(M, kind, k, s, p, ceil, a, b) {
    var n = M.length, hs = a * s - p, ws = b * s - p, he = Math.min(hs + k, n + p), we = Math.min(ws + k, n + p);
    var pool = (he - hs) * (we - ws), i, j, vals = [], cells = [], mx = -Infinity, sum = 0;
    hs = Math.max(hs, 0); ws = Math.max(ws, 0); he = Math.min(he, n); we = Math.min(we, n);
    for (i = hs; i < he; i++) for (j = ws; j < we; j++) { vals.push(M[i][j]); cells.push([i, j]); mx = Math.max(mx, M[i][j]); sum += M[i][j]; }
    var area = (he - hs) * (we - ws);
    return { vals: vals, cells: cells, max: mx, avg: sum / pool, avgNoPad: sum / area, pool: pool, sum: sum };
  }
  function pool2d(M, kind, k, s, p, ceil) {
    var m = outLen(M.length, k, s, p, ceil), res = [], a, b;
    for (a = 0; a < m; a++) { res.push([]); for (b = 0; b < m; b++) { var w = window2d(M, kind, k, s, p, ceil, a, b); res[a].push(kind === "max" ? w.max : w.avg); } }
    return res;
  }
  /* AdaptiveAvgPool2d(m): ventanas de inicio floor(i*n/m) y fin ceil((i+1)*n/m) */
  function adaptive(M, m) {
    var n = M.length, res = [], a, b, i, j;
    for (a = 0; a < m; a++) {
      res.push([]);
      for (b = 0; b < m; b++) {
        var r0 = Math.floor(a * n / m), r1 = Math.ceil((a + 1) * n / m), c0 = Math.floor(b * n / m), c1 = Math.ceil((b + 1) * n / m), s = 0;
        for (i = r0; i < r1; i++) for (j = c0; j < c1; j++) s += M[i][j];
        res[a].push(s / ((r1 - r0) * (c1 - c0)));
      }
    }
    return res;
  }
  function adaptiveWindow(n, m, a, b) {
    return { r0: Math.floor(a * n / m), r1: Math.ceil((a + 1) * n / m), c0: Math.floor(b * n / m), c1: Math.ceil((b + 1) * n / m) };
  }
  var core = { MAP: MAP, outLen: outLen, window2d: window2d, pool2d: pool2d, adaptive: adaptive };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-pooling-pytorch", function (root, api) {
    var D = api.d, N = 7;
    var S = { kind: "max", k: 2, sAuto: true, s: 1, p: 0, ceil: false, m: 3, win: 0 };
    function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString(); }
    function stride() { return S.sAuto ? S.k : S.s; }
    function outN() { return S.kind === "adapt" ? S.m : outLen(N, S.k, stride(), S.p, S.ceil); }

    var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: "10px", alignItems: "start" } });
    root.appendChild(grid);
    function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
    var vIn = api.view(cellDiv(), { aspect: 1, minH: 190, maxH: 330, label: "Mapa de entrada de 7 por 7 con la ventana resaltada" });
    var vOut = api.view(cellDiv(), { aspect: 1, minH: 190, maxH: 330, label: "Mapa de salida del pooling" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Capa", value: S.kind, options: [["max", "MaxPool2d"], ["avg", "AvgPool2d"], ["adapt", "AdaptiveAvg"]], onChange: function (v) { S.kind = v; S.win = 0; fix(); update(); } });
    ui.segmented({ label: "kernel_size", value: S.k, options: [[2, "2"], [3, "3"]], onChange: function (v) { S.k = v; if (S.p > Math.floor(v / 2)) S.p = Math.floor(v / 2); S.win = 0; fix(); update(); } });
    ui.segmented({ label: "stride", value: "auto", options: [["auto", "por defecto (= kernel)"], [1, "1"], [2, "2"]], onChange: function (v) { S.sAuto = v === "auto"; if (!S.sAuto) S.s = v; S.win = 0; fix(); update(); } });
    ui.segmented({ label: "padding", value: 0, options: [[0, "0"], [1, "1"]], onChange: function (v) { S.p = v; S.win = 0; fix(); update(); } });
    var slM = ui.slider({ label: "output_size (solo Adaptive)", min: 1, max: 7, step: 1, value: S.m, onInput: function (v) { S.m = v; S.win = 0; fix(); update(); } });
    var tg = ui.toggle({ label: "ceil_mode=True", value: false, onChange: function (v) { S.ceil = v; S.win = 0; fix(); update(); } });
    var slW = ui.slider({ label: "Casilla de salida", min: 0, max: 0, step: 1, value: 0, fmt: function (v) { return "nº " + (v + 1); }, onInput: function (v) { S.win = v; update(); } });

    function fix() {
      var m = outN(), tot = Math.max(1, m * m);
      slW.input.max = tot - 1; if (S.win > tot - 1) S.win = tot - 1; slW.set(S.win, true);
    }
    function cur() { var m = outN(); return m > 0 ? { a: Math.floor(S.win / m), b: S.win % m } : null; }
    function winInfo() {
      var c = cur(); if (!c) return null;
      if (S.kind === "adapt") { var w = adaptiveWindow(N, S.m, c.a, c.b); return { r0: w.r0, r1: w.r1, c0: w.c0, c1: w.c1 }; }
      var s = stride(), r0 = c.a * s - S.p, c0 = c.b * s - S.p;
      return { r0: r0, r1: Math.min(r0 + S.k, N + S.p), c0: c0, c1: Math.min(c0 + S.k, N + S.p) };
    }
    function results() {
      if (S.kind === "adapt") return adaptive(MAP, S.m);
      return pool2d(MAP, S.kind, S.k, stride(), S.p, S.ceil);
    }
    /* qué casillas de la entrada lee alguna ventana */
    function readMask() {
      var m = outN(), mask = [], i, j, a, b;
      for (i = 0; i < N; i++) { mask.push([]); for (j = 0; j < N; j++) mask[i].push(false); }
      for (a = 0; a < m; a++) for (b = 0; b < m; b++) {
        if (S.kind === "adapt") { var w = adaptiveWindow(N, S.m, a, b); for (i = w.r0; i < w.r1; i++) for (j = w.c0; j < w.c1; j++) mask[i][j] = true; }
        else window2d(MAP, S.kind, S.k, stride(), S.p, S.ceil, a, b).cells.forEach(function (c) { mask[c[0]][c[1]] = true; });
      }
      return mask;
    }

    function geom(v, cells, top) { var sz = Math.max(14, Math.min((v.w - 16) / cells, (v.h - top - 8) / cells)); return { sz: sz, x0: (v.w - sz * cells) / 2, y0: top }; }
    function drawIn(ctx, w, h, C) {
      var P = S.p, M = N + 2 * P, g = geom(vIn, M, 22), i, j, wi = winInfo(), mask = readMask();
      D.text(ctx, "Entrada " + N + "×" + N + (P ? " + marco" : ""), w / 2, 14, { size: 11, align: "center", weight: 600, color: C.ink2 });
      for (i = 0; i < M; i++) for (j = 0; j < M; j++) {
        var ri = i - P, rj = j - P, real = ri >= 0 && ri < N && rj >= 0 && rj < N, x = g.x0 + j * g.sz, y = g.y0 + i * g.sz;
        D.rect(ctx, x, y, g.sz, g.sz, real ? C.surface : C.markerWash, C.line, 1);
        if (real) {
          D.text(ctx, String(MAP[ri][rj]), x + g.sz / 2, y + g.sz / 2 + 4, { size: Math.min(14, g.sz * 0.46), align: "center", mono: true, color: mask[ri][rj] ? C.ink : C.muted });
          if (!mask[ri][rj]) { D.line(ctx, x + 3, y + 3, x + g.sz - 3, y + g.sz - 3, C.terracota, 1.5); D.line(ctx, x + g.sz - 3, y + 3, x + 3, y + g.sz - 3, C.terracota, 1.5); }
        }
      }
      if (P) D.rect(ctx, g.x0 + P * g.sz, g.y0 + P * g.sz, N * g.sz, N * g.sz, null, C.ink, 1.5);
      if (wi) {
        var r0 = Math.max(wi.r0 + P, 0), c0 = Math.max(wi.c0 + P, 0), r1 = wi.r1 + P, c1 = wi.c1 + P;
        D.rect(ctx, g.x0 + c0 * g.sz, g.y0 + r0 * g.sz, (c1 - c0) * g.sz, (r1 - r0) * g.sz, null, C.terracota, 3);
      }
    }
    function drawOut(ctx, w, h, C) {
      var m = outN(), c = cur(), i, j;
      if (m <= 0) { D.text(ctx, "no cabe ninguna ventana", w / 2, h / 2, { size: 12, align: "center", color: C.terracotaInk }); return; }
      var res = results(), g = geom(vOut, m, 22);
      D.text(ctx, "Salida " + m + "×" + m, w / 2, 14, { size: 11, align: "center", weight: 600, color: C.ink2 });
      var mx = 0; res.forEach(function (r) { r.forEach(function (v) { mx = Math.max(mx, v); }); });
      for (i = 0; i < m; i++) for (j = 0; j < m; j++) {
        var v = res[i][j], x = g.x0 + j * g.sz, y = g.y0 + i * g.sz, on = c && c.a === i && c.b === j;
        D.rect(ctx, x, y, g.sz, g.sz, C.cobaltoWash, on ? C.terracota : C.line, on ? 3 : 1);
        D.text(ctx, fmt(v), x + g.sz / 2, y + g.sz / 2 + 4, { size: Math.min(14, g.sz * 0.4), align: "center", mono: true, weight: 600, color: C.cobaltoInk });
      }
    }
    vIn.draw(drawIn); vOut.draw(drawOut);

    function update() {
      var m = outN(), c = cur(), s = stride(), code, t;
      if (S.kind === "adapt") code = "nn.AdaptiveAvgPool2d(output_size=" + S.m + ")";
      else code = "nn." + (S.kind === "max" ? "MaxPool2d" : "AvgPool2d") + "(kernel_size=" + S.k + (S.sAuto ? "" : ", stride=" + s) + (S.p ? ", padding=" + S.p : "") + (S.ceil ? ", ceil_mode=True" : "") + ")";
      t = "<code>" + code + "</code> → salida <b>" + (m > 0 ? m + "×" + m : "vacía") + "</b>";
      if (S.kind !== "adapt") {
        var v = (N + 2 * S.p - S.k) / s;
        t += "<br>" + (S.ceil ? "⌈" : "⌊") + "(" + N + " + 2·" + S.p + " − " + S.k + ") / " + s + (S.ceil ? "⌉" : "⌋") + " + 1 = " + (S.ceil ? "⌈" : "⌊") + fmt(v) + (S.ceil ? "⌉" : "⌋") + " + 1 = <b>" + m + "</b>" +
          (S.sAuto ? " &nbsp;(stride no indicado → es igual a kernel_size)" : "");
      } else t += "<br>cada casilla promedia un trozo de " + N + " dividido en " + S.m + " partes: de ⌊i·" + N + "/" + S.m + "⌋ a ⌈(i+1)·" + N + "/" + S.m + "⌉; los trozos pueden tener tamaños distintos y solaparse";
      if (c && m > 0) {
        if (S.kind === "adapt") {
          var w = adaptiveWindow(N, S.m, c.a, c.b), vals = [], i, j;
          for (i = w.r0; i < w.r1; i++) for (j = w.c0; j < w.c1; j++) vals.push(MAP[i][j]);
          t += "<br>Casilla (" + c.a + ", " + c.b + "): filas " + w.r0 + "–" + (w.r1 - 1) + ", columnas " + w.c0 + "–" + (w.c1 - 1) + " → media de " + vals.length + " valores = " + fmt(vals.reduce(function (x, y) { return x + y; }, 0)) + " / " + vals.length + " = <b>" + fmt(vals.reduce(function (x, y) { return x + y; }, 0) / vals.length) + "</b>";
        } else {
          var wd = window2d(MAP, S.kind, S.k, s, S.p, S.ceil, c.a, c.b);
          if (S.kind === "max") t += "<br>Casilla (" + c.a + ", " + c.b + "): máx(" + wd.vals.join(", ") + ") = <b>" + fmt(wd.max) + "</b>" + (S.p ? " (el marco no cuenta: es −∞)" : "");
          else t += "<br>Casilla (" + c.a + ", " + c.b + "): (" + wd.vals.join(" + ") + ") / " + wd.pool + " = <b>" + fmt(wd.avg) + "</b>" + (wd.pool !== wd.vals.length ? " (con padding, el divisor cuenta los ceros del marco: count_include_pad=True)" : "");
        }
      }
      if (S.kind !== "adapt" && m > 0) {
        var lost = readMask().reduce(function (a, r) { return a + r.filter(function (x) { return !x; }).length; }, 0);
        t += lost ? "<br><span class='bad'>" + lost + " casillas de la entrada no las lee ninguna ventana (×): con ceil_mode=False el resto se descarta.</span>" : "<br><span class='good'>Todas las casillas de la entrada se leen.</span>";
      }
      out.set(t); vIn.redraw(); vOut.redraw();
    }
    fix(); update();
  });
})();
