/* Experimento: ampliar una imagen 4×4 a 8×8 con distintos métodos. Se ve que la convolución transpuesta
   GENERALIZA la interpolación: con ciertos kernels es idéntica a "nearest" o a "bilinear". */
Lab.register("curso3/c3m2-upsampling-comparado", function (root, api) {
  var N = 4;
  var X = [];
  var st = { a: "nearest", b: "t22", img: "diag" };
  var rg = api.rng(11);
  var learned = (function () {
    var K = [], i, j, sum = 0, r = api.rng(5);
    for (i = 0; i < 4; i++) { K.push([]); for (j = 0; j < 4; j++) { var v = r.range(-0.4, 1.2); K[i].push(v); sum += v; }
    }
    var f = 4 / sum; return K.map(function (row) { return row.map(function (v) { return v * f; }); });
  })();

  function mk(n, f) { var a = [], i, j; for (i = 0; i < n; i++) { a.push([]); for (j = 0; j < n; j++) a[i].push(f(i, j)); } return a; }
  function setImg(name) {
    if (name === "diag") X = mk(N, function (i, j) { return i === j ? 9 : (Math.abs(i - j) === 1 ? 4 : 1); });
    else if (name === "cruz") X = mk(N, function (i, j) { return (i === 1 || i === 2 || j === 1 || j === 2) ? ((i === 1 || i === 2) && (j === 1 || j === 2) ? 9 : 6) : 1; });
    else if (name === "tablero") X = mk(N, function (i, j) { return (i + j) % 2 ? 9 : 1; });
    else if (name === "rampa") X = mk(N, function (i, j) { return Math.round(1 + (i + j) * 8 / 6); });
    else X = mk(N, function () { return rg.int(0, 9); });
  }

  function nearest(x) { return mk(2 * N, function (i, j) { return x[i >> 1][j >> 1]; }); }
  function bilinear(x) {
    function idx(o) { var s = (o + 0.5) / 2 - 0.5; s = Math.max(0, Math.min(N - 1, s)); var i0 = Math.floor(s), i1 = Math.min(N - 1, i0 + 1); return [i0, i1, s - i0]; }
    return mk(2 * N, function (i, j) {
      var a = idx(i), b = idx(j);
      var top = x[a[0]][b[0]] * (1 - b[2]) + x[a[0]][b[1]] * b[2], bot = x[a[1]][b[0]] * (1 - b[2]) + x[a[1]][b[1]] * b[2];
      return top * (1 - a[2]) + bot * a[2];
    });
  }
  function convT(x, K, s) {          /* Conv2DTranspose, padding="same" (recorte como Keras) */
    var k = K.length, n = x.length, F = (n - 1) * s + k, full = mk(F, function () { return 0; }), i, j, a, b;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (a = 0; a < k; a++) for (b = 0; b < k; b++) full[i * s + a][j * s + b] += x[i][j] * K[a][b];
    var T = Math.max(k - s, 0), cs = Math.floor(T / 2);
    return mk(n * s, function (r, c) { return full[r + cs][c + cs]; });
  }
  var tri = [0.25, 0.75, 0.75, 0.25];
  var METHODS = {
    nearest: { name: "UpSampling2D · nearest", f: function (x) { return nearest(x); } },
    bilinear: { name: "UpSampling2D · bilinear", f: function (x) { return bilinear(x); } },
    t22: { name: "Conv2DTranspose k=2, s=2, kernel de unos", f: function (x) { return convT(x, mk(2, function () { return 1; }), 2); } },
    t42: { name: "Conv2DTranspose k=4, s=2, kernel triangular", f: function (x) { return convT(x, mk(4, function (i, j) { return tri[i] * tri[j]; }), 2); } },
    t32: { name: "Conv2DTranspose k=3, s=2, kernel uniforme", f: function (x) { return convT(x, mk(3, function () { return 4 / 9; }), 2); } },
    tl: { name: "Conv2DTranspose k=4, s=2, kernel «aprendido» (aleatorio)", f: function (x) { return convT(x, learned, 2); } }
  };
  var opts = Object.keys(METHODS).map(function (k) { return [k, METHODS[k].name]; });

  setImg("diag");
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vX = api.view(cellDiv(), { aspect: 1, minH: 190, maxH: 280, label: "Imagen pequeña 4 por 4" });
  var vA = api.view(cellDiv(), { aspect: 1, minH: 190, maxH: 280, label: "Método A, 8 por 8" });
  var vB = api.view(cellDiv(), { aspect: 1, minH: 190, maxH: 280, label: "Método B, 8 por 8" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Imagen 4×4 (toca una casilla para cambiarla)", options: [["diag", "Diagonal"], ["cruz", "Cruz"], ["tablero", "Tablero"], ["rampa", "Rampa"], ["rnd", "Aleatoria"]], value: "diag", onChange: function (v) { st.img = v; setImg(v); update(); } });
  ui.select({ label: "Método A", options: opts, value: st.a, onChange: function (v) { st.a = v; update(); } });
  ui.select({ label: "Método B", options: opts, value: st.b, onChange: function (v) { st.b = v; update(); } });

  function geom(w, h, n) { var sz = Math.max(8, Math.min((w - 10) / n, (h - 34) / n)); return { sz: sz, x: (w - sz * n) / 2, y: 28 }; }
  function paint(view, data, title, vmax, editable) {
    view.draw(function (ctx, w, h, C) {
      var D = api.d, n = data.length, g = geom(w, h, n), i, j;
      D.text(ctx, title, w / 2, 14, { size: Math.min(11, w / 22), weight: 600, align: "center", color: C.ink2 });
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        var v = data[i][j], x = g.x + j * g.sz, y = g.y + i * g.sz, t = Math.max(0, Math.min(1, v / vmax));
        D.rect(ctx, x, y, g.sz, g.sz, C.surface);
        ctx.save(); ctx.globalAlpha = 0.06 + 0.94 * t; D.rect(ctx, x, y, g.sz, g.sz, C.cobalto); ctx.restore();
        D.rect(ctx, x, y, g.sz, g.sz, null, C.line, 0.5);
        if (g.sz >= 24) D.text(ctx, (Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(1)), x + g.sz / 2, y + g.sz / 2 + 4, { size: Math.min(12, g.sz * 0.36), align: "center", mono: true, weight: 600, color: t > 0.55 ? C.paper : C.ink });
      }
      D.rect(ctx, g.x, g.y, g.sz * n, g.sz * n, null, C.ink, 1.5);
    });
  }
  vX.pointer({ down: function (px, py) {
    var g = geom(vX.w, vX.h, N), i = Math.floor((py - g.y) / g.sz), j = Math.floor((px - g.x) / g.sz);
    if (i >= 0 && i < N && j >= 0 && j < N) { X[i][j] = (X[i][j] + 1) % 10; update(); }
  } });

  function update() {
    var A = METHODS[st.a].f(X), B = METHODS[st.b].f(X), vmax = 9, i, j, mx = 0, mxIn = 0, me = 0;
    paint(vX, X, "Entrada 4×4", vmax);
    paint(vA, A, "A · 8×8", vmax);
    paint(vB, B, "B · 8×8", vmax);
    for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) {
      var d = Math.abs(A[i][j] - B[i][j]); if (d > mx) mx = d;
      if (i >= 1 && i < 7 && j >= 1 && j < 7 && d > mxIn) mxIn = d;
    }
    var html = "A = <b>" + METHODS[st.a].name + "</b><br>B = <b>" + METHODS[st.b].name + "</b><br>";
    html += "Diferencia máxima |A − B|: en toda la imagen <b>" + mx.toFixed(3) + "</b> · sin contar el borde <b>" + mxIn.toFixed(3) + "</b><br>";
    if (mx < 1e-9) html += "<span class='good'>Los dos métodos producen EXACTAMENTE la misma imagen.</span>";
    else if (mxIn < 1e-9) html += "<span class='good'>Idénticos en el interior</span>; solo se distinguen en el borde (la transpuesta rellena con ceros, la interpolación repite el borde).";
    else html += "<span class='bad'>Son métodos distintos.</span> Prueba nearest frente a «k=2, s=2, kernel de unos», o bilinear frente a «k=4, kernel triangular».";
    out.set(html);
  }
  update();
});
