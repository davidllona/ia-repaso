/* Experimento: laboratorio de una neurona (entradas, pesos, bias, suma ponderada z y activación a = f(z)).
   Disfraz: decidir si ves una peli según el gusto por su género (x1) y lo larga que es (x2). */
Lab.register("curso2/c2m1-neurona", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  // En pantallas táctiles el plano deja desplazar la página con el dedo (los sliders hacen lo mismo que el arrastre); un toque sigue colocando el punto.
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var S = { x1: 0.9, x2: 0.6, w1: 2, w2: -3, b: 0.5, act: "sigmoid" };

  var ACT = {
    sigmoid: { name: "Sigmoide", sym: "σ", f: function (z) { return 1 / (1 + Math.exp(-z)); }, yr: [-0.25, 1.25], yt: 6, norm: function (a) { return a; } },
    tanh:    { name: "tanh", sym: "tanh", f: Math.tanh, yr: [-1.5, 1.5], yt: 6, norm: function (a) { return (a + 1) / 2; } },
    relu:    { name: "ReLU", sym: "ReLU", f: function (z) { return Math.max(0, z); }, yr: [-2, 6], yt: 4, norm: function (a) { return Math.min(a / 3, 1); } },
    leaky:   { name: "Leaky ReLU (α = 0,1)", sym: "LReLU", f: function (z) { return z > 0 ? z : 0.1 * z; }, yr: [-2, 6], yt: 4, norm: function (a) { return M.clamp((a + 0.6) / 3.6, 0, 1); } },
    step:    { name: "Escalón", sym: "escalón", f: function (z) { return z > 0 ? 1 : 0; }, yr: [-0.25, 1.25], yt: 6, norm: function (a) { return a; } },
    linear:  { name: "Lineal (sin activación)", sym: "lineal", f: function (z) { return z; }, yr: [-6, 6], yt: 6, norm: function (a) { return M.clamp((a + 3) / 6, 0, 1); } }
  };

  var row = api.el("div", { class: "lab-row" });
  var colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);

  var view = api.view(colA, { aspect: 1.0, minH: 250, maxH: 440, drag: !coarse, label: "Plano de las dos entradas de la neurona (gusto por el género y duración de la peli) con la recta z = 0 y la zona donde decide ver la peli" });
  var plot = api.plot(view, { xr: [-3, 3], yr: [-3, 3], xticks: 6, yticks: 6, xlabel: "x₁ · gusto por el género", ylabel: "x₂ · duración", pad: { l: 46, r: 12, t: 12, b: 36 },
    xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var view2 = api.view(colB, { aspect: 1.0, minH: 250, maxH: 440, label: "Función de activación con el punto z actual" });
  var po2 = { xr: [-6, 6], yr: [-0.25, 1.25], xticks: 6, yticks: 4, xlabel: "z (suma ponderada)", ylabel: "a = f(z) · ganas", pad: { l: 46, r: 12, t: 12, b: 36 },
    xfmt: function (v) { return Math.round(v); } };
  var plot2 = api.plot(view2, po2);

  var ui = api.controls(root);
  var out = api.readout(root);
  var sl = {};
  function fmt1(v) { return v.toFixed(2); }
  sl.x1 = ui.slider({ label: "x₁ · gusto por el género", min: -2, max: 2, step: 0.05, value: S.x1, fmt: fmt1, onInput: function (v) { S.x1 = v; update(); } });
  sl.x2 = ui.slider({ label: "x₂ · lo larga que es", min: -2, max: 2, step: 0.05, value: S.x2, fmt: fmt1, onInput: function (v) { S.x2 = v; update(); } });
  sl.w1 = ui.slider({ label: "Peso w₁ (importancia del género)", min: -4, max: 4, step: 0.1, value: S.w1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w1 = v; update(); } });
  sl.w2 = ui.slider({ label: "Peso w₂ (importancia de la duración)", min: -4, max: 4, step: 0.1, value: S.w2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w2 = v; update(); } });
  sl.b = ui.slider({ label: "Bias b (ganas de base)", min: -4, max: 4, step: 0.1, value: S.b, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.b = v; update(); } });
  ui.select({ label: "Función de activación", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].name]; }),
    onChange: function (v) { S.act = v; update(); } });
  api.legend(root, [[C0.cobalto, "zona «sí la pongo» (z > 0)"], [C0.terracota, "zona «paso» (z < 0)"]]);

  function zOf() { return S.w1 * S.x1 + S.w2 * S.x2 + S.b; }

  function drawPlane(ctx, w, h, C) {
    var A = ACT[S.act], b = plot.box, n = 34, cw = b.w / n, ch = b.h / n, i, j;
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      var px = Math.round(b.x + i * cw), py = Math.round(b.y + j * ch);
      var pw = Math.round(b.x + (i + 1) * cw) - px, ph = Math.round(b.y + (j + 1) * ch) - py;
      var z = S.w1 * plot.ix(b.x + (i + 0.5) * cw) + S.w2 * plot.iy(b.y + (j + 0.5) * ch) + S.b;
      var t = A.norm(A.f(z));
      ctx.globalAlpha = 0.38 * t; ctx.fillStyle = C.cobalto; ctx.fillRect(px, py, pw, ph);
      ctx.globalAlpha = 0.38 * (1 - t); ctx.fillStyle = C.terracota; ctx.fillRect(px, py, pw, ph);
    }
    ctx.globalAlpha = 1;
    var nw = Math.sqrt(S.w1 * S.w1 + S.w2 * S.w2);
    if (nw > 1e-6) {
      var ux = -S.w2 / nw, uy = S.w1 / nw, p0x = -S.b * S.w1 / (nw * nw), p0y = -S.b * S.w2 / (nw * nw);
      D.line(ctx, plot.x(p0x - 20 * ux), plot.y(p0y - 20 * uy), plot.x(p0x + 20 * ux), plot.y(p0y + 20 * uy), C.ink, 2.2);
      var tipx = p0x + 0.9 * S.w1 / nw, tipy = p0y + 0.9 * S.w2 / nw;
      D.arrow(ctx, plot.x(p0x), plot.y(p0y), plot.x(tipx), plot.y(tipy), C.ink, 2);
      D.text(ctx, "w", plot.x(tipx) + 8 * (S.w1 >= 0 ? 1 : -1), plot.y(tipy) + (S.w2 >= 0 ? -6 : 14), { size: 13, weight: 600, color: C.ink, align: S.w1 >= 0 ? "left" : "right" });
    }
    ctx.restore();
    var qx = plot.x(S.x1), qy = plot.y(S.x2);
    D.circle(ctx, qx, qy, 8, C.marker, C.ink, 2);
    var flip = qx > b.x + b.w / 2;
    D.text(ctx, "x = (" + S.x1.toFixed(2) + ", " + S.x2.toFixed(2) + ")", flip ? qx - 13 : qx + 13, qy < b.y + 24 ? qy + 18 : qy - 12,
      { size: 11, color: C.ink, mono: true, align: flip ? "right" : "left", weight: 600 });
  }

  function drawFn(ctx, w, h, C) {
    var A = ACT[S.act], z = zOf(), zc = M.clamp(z, -6, 6), pts = [], i;
    plot2.yr = A.yr; po2.yticks = A.yt;
    plot2.axes(ctx);
    ctx.save(); plot2.clip(ctx);
    D.line(ctx, plot2.x(-6), plot2.y(0), plot2.x(6), plot2.y(0), C.muted, 1, [3, 3]);
    D.line(ctx, plot2.x(0), plot2.y(A.yr[0]), plot2.x(0), plot2.y(A.yr[1]), C.muted, 1, [3, 3]);
    for (i = 0; i <= 160; i++) { var zz = -6 + 12 * i / 160; pts.push([plot2.x(zz), plot2.y(A.f(zz))]); }
    D.path(ctx, pts, C.cobalto, 3);
    var a = A.f(zc), px = plot2.x(zc), py = plot2.y(a);
    D.line(ctx, px, plot2.y(A.yr[0]), px, py, C.terracota, 1.5, [4, 3]);
    D.line(ctx, plot2.box.x, py, px, py, C.terracota, 1.5, [4, 3]);
    ctx.restore();
    D.circle(ctx, px, py, 7, C.terracota, C.ink, 2);
    var left = zc > 0;
    var ty = Math.max(plot2.box.y + 14, Math.min(plot2.box.y + plot2.box.h - 8, py - 12));
    D.text(ctx, "a = " + A.f(z).toFixed(3), left ? px - 11 : px + 11, ty, { size: 12, weight: 600, color: C.terracotaInk, align: left ? "right" : "left", mono: true });
  }

  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function update() {
    var A = ACT[S.act], z = zOf(), a = A.f(z), good = z > 0;
    var t1 = S.w1 * S.x1, t2 = S.w2 * S.x2;
    function sg(v, k) { return v < 0 ? "(" + v.toFixed(k) + ")" : v.toFixed(k); }
    var nw = Math.hypot(S.w1, S.w2);
    out.set(
      "z = w₁·x₁ + w₂·x₂ + b<br>" +
      "&nbsp;&nbsp;= " + sg(S.w1, 1) + "·" + sg(S.x1, 2) + " + " + sg(S.w2, 1) + "·" + sg(S.x2, 2) + " + " + sg(S.b, 1) + "<br>" +
      "&nbsp;&nbsp;= " + sg(t1, 2) + " + " + sg(t2, 2) + " + " + sg(S.b, 1) + " = <b>" + z.toFixed(3) + "</b><br>" +
      "a = " + A.sym + "(" + z.toFixed(3) + ") = <b>" + a.toFixed(3) + "</b><br>" +
      (S.act === "linear" ? "Sin activación, la neurona devuelve z tal cual." :
        "Decisión: <span class='" + (good ? "good" : "bad") + "'>" + (good ? "z &gt; 0 → SÍ la pones" : "z ≤ 0 → NO la pones") + "</span>") +
      "<br>La recta z = 0 es la frontera; " + (nw > 1e-6 ? "b la desplaza (distancia al origen: " + (Math.abs(S.b) / nw).toFixed(2) + ")." : "con w = 0 no hay recta.")
    );
    view.redraw(); view2.redraw();
  }

  function moveX(px, py) {
    if (!plot.inside(px, py)) return;
    S.x1 = M.clamp(Math.round(plot.ix(px) * 20) / 20, -2, 2); S.x2 = M.clamp(Math.round(plot.iy(py) * 20) / 20, -2, 2);
    sl.x1.set(S.x1, true); sl.x2.set(S.x2, true); update();
  }
  view.pointer({ down: moveX, drag: moveX });
  view.draw(drawPlane); view2.draw(drawFn); update();
});
