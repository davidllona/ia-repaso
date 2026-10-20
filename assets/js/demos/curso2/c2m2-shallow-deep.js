/* Experimento: red poco profunda (1 capa ancha) frente a red profunda (varias capas estrechas), entrenadas a la vez. */
Lab.register("curso2/c2m2-shallow-deep", function (root, api) {
  var C2 = window.C2M2;
  var DS = {
    spiral: { name: "Espiral de 2,25 vueltas (difícil)", gen: function (r, n) { return C2.data.spiral(r, n, 0.03, 2.25); } },
    easy: { name: "Espiral de 1,25 vueltas (fácil)", gen: function (r, n) { return C2.data.spiral(r, n, 0.04, 1.25); } },
    moons: { name: "Dos lunas", gen: function (r, n) { return C2.data.moons(r, n, 0.12); } },
    circles: { name: "Círculos concéntricos", gen: function (r, n) { return C2.data.circles(r, n, 0.06); } }
  };
  var st = { ds: "spiral", wide: 44, narrow: 8, depth: 3, seed: 2 }, MAXEP = 500;
  var tr, te, A, B, rA, rB, epoch, hA, hB, loop;

  var row = api.el("div", { class: "lab-row" }), cA = api.el("div"), cB = api.el("div");
  row.appendChild(cA); row.appendChild(cB); root.appendChild(row);
  var vA = api.view(cA, { aspect: 1.0, minH: 240, maxH: 380, label: "Frontera de decisión de la red poco profunda" });
  var vB = api.view(cB, { aspect: 1.0, minH: 240, maxH: 380, label: "Frontera de decisión de la red profunda" });
  var pA = api.plot(vA, { xr: [-1.3, 1.3], yr: [-1.3, 1.3], grid: false, xticks: 1, yticks: 1, xfmt: function () { return ""; }, yfmt: function () { return ""; }, pad: { l: 6, r: 6, t: 24, b: 6 } });
  var pB = api.plot(vB, { xr: [-1.3, 1.3], yr: [-1.3, 1.3], grid: false, xticks: 1, yticks: 1, xfmt: function () { return ""; }, yfmt: function () { return ""; }, pad: { l: 6, r: 6, t: 24, b: 6 } });
  var vC = api.view(root, { aspect: 3.4, minH: 140, maxH: 200, label: "Accuracy en test de las dos redes por época" });
  var pC = api.plot(vC, { xr: [0, 100], yr: [0.4, 1], xticks: 5, yticks: 3, xlabel: "época (epoch)", ylabel: "accuracy test", yfmt: function (v) { return Math.round(v * 100) + "%"; }, pad: { l: 46, r: 10, t: 8, b: 40 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Datos", value: st.ds, options: Object.keys(DS).map(function (k) { return [k, DS[k].name]; }), onChange: function (v) { st.ds = v; rebuild(true); } });
  ui.slider({ label: "A · poco profunda: neuronas de su única capa", min: 4, max: 128, step: 1, value: st.wide, onInput: function (v) { st.wide = v; rebuild(false); } });
  ui.slider({ label: "B · profunda: neuronas por capa", min: 2, max: 16, step: 1, value: st.narrow, onInput: function (v) { st.narrow = v; rebuild(false); } });
  ui.segmented({ label: "B · profunda: capas ocultas", value: st.depth, options: [[2, "2"], [3, "3"], [4, "4"]], onChange: function (v) { st.depth = v; rebuild(false); } });
  var bGo = ui.button("▶ Entrenar las dos", function () { toggle(); }, "primary");
  ui.button("Pesos nuevos", function () { st.seed += 3; rebuild(false); });
  ui.button("Otros datos", function () { st.seed += 3; rebuild(true); }, "warm");

  function build(sizes, seed) { return new C2.MLP(sizes, "relu", "sigmoid", "bce", api.rng(seed), "adam"); }
  function rebuild(newData) {
    if (loop && loop.running) loop.stop();
    if (newData || !tr) { tr = DS[st.ds].gen(api.rng(20 + st.seed), 300); te = DS[st.ds].gen(api.rng(500 + st.seed), 300); }
    var sB = [2]; for (var i = 0; i < st.depth; i++) sB.push(st.narrow); sB.push(1);
    A = build([2, st.wide, 1], 7 + st.seed); B = build(sB, 9 + st.seed);
    rA = api.rng(31 + st.seed); rB = api.rng(32 + st.seed); epoch = 0;
    hA = { tr: [], te: [], loss: [] }; hB = { tr: [], te: [], loss: [] };
    update();
  }
  function oneEpoch() {
    hA.loss.push(A.epoch(tr.X, tr.Y, 32, 0.01, rA)); hB.loss.push(B.epoch(tr.X, tr.Y, 32, 0.01, rB));
    var a1 = A.evaluate(tr.X, tr.Y), a2 = A.evaluate(te.X, te.Y), b1 = B.evaluate(tr.X, tr.Y), b2 = B.evaluate(te.X, te.Y);
    hA.tr.push(a1.acc); hA.te.push(a2.acc); hB.tr.push(b1.acc); hB.te.push(b2.acc); epoch++;
  }
  function toggle() {
    if (loop.running) { loop.stop(); return; }
    if (epoch >= MAXEP) rebuild(false);
    if (api.reduceMotion) { for (var k = 0; k < 300 && epoch < MAXEP; k++) oneEpoch(); update(); return; }
    loop.start();
  }
  loop = api.loop(function () { for (var k = 0; k < 4 && epoch < MAXEP; k++) oneEpoch(); update(); if (epoch >= MAXEP) return false; },
    { fps: 30, onState: function (on) { bGo.textContent = on ? "⏸ Pausa" : (epoch >= MAXEP ? "↺ Volver a entrenar" : "▶ Entrenar las dos"); } });

  function drawNet(plot, getNet, title, col) {
    return function (ctx, w, h, C) {
      var D = api.d, b = plot.box, net = getNet();
      plot.axes(ctx); ctx.save(); plot.clip(ctx);
      C2.paintBoundary(ctx, plot, function (x, y) { return net.forward([x, y])[0]; }, C, 30);
      te.X.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 2.6, null, te.Y[i][0] ? C.terracota : C.cobalto, 1); });
      tr.X.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.4, tr.Y[i][0] ? C.terracota : C.cobalto, C.paper, 1); });
      ctx.restore();
      D.text(ctx, title, b.x, 15, { size: 12, weight: 700, color: col(C) });
    };
  }
  function drawC(ctx, w, h, C) {
    var D = api.d, n = hA.te.length;
    pC.xr = [0, Math.max(50, Math.ceil(Math.max(n, 1) / 50) * 50)];
    pC.axes(ctx); ctx.save(); pC.clip(ctx);
    if (n) {
      D.path(ctx, hA.te.map(function (v, i) { return [pC.x(i + 1), pC.y(v)]; }), C.cobalto, 2.4);
      D.path(ctx, hB.te.map(function (v, i) { return [pC.x(i + 1), pC.y(v)]; }), C.terracota, 2.4);
    }
    ctx.restore();
    var b = pC.box;
    D.text(ctx, "A poco profunda", b.x + 8, b.y + b.h - 22, { size: 11, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "B profunda", b.x + 8, b.y + b.h - 8, { size: 11, weight: 600, color: C.terracotaInk });
  }
  function info(net, h) {
    var i = h.te.length - 1;
    return { p: net.nParams(), tr: i >= 0 ? h.tr[i] : null, te: i >= 0 ? h.te[i] : null, loss: i >= 0 ? h.loss[i] : null };
  }
  function pct(v) { return v === null ? "—" : (100 * v).toFixed(1) + " %"; }
  function update() {
    vA.redraw(); vB.redraw(); vC.redraw();
    var a = info(A, hA), b = info(B, hB), archB = B.sizes.slice(1, -1).join("·");
    var msg = "";
    if (epoch >= 100) {
      if (b.te - a.te > 0.08) msg = "<br><span class='good'>Con los mismos parámetros, la red profunda ya separa mucho mejor.</span>";
      else if (a.te - b.te > 0.08) msg = "<br><span class='bad'>Aquí la poco profunda va por delante: con datos sencillos, o pocas capas, la profundidad no ayuda.</span>";
      else msg = "<br>Rendimiento parecido: este problema no necesita profundidad (o a alguna le faltan épocas).";
    }
    out.set("época <b>" + epoch + "</b> / " + MAXEP + " · mismo optimizador (Adam 0.01), mismo batch (32) y mismos datos<br>" +
      "<b>A</b> 1 capa de " + st.wide + " → <b>" + a.p + "</b> parámetros · acc train " + pct(a.tr) + " · acc test <b>" + pct(a.te) + "</b><br>" +
      "<b>B</b> " + st.depth + " capas de " + st.narrow + " (" + archB + ") → <b>" + b.p + "</b> parámetros · acc train " + pct(b.tr) + " · acc test <b>" + pct(b.te) + "</b>" + msg);
  }
  rebuild(true);
  vA.draw(drawNet(pA, function () { return A; }, "A · poco profunda", function (C) { return C.cobaltoInk; }));
  vB.draw(drawNet(pB, function () { return B; }, "B · profunda", function (C) { return C.terracotaInk; }));
  vC.draw(drawC);
  return { destroy: function () { if (loop) loop.stop(); } };
});
