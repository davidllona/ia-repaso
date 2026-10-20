/* Experimento: aprender = probar valores del parámetro y quedarse con el que menos falla. */
Lab.register("curso1/aprende-umbral", function (root, api) {
  var M = api.math, r = api.rng(11), N = 30, pts = [], i;
  for (i = 0; i < N; i++) {
    var x = r.range(1, 59);
    pts.push({ x: x, y: r.next() < M.sigmoid((x - 30) / 5) ? 1 : 0, j: r.range(-1, 1) });
  }
  var thr = 12, curve = [], searching = false, best = null;
  var view = api.view(root, { aspect: 1.45, drag: true, minH: 300, label: "Clientes colocados según sus días sin entrar, con una línea vertical que separa los que se quedan de los que cancelan" });
  var ui = api.controls(root);
  var out = api.readout(root);
  api.legend(root, [[api.colors().cobalto, "se queda (real)"], [api.colors().terracota, "cancela (real)"]]);

  function acc(t) { var ok = 0; pts.forEach(function (p) { if ((p.x > t ? 1 : 0) === p.y) ok++; }); return ok; }
  var slider = ui.slider({ label: "Umbral (días sin entrar)", min: 0, max: 60, step: 0.5, value: thr,
    fmt: function (v) { return v.toFixed(1) + " días"; }, onInput: function (v) { if (!searching) { thr = v; update(); } } });
  var btn = ui.button("Que lo aprenda el ordenador", function () { search(); }, "primary");

  var loop = api.loop(function () {
    thr += 0.9; if (thr >= 60) { thr = 60; finishSearch(); return false; }
    curve.push([thr, acc(thr) / N]); slider.set(thr, true); update();
  }, { fps: 40 });

  function search() {
    if (searching) return;
    searching = true; curve = []; best = null; thr = 0; btn.disabled = true;
    if (api.reduceMotion) { for (var t = 0; t <= 60; t += 0.9) curve.push([t, acc(t) / N]); finishSearch(); return; }
    loop.start();
  }
  function finishSearch() {
    var top = Math.max.apply(null, curve.map(function (c) { return c[1]; }));
    var ts = curve.filter(function (c) { return c[1] === top; }).map(function (c) { return c[0]; });
    best = M.mean(ts); thr = best; slider.set(best, true); searching = false; btn.disabled = false; update();
  }

  function layout() {
    var w = view.w, h = view.h, L = 40, R = 14;
    return { L: L, R: R, topY: 14, topH: Math.round(h * 0.46), botY: Math.round(h * 0.46) + 56, botH: h - (Math.round(h * 0.46) + 56) - 28, w: w, h: h };
  }
  function X(v, g) { return g.L + v / 60 * (g.w - g.L - g.R); }
  function draw(ctx, w, h, C) {
    var g = layout(), tx = X(thr, g), yTop = g.topY, yBot = g.topY + g.topH;
    d(ctx, C, g, tx, yTop, yBot);
  }
  function d(ctx, C, g, tx, yTop, yBot) {
    var D = api.d;
    ctx.fillStyle = C.cobaltoWash; ctx.fillRect(g.L, yTop, tx - g.L, g.topH);
    ctx.fillStyle = C.terracotaWash; ctx.fillRect(tx, yTop, g.w - g.R - tx, g.topH);
    D.rect(ctx, g.L, yTop, g.w - g.L - g.R, g.topH, null, C.ink, 1.5);
    D.text(ctx, "predice: se queda", g.L + 8, yTop + 16, { size: 11, color: C.cobaltoInk, weight: 500 });
    D.text(ctx, "predice: cancela", g.w - g.R - 8, yTop + 16, { size: 11, color: C.terracotaInk, weight: 500, align: "right" });
    D.line(ctx, tx, yTop - 4, tx, yBot + 4, C.ink, 2.5);
    D.circle(ctx, tx, yTop - 4, 5, C.ink);
    pts.forEach(function (p) {
      var px = X(p.x, g), py = yTop + g.topH / 2 + p.j * (g.topH / 2 - 14) + 4, ok = (p.x > thr ? 1 : 0) === p.y;
      D.circle(ctx, px, py, 6, p.y ? C.terracota : C.cobalto, C.paper, 1.5);
      if (!ok) { D.circle(ctx, px, py, 10, null, C.ink, 2); }
    });
    for (var t = 0; t <= 60; t += 10) D.text(ctx, String(t), X(t, g), yBot + 18, { size: 11, align: "center", color: C.muted, mono: true });
    D.text(ctx, "días sin entrar en la plataforma", (g.L + g.w - g.R) / 2, yBot + 33, { size: 12, align: "center", color: C.ink2, weight: 500 });
    D.text(ctx, "círculo con aro = fallo del modelo", g.w - g.R, yBot + 33, { size: 10, align: "right", color: C.muted });
    // curva de aciertos
    var by = g.botY, bh = g.botH;
    D.rect(ctx, g.L, by, g.w - g.L - g.R, bh, C.surface, C.ink, 1.5);
    D.text(ctx, "% de aciertos para cada umbral", g.L + 8, by + 14, { size: 10, color: C.muted });
    D.text(ctx, "100%", g.L - 4, by + 10, { size: 10, align: "right", color: C.muted, mono: true });
    D.text(ctx, "0%", g.L - 4, by + bh, { size: 10, align: "right", color: C.muted, mono: true });
    if (curve.length > 1) {
      D.path(ctx, curve.map(function (c) { return [X(c[0], g), by + bh - c[1] * bh]; }), C.olivaInk || C.oliva, 2);
    } else D.text(ctx, "pulsa «Que lo aprenda el ordenador» para ver cómo cambia el acierto", (g.L + g.w - g.R) / 2, by + bh / 2 + 4, { size: 11, align: "center", color: C.muted });
    var a = acc(thr) / N;
    D.line(ctx, tx, by, tx, by + bh, C.terracota, 1.5, [4, 3]);
    D.circle(ctx, tx, by + bh - a * bh, 5, C.terracota, C.paper, 1.5);
  }
  function update() {
    view.redraw();
    var ok = acc(thr), a = ok / N * 100;
    out.set("umbral = <b>" + thr.toFixed(1) + " días</b> · aciertos = <b>" + ok + " / " + N + "</b> (" + a.toFixed(0) + " %) · fallos = <span class='bad'>" + (N - ok) + "</span>" +
      (best !== null ? "<br><span class='good'>El ordenador ha probado todos los umbrales y se ha quedado con el mejor: " + best.toFixed(1) + " días.</span>" : ""));
  }
  function setFromPx(px) { if (searching) return; var v = M.clamp((px - layout().L) / (view.w - layout().L - layout().R) * 60, 0, 60); thr = Math.round(v * 2) / 2; slider.set(thr, true); update(); }
  view.pointer({ down: setFromPx, drag: setFromPx });
  view.draw(draw); update();
  return { destroy: function () { loop.stop(); } };
});
