/* Experimento: Gradient Boosting con árboles pequeños en 1D. Cada árbol nuevo aprende los residuos del anterior. */
Lab.register("curso1/c1m3-boosting", function (root, api) {
  var D = api.d, M = api.math;
  var seed = 6, noise = 0.5, eta = 0.3, dep = 1, m = 3, MAXM = 80, train, test, F0, trees = [], mseTr = [], mseTe = [], loop = null, playBtn;
  function f(x) { return 2 + 2.5 * Math.sin(0.8 * x) + 0.35 * x; }
  function gen() {
    var r = api.rng(seed), t = api.rng(700 + seed), i;
    train = []; test = [];
    for (i = 0; i < 40; i++) { var x = r.range(0, 10); train.push([x, f(x) + r.normal(0, noise)]); }
    for (i = 0; i < 200; i++) { var x2 = t.range(0, 10); test.push([x2, f(x2) + t.normal(0, noise)]); }
    fit();
  }
  /* árbol de regresión pequeño (mismo método que el módulo: minimiza la suma de errores cuadráticos) */
  function sseRange(s, a, e) { var mm = 0, i, v = 0; for (i = a; i < e; i++) mm += s[i][1]; mm /= (e - a); for (i = a; i < e; i++) v += (s[i][1] - mm) * (s[i][1] - mm); return v; }
  function tree(s, d) {
    var n = s.length, mean = M.mean(s.map(function (p) { return p[1]; })), best = null, i;
    var node = { pred: mean };
    if (d === 0 || n < 2) return node;
    for (i = 1; i < n; i++) {
      if (s[i][0] === s[i - 1][0]) continue;
      var tot = sseRange(s, 0, i) + sseRange(s, i, n);
      if (!best || tot < best.s - 1e-12) best = { s: tot, i: i, t: (s[i][0] + s[i - 1][0]) / 2 };
    }
    if (!best) return node;
    node.t = best.t; node.l = tree(s.slice(0, best.i), d - 1); node.r = tree(s.slice(best.i), d - 1);
    return node;
  }
  function ev(nd, x) { while (nd.l) nd = x <= nd.t ? nd.l : nd.r; return nd.pred; }
  function Fm(x, k) { var s = F0; for (var i = 0; i < k; i++) s += eta * ev(trees[i], x); return s; }
  function fit() {
    F0 = M.mean(train.map(function (p) { return p[1]; })); trees = []; mseTr = []; mseTe = [];
    var cur = train.map(function () { return F0; }), k, i;
    function err(set, k2) { return M.mean(set.map(function (p) { var e = Fm(p[0], k2) - p[1]; return e * e; })); }
    for (k = 0; k <= MAXM; k++) {
      if (k > 0) { /* ajustar el árbol k a los residuos actuales */
        var res = train.map(function (p, j) { return [p[0], p[1] - cur[j]]; }).sort(function (a, b) { return a[0] - b[0]; });
        trees.push(tree(res, dep));
        for (i = 0; i < train.length; i++) cur[i] += eta * ev(trees[k - 1], train[i][0]);
      }
      mseTr.push(err(train, k)); mseTe.push(err(test, k));
    }
  }
  function nextTree() {
    var res = train.map(function (p) { return [p[0], p[1] - Fm(p[0], m)]; }).sort(function (a, b) { return a[0] - b[0]; });
    return tree(res, dep);
  }

  var view = api.view(root, { aspect: 2.0, minH: 230, label: "Horas de series a la semana según la edad del usuario, y predicción del modelo de boosting tras las etapas elegidas" });
  var plot = api.plot(view, { xr: [0, 10], yr: [-1, 8], xticks: 5, yticks: 3, xlabel: "edad del usuario (años)", ylabel: "horas de series / semana", pad: { l: 36, r: 10, t: 10, b: 38 }, xfmt: function (v) { return Math.round(10 + 6 * v); }, yfmt: function (v) { return Math.round(v); } });
  var view2 = api.view(root, { aspect: 3.0, minH: 140, maxH: 200, label: "Residuos actuales y árbol que se añadirá a continuación" });
  var plot2 = api.plot(view2, { xr: [0, 10], yr: [-4, 4], xticks: 5, yticks: 2, pad: { l: 36, r: 10, t: 8, b: 22 }, xfmt: function (v) { return Math.round(10 + 6 * v); }, yfmt: function (v) { return Math.round(v); } });
  var view3 = api.view(root, { aspect: 3.4, minH: 120, maxH: 180, label: "Error cuadrático medio en train y en test según el número de árboles" });
  var plot3 = api.plot(view3, { xr: [0, MAXM], yr: [0, 4], xticks: 8, yticks: 2, xlabel: "número de árboles añadidos", pad: { l: 36, r: 10, t: 8, b: 40 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root), sM;
  sM = ui.slider({ label: "Árboles añadidos (m)", min: 0, max: MAXM, step: 1, value: m, onInput: function (v) { m = v; update(); } });
  ui.slider({ label: "Tasa de aprendizaje (η)", min: 0.05, max: 1, step: 0.05, value: eta, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { eta = v; fit(); update(); } });
  ui.segmented({ label: "Árbol débil", options: [[1, "Stump (1 pregunta)"], [2, "Profundidad 2"]], value: dep, onChange: function (v) { dep = v; fit(); update(); } });
  ui.button("+1 árbol", function () { stop(); m = Math.min(MAXM, m + 1); sM.set(m, true); update(); }, "primary");
  playBtn = ui.button("▶ Entrenar solo", function () { if (loop && loop.running) stop(); else start(); }, "warm");
  ui.button("Generar otros datos", function () { stop(); seed += 3; gen(); update(); });
  api.legend(root, [[api.colors().cobalto, "usuarios (datos)"], [api.colors().terracota, "modelo F"], [api.colors().muted, "curva real"], [api.colors().oliva, "residuos y árbol siguiente"]]);

  function start() {
    if (api.reduceMotion) { m = Math.max(m, 30); sM.set(m, true); update(); return; }
    if (m >= MAXM) { m = 0; sM.set(0, true); }
    loop.start(); playBtn.textContent = "⏸ Parar";
  }
  function stop() { if (loop) loop.stop(); playBtn.textContent = "▶ Entrenar solo"; }
  loop = api.loop(function () { if (m >= MAXM) { stop(); return false; } m++; sM.set(m, true); update(); }, { fps: 7 });

  function draw(ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var i, tr = [], md = [], x;
    for (i = 0; i <= 160; i++) { x = 10 * i / 160; tr.push([plot.x(x), plot.y(f(x))]); }
    D.path(ctx, tr, C.muted, 1.6, [5, 4]);
    for (i = 0; i <= 400; i++) { x = 10 * i / 400; md.push([plot.x(x), plot.y(Fm(x, m))]); }
    D.path(ctx, md, C.terracota, 3);
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 4.2, C.cobalto, C.paper, 1.2); });
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var lim = 1; train.forEach(function (p) { lim = Math.max(lim, Math.abs(p[1] - Fm(p[0], m))); }); lim = Math.ceil(lim);
    plot2.yr = [-lim, lim]; plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    D.line(ctx, plot2.box.x, plot2.y(0), plot2.box.x + plot2.box.w, plot2.y(0), C.ink, 1.2);
    train.forEach(function (p) { var r = p[1] - Fm(p[0], m); D.line(ctx, plot2.x(p[0]), plot2.y(0), plot2.x(p[0]), plot2.y(r), C.oliva, 1.5); D.circle(ctx, plot2.x(p[0]), plot2.y(r), 3.6, C.oliva, C.paper, 1); });
    var nt = nextTree(), pts = [], i;
    for (i = 0; i <= 400; i++) { var x = 10 * i / 400; pts.push([plot2.x(x), plot2.y(ev(nt, x))]); }
    D.path(ctx, pts, C.ink, 2.4, [6, 3]);
    ctx.restore();
  }
  function draw3(ctx, w, h, C) {
    plot3.yr = [0, Math.max(0.5, Math.ceil(Math.max(mseTr[0], mseTe[0]) * 1.05))]; plot3.axes(ctx);
    D.path(ctx, mseTr.map(function (v, k) { return [plot3.x(k), plot3.y(v)]; }), C.cobalto, 2.4);
    D.path(ctx, mseTe.map(function (v, k) { return [plot3.x(k), plot3.y(v)]; }), C.terracota, 2.4);
    D.line(ctx, plot3.x(m), plot3.box.y, plot3.x(m), plot3.box.y + plot3.box.h, C.ink, 1.3, [4, 3]);
    D.text(ctx, "train", plot3.box.x + plot3.box.w - 8, plot3.box.y + 14, { size: 11, color: C.cobaltoInk, weight: 600, align: "right" });
    D.text(ctx, "test", plot3.box.x + plot3.box.w - 8, plot3.box.y + 28, { size: 11, color: C.terracotaInk, weight: 600, align: "right" });
  }
  function update() {
    view.redraw(); view2.redraw(); view3.redraw();
    var bestK = 0; mseTe.forEach(function (v, k) { if (v < mseTe[bestK]) bestK = k; });
    out.set("Árboles añadidos: <b>" + m + "</b> · F" + m + "(x) = F0 + " + eta.toFixed(2) + "·(h1 + … + h" + m + ") con F0 = media de y = <b>" + F0.toFixed(2) + "</b><br>" +
      "Error cuadrático medio: train = <b>" + mseTr[m].toFixed(3) + "</b> · test = <b>" + mseTe[m].toFixed(3) + "</b> (sin árboles: " + mseTr[0].toFixed(2) + " / " + mseTe[0].toFixed(2) + ")<br>" +
      "Mejor número de árboles para test con estos ajustes: <b>" + bestK + "</b> (" + mseTe[bestK].toFixed(3) + ")" +
      (m > bestK + 8 && mseTe[m] > mseTe[bestK] * 1.08 ? "<br><span class='bad'>Sobreajuste: el error de train sigue bajando pero el de test ya sube.</span>" : ""));
  }
  gen(); view.draw(draw); view2.draw(draw2); view3.draw(draw3); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});
