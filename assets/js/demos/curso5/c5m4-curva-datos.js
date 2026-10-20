/* Experimento: resultados REALES de los fragmentos 15 y 16 del módulo (exactitud en el test de la tarea B, media y desviación de 5 semillas).
   No se recalcula nada aquí: es una vista interactiva de los números medidos con PyTorch. */
Lab.register("curso5/c5m4-curva-datos", function (root, api) {
  var D = api.d, DATA = {"t1": {"ns": [1, 2, 5, 10, 25, 50], "m": {"regresion_logistica": [[0.74, 0.087], [0.843, 0.028], [0.902, 0.03], [0.939, 0.004], [0.965, 0.006], [0.974, 0.002]], "desde_cero": [[0.645, 0.089], [0.767, 0.014], [0.864, 0.035], [0.935, 0.009], [0.972, 0.005], [0.983, 0.003]], "base_aleatoria": [[0.47, 0.108], [0.539, 0.106], [0.645, 0.038], [0.7, 0.034], [0.69, 0.025], [0.718, 0.018]], "congelada": [[0.445, 0.122], [0.598, 0.055], [0.718, 0.022], [0.771, 0.021], [0.825, 0.012], [0.843, 0.008]], "ajuste_fino": [[0.597, 0.094], [0.741, 0.035], [0.88, 0.038], [0.943, 0.012], [0.977, 0.004], [0.99, 0.002]], "ajuste_fino_bn_eval": [[0.58, 0.09], [0.711, 0.091], [0.825, 0.048], [0.923, 0.016], [0.959, 0.007], [0.976, 0.006]]}}, "t2": {"ns": [1, 2, 5, 10, 25], "m": {"regresion_logistica": [[0.773, 0.041], [0.862, 0.047], [0.903, 0.038], [0.921, 0.008], [0.951, 0.013]], "desde_cero": [[0.628, 0.139], [0.851, 0.079], [0.899, 0.039], [0.937, 0.019], [0.944, 0.016]], "base_aleatoria": [[0.66, 0.106], [0.723, 0.079], [0.783, 0.106], [0.846, 0.024], [0.863, 0.02]], "congelada": [[0.723, 0.092], [0.759, 0.078], [0.816, 0.02], [0.844, 0.022], [0.888, 0.019]], "ajuste_fino": [[0.747, 0.069], [0.877, 0.052], [0.932, 0.036], [0.955, 0.019], [0.965, 0.015]], "ajuste_fino_bn_eval": [[0.748, 0.073], [0.855, 0.082], [0.886, 0.055], [0.941, 0.009], [0.954, 0.017]]}}};
  var NOM = { regresion_logistica: "regresión logística (píxeles)", desde_cero: "desde cero", base_aleatoria: "cuerpo aleatorio congelado", congelada: "preentrenado congelado", ajuste_fino: "ajuste fino", ajuste_fino_bn_eval: "ajuste fino, BN fija" };
  var COL = ["muted", "ink2", "oliva", "cobalto", "terracota", "marker"];
  var KEYS = Object.keys(NOM);
  var S = { tarea: "t1", idx: 3, on: { regresion_logistica: true, desde_cero: true, base_aleatoria: false, congelada: true, ajuste_fino: true, ajuste_fino_bn_eval: false } };
  function f3(v) { return v.toFixed(3).replace(".", ","); }

  var view = api.view(root, { aspect: 1.6, minH: 260, maxH: 380, label: "Exactitud en el test según el número de imágenes por cifra para cada método" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Tarea", value: S.tarea, options: [["t1", "1 · de 0–4 a 5–9"], ["t2", "2 · de 0–7 a 8–9"]], onChange: function (v) { S.tarea = v; S.idx = Math.min(S.idx, DATA[v].ns.length - 1); sl.input.max = DATA[v].ns.length - 1; update(); } });
  var sl = ui.slider({ label: "Imágenes por cifra (posición en la escala)", min: 0, max: DATA.t1.ns.length - 1, step: 1, value: S.idx, fmt: function (v) { return DATA[S.tarea].ns[v]; }, onInput: function (v) { S.idx = v; update(); } });
  KEYS.forEach(function (k) { ui.toggle({ label: NOM[k], value: S.on[k], onChange: function (v) { S.on[k] = v; update(); } }); });
  var leg = api.legend(root, KEYS.map(function (k, i) { return [api.colors()[COL[i]], NOM[k]]; }));

  var pl = api.plot(view, { xr: [0, 1], yr: [0.4, 1], xticks: 4, yticks: 6, pad: { l: 44, r: 10, t: 14, b: 36 }, xlabel: "imágenes por cifra (escala logarítmica)", ylabel: "exactitud en test", xfmt: function () { return ""; }, yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });
  function draw(ctx, w, h, C) {
    var d = DATA[S.tarea], ns = d.ns, i, lx = ns.map(function (n) { return Math.log(n); }), x0 = lx[0], x1 = lx[lx.length - 1];
    pl.xr = [x0 - 0.15, x1 + 0.15]; pl.yr = [0.4, 1];
    pl.axes(ctx);
    ns.forEach(function (n, k) { D.text(ctx, String(n), pl.x(lx[k]), pl.box.y + pl.box.h + 15, { size: 10.5, mono: true, color: C.muted, align: "center" }); D.line(ctx, pl.x(lx[k]), pl.box.y, pl.x(lx[k]), pl.box.y + pl.box.h, k === S.idx ? C.terracota : C.line, k === S.idx ? 1.6 : 1, k === S.idx ? [4, 3] : []); });
    ctx.save(); pl.clip(ctx);
    KEYS.forEach(function (k, ci) {
      if (!S.on[k]) return;
      var col = C[COL[ci]], pts = d.m[k].map(function (v, j) { return [pl.x(lx[j]), pl.y(Math.max(0.4, v[0]))]; });
      D.path(ctx, pts, col, k === "ajuste_fino" || k === "desde_cero" ? 2.6 : 1.8, k === "ajuste_fino_bn_eval" ? [5, 3] : null);
      d.m[k].forEach(function (v, j) {
        D.line(ctx, pts[j][0], pl.y(Math.min(1, v[0] + v[1])), pts[j][0], pl.y(Math.max(0.4, v[0] - v[1])), col, 1.2);
        D.circle(ctx, pts[j][0], pts[j][1], j === S.idx ? 4.6 : 3, col, C.paper, 1.2);
      });
    });
    ctx.restore();
  }
  view.draw(draw);

  function update() {
    var d = DATA[S.tarea], j = S.idx, n = d.ns[j];
    var s = "<b>" + n + "</b> imágenes por cifra · media ± desviación típica de 5 semillas, exactitud en el test:";
    KEYS.forEach(function (k) { if (S.on[k]) s += "<br>" + NOM[k] + ": <b>" + f3(d.m[k][j][0]) + "</b> ± " + f3(d.m[k][j][1]); });
    var a = d.m.ajuste_fino[j], c = d.m.desde_cero[j], dif = a[0] - c[0], sd = Math.max(a[1], c[1]);
    s += "<br>Ajuste fino − desde cero: <b>" + (dif >= 0 ? "+" : "−") + Math.abs(dif * 100).toFixed(1).replace(".", ",") + " puntos</b> (desviación mayor de los dos: " + (sd * 100).toFixed(1).replace(".", ",") + " puntos) " + (Math.abs(dif) > 2 * sd ? "<span class='good'>→ diferencia clara</span>" : (Math.abs(dif) > sd ? "→ ventaja pequeña, dentro del ruido razonable" : "<span class='bad'>→ indistinguible del azar de las semillas</span>"));
    out.set(s); view.redraw();
  }
  update();
});
