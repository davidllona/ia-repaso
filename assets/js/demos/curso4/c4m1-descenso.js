/* Experimento: descenso del gradiente con derivadas automáticas. Se elige una función, un punto inicial y una tasa de
   aprendizaje; cada paso hace w ← w − lr · dL/dw (con la derivada exacta). Se ve cuándo converge, oscila o diverge. */
Lab.register("curso4/c4m1-descenso", function (root, api) {
  var D = api.d, M = api.math;
  var F = {
    quad: { name: "L(w) = (w − 3)²", f: function (w) { return (w - 3) * (w - 3); }, d: function (w) { return 2 * (w - 3); }, xr: [-3, 9], yr: [0, 40], w0: 0 },
    quart: { name: "L(w) = w⁴ − 3w² + w  (dos valles)", f: function (w) { return w * w * w * w - 3 * w * w + w; }, d: function (w) { return 4 * w * w * w - 6 * w + 1; }, xr: [-2.2, 2.2], yr: [-4, 12], w0: 1.5 }
  };
  var st = { fn: "quad", w: 0, lr: 0.1, path: [] };
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer:coarse)").matches);   /* en táctil no se arrastra: hay deslizador */
  var view = api.view(root, { aspect: 2.0, minH: 240, maxH: 330, drag: !coarse, label: "Curva de pérdida con el recorrido del descenso del gradiente" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Función de pérdida", value: "quad", options: [["quad", "(w − 3)²"], ["quart", "w⁴ − 3w² + w"]], onChange: function (v) { st.fn = v; s0.input.min = F[v].xr[0]; s0.input.max = F[v].xr[1]; reset(); } });
  var s0 = ui.slider({ label: "Punto de partida w", min: -3, max: 9, step: 0.05, value: 0, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.w = v; st.path = [v]; update(); } });
  var sl = ui.slider({ label: "Tasa de aprendizaje lr", min: 0.01, max: 1.1, step: 0.01, value: 0.1, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.lr = v; if (st.fn === "quart") { reset(true); } else reset(true); } });
  ui.button("Paso ▶", function () { step(1); }, "primary");
  ui.button("10 pasos", function () { step(10); });
  ui.button("Volver al inicio", function () { reset(true); }, "warm");
  function reset(keep) { var f = F[st.fn]; if (!keep || st.path.length === 0) { st.w = f.w0; } else st.w = st.path[0]; st.path = [st.w]; update(); }
  function step(k) { var f = F[st.fn]; for (var q = 0; q < k; q++) { if (!isFinite(st.w) || Math.abs(st.w) > 1e6) break; st.w = st.w - st.lr * f.d(st.w); st.path.push(st.w); } update(); }
  var p;
  view.draw(function (ctx, w, h, C) {
    var f = F[st.fn]; p = api.plot(view, { xr: f.xr, yr: f.yr, xticks: 6, yticks: 4, pad: { l: 44, r: 12, t: 12, b: 42 }, xlabel: "w (el peso)", ylabel: "L(w) = error", xfmt: function (t) { return +t.toFixed(1); } });
    p.axes(ctx); ctx.save(); p.clip(ctx);
    D.path(ctx, M.linspace(f.xr[0], f.xr[1], 200).map(function (x) { return [p.x(x), p.y(f.f(x))]; }), C.ink, 2.2);
    var pts = st.path.slice(0, 60).map(function (v) { return [p.x(M.clamp(v, f.xr[0] - 1, f.xr[1] + 1)), p.y(Math.min(f.yr[1] * 1.2, f.f(v)))]; });
    D.path(ctx, pts, C.terracota, 1.4, [4, 3]);
    pts.forEach(function (q, i) { D.circle(ctx, q[0], q[1], i === pts.length - 1 ? 6 : 3.2, i === pts.length - 1 ? C.terracota : C.terracotaInk, i === pts.length - 1 ? C.paper : null, 1.6); });
    ctx.restore();
    D.text(ctx, (coarse ? "usa el deslizador · " : p.box.w < 420 ? "arrastra el punto · " : "arrastra el punto de partida sobre la curva · ") + f.name, p.box.x + 6, p.box.y + 13, { size: 10.5, color: C.ink2, weight: 600 });
  });
  if (!coarse) view.pointer({ down: mv, drag: mv });
  function mv(px, py) { if (!p || !p.inside(px, py)) return; var f = F[st.fn]; st.w = Math.round(p.ix(px) * 20) / 20; st.path = [st.w]; update(); }
  function update() {
    var f = F[st.fn], w = st.w, g = f.d(w), n = st.path.length - 1, s;
    if (isFinite(st.path[0])) s0.set(st.path[0], true);
    s = "Paso " + n + ": w = <b>" + (isFinite(w) && Math.abs(w) < 1e6 ? w.toFixed(4) : "∞ (diverge)") + "</b> · L(w) = <b>" + (isFinite(f.f(w)) && Math.abs(w) < 1e6 ? f.f(w).toFixed(4) : "∞") + "</b> · dL/dw = <b>" + (Math.abs(w) < 1e6 ? g.toFixed(4) : "∞") + "</b>";
    if (st.fn === "quad") {
      var fac = 1 - 2 * st.lr;
      s += "<br>Objetivo: w = 3, el peso que mejor acierta la nota. Cada paso multiplica la distancia a w = 3 por (1 − 2·lr) = <b>" + fac.toFixed(2) + "</b> → " + (Math.abs(fac) < 1 ? (Math.abs(fac) < 0.05 ? "<span class='good'>cae casi de golpe</span>" : fac < 0 ? "<span class='good'>converge saltando de un lado al otro</span>" : "<span class='good'>converge suavemente</span>") : Math.abs(fac) === 1 ? "oscila sin converger" : "<span class='bad'>|factor| &gt; 1: diverge</span>");
    } else s += "<br>Con dos valles, el punto de partida decide a cuál llegas (mínimo local o global). Arrastra el punto inicial.";
    s += "<br>Actualización: w ← w − lr · dL/dw = " + (Math.abs(w) < 1e6 ? w.toFixed(3) + " − " + st.lr.toFixed(2) + " · " + g.toFixed(3) + " = " + (w - st.lr * g).toFixed(3) : "—");
    out.set(s); view.redraw();
  }
  reset();
});
