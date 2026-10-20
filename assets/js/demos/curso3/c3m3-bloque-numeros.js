/* Experimento: un bloque Transformer con NÚMEROS REALES (4 tokens = 4 películas de tu historial, d_model = 4, 2 cabezas, d_ff = 8, pesos aleatorios con semilla, sin sesgos).
   Se recorre paso a paso en versión post-LN (la del artículo y la de nuestro código) o pre-LN, con o sin conexión residual. */
Lab.register("curso3/c3m3-bloque-numeros", function (root, api) {
  var D = api.d, N = 4, DM = 4, H = 2, DK = 2, FF = 8;
  var S = { pre: false, res: true, step: 0 };
  var r = api.rng(7);
  function mat(a, b, s) { var m = [], i, j; for (i = 0; i < a; i++) { m.push([]); for (j = 0; j < b; j++) m[i].push(r.normal(0, s)); } return m; }
  var X = mat(N, DM, 1); X[2] = X[2].map(function (v) { return v * 3; });
  var Wq = mat(DM, DM, 0.7), Wk = mat(DM, DM, 0.7), Wv = mat(DM, DM, 0.7), Wo = mat(DM, DM, 0.7), W1 = mat(DM, FF, 0.6), W2 = mat(FF, DM, 0.5);
  function mm(A, B2) { return A.map(function (row) { return B2[0].map(function (_, j) { return row.reduce(function (s, v, k) { return s + v * B2[k][j]; }, 0); }); }); }
  function add(A, B2) { return A.map(function (row, i) { return row.map(function (v, j) { return v + B2[i][j]; }); }); }
  function ln(A) { return A.map(function (row) { var m = row.reduce(function (s, v) { return s + v; }, 0) / row.length, va = row.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / row.length; return row.map(function (v) { return (v - m) / Math.sqrt(va + 1e-6); }); }); }
  function sm(a) { var m = Math.max.apply(null, a), e = a.map(function (v) { return Math.exp(v - m); }), s = e.reduce(function (x, y) { return x + y; }, 0); return e.map(function (v) { return v / s; }); }
  function mha(A) {
    var Q = mm(A, Wq), K = mm(A, Wk), V = mm(A, Wv), heads = [], maps = [], h, i, j, k;
    for (h = 0; h < H; h++) {
      var sc = [], O = [];
      for (i = 0; i < N; i++) { var row = []; for (j = 0; j < N; j++) { var s = 0; for (k = 0; k < DK; k++) s += Q[i][h * DK + k] * K[j][h * DK + k]; row.push(s / Math.sqrt(DK)); } sc.push(sm(row)); }
      for (i = 0; i < N; i++) { O.push([]); for (k = 0; k < DK; k++) { var s2 = 0; for (j = 0; j < N; j++) s2 += sc[i][j] * V[j][h * DK + k]; O[i].push(s2); } }
      heads.push(O); maps.push(sc);
    }
    var cat = heads[0].map(function (row, i) { return row.concat(heads[1][i]); });
    return { out: mm(cat, Wo), maps: maps };
  }
  function relu(A) { return A.map(function (row) { return row.map(function (v) { return Math.max(0, v); }); }); }
  function build() {
    var st = [], x = X, a, f, y;
    function skip(base, sub) { return S.res ? add(base, sub) : sub; }
    if (!S.pre) {
      a = mha(x); var s1 = skip(x, a.out), x1 = ln(s1), hid = relu(mm(x1, W1)), ff = mm(hid, W2), s2 = skip(x1, ff); y = ln(s2);
      st = [["Entrada x", x, "(4, 4) = (películas, d_model)", "Lo que llega al bloque: un vector de 4 números por película (la ficha de la peli 3 es 3 veces más grande a propósito)."],
        ["Atención multi-cabeza", a.out, "(4, 4)", "MHA(x, x): cada película mezcla los valores de las demás con los pesos de las 2 cabezas (mapas abajo). Misma forma que la entrada."],
        ["Suma residual x + atención", s1, "(4, 4)", S.res ? "Se suma la entrada original: la información que ya había no se pierde." : "SIN residual: se tira la entrada y solo queda lo que calculó la atención."],
        ["LayerNorm (norm1)", x1, "(4, 4)", "Cada fila (película) queda con media 0 y desviación 1. Fíjate en que la peli 3, enorme, vuelve a escala normal."],
        ["Red feed-forward", ff, "(4, 4) tras pasar por (4, 8)", "Dense(8) + ReLU + Dense(4) aplicada a cada película por separado: sube a 8, anula los negativos y vuelve a 4."],
        ["Suma residual x1 + ffn", s2, "(4, 4)", S.res ? "Otra suma residual: x1 + ffn(x1)." : "SIN residual: solo queda la salida de la red feed-forward."],
        ["LayerNorm (norm2) = salida", y, "(4, 4)", "Salida del bloque: misma forma que la entrada, así que se pueden apilar bloques."]];
      st.maps = a.maps;
    } else {
      var n1 = ln(x); a = mha(n1); var s1p = skip(x, a.out), n2 = ln(s1p), ff2 = mm(relu(mm(n2, W1)), W2); y = skip(s1p, ff2);
      st = [["Entrada x", x, "(4, 4)", "Igual que antes."],
        ["LayerNorm (antes de la atención)", n1, "(4, 4)", "En pre-LN se normaliza ANTES de cada sub-bloque; la atención recibe datos ya normalizados."],
        ["Atención multi-cabeza", a.out, "(4, 4)", "MHA sobre la entrada normalizada."],
        ["Suma residual x + atención", s1p, "(4, 4)", S.res ? "La suma se hace con la x SIN normalizar: el «carril» residual lleva los datos crudos." : "SIN residual."],
        ["LayerNorm (antes de la red)", n2, "(4, 4)", "Segunda normalización, antes del feed-forward."],
        ["Red feed-forward", ff2, "(4, 4)", "Dense(8) + ReLU + Dense(4)."],
        ["Suma residual = salida", y, "(4, 4)", "En pre-LN la salida no se normaliza dentro del bloque (suele añadirse una LayerNorm final al apilar todos)."]];
      st.maps = a.maps;
    }
    st.input = X; st.output = y; return st;
  }
  var ST = build();
  var view = api.view(root, { aspect: 2.3, minH: 190, maxH: 250, label: "Matriz de 4 películas por 4 números en el paso elegido del bloque Transformer" });
  var view2 = api.view(root, { aspect: 2.8, minH: 150, maxH: 200, label: "Mapas de atención de las dos cabezas del bloque (4 por 4)" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  var sl = ui.slider({ label: "Paso", min: 0, max: 6, step: 1, value: 0, onInput: function (v) { S.step = v; update(); } });
  ui.segmented({ label: "Orden de la LayerNorm", value: "post", options: [["post", "post-LN (nuestro código)"], ["pre", "pre-LN"]], onChange: function (v) { S.pre = v === "pre"; ST = build(); update(); } });
  ui.toggle({ label: "Con conexiones residuales", value: true, onChange: function (v) { S.res = v; ST = build(); update(); } });
  ui.button("◀ Anterior", function () { S.step = Math.max(0, S.step - 1); sl.set(S.step, true); update(); });
  ui.button("Siguiente ▶", function () { S.step = Math.min(6, S.step + 1); sl.set(S.step, true); update(); }, "primary");
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function stat(M) { var ms = [], ss = []; M.forEach(function (row) { var m = row.reduce(function (s, v) { return s + v; }, 0) / row.length; ms.push(m); ss.push(Math.sqrt(row.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / row.length)); }); return { m: ms, s: ss }; }
  function cos(A, B2) { var t = 0; A.forEach(function (row, i) { var d = 0, a = 0, b = 0; row.forEach(function (v, j) { d += v * B2[i][j]; a += v * v; b += B2[i][j] * B2[i][j]; }); t += d / (Math.sqrt(a * b) + 1e-12); }); return t / A.length; }
  view.draw(function (ctx, w, h, C) {
    var M = ST[S.step][1], cell = Math.max(22, Math.min(54, (w - 80) / DM, (h - 30) / N)), x0 = (w - cell * DM) / 2 + 24, y0 = 24, i, j;
    D.text(ctx, S.step + ". " + ST[S.step][0] + "  " + ST[S.step][2].replace(/ tras.*/, ""), w / 2, 14, { size: 11.5, align: "center", weight: 700 });
    for (i = 0; i < N; i++) {
      D.text(ctx, "peli " + (i + 1), x0 - 6, y0 + i * cell + cell / 2 + 4, { size: 10.5, align: "right", color: C.muted });
      for (j = 0; j < DM; j++) {
        var v = M[i][j], x = x0 + j * cell, y = y0 + i * cell;
        D.rect(ctx, x, y, cell, cell, C.surface, C.line, 1);
        ctx.save(); ctx.globalAlpha = Math.min(0.55, Math.abs(v) / 4); ctx.fillStyle = v >= 0 ? C.cobalto : C.terracota; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); ctx.restore();
        D.text(ctx, n(v, 2), x + cell / 2, y + cell / 2 + 4, { size: cell >= 40 ? 12 : 10.5, mono: true, align: "center" });
      }
    }
    D.rect(ctx, x0, y0, cell * DM, cell * N, null, C.ink, 1.3);
  });
  view2.draw(function (ctx, w, h, C) {
    var cell = Math.min(34, (h - 44) / N, (w - 80) / (2 * N)), gap = 34, x0 = (w - (2 * N * cell + gap)) / 2, h2, i, j;
    for (h2 = 0; h2 < H; h2++) {
      var cx = x0 + h2 * (N * cell + gap);
      D.text(ctx, "Cabeza " + (h2 + 1) + (S.pre ? "" : "") + "", cx + N * cell / 2, 12, { size: 10.5, align: "center", weight: 600 });
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var v = ST.maps[h2][i][j], x = cx + j * cell, y = 20 + i * cell;
        D.rect(ctx, x, y, cell, cell, C.surface, C.line, 1);
        ctx.save(); ctx.globalAlpha = Math.min(1, 0.05 + v * 0.95); ctx.fillStyle = C.cobalto; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); ctx.restore();
        if (cell >= 22) D.text(ctx, String(Math.round(v * 100)), x + cell / 2, y + cell / 2 + 3.5, { size: 9.5, mono: true, align: "center", color: v > 0.5 ? C.paper : C.ink });
      }
    }
    D.text(ctx, "filas = película que consulta · casillas = peso en %", w / 2, h - 6, { size: 10, align: "center", color: C.muted });
  });
  function update() {
    view.redraw(); view2.redraw();
    var st = ST[S.step], sx = stat(st[1]), isLN = /LayerNorm/.test(st[0]) && !/antes/.test(st[0]) && !S.pre || (S.pre && /^LayerNorm/.test(st[0]));
    out.set("<b>Paso " + S.step + " · " + st[0] + "</b> — forma " + st[2] + "<br>" + st[3] + "<br>" +
      "Media de cada token: " + sx.m.map(function (v) { return n(v, 2); }).join(" ; ") + " · desviación: " + sx.s.map(function (v) { return n(v, 2); }).join(" ; ") +
      (S.step === 6 ? "<br>Parecido (coseno medio) entre la entrada y la salida del bloque: <b>" + n(cos(ST.input, ST.output), 2) + "</b>" + (S.res ? " — con residual la salida conserva algo de la entrada." : " — sin residual el bloque se «olvida» de lo que le llegó.") : ""));
  }
  update();
});
