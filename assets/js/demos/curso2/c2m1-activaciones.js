/* Experimento: catálogo de funciones de activación con su derivada y la zona de saturación (gradiente ≈ 0). */
Lab.register("curso2/c2m1-activaciones", function (root, api) {
  var M = api.math, D = api.d;
  var S = { act: "sigmoid", z: 2.5 };
  var ACT = {
    sigmoid: { name: "Sigmoide", f: function (z) { return 1 / (1 + Math.exp(-z)); }, df: function (z) { var s = 1 / (1 + Math.exp(-z)); return s * (1 - s); },
      yr: [-0.25, 1.25], yt: 6, yr2: [-0.05, 0.3], yt2: 7, txt: "σ(z) = 1 / (1 + e^(−z)) · σ′(z) = σ(z)·(1 − σ(z))", rango: "(0, 1)" },
    tanh: { name: "tanh", f: Math.tanh, df: function (z) { var t = Math.tanh(z); return 1 - t * t; },
      yr: [-1.5, 1.5], yt: 6, yr2: [-0.25, 1.25], yt2: 6, txt: "tanh(z) = (e^z − e^(−z)) / (e^z + e^(−z)) · tanh′(z) = 1 − tanh²(z)", rango: "(−1, 1)" },
    relu: { name: "ReLU", f: function (z) { return Math.max(0, z); }, df: function (z) { return z > 0 ? 1 : 0; },
      yr: [-2, 8], yt: 5, yr2: [-0.25, 1.25], yt2: 6, txt: "ReLU(z) = max(0, z) · ReLU′(z) = 1 si z > 0, 0 si z < 0", rango: "[0, ∞)" },
    leaky: { name: "Leaky ReLU (α = 0,1)", f: function (z) { return z > 0 ? z : 0.1 * z; }, df: function (z) { return z > 0 ? 1 : 0.1; },
      yr: [-2, 8], yt: 5, yr2: [-0.25, 1.25], yt2: 6, txt: "LeakyReLU(z) = z si z > 0, α·z si z ≤ 0 · derivada = 1 o α", rango: "(−∞, ∞)" },
    step: { name: "Escalón", f: function (z) { return z > 0 ? 1 : 0; }, df: function () { return 0; },
      yr: [-0.25, 1.25], yt: 6, yr2: [-0.25, 1.25], yt2: 6, txt: "escalón(z) = 1 si z > 0, 0 si no · derivada = 0 en todas partes (salvo el salto)", rango: "{0, 1}" }
  };
  var THR = 0.02;     // por debajo de este valor consideramos que el gradiente «ya no pasa»

  var row = api.el("div", { class: "lab-row" });
  var colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var v1 = api.view(colA, { aspect: 1.15, minH: 230, maxH: 400, drag: true, label: "Función de activación f(z) con el punto z elegido" });
  var v2 = api.view(colB, { aspect: 1.15, minH: 230, maxH: 400, drag: true, label: "Derivada f'(z) con la zona de saturación sombreada" });
  var po1 = { xr: [-8, 8], yr: [-0.25, 1.25], xticks: 8, yticks: 6, xlabel: "z", ylabel: "f(z)", pad: { l: 46, r: 12, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); } };
  var po2 = { xr: [-8, 8], yr: [-0.05, 0.3], xticks: 8, yticks: 7, xlabel: "z", ylabel: "f′(z)", pad: { l: 46, r: 12, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); } };
  var p1 = api.plot(v1, po1), p2 = api.plot(v2, po2);

  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Función de activación", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].name]; }), onChange: function (v) { S.act = v; update(); } });
  var sl = ui.slider({ label: "z (también puedes arrastrar en los gráficos)", min: -8, max: 8, step: 0.1, value: S.z, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "f(z): lo que sale de la neurona"], [api.colors().terracota, "f′(z): cuánto gradiente la atraviesa"], [api.colors().marker, "zona saturada: f′ < 0,02"]]);

  function satBands(ctx, p, C) {
    var A = ACT[S.act], b = p.box, x, run = null, i, N = Math.max(60, Math.floor(b.w / 3));
    function flush(a, c) { ctx.globalAlpha = 0.55; ctx.fillStyle = C.markerWash; ctx.fillRect(a, b.y, c - a, b.h); ctx.globalAlpha = 1; }
    for (i = 0; i <= N; i++) {
      x = b.x + b.w * i / N;
      var sat = A.df(p.ix(x)) < THR;
      if (sat && run === null) run = x;
      if (!sat && run !== null) { flush(run, x); run = null; }
    }
    if (run !== null) flush(run, b.x + b.w);
  }

  function drawF(ctx, w, h, C) {
    var A = ACT[S.act], pts = [], i, zc = S.z;
    p1.yr = A.yr; po1.yticks = A.yt;
    p1.axes(ctx); ctx.save(); p1.clip(ctx);
    satBands(ctx, p1, C);
    D.line(ctx, p1.x(-8), p1.y(0), p1.x(8), p1.y(0), C.muted, 1, [3, 3]);
    for (i = 0; i <= 320; i++) { var zz = -8 + 16 * i / 320; pts.push([p1.x(zz), p1.y(A.f(zz))]); }
    if (S.act === "step") { D.path(ctx, pts.filter(function (q) { return q[0] < p1.x(0); }), C.cobalto, 3); D.path(ctx, pts.filter(function (q) { return q[0] >= p1.x(0); }), C.cobalto, 3); }
    else D.path(ctx, pts, C.cobalto, 3);
    var px = p1.x(zc), py = p1.y(A.f(zc));
    D.line(ctx, px, p1.box.y, px, p1.box.y + p1.box.h, C.terracota, 1.3, [4, 3]);
    ctx.restore();
    D.circle(ctx, px, py, 7, C.cobalto, C.ink, 2);
    var right = zc < 2;
    D.text(ctx, "f = " + A.f(zc).toFixed(3), right ? px + 12 : px - 12, M.clamp(py - 12, p1.box.y + 14, p1.box.y + p1.box.h - 8), { size: 12, mono: true, weight: 600, color: C.cobaltoInk, align: right ? "left" : "right" });
  }
  function drawD(ctx, w, h, C) {
    var A = ACT[S.act], pts = [], i, zc = S.z;
    p2.yr = A.yr2; po2.yticks = A.yt2;
    p2.axes(ctx); ctx.save(); p2.clip(ctx);
    satBands(ctx, p2, C);
    D.line(ctx, p2.x(-8), p2.y(0), p2.x(8), p2.y(0), C.muted, 1, [3, 3]);
    for (i = 0; i <= 320; i++) { var zz = -8 + 16 * i / 320; pts.push([p2.x(zz), p2.y(A.df(zz))]); }
    D.path(ctx, pts, C.terracota, 3);
    var px = p2.x(zc), py = p2.y(A.df(zc));
    D.line(ctx, px, p2.box.y, px, p2.box.y + p2.box.h, C.terracota, 1.3, [4, 3]);
    ctx.restore();
    D.circle(ctx, px, py, 7, C.terracota, C.ink, 2);
    var right = zc < 2;
    D.text(ctx, "f′ = " + A.df(zc).toFixed(4), right ? px + 12 : px - 12, M.clamp(py - 12, p2.box.y + 14, p2.box.y + p2.box.h - 8), { size: 12, mono: true, weight: 600, color: C.terracotaInk, align: right ? "left" : "right" });
  }

  function sci(x) { if (x === 0) return "0"; if (Math.abs(x) < 1e-3) return x.toExponential(1); return x.toFixed(4); }
  function update() {
    var A = ACT[S.act], f = A.f(S.z), d = A.df(S.z), sat = d < THR;
    var n5 = Math.pow(d, 5);
    out.set(
      A.txt + "<br>Rango de salida: " + A.rango + "<br>" +
      "z = <b>" + S.z.toFixed(1) + "</b> → f(z) = <b>" + f.toFixed(4) + "</b> · f′(z) = <b>" + sci(d) + "</b><br>" +
      (sat ? "<span class='bad'>Zona SATURADA: el gradiente se multiplica por " + sci(d) + " y casi no llega a las capas anteriores.</span>"
           : "<span class='good'>Zona activa: el gradiente pasa multiplicado por " + sci(d) + ".</span>") +
      "<br>Si 5 capas seguidas estuvieran en este z: " + sci(d) + "<sup>5</sup> = <b>" + (n5 === 0 ? "0" : n5.toExponential(1)) + "</b>"
    );
    v1.redraw(); v2.redraw();
  }
  function mv(px, py, which) {
    var p = which === 1 ? p1 : p2;
    if (px < p.box.x - 4 || px > p.box.x + p.box.w + 4) return;
    S.z = M.clamp(Math.round(p.ix(px) * 10) / 10, -8, 8); sl.set(S.z, true); update();
  }
  v1.pointer({ down: function (x, y) { mv(x, y, 1); }, drag: function (x, y) { mv(x, y, 1); } });
  v2.pointer({ down: function (x, y) { mv(x, y, 2); }, drag: function (x, y) { mv(x, y, 2); } });
  v1.draw(drawF); v2.draw(drawD); update();
});
