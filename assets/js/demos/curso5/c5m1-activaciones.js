/* Experimento: las cuatro activaciones de PyTorch (torch.sigmoid, torch.tanh, torch.relu, nn.LeakyReLU)
   y sus derivadas, que es lo que autograd multiplica al retroceder. Se elige z y cuántas capas seguidas
   atraviesa el gradiente. */
Lab.register("curso5/c5m1-activaciones", function (root, api) {
  var D = api.d, M = api.math;
  var S = { z: 0.5, n: 4, slope: 0.1 };
  var A = [
    { k: "sig", n: "sigmoide", f: M.sigmoid, d: function (z) { var s = M.sigmoid(z); return s * (1 - s); } },
    { k: "tanh", n: "tanh", f: Math.tanh, d: function (z) { var t = Math.tanh(z); return 1 - t * t; } },
    { k: "relu", n: "ReLU", f: function (z) { return Math.max(0, z); }, d: function (z) { return z > 0 ? 1 : 0; } },
    { k: "leaky", n: "LeakyReLU", f: function (z) { return z > 0 ? z : S.slope * z; }, d: function (z) { return z > 0 ? 1 : S.slope; } }
  ];
  function col(C, k) { return k === "sig" ? C.cobalto : k === "tanh" ? C.terracota : k === "relu" ? C.oliva : C.ink2; }

  var vF = api.view(root, { aspect: 2.5, minH: 170, maxH: 260, drag: true, label: "Gráfica de las cuatro funciones de activación" });
  var pF = api.plot(vF, { xr: [-6, 6], yr: [-1.5, 2.5], xticks: 6, yticks: 4, ylabel: "f(z)", pad: { l: 44, r: 10, t: 12, b: 22 }, xfmt: function (v) { return +v.toFixed(0); } });
  var vD = api.view(root, { aspect: 2.5, minH: 150, maxH: 230, drag: true, label: "Gráfica de las derivadas de las cuatro activaciones" });
  var pD = api.plot(vD, { xr: [-6, 6], yr: [0, 1.1], xticks: 6, yticks: 2, xlabel: "z (lo que recibe la neurona antes de activar)", ylabel: "f ′(z)", pad: { l: 44, r: 10, t: 12, b: 38 }, xfmt: function (v) { return +v.toFixed(0); }, yfmt: function (v) { return +v.toFixed(2); } });
  var ui = api.controls(root);
  var sZ = ui.slider({ label: "z", min: -6, max: 6, step: 0.05, value: S.z, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.z = v; update(); } });
  ui.slider({ label: "Capas seguidas que atraviesa el gradiente (n)", min: 1, max: 10, step: 1, value: S.n, fmt: function (v) { return v; }, onInput: function (v) { S.n = v; update(); } });
  ui.slider({ label: "negative_slope de LeakyReLU", min: 0, max: 0.5, step: 0.01, value: S.slope, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.slope = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "sigmoide"], [api.colors().terracota, "tanh"], [api.colors().oliva, "ReLU"], [api.colors().ink2, "LeakyReLU"]]);
  var tb = api.table(root, ["activación", "f(z)", "derivada", "derivada en n capas"]);
  var out = api.readout(root);

  function setZ(p, px) { var z = M.clamp(p.ix(px), -6, 6); S.z = Math.round(z * 20) / 20; sZ.set(S.z, true); update(); }
  vF.pointer({ down: function (x) { setZ(pF, x); }, drag: function (x) { setZ(pF, x); } });
  vD.pointer({ down: function (x) { setZ(pD, x); }, drag: function (x) { setZ(pD, x); } });

  function curve(ctx, p, fn, color, dash, w) {
    var pts = [], i, N = 160;
    for (i = 0; i <= N; i++) { var z = -6 + 12 * i / N; pts.push([p.x(z), p.y(fn(z))]); }
    D.path(ctx, pts, color, w || 2.4, dash);
  }
  vF.draw(function (ctx, w, h, C) {
    pF.axes(ctx); ctx.save(); pF.clip(ctx);
    A.forEach(function (a) { curve(ctx, pF, a.f, col(C, a.k), a.k === "leaky" ? [5, 3] : null); });
    D.line(ctx, pF.x(S.z), pF.box.y, pF.x(S.z), pF.box.y + pF.box.h, C.ink, 1.4, [4, 3]);
    A.forEach(function (a) { var v = a.f(S.z); if (v <= pF.yr[1] && v >= pF.yr[0]) D.circle(ctx, pF.x(S.z), pF.y(v), 4.5, col(C, a.k), C.paper, 1.5); });
    ctx.restore();
  });
  vD.draw(function (ctx, w, h, C) {
    pD.axes(ctx); ctx.save(); pD.clip(ctx);
    A.forEach(function (a) { curve(ctx, pD, a.d, col(C, a.k), a.k === "leaky" ? [5, 3] : null); });
    D.line(ctx, pD.x(S.z), pD.box.y, pD.x(S.z), pD.box.y + pD.box.h, C.ink, 1.4, [4, 3]);
    A.forEach(function (a) { D.circle(ctx, pD.x(S.z), pD.y(a.d(S.z)), 4.5, col(C, a.k), C.paper, 1.5); });
    ctx.restore();
  });

  function sci(v) {
    if (v === 0) return "0";
    if (Math.abs(v) >= 0.001) return v.toFixed(4).replace("-", "−");
    var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    return m.toFixed(2) + "·10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  function update() {
    var rows = A.map(function (a) {
      var d = a.d(S.z);
      return [a.n, a.f(S.z).toFixed(4).replace("-", "−"), d.toFixed(4), sci(Math.pow(d, S.n))];
    });
    tb.set(rows);
    var ds = A.map(function (a) { return Math.pow(a.d(S.z), S.n); });
    out.set("En z = <b>" + S.z.toFixed(2) + "</b> el gradiente que llega a una capa lejana se multiplica por f ′(z) en cada una de las <b>" + S.n + "</b> capas:<br>" +
      "con sigmoide queda <b>" + sci(ds[0]) + "</b> de su valor original; con ReLU, <b>" + sci(ds[2]) + "</b>." +
      (Math.abs(S.z) > 4 ? "<br><span class='bad'>|z| grande: sigmoide y tanh están saturadas (derivada casi 0).</span>" : "") +
      (S.z < 0 ? "<br>z negativa: la ReLU vale 0 y su derivada 0 (neurona apagada); LeakyReLU conserva " + S.slope.toFixed(2) + "." : ""));
    vF.redraw(); vD.redraw();
  }
  update();
});
