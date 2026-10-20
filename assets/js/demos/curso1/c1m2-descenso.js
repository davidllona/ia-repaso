/* Experimento: gradient descent = bajar una montaña. Learning rate pequeño / óptimo / grande y mínimos locales. */
Lab.register("curso1/c1m2-descenso", function (root, api) {
  var M = api.math, terrain = "bowl", lr = 0.3, start = 3.2, th, k, trail, Jh, status, loop;
  var T = {
    bowl: { name: "Un solo valle (regresión)", J: function (t) { return 0.5 * (t - 1) * (t - 1); }, dJ: function (t) { return t - 1; }, yr: [0, 14], yt: 7, start: 3.2, lr: 0.3 },
    two:  { name: "Dos valles (redes neuronales)", J: function (t) { return Math.pow(t * t - 4, 2) / 64 + 0.15 * t; }, dJ: function (t) { return 4 * t * (t * t - 4) / 64 + 0.15; }, yr: [-1, 3], yt: 4, start: 3.2, lr: 0.5 }
  };
  var view = api.view(root, { aspect: 1.9, minH: 260, drag: true, label: "Curva de coste del recomendador con una bola que baja siguiendo el gradiente" });
  var po = { xr: [-4, 4], yr: T.bowl.yr, xticks: 8, yticks: 7, xlabel: "parámetro θ (peso del género «acción»)", ylabel: "coste J(θ): fallos", pad: { l: 46, r: 12, t: 12, b: 40 } };
  var plot = api.plot(view, po);
  var view2 = api.view(root, { aspect: 4.5, minH: 110, maxH: 160, label: "Coste en cada iteración" });
  var plot2 = api.plot(view2, { xr: [0, 20], yr: [0, 10], xticks: 5, yticks: 2, xlabel: "iteración", pad: { l: 46, r: 12, t: 8, b: 32 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Terreno", options: [["bowl", T.bowl.name], ["two", T.two.name]], value: terrain, onChange: function (v) { terrain = v; var t = T[v]; plot.yr = t.yr; po.yticks = t.yt; lr = t.lr; start = t.start; slLr.set(lr, true); slSt.set(start, true); reset(); } });
  var slLr = ui.slider({ label: "Learning rate (α)", min: 0.01, max: 2.5, step: 0.01, value: lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { lr = v; reset(); } });
  var slSt = ui.slider({ label: "Punto de partida (también puedes hacer clic en la curva)", min: -3.8, max: 3.8, step: 0.1, value: start, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { start = v; reset(); } });
  ui.button("Un paso", function () { step(); }, "primary");
  var bPlay = ui.button("Ejecutar", function () { if (loop.running) loop.stop(); else { if (finished()) reset(); if (api.reduceMotion) { for (var q = 0; q < 150 && !finished(); q++) advance(); redraw(); } else loop.start(); } });
  ui.button("Volver al inicio", function () { reset(); });

  function nice(v) { var e = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; }
  function J(t) { return T[terrain].J(t); }
  function dJ(t) { return T[terrain].dJ(t); }
  function finished() { return status !== "run"; }
  function advance() {
    var g = dJ(th), nt = th - lr * g;
    th = nt; k++; trail.push(th); Jh.push(J(th));
    var gn = Math.abs(dJ(th));
    if (!isFinite(th) || Math.abs(th) > 40 || J(th) > 1e5) status = "diverge";
    else if (gn < 1e-3) status = "converge";
    else if (k >= 200) status = "limit";
  }
  function step() { if (!finished()) { advance(); redraw(); } }
  function reset() { if (loop) loop.stop(); th = start; k = 0; trail = [th]; Jh = [J(th)]; status = "run"; redraw(); }
  loop = api.loop(function () { advance(); redraw(); return !finished(); }, { fps: 8, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  function draw(ctx, w, h, C) {
    var D = api.d, b = plot.box, i, cu = [], t = T[terrain];
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    for (i = 0; i <= 240; i++) { var x = -4 + 8 * i / 240; cu.push([plot.x(x), plot.y(t.J(x))]); }
    D.path(ctx, cu, C.ink, 3);
    var pts = trail.map(function (v) { return [plot.x(M.clamp(v, -4, 4)), plot.y(M.clamp(J(v), t.yr[0], t.yr[1]))]; });
    D.path(ctx, pts, C.terracota, 1.5, [4, 3]);
    pts.forEach(function (p, q) { if (q < pts.length - 1) D.circle(ctx, p[0], p[1], 3.5, C.terracota, C.paper, 1); });
    var cur = th, inside = Math.abs(cur) <= 4 && J(cur) <= t.yr[1];
    if (inside) {
      var px = plot.x(cur), py = plot.y(J(cur)), sp = -dJ(cur) * (plot.y(0) - plot.y(1)) / (plot.x(1) - plot.x(0)), dx = 42 / Math.sqrt(1 + sp * sp);
      D.line(ctx, px - dx, py - sp * dx, px + dx, py + sp * dx, C.oliva, 2.5);
      D.circle(ctx, px, py, 8, C.marker, C.ink, 2.5);
    }
    ctx.restore();
    if (!inside) D.text(ctx, "la bola ha salido del mapa", b.x + b.w / 2, b.y + 22, { size: 12, color: C.terracotaInk, weight: 600, align: "center" });
    D.text(ctx, "recta verde = pendiente = gradiente", b.x + b.w / 2, b.y + 16, { size: 10.5, color: C.olivaInk, align: "center" });
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, n = Jh.length, mx = Math.max(20, n - 1), ymax = nice(Math.max(Jh[0], 1e-6) * 1.15 + 1e-6);
    plot2.xr = [0, mx]; plot2.yr = [Math.min(0, T[terrain].yr[0]), ymax]; plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    D.path(ctx, Jh.map(function (v, q) { return [plot2.x(q), plot2.y(Math.min(v, ymax))]; }), C.terracota, 2.5);
    if (Jh.length === 1) D.circle(ctx, plot2.x(0), plot2.y(Jh[0]), 4, C.terracota, C.paper, 1);
    ctx.restore();
    if (Math.max.apply(null, Jh) > ymax) D.text(ctx, "el coste sube por encima del gráfico", plot2.box.x + plot2.box.w - 6, plot2.box.y + 14, { size: 10.5, color: C.terracotaInk, align: "right", weight: 600 });
  }
  function redraw() {
    view.redraw(); view2.redraw();
    var g = dJ(th), msg;
    if (status === "diverge") msg = "<span class='bad'>DIVERGE: cada paso se pasa tanto del fondo que acaba más arriba que antes. El learning rate es demasiado grande.</span>";
    else if (status === "converge") msg = "<span class='good'>CONVERGE: el gradiente es casi 0, estamos en el fondo de un valle" + (terrain === "two" ? (th < 0 ? " (el mínimo GLOBAL, el más profundo)." : " (un mínimo LOCAL: hay otro valle más profundo a la izquierda).") : ".") + "</span>";
    else if (status === "limit") msg = "<span class='bad'>200 iteraciones y todavía " + (k > 20 && Math.abs(Jh[k] - Jh[k - 1]) < 0.02 * Math.abs(Jh[0]) + 1e-9 ? "avanzando a paso de tortuga: learning rate demasiado pequeño, o rebotando sin asentarse." : "sin asentarse.") + "</span>";
    else msg = "Pulsa «Un paso» o «Ejecutar».";
    out.set("iteración <b>" + k + "</b> · θ = <b>" + (isFinite(th) ? th.toFixed(4) : "∞") + "</b> · J(θ) = <b>" + (J(th) > 1e5 ? "enorme" : J(th).toFixed(4)) + "</b> · gradiente = <b>" + (Math.abs(g) > 1e5 ? "enorme" : g.toFixed(4)) + "</b><br>" +
      "Siguiente paso: θ_nuevo = θ − α·gradiente = " + (isFinite(th) ? th.toFixed(3) : "∞") + " − " + lr.toFixed(2) + " × " + (Math.abs(g) > 1e5 ? "enorme" : g.toFixed(3)) + "<br>" + msg);
  }
  function pick(px, py) { if (!plot.inside(px, py)) return; start = M.clamp(Math.round(plot.ix(px) * 10) / 10, -3.8, 3.8); slSt.set(start, true); reset(); }
  view.pointer({ down: pick, drag: pick });
  th = start; k = 0; trail = [th]; Jh = [J(th)]; status = "run";
  view.draw(draw); view2.draw(draw2); redraw();
  return { destroy: function () { loop.stop(); } };
});
