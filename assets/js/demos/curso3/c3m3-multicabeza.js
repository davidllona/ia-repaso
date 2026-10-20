/* Experimento: atención multi-cabeza. Cuatro cabezas con matrices ELEGIDAS A MANO (no entrenadas) calculan de verdad q·k sobre una frase de 6 tokens;
   cada una mira a algo distinto. El número de cabezas h reparte d_model = 64 en h trozos de d_k = 64/h sin cambiar el número de parámetros. */
Lab.register("curso3/c3m3-multicabeza", function (root, api) {
  var D = api.d, TOK = ["la", "niña", "pequeña", "ve", "una", "película"], N = 6;
  var TIPO = ["det", "nom", "adj", "ver", "det", "nom"];   // tipo de palabra
  var DMODEL = 64, S = { h: 4, q: 2 };
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function sm(a) { var m = Math.max.apply(null, a), e = a.map(function (v) { return Math.exp(v - m); }), s = 0; e.forEach(function (v) { s += v; }); return e.map(function (v) { return v / s; }); }
  var is = function (i, t) { return TIPO[i] === t ? 1 : 0; };
  function rot(i, th, g) { return [g * Math.cos(th * i), g * Math.sin(th * i)]; }
  // Cada cabeza: vectores q_i y k_j (pequeños) construidos con rasgos del token y su posición
  var HEADS = [
    { name: "anterior", desc: "mira al token de justo antes",
      q: function (i) { return rot(i, 1.1, 2.2); }, k: function (j) { return rot(j + 1, 1.1, 2.2); } },
    { name: "→ sustantivo", desc: "determinantes y adjetivos buscan su sustantivo cercano",
      q: function (i) { return [2.6 * (is(i, "det") + is(i, "adj"))].concat(rot(i, 0.55, 1.5)); }, k: function (j) { return [2.6 * is(j, "nom")].concat(rot(j, 0.55, 1.5)); } },
    { name: "→ verbo", desc: "los sustantivos miran al verbo",
      q: function (i) { return [2.8 * is(i, "nom")].concat(rot(i, 0.4, 1.2)); }, k: function (j) { return [2.8 * is(j, "ver")].concat(rot(j, 0.4, 1.2)); } },
    { name: "global", desc: "reparte la atención por igual",
      q: function () { return [0, 0]; }, k: function () { return [0, 0]; } }
  ];
  function attn(hd) {
    var A = [], i, j;
    for (i = 0; i < N; i++) { var qi = hd.q(i), row = []; for (j = 0; j < N; j++) { var kj = hd.k(j), s = 0; for (var d = 0; d < qi.length; d++) s += qi[d] * kj[d]; row.push(s / Math.sqrt(qi.length)); } A.push(sm(row)); }
    return A;
  }
  var MAPS = HEADS.map(attn);
  var narrow = (root.clientWidth || window.innerWidth) < 560;
  var view = api.view(root, { aspect: narrow ? 0.85 : 3.0, minH: narrow ? 400 : 250, maxH: narrow ? 470 : 300, drag: false, label: "Mapas de atención de varias cabezas sobre el subtítulo «la niña pequeña ve una película»" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  ui.segmented({ label: "Número de cabezas h", value: 4, options: [[1, "1"], [2, "2"], [3, "3"], [4, "4"]], onChange: function (v) { S.h = v; update(); } });
  ui.select({ label: "Token que consulta", value: S.q, options: TOK.map(function (t, k) { return [k, (k + 1) + " · " + t]; }), onChange: function (v) { S.q = parseInt(v, 10); update(); } });

  function layout(w, h) {
    var cols = w >= 560 ? Math.min(S.h, 4) : Math.min(S.h, 2), rows = Math.ceil(S.h / cols), gap = 14, top = 22;
    var cell = Math.min(Math.floor((w - 14 - gap * (cols - 1)) / cols / N), Math.floor((h - top - 20 * rows - gap * (rows - 1)) / rows / N), 44);
    var mw = cell * N, x0 = (w - (mw * cols + gap * (cols - 1))) / 2;
    return { cols: cols, rows: rows, gap: gap, top: top, cell: Math.max(cell, 14), mw: mw, x0: x0 };
  }
  view.draw(function (ctx, w, h, C) {
    var g = layout(w, h), k, i, j;
    D.text(ctx, TOK.map(function (t, a) { return (a + 1) + " " + t; }).join(w < 420 ? "  " : "   "), w / 2, 12, { size: w < 420 ? 9.5 : 11, align: "center", color: C.ink2, mono: true });
    for (k = 0; k < S.h; k++) {
      var cx = g.x0 + (k % g.cols) * (g.mw + g.gap), cy = g.top + 18 + Math.floor(k / g.cols) * (g.mw + 20 + g.gap), A = MAPS[k];
      D.text(ctx, "Cabeza " + (k + 1) + ": " + HEADS[k].name, cx + g.mw / 2, cy - 6, { size: 11, align: "center", weight: 600, color: C.ink });
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var x = cx + j * g.cell, y = cy + i * g.cell, v = A[i][j];
        D.rect(ctx, x, y, g.cell, g.cell, C.surface, C.line, 1);
        ctx.save(); ctx.globalAlpha = Math.min(1, 0.05 + v * 0.95); ctx.fillStyle = C.cobalto; ctx.fillRect(x + 1, y + 1, g.cell - 2, g.cell - 2); ctx.restore();
        if (g.cell >= 22) D.text(ctx, String(Math.round(v * 100)), x + g.cell / 2, y + g.cell / 2 + 3.5, { size: 9.5, mono: true, align: "center", color: v > 0.5 ? C.paper : C.ink });
      }
      for (i = 0; i < N; i++) { D.text(ctx, String(i + 1), cx - 4, cy + i * g.cell + g.cell / 2 + 4, { size: 9.5, align: "right", color: i === S.q ? C.terracotaInk : C.muted, weight: i === S.q ? 700 : 400 }); D.text(ctx, String(i + 1), cx + i * g.cell + g.cell / 2, cy + N * g.cell + 11, { size: 9.5, align: "center", color: C.muted }); }
      D.rect(ctx, cx, cy + S.q * g.cell, g.mw, g.cell, null, C.terracota, 2.5);
    }
    D.text(ctx, "casillas = peso en %; fila naranja = el token que consulta", w / 2, h - 5, { size: 10, align: "center", color: C.muted });
  });
  view.pointer({ down: function (px, py) {
    var g = layout(view.w, view.h), k, cx, cy;
    for (k = 0; k < S.h; k++) {
      cx = g.x0 + (k % g.cols) * (g.mw + g.gap); cy = g.top + 18 + Math.floor(k / g.cols) * (g.mw + 20 + g.gap);
      if (px >= cx && px <= cx + g.mw && py >= cy && py <= cy + g.mw) { S.q = Math.floor((py - cy) / g.cell); update(); return; }
    }
  } });
  function update() {
    view.redraw();
    var dk = DMODEL / S.h, par = 4 * DMODEL * DMODEL + 4 * DMODEL, lines = [], k;
    for (k = 0; k < S.h; k++) {
      var row = MAPS[k][S.q], b = 0; row.forEach(function (v, j) { if (v > row[b]) b = j; });
      lines.push("Cabeza " + (k + 1) + " (" + HEADS[k].name + "): " + (row[b] < 0.3 ? "«" + TOK[S.q] + "» reparte casi por igual (el máximo es «" + TOK[b] + "», " + n(row[b] * 100, 0) + " %)" : "«" + TOK[S.q] + "» mira sobre todo a <b>«" + TOK[b] + "»</b> (" + n(row[b] * 100, 0) + " %)"));
    }
    out.set(lines.join("<br>") + "<br>Con d_model = <b>" + DMODEL + "</b> y h = <b>" + S.h + "</b>: cada cabeza trabaja con d_k = " + DMODEL + " / " + S.h + " = <b>" + dk + "</b>; se concatenan " + S.h + " × " + dk + " = <b>" + (S.h * dk) + "</b> números y W_O los mezcla.<br>Parámetros de la capa: 4·" + DMODEL + "² + 4·" + DMODEL + " = <b>" + par.toLocaleString("es-ES") + "</b> (los mismos con cualquier h).");
  }
  update();
});
