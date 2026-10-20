/* Experimento: random_split con proporciones. Calcula los tamaños exactamente como PyTorch (parte entera de N·fracción y las sobrantes
   de una en una a los primeros conjuntos) y reparte los índices con o sin semilla. */
Lab.register("curso4/c4m2-reparto-split", function (root, api) {
  var D = api.d;
  var S = { N: 1797, fa: 70, fb: 15, seed: true, run: 0 };
  var view = api.view(root, { aspect: 2.8, minH: 200, maxH: 270, label: "Las muestras del dataset coloreadas según el conjunto al que van" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "N muestras", min: 10, max: 2000, step: 1, value: S.N, onInput: function (v) { S.N = v; update(); } });
  var sA = ui.slider({ label: "entrenamiento %", min: 10, max: 90, step: 5, value: S.fa, onInput: function (v) { S.fa = v; if (S.fa + S.fb > 95) { S.fb = 95 - S.fa; sB.set(S.fb, true); } update(); } });
  var sB = ui.slider({ label: "validación %", min: 0, max: 40, step: 5, value: S.fb, onInput: function (v) { S.fb = v; if (S.fa + S.fb > 95) { S.fa = 95 - S.fb; sA.set(S.fa, true); } update(); } });
  ui.toggle({ label: "con generator (semilla fija)", value: true, onChange: function (v) { S.seed = v; update(); } });
  ui.button("Ejecutar otra vez", function () { S.run++; update(); }, "primary");

  function lengths() {
    var f = [S.fa / 100, S.fb / 100, 1 - S.fa / 100 - S.fb / 100], L = f.map(function (q) { return Math.floor(S.N * q + 1e-9); }), rest = S.N - L.reduce(function (a, b) { return a + b; }, 0), k = 0;
    while (rest > 0) { L[k % L.length]++; rest--; k++; }
    return { L: L, f: f };
  }
  function assignment(L) {
    var R = api.rng(S.seed ? 0 : 1000 + S.run), idx = [], k; for (k = 0; k < S.N; k++) idx.push(k);
    R.shuffle(idx);
    var who = new Array(S.N), pos = 0;
    L.forEach(function (n, g) { for (k = 0; k < n; k++) who[idx[pos++]] = g; });
    return who;
  }
  function draw(ctx, w, h, C) {
    var lg = lengths(), who = assignment(lg.L), pal = [[C.cobaltoWash, C.cobalto], [C.olivaWash, C.oliva], [C.terracotaWash, C.terracota]];
    var pad = 10, k = Math.max(1, Math.ceil(S.N / 400)), cells = Math.ceil(S.N / k), cs = Math.max(3, Math.min(16, Math.sqrt(((w - 2 * pad) * (h - 54)) / cells)));
    var cols = Math.floor((w - 2 * pad) / cs), rows = Math.ceil(cells / cols), x0 = (w - cols * cs) / 2, i;
    for (i = 0; i < cells; i++) {
      var g = who[i * k]; D.rect(ctx, x0 + (i % cols) * cs, 8 + Math.floor(i / cols) * cs, cs - 1, cs - 1, pal[g][0], pal[g][1], 0.8);
    }
    var yl = Math.min(h - 26, 8 + rows * cs + 18), names = w < 520 ? ["entren.", "valid.", "prueba"] : ["entrenamiento", "validación", "prueba"];
    names.forEach(function (nm, g) { var x = pad + g * (w - 2 * pad) / 3; D.rect(ctx, x, yl - 8, 10, 10, pal[g][0], pal[g][1], 1.2); D.text(ctx, nm + " " + lg.L[g], x + 14, yl + 1, { size: w < 520 ? 10 : 11, color: C.ink2 }); });
    D.text(ctx, "una casilla = " + k + " muestra" + (k > 1 ? "s" : "") + " (posición = índice en el dataset)", w / 2, h - 5, { size: 10, color: C.muted, align: "center" });
  }
  view.draw(draw);

  function update() {
    var lg = lengths(), L = lg.L, who = assignment(L), sig = who.slice(0, 12).join("");
    var sum = L[0] + L[1] + L[2], raw = lg.f.map(function (q) { return S.N * q; });
    out.set("<code style=\"white-space:normal;overflow-wrap:anywhere\">random_split(ds, [" + lg.f.map(function (q) { return q.toFixed(2); }).join(", ") + "]" + (S.seed ? ", generator=torch.Generator().manual_seed(0)" : "") + ")</code><br>" +
      "N · fracción = " + raw.map(function (v) { return v.toFixed(2); }).join(" · ") + " → parte entera " + raw.map(function (v) { return Math.floor(v + 1e-9); }).join(" · ") + " → sobran <b>" + (S.N - raw.reduce(function (a, v) { return a + Math.floor(v + 1e-9); }, 0)) + "</b> y se reparten de una en una" + "<br>" +
      "tamaños finales: <b>" + L.join(" / ") + "</b> · suma = <b class='" + (sum === S.N ? "good" : "bad") + "'>" + sum + "</b><br>" +
      "primeras 12 muestras → conjuntos (0 = entr., 1 = val., 2 = prueba): <b>" + who.slice(0, 12).join(" ") + "</b> · " + (S.seed ? "con semilla fija: siempre el mismo reparto" : "sin semilla: ejecución nº " + (S.run + 1) + ", el reparto cambia en cada ejecución"));
    view.redraw();
  }
  update();
});
