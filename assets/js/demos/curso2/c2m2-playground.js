/* Experimento: una red densa que se entrena de verdad en tu navegador (como model.fit). */
Lab.register("curso2/c2m2-playground", function (root, api) {
  var C2 = window.C2M2, M = api.math;
  var LRS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3], MAXEP = 400;
  var st = { ds: "moons", nh: 2, units: 8, act: "relu", lri: 2, batch: 16, noise: 0.25, seed: 4 };
  var net, train, val, hist, rr, epoch, loop;

  var row = api.el("div", { class: "lab-row" });
  var cellA = api.el("div"), cellB = api.el("div");
  row.appendChild(cellA); row.appendChild(cellB); root.appendChild(row);
  var view = api.view(cellA, { aspect: 1.1, minH: 270, maxH: 400, label: "Frontera de decisión de la red entre thrillers y comedias, con las películas de entrenamiento y de validación" });
  var plot = api.plot(view, { xr: [-1.4, 1.4], yr: [-1.3, 1.3], xticks: 4, yticks: 4, grid: false, xfmt: function () { return ""; }, yfmt: function () { return ""; }, pad: { l: 8, r: 8, t: 8, b: 8 } });
  var view2 = api.view(cellB, { aspect: 1.1, minH: 270, maxH: 400, label: "Curvas de loss de entrenamiento y de validación por época" });
  var plot2 = api.plot(view2, { xr: [0, 100], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "época (epoch)", ylabel: "loss", xfmt: function (v) { return Math.round(v); }, pad: { l: 50, r: 8, t: 8, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);

  ui.select({ label: "Datos", value: st.ds, options: [["moons", "Dos lunas"], ["circles", "Círculos"], ["spiral", "Espiral"], ["xor", "XOR (cuadrantes)"]], onChange: function (v) { st.ds = v; rebuild(true); } });
  ui.segmented({ label: "Capas ocultas", value: 2, options: [[1, "1"], [2, "2"], [3, "3"]], onChange: function (v) { st.nh = v; rebuild(false); } });
  ui.slider({ label: "Neuronas por capa oculta", min: 2, max: 16, step: 1, value: st.units, onInput: function (v) { st.units = v; rebuild(false); } });
  ui.select({ label: "Activación oculta", value: st.act, options: [["relu", "relu"], ["tanh", "tanh"], ["sigmoid", "sigmoid"]], onChange: function (v) { st.act = v; rebuild(false); } });
  ui.slider({ label: "learning_rate (Adam)", min: 0, max: LRS.length - 1, step: 1, value: st.lri, fmt: function (v) { return LRS[v]; }, onInput: function (v) { st.lri = v; update(); } });
  ui.select({ label: "batch_size", value: st.batch, options: [[8, "8"], [16, "16"], [32, "32"], [64, "64"]], onChange: function (v) { st.batch = +v; update(); } });
  ui.slider({ label: "Ruido de los datos", min: 0.02, max: 0.35, step: 0.01, value: st.noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.noise = v; rebuild(true); } });
  var bGo = ui.button("▶ Entrenar", function () { toggle(); }, "primary");
  ui.button("+1 época", function () { stopLoop(); oneEpoch(); update(); });
  ui.button("Pesos nuevos", function () { st.seed += 3; rebuild(false); });
  ui.button("Otros datos", function () { st.seed += 3; rebuild(true); }, "warm");

  function makeData() {
    var gen = C2.data[st.ds], r = api.rng(100 + st.seed);
    var d = gen(r, 240, st.noise, 1.25);
    var idx = []; for (var i = 0; i < 240; i++) idx.push(i); r.shuffle(idx);
    train = { X: [], Y: [] }; val = { X: [], Y: [] };
    idx.forEach(function (k, j) { var t = j < 160 ? train : val; t.X.push(d.X[k]); t.Y.push(d.Y[k]); });
  }
  function rebuild(newData) {
    stopLoop();
    if (newData || !train) makeData();
    var sizes = [2]; for (var i = 0; i < st.nh; i++) sizes.push(st.units); sizes.push(1);
    net = new C2.MLP(sizes, st.act, "sigmoid", "bce", api.rng(7 + st.seed), "adam");
    rr = api.rng(31 + st.seed);
    hist = { loss: [], vloss: [], acc: [], vacc: [] }; epoch = 0;
    var e0 = net.evaluate(train.X, train.Y), v0 = net.evaluate(val.X, val.Y);
    hist.e0 = [e0.loss, v0.loss];
    update();
  }
  function oneEpoch() {
    var l = net.epoch(train.X, train.Y, st.batch, LRS[st.lri], rr);
    var e = net.evaluate(train.X, train.Y), v = net.evaluate(val.X, val.Y);
    hist.loss.push(l); hist.vloss.push(v.loss); hist.acc.push(e.acc); hist.vacc.push(v.acc); epoch++;
  }
  function stopLoop() { if (loop && loop.running) loop.stop(); }
  function toggle() {
    if (loop.running) { loop.stop(); return; }
    if (epoch >= MAXEP) rebuild(false);
    if (api.reduceMotion) { for (var k = 0; k < 150 && epoch < MAXEP; k++) oneEpoch(); update(); return; }
    loop.start();
  }
  loop = api.loop(function () {
    for (var k = 0; k < 2 && epoch < MAXEP; k++) oneEpoch();
    update();
    if (epoch >= MAXEP) return false;
  }, { fps: 30, onState: function (on) { bGo.textContent = on ? "⏸ Pausa" : (epoch >= MAXEP ? "↺ Entrenar otra vez" : "▶ Entrenar"); } });

  function drawA(ctx, w, h, C) {
    var D = api.d, b = plot.box, asp = b.w / b.h;
    plot.xr = [-1.3 * asp, 1.3 * asp]; plot.yr = [-1.3, 1.3];
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    C2.paintBoundary(ctx, plot, function (x, y) { return net.forward([x, y])[0]; }, C, 34);
    val.X.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.6, null, val.Y[i][0] ? C.terracota : C.cobalto, 1.6); });
    train.X.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 4.2, train.Y[i][0] ? C.terracota : C.cobalto, C.paper, 1.2); });
    ctx.restore();
    var b = plot.box;
    C2.halo(ctx, "● thriller", b.x + 8, b.y + 18, { size: 11, bg: C.surface }); D.text(ctx, "● thriller", b.x + 8, b.y + 18, { size: 11, weight: 600, color: C.terracotaInk });
    C2.halo(ctx, "● comedia", b.x + 8, b.y + 34, { size: 11, bg: C.surface }); D.text(ctx, "● comedia", b.x + 8, b.y + 34, { size: 11, weight: 600, color: C.cobaltoInk });
  }
  function drawB(ctx, w, h, C) {
    var D = api.d, n = hist.loss.length, xmax = Math.max(50, Math.ceil(n / 50) * 50), ymax = Math.max(0.5, hist.e0[0], hist.e0[1]);
    for (var i = 0; i < n; i++) ymax = Math.max(ymax, hist.loss[i], hist.vloss[i]);
    ymax = Math.min(Math.ceil(ymax * 5) / 5, 2);
    plot2.xr = [0, xmax]; plot2.yr = [0, ymax];
    plot2.axes(ctx);
    ctx.save(); plot2.clip(ctx);
    if (n) {
      D.path(ctx, hist.loss.map(function (v, i) { return [plot2.x(i + 1), plot2.y(Math.min(v, ymax))]; }), C.cobalto, 2.4);
      D.path(ctx, hist.vloss.map(function (v, i) { return [plot2.x(i + 1), plot2.y(Math.min(v, ymax))]; }), C.terracota, 2.4);
    }
    ctx.restore();
    var b = plot2.box;
    D.text(ctx, "loss (train)", b.x + b.w - 6, b.y + 14, { align: "right", size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "val_loss (validación)", b.x + b.w - 6, b.y + 28, { align: "right", size: 11, color: C.terracotaInk, weight: 600 });
  }
  function update() {
    view.redraw(); view2.redraw();
    var i = epoch - 1, lr = LRS[st.lri], parts = [], sz = net.sizes;
    for (var l = 0; l < sz.length - 1; l++) parts.push("(" + sz[l] + "·" + sz[l + 1] + "+" + sz[l + 1] + ")");
    var code = "Sequential([" + (sz.length > 2 ? sz.slice(1, -1).map(function (u) { return "Dense(" + u + ",'" + st.act + "')"; }).join(", ") + ", " : "") + "Dense(1,'sigmoid')]) · Adam(" + lr + ") · batch " + st.batch;
    var steps = Math.ceil(train.X.length / st.batch);
    var line = epoch ? "época <b>" + epoch + "</b> · loss <b>" + hist.loss[i].toFixed(3) + "</b> · val_loss <b>" + hist.vloss[i].toFixed(3) +
      "</b> · accuracy <b>" + (100 * hist.acc[i]).toFixed(0) + " %</b> · val_accuracy <b>" + (100 * hist.vacc[i]).toFixed(0) + " %</b>" :
      "época <b>0</b> · todavía sin entrenar (pesos aleatorios): pulsa «Entrenar»";
    var verdict = "";
    if (epoch > 40) {
      var gap = hist.vloss[i] - hist.loss[i];
      if (hist.acc[i] < 0.8) verdict = "<br><span class='bad'>Aún no aprende bien: prueba más neuronas, más épocas o otra activación.</span>";
      else if (gap > Math.max(0.06, 2 * hist.loss[i])) verdict = "<br><span class='bad'>val_loss muy por encima de loss: empieza el sobreajuste.</span>";
      else verdict = "<br><span class='good'>loss y val_loss bajas y parecidas: la red generaliza.</span>";
    }
    out.set(line + "<br>" + parts.join(" + ") + " = <b>" + net.nParams() + "</b> parámetros · " + steps + " pasos por época<br><span style='opacity:.8'>" + code + "</span>" + verdict);
  }
  rebuild(true);
  view.draw(drawA); view2.draw(drawB);
  return { destroy: function () { if (loop) loop.stop(); } };
});
