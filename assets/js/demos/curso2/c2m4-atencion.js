/* Experimento: mapa de self-attention de un subtítulo de 6 tokens («El detective astuto persigue al ladrón»). Q, K, V se calculan de verdad con matrices pequeñas
   ELEGIDAS A MANO (no entrenadas) para que el mecanismo se vea. Cada token es un vector [sustantivo, verbo, modificador, cos(pos), sin(pos)]. */
Lab.register("curso2/c2m4-atencion", function (root, api) {
  var D = api.d, C0 = api.colors();
  var TOK = ["El", "detective", "astuto", "persigue", "al", "ladrón"];
  var ROLE = [[0, 0, 1], [1, 0, 0], [0, 0, 1], [0, 1, 0], [0, 0, 1], [1, 0, 0]];   // [N, V, M]
  var OMEGA = 0.5, N = TOK.length, DK = 3;
  var S = { head: 0, q: 3, T: 1, causal: false, pos: true };

  // Matrices de cada cabeza (filas = rasgos [N, V, M, cos, sin]; columnas = dimensiones de q o k)
  var HEADS = [
    { name: "Cabeza 1: los modificadores y los verbos buscan un sustantivo cercano",
      WQ: [[0, 0, 0], [3, 0, 0], [4, 0, 0], [0, 1, 0], [0, 0, 1]],
      WK: [[1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 1, 0], [0, 0, 1]] },
    { name: "Cabeza 2: los sustantivos buscan al verbo",
      WQ: [[4, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0.7, 0], [0, 0, 0.7]],
      WK: [[0, 0, 0], [1, 0, 0], [0, 0, 0], [0, 0.7, 0], [0, 0, 0.7]] }
  ];
  var WV = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0], [0, 0, 0]];     // V = [N, V, M] (copia los 3 rasgos de rol)

  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function embed(i) {
    var r = ROLE[i], c = S.pos ? Math.cos(OMEGA * i) : 0, s = S.pos ? Math.sin(OMEGA * i) : 0;
    return [r[0], r[1], r[2], c, s];
  }
  function vecmat(x, W) { var o = [], j, k; for (j = 0; j < W[0].length; j++) { var s = 0; for (k = 0; k < x.length; k++) s += x[k] * W[k][j]; o.push(s); } return o; }
  var R;
  function compute() {
    var H = HEADS[S.head], X = [], Q = [], K = [], V = [], i, j;
    for (i = 0; i < N; i++) { var x = embed(i); X.push(x); Q.push(vecmat(x, H.WQ)); K.push(vecmat(x, H.WK)); V.push(vecmat(x, WV)); }
    var raw = [], sc = [], A = [];
    for (i = 0; i < N; i++) {
      var r = [], s2 = [];
      for (j = 0; j < N; j++) { var d = 0, k; for (k = 0; k < DK; k++) d += Q[i][k] * K[j][k]; r.push(d); s2.push(d / Math.sqrt(DK)); }
      raw.push(r); sc.push(s2);
      var m = -Infinity; for (j = 0; j < N; j++) if (!(S.causal && j > i)) m = Math.max(m, s2[j] / S.T);
      var e = [], tot = 0;
      for (j = 0; j < N; j++) { var ev = (S.causal && j > i) ? 0 : Math.exp(s2[j] / S.T - m); e.push(ev); tot += ev; }
      A.push(e.map(function (v) { return v / tot; }));
    }
    var O = A.map(function (row) { var o = [0, 0, 0]; row.forEach(function (w, jj) { for (var k = 0; k < 3; k++) o[k] += w * V[jj][k]; }); return o; });
    R = { Q: Q, K: K, V: V, raw: raw, sc: sc, A: A, O: O };
  }

  var view = api.view(root, { aspect: 1.35, minH: 300, maxH: 430, drag: false, label: "Mapa de atención: filas = tokens que consultan, columnas = tokens consultados; más oscuro = más peso" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var segHead = ui.segmented({ label: "Cabeza de atención", value: 0, options: [[0, "Cabeza 1"], [1, "Cabeza 2"]], onChange: function (v) { S.head = v; update(); } });
  var selQ = ui.select({ label: "Token que consulta (fila)", value: S.q, options: TOK.map(function (t, i) { return [i, t]; }), onChange: function (v) { S.q = parseInt(v, 10); update(); } });
  ui.slider({ label: "Temperatura del softmax (T)", min: 0.2, max: 3, step: 0.05, value: S.T, fmt: function (v) { return n(v, 2); }, onInput: function (v) { S.T = v; update(); } });
  ui.toggle({ label: "Máscara causal (decoder: no mirar al futuro)", value: S.causal, onChange: function (v) { S.causal = v; update(); } });
  ui.toggle({ label: "Con información de posición", value: S.pos, onChange: function (v) { S.pos = v; update(); } });
  var tab = api.table(root, ["token", "clave k", "q·k", "÷ √3", "peso"]);

  function geom(w, h) {
    var L = Math.min(76, Math.max(50, 12 + 6.4 * 9 * (w < 460 ? 0.9 : 1))), T = 40, cell = Math.min((w - L - 8) / N, (h - T - 8) / N, 84);
    return { L: L + Math.max(0, (w - L - 8 - cell * N) / 2), T: T, cell: cell };
  }
  function draw(ctx, w, h, C) {
    var g = geom(w, h), i, j;
    D.text(ctx, "claves K →", g.L, 14, { size: 10.5, color: C.muted });
    D.text(ctx, "consulta Q ↓", 4, 14 + 14, { size: 10.5, color: C.muted });
    var fs = g.cell < 60 ? 10 : 11.5;
    for (j = 0; j < N; j++) D.text(ctx, TOK[j], g.L + g.cell * (j + 0.5), g.T - 8, { size: fs, align: "center", weight: 600, color: C.ink });
    for (i = 0; i < N; i++) {
      D.text(ctx, TOK[i], g.L - 6, g.T + g.cell * (i + 0.5) + 4, { size: fs, align: "right", weight: i === S.q ? 700 : 500, color: i === S.q ? C.terracotaInk : C.ink });
      for (j = 0; j < N; j++) {
        var x = g.L + g.cell * j, y = g.T + g.cell * i, masked = S.causal && j > i, v = R.A[i][j];
        D.rect(ctx, x, y, g.cell, g.cell, C.surface, C.line, 1);
        if (masked) {
          ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + g.cell - 4); ctx.lineTo(x + g.cell - 4, y + 4); ctx.stroke(); ctx.restore();
        } else {
          ctx.save(); ctx.globalAlpha = Math.min(1, 0.08 + v * 0.92); ctx.fillStyle = C.cobalto; ctx.fillRect(x + 1, y + 1, g.cell - 2, g.cell - 2); ctx.restore();
          if (g.cell >= 36) D.text(ctx, n(v, 2), x + g.cell / 2, y + g.cell / 2 + 4, { size: g.cell >= 52 ? 12 : 10.5, mono: true, align: "center", color: v > 0.45 ? C.paper : C.ink });
        }
      }
    }
    D.rect(ctx, g.L, g.T + g.cell * S.q, g.cell * N, g.cell, null, C.terracota, 3);
    D.rect(ctx, g.L, g.T, g.cell * N, g.cell * N, null, C.ink, 1.5);
  }
  view.pointer({ down: function (px, py) {
    var g = geom(view.w, view.h), i = Math.floor((py - g.T) / g.cell);
    if (i >= 0 && i < N && px < g.L + g.cell * N) { S.q = i; selQ.set(i); update(); }
  } });
  compute();
  view.draw(draw);

  function update() {
    compute();
    view.redraw();
    var i = S.q, rows = [], j, best = 0;
    for (j = 0; j < N; j++) {
      rows.push([TOK[j], "(" + R.K[j].map(function (v) { return n(v, 2); }).join("; ") + ")", n(R.raw[i][j], 2), n(R.sc[i][j], 2),
        (S.causal && j > i) ? "<i>tapado</i>" : "<b>" + n(R.A[i][j], 3) + "</b>"]);
      if (R.A[i][j] > R.A[i][best]) best = j;
    }
    tab.set(rows);
    var o = R.O[i];
    out.set(HEADS[S.head].name + "<br>" +
      "q(" + TOK[i] + ") = (" + R.Q[i].map(function (v) { return n(v, 2); }).join("; ") + ")  →  mira sobre todo a <b>" + TOK[best] + "</b> (peso <b>" + n(R.A[i][best], 3) + "</b>)<br>" +
      "salida = Σ peso·V = [sustantivo <b>" + n(o[0], 2) + "</b>, verbo <b>" + n(o[1], 2) + "</b>, modificador <b>" + n(o[2], 2) + "</b>]" +
      (!S.pos ? "<br><span class='bad'>Sin posición, «El» no distingue entre «detective» y «ladrón»: ve las mismas palabras en cualquier orden.</span>" : "") +
      (S.T < 0.5 ? "<br>T baja: el reparto se concentra en un solo token." : S.T > 1.8 ? "<br>T alta: el reparto se aplana hacia lo uniforme." : ""));
  }
  update();
});
