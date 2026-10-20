/* Experimento: una BatchNorm con γ y β congelados. En eval() sus estadísticas guardadas no se mueven; en train() running_mean y running_var
   se desplazan hacia los datos nuevos (momentum 0,1 de PyTorch: nuevo = 0,9·viejo + 0,1·lote; la varianza guardada usa la cuasi-varianza ÷(n−1)). */
Lab.register("curso5/c5m4-bn-estadisticas", function (root, api) {
  var D = api.d, EPS = 1e-5;
  var S = { muB: 2, sdB: 1.5, n: 16, modo: "train", seed: 5 };
  var rm = 0, rv = 1, t = 0, hist = [], R;
  function reset() { R = api.rng(S.seed); rm = 0; rv = 1; t = 0; hist = [[0, 1]]; }
  function lote() {
    if (S.modo === "eval") return;
    var xs = [], i, m = 0, v = 0;
    for (i = 0; i < S.n; i++) xs.push(R.normal(S.muB, S.sdB));
    for (i = 0; i < S.n; i++) m += xs[i]; m /= S.n;
    for (i = 0; i < S.n; i++) v += (xs[i] - m) * (xs[i] - m); v /= (S.n - 1);
    rm = 0.9 * rm + 0.1 * m; rv = 0.9 * rv + 0.1 * v; t++; hist.push([rm, rv]);
  }
  function gauss(x, mu, sd) { return Math.exp(-0.5 * (x - mu) * (x - mu) / (sd * sd)) / (sd * Math.sqrt(2 * Math.PI)); }
  function f2(v) { return v.toFixed(2).replace("-", "−").replace(".", ","); }

  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var v1 = api.view(colA, { aspect: 1.3, minH: 220, maxH: 320, label: "Distribución real de los datos nuevos y la que cree la BatchNorm" });
  var p1 = api.plot(v1, { xr: [-6, 8], yr: [0, 1.4], xticks: 7, yticks: 0, pad: { l: 8, r: 8, t: 18, b: 38 }, xlabel: "valor de la característica", xfmt: function (v) { return Math.round(v); }, yfmt: function () { return ""; } });
  var v2 = api.view(colB, { aspect: 1.3, minH: 220, maxH: 320, label: "Evolución de running_mean y running_var con los lotes" });
  var o2 = { xr: [0, 50], yr: [-2, 6], xticks: 5, yticks: 4, pad: { l: 30, r: 8, t: 18, b: 38 }, xlabel: "lotes procesados", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } };
  var p2 = api.plot(v2, o2);
  var ui = api.controls(root), out = api.readout(root);
  api.legend(root, [[api.colors().terracota, "datos nuevos (reales)"], [api.colors().cobalto, "lo que cree la BN (running_mean, running_var)"]]);
  ui.slider({ label: "Media de los datos nuevos", min: -3, max: 3, step: 0.5, value: S.muB, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.muB = v; reset(); update(); } });
  ui.slider({ label: "Desviación de los datos nuevos", min: 0.3, max: 3, step: 0.1, value: S.sdB, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.sdB = v; reset(); update(); } });
  ui.slider({ label: "Tamaño del lote", min: 2, max: 64, step: 1, value: S.n, onInput: function (v) { S.n = v; reset(); update(); } });
  ui.segmented({ label: "Modo de la BatchNorm", value: S.modo, options: [["train", "train()"], ["eval", "eval()"]], onChange: function (v) { S.modo = v; update(); } });
  ui.button("Procesar un lote", function () { lote(); update(); }, "primary");
  ui.button("Procesar 10 lotes", function () { for (var i = 0; i < 10; i++) lote(); update(); });

  function draw1(ctx, w, h, C) {
    var b = p1.box, i, N = 120, pa = [], pb = [];
    p1.axes(ctx); ctx.save(); p1.clip(ctx);
    for (i = 0; i <= N; i++) {
      var x = -6 + 14 * i / N;
      pa.push([p1.x(x), p1.y(gauss(x, S.muB, S.sdB))]); pb.push([p1.x(x), p1.y(gauss(x, rm, Math.sqrt(rv)))]);
    }
    D.path(ctx, pa, C.terracota, 2.6); D.path(ctx, pb, C.cobalto, 2.6);
    D.line(ctx, p1.x(S.muB), b.y, p1.x(S.muB), b.y + b.h, C.terracota, 1, [4, 3]);
    D.line(ctx, p1.x(rm), b.y, p1.x(rm), b.y + b.h, C.cobalto, 1, [4, 3]);
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var T = Math.max(50, hist.length - 1), i;
    var lo = 2 * Math.floor(Math.min(-0.5, S.muB - 0.5) / 2), hi = 2 * Math.ceil(Math.max(5, S.sdB * S.sdB + 0.5) / 2);
    o2.yticks = (hi - lo) / 2; p2.xr = [0, T]; p2.yr = [lo, hi];
    p2.axes(ctx); ctx.save(); p2.clip(ctx);
    D.line(ctx, p2.box.x, p2.y(S.muB), p2.box.x + p2.box.w, p2.y(S.muB), C.terracota, 1, [5, 3]);
    D.line(ctx, p2.box.x, p2.y(S.sdB * S.sdB), p2.box.x + p2.box.w, p2.y(S.sdB * S.sdB), C.terracota, 1, [2, 3]);
    D.path(ctx, hist.map(function (q, k) { return [p2.x(k), p2.y(q[0])]; }), C.cobalto, 2.4);
    D.path(ctx, hist.map(function (q, k) { return [p2.x(k), p2.y(q[1])]; }), C.oliva, 2.4);
    ctx.restore();
    D.text(ctx, "running_mean (azul) · running_var (verde) · rayas: valores reales", w - 8, 12, { size: 9.5, color: C.muted, align: "right" });
  }
  reset(); v1.draw(draw1); v2.draw(draw2);

  function update() {
    var sd = Math.sqrt(rv + EPS), mo = (S.muB - rm) / sd, so = S.sdB / sd, ok = Math.abs(mo) < 0.3 && Math.abs(so - 1) < 0.3;
    var s = "Tras <b>" + t + "</b> lotes en train(): running_mean = <b>" + f2(rm) + "</b>, running_var = <b>" + f2(rv) + "</b> (reales: " + f2(S.muB) + " y " + f2(S.sdB * S.sdB) + ")";
    s += "<br>Salida de la capa en <b>eval()</b>, con γ=1 y β=0 congelados: media <b>" + f2(mo) + "</b> y desviación <b>" + f2(so) + "</b> (la capa siguiente espera 0 y 1)";
    if (S.modo === "eval") s += "<br><span class='bad'>En eval() las estadísticas no se mueven: «Procesar un lote» no hace nada. Los datos nuevos llegan mal centrados a la capa siguiente.</span>";
    else if (t === 0) s += "<br>Pulsa «Procesar un lote»: los pesos están congelados, pero las estadísticas empiezan a moverse.";
    else if (ok) s += "<br><span class='good'>Las estadísticas ya describen los datos nuevos: la salida vuelve a estar centrada. Pero la red ya no es exactamente la preentrenada, y con lotes pequeños esas estadísticas son ruidosas.</span>";
    else s += "<br><span class='bad'>Con momentum 0,1 hacen falta muchos lotes: la mitad del camino se recorre en unos 7 lotes; el 95 %, en unos 29.</span>";
    out.set(s); v1.redraw(); v2.redraw();
  }
  update();
});
