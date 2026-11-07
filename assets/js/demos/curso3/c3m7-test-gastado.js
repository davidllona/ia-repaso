/* Experimento: por qué el test se mira UNA vez. Se prueban k ajustes de un modelo de pisos (MAE real de cada uno alrededor de
   10,5 miles de €). Cada ajuste se mide en una validación y en un test de 800 filas, con un ruido de medida de 0,5.
   Si eliges el mejor mirando la validación y das su cifra de test, la cifra es honesta. Si eliges mirando el TEST, das
   el mínimo de k medidas con ruido: sale optimista y el modelo rinde peor con pisos nuevos. Cifras simuladas (semilla fija);
   la media del engaño se calcula de verdad con 300 sorteos. */
Lab.register("curso3/c3m7-test-gastado", function (root, api) {
  var D = api.d, N = 24, REP = 300, RUIDO = 0.5;
  var S = { k: 12, modo: "val", seed: 1 };
  var cand = null;

  function genera(seed) {
    var R = api.rng(seed * 104729 + 7), c = [], i;
    for (i = 0; i < N; i++) {
      var t = 10.5 + R.normal(0, 0.5);
      c.push({ real: t, val: t + R.normal(0, RUIDO), test: t + R.normal(0, RUIDO) });
    }
    return c;
  }
  function elige(c, k, modo) {
    var best = 0, i;
    for (i = 1; i < k; i++) if (c[i][modo] < c[best][modo]) best = i;
    return best;
  }
  function enganoMedio(k, modo) {
    var s = 0, r;
    for (r = 0; r < REP; r++) { var c = genera(1000 + r), b = elige(c, k, modo); s += c[b].test - c[b].real; }
    return s / REP;
  }
  function f(v) { return v.toFixed(2).replace(".", ","); }

  var view = api.view(root, { aspect: 1.8, minH: 250, maxH: 340, label: "Error medido de cada ajuste probado y el ajuste elegido, con la cifra que darías y la que tendrá con pisos nuevos" });
  var plot = api.plot(view, { xr: [0, S.k + 1], yr: [8.5, 12.5], xticks: 6, yticks: 4, grid: true, pad: { l: 44, r: 12, t: 12, b: 40 },
    xlabel: "ajuste probado", xfmt: function (v) { return Math.round(v) >= 1 && Math.round(v) <= S.k ? String(Math.round(v)) : ""; },
    yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Elijo el mejor ajuste mirando", options: [["val", "la validación"], ["test", "el test"]], value: S.modo,
    onChange: function (v) { S.modo = v; update(); } });
  ui.slider({ label: "Ajustes probados (k)", min: 1, max: N, step: 1, value: S.k, onInput: function (v) { S.k = v; update(); } });
  ui.button("Otro sorteo", function () { S.seed = S.seed % 9 + 1; cand = genera(S.seed); update(); });
  api.legend(root, [[api.colors().muted, "error real de cada ajuste (raya)"], [api.colors().cobalto, "error medido con lo que miras para elegir"], [api.colors().terracota, "cifra de test que darías"], [api.colors().oliva, "error real con pisos nuevos"]]);

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    if (!cand) return;
    var b = plot.box, best = elige(cand, S.k, S.modo), i;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < S.k; i++) {
      var x = plot.x(i + 1), m = cand[i][S.modo];
      D.line(ctx, x - 5, plot.y(cand[i].real), x + 5, plot.y(cand[i].real), C.muted, 1.5);
      D.circle(ctx, x, plot.y(m), i === best ? 7 : 4.5, i === best ? C.cobalto : C.cobaltoWash, C.cobalto, 1.5);
    }
    var yr = plot.y(cand[best].test), yo = plot.y(cand[best].real);
    D.line(ctx, b.x, yr, b.x + b.w, yr, C.terracota, 2, [6, 4]);
    D.line(ctx, b.x, yo, b.x + b.w, yo, C.oliva, 2);
    ctx.restore();
    var arriba = yr < yo;
    D.text(ctx, "darías " + f(cand[best].test), b.x + b.w - 4, yr + (arriba ? -6 : 14), { align: "right", size: 11, weight: 600, color: C.terracotaInk });
    D.text(ctx, "real " + f(cand[best].real), b.x + 6, yo + (arriba ? 14 : -6), { size: 11, weight: 600, color: C.olivaInk });
  });

  function update() {
    if (!cand) cand = genera(S.seed);
    var paso = S.k > 12 ? 4 : (S.k > 6 ? 2 : 1);
    plot = api.plot(view, { xr: [0, S.k + 1], yr: [8.5, 12.5], xticks: S.k + 1, yticks: 4, grid: true, pad: { l: 44, r: 12, t: 12, b: 40 },
      xlabel: "ajuste probado", xfmt: function (v) { var r = Math.round(v); return r >= 1 && r <= S.k && r % paso === 0 || r === 1 ? String(r) : ""; },
      yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });
    var best = elige(cand, S.k, S.modo), c = cand[best], e = c.test - c.real, em = enganoMedio(S.k, S.modo);
    var miradas = S.modo === "test" ? S.k : 1;
    out.set("Eliges el mejor de <b>" + S.k + "</b> ajustes mirando <b>" + (S.modo === "test" ? "el test" : "la validación") + "</b>. Veces que miras el test: <b>" + miradas + "</b>" +
      "<br>Cifra de test que darías: <b>" + f(c.test) + "</b> mil € de MAE · con pisos nuevos: <b>" + f(c.real) + "</b>" +
      "<br>Engaño en este sorteo: <b>" + (e >= 0 ? "+" : "") + f(e) + "</b> · de media en " + REP + " sorteos: " +
      (Math.abs(em) < 0.1 ? "<span class='good'><b>" + f(em) + "</b> (cifra honesta)</span>" : "<span class='bad'><b>" + f(em) + "</b> (prometes menos error del que habrá)</span>"));
    view.redraw();
  }
  update();
});
