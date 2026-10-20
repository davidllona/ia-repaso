/* Experimento: una red densa de regresión aprende una curva (Dense + capa final lineal + MSE). */
Lab.register("curso2/c2m2-regresion-curva", function (root, api) {
  var C2 = window.C2M2, M = api.math;
  var FUN = {
    onda: { f: function (x) { return Math.sin(2 * x) + 0.3 * x; }, name: "onda + tendencia" },
    parabola: { f: function (x) { return x * x / 3 - 1; }, name: "parábola" },
    rapida: { f: function (x) { return Math.sin(3 * x) + 0.2 * x; }, name: "onda rápida" }
  };
  var st = { fn: "onda", nh: 1, u: 8, ep: 200, out: "linear", seed: 5 };
  var net, X, Y, rr, trained, hist, loop;

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 380, label: "Puntos con ruido, función real y curva que ha aprendido la red" });
  var plot = api.plot(view, { xr: [-3, 3], yr: [-2, 2], xticks: 6, yticks: 4, xlabel: "x (la entrada)", ylabel: "y (lo que predice)", pad: { l: 44, r: 10, t: 10, b: 36 } });
  var view2 = api.view(root, { aspect: 4.4, minH: 110, maxH: 150, label: "Error cuadrático medio (loss) por época" });
  var plot2 = api.plot(view2, { xr: [0, 100], yr: [0, 1], xticks: 5, yticks: 2, xlabel: "época (epoch)", ylabel: "loss", xfmt: function (v) { return Math.round(v); }, pad: { l: 52, r: 10, t: 8, b: 32 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Función que hay que aprender", value: st.fn, options: [["onda", "onda + tendencia"], ["parabola", "parábola"], ["rapida", "onda rápida (más curvas)"]], onChange: function (v) { st.fn = v; rebuild(true); } });
  ui.segmented({ label: "Capas ocultas", value: 1, options: [[1, "1"], [2, "2"], [3, "3"]], onChange: function (v) { st.nh = v; rebuild(false); } });
  ui.slider({ label: "Neuronas por capa oculta", min: 1, max: 32, step: 1, value: st.u, onInput: function (v) { st.u = v; rebuild(false); } });
  ui.slider({ label: "epochs (épocas de entrenamiento)", min: 0, max: 600, step: 10, value: st.ep, onInput: function (v) { st.ep = v; retarget(); } });
  ui.select({ label: "Capa de salida", value: st.out, options: [["linear", "Dense(1) sin activación (lo correcto)"], ["sigmoid", "Dense(1, 'sigmoid') (error típico)"]], onChange: function (v) { st.out = v; rebuild(false); } });
  ui.button("Otros datos", function () { st.seed += 3; rebuild(true); }, "warm");

  function makeData() {
    var r = api.rng(40 + st.seed), f = FUN[st.fn].f;
    X = []; Y = [];
    for (var i = 0; i < 50; i++) { var x = r.range(-3, 3); X.push([x / 3]); Y.push([f(x) + r.normal(0, 0.22)]); }
  }
  function rebuild(newData, sync) {
    if (loop && loop.running) loop.stop();
    if (newData || !X) makeData();
    var sizes = [1]; for (var i = 0; i < st.nh; i++) sizes.push(st.u); sizes.push(1);
    net = new C2.MLP(sizes, "relu", st.out, "mse", api.rng(11 + st.seed), "adam");
    rr = api.rng(17 + st.seed); trained = 0; hist = [];
    retarget(sync);
  }
  function trainSome(k) {
    for (var i = 0; i < k && trained < st.ep; i++) { hist.push(net.epoch(X, Y, 16, 0.01, rr)); trained++; }
  }
  function retarget(sync) {
    if (trained > st.ep) rebuildSilent();
    if (sync || api.reduceMotion) { trainSome(st.ep); update(); return; }
    if (trained < st.ep) { if (!loop.running) loop.start(); } else update();
  }
  function rebuildSilent() {
    var sizes = [1]; for (var i = 0; i < st.nh; i++) sizes.push(st.u); sizes.push(1);
    net = new C2.MLP(sizes, "relu", st.out, "mse", api.rng(11 + st.seed), "adam");
    rr = api.rng(17 + st.seed); trained = 0; hist = [];
  }
  loop = api.loop(function () { trainSome(12); update(); if (trained >= st.ep) return false; }, { fps: 30 });

  function trueErr() {
    var f = FUN[st.fn].f, s = 0, n = 120;
    for (var j = 0; j < n; j++) { var x = -3 + 6 * j / (n - 1), d = net.forward([x / 3])[0] - f(x); s += d * d; }
    return s / n;
  }
  function draw(ctx, w, h, C) {
    var D = api.d, f = FUN[st.fn].f, i;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var tru = [], cur = [];
    for (i = 0; i <= 160; i++) { var x = -3 + 6 * i / 160; tru.push([plot.x(x), plot.y(f(x))]); cur.push([plot.x(x), plot.y(net.forward([x / 3])[0])]); }
    D.path(ctx, tru, C.muted, 1.6, [5, 4]);
    X.forEach(function (p, k) { D.circle(ctx, plot.x(p[0] * 3), plot.y(Y[k][0]), 3.8, C.cobalto, C.paper, 1.2); });
    D.path(ctx, cur, C.terracota, 3);
    ctx.restore();
    var b = plot.box;
    D.text(ctx, "- - función real", b.x + 8, b.y + 14, { size: 11, color: C.muted, weight: 600 });
    D.text(ctx, "datos con ruido", b.x + 8, b.y + 28, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "curva de la red", b.x + 8, b.y + 42, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, n = hist.length, ymax = 0.5, i;
    for (i = 0; i < n; i++) ymax = Math.max(ymax, hist[i]);
    plot2.xr = [0, Math.max(50, st.ep)]; plot2.yr = [0, Math.min(2, Math.ceil(ymax * 4) / 4)];
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    if (n) D.path(ctx, hist.map(function (v, k) { return [plot2.x(k + 1), plot2.y(Math.min(v, plot2.yr[1]))]; }), C.terracota, 2.4);
    ctx.restore();
  }
  function update() {
    view.redraw(); view2.redraw();
    var l = hist.length ? hist[hist.length - 1] : null, te = trueErr(), cls = "good", msg;
    if (trained === 0) { msg = "Sin entrenar: los pesos son aleatorios y la curva no tiene nada que ver con los datos."; cls = "bad"; }
    else if (st.out === "sigmoid") { msg = "La sigmoide solo produce valores entre 0 y 1: la curva no puede bajar de 0 ni subir de 1. En regresión la capa final va SIN activación."; cls = "bad"; }
    else if (te > 0.12) { msg = "Todavía se queda corta: prueba más neuronas, más capas o más épocas."; cls = "bad"; }
    else if (te > 0.045 && st.u * st.nh <= 4) { msg = "Demasiado simple para esta función (infraajuste)."; cls = "bad"; }
    else msg = "La curva sigue a la función real: la red ha aprendido el patrón.";
    out.set("épocas entrenadas <b>" + trained + "</b> / " + st.ep + " · loss (MSE) <b>" + (l === null ? "—" : l.toFixed(3)) + "</b> · error frente a la función real <b>" + te.toFixed(3) + "</b> · parámetros <b>" + net.nParams() + "</b><br><span class='" + cls + "'>" + msg + "</span>");
  }
  rebuild(true, true);
  view.draw(draw); view2.draw(draw2);
  return { destroy: function () { if (loop) loop.stop(); } };
});
