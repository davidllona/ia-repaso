/* Experimento: regresión logística con DOS variables. p = sigmoide(w1·x1 + w2·x2 + b); la frontera p = 0.5 es la recta
   w1·x1 + w2·x2 + b = 0. Se entrena en vivo con BCE y descenso del gradiente (todos los datos). Como el fragmento 15.
   Ejemplo: x1 = días sin abrir la app, x2 = series abandonadas a medias; azul = cancelan, naranja = se quedan. */
Lab.register("curso4/c4m4-frontera-2d", function (root, api) {
  var M = api.math, D = api.d;
  var S = { sep: 2.0, lr: 0.3, seed: 3, epoch: 0, w1: 0, w2: 0, b: 0, mapa: true };
  var pts, loop, hist, ready = false;

  var wrap = api.el("div", { style: { maxWidth: "560px", margin: "0 auto" } }); root.appendChild(wrap);
  var view = api.view(wrap, { aspect: 1.1, minH: 280, maxH: 520, label: "Usuarios que se quedan y usuarios que cancelan, la recta frontera y el mapa de probabilidad" });
  var plot = api.plot(view, { xr: [-1, 7], yr: [-1, 7], xticks: 8, yticks: 8, xlabel: "x1 = días sin abrir la app", ylabel: "x2 = series abandonadas", pad: { l: 38, r: 10, t: 10, b: 36 }, grid: false });
  api.legend(root, [[api.colors().cobalto, "usuarios que cancelan"], [api.colors().terracota, "usuarios que se quedan"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Distancia entre los grupos", min: 0.5, max: 4, step: 0.1, value: S.sep, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.sep = v; regen(); } });
  ui.slider({ label: "Learning rate", min: 0.02, max: 3, step: 0.02, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; } });
  ui.toggle({ label: "Mapa de probabilidad", value: S.mapa, onChange: function (v) { S.mapa = v; view.redraw(); } });
  var bPlay = ui.button("Ejecutar", function () { if (loop.running) loop.stop(); else { if (api.reduceMotion) { advance(300); redraw(); } else loop.start(); } }, "primary");
  ui.button("+ 1 época", function () { advance(1); redraw(); });
  ui.button("+ 50 épocas", function () { advance(50); redraw(); });
  ui.button("Datos nuevos", function () { S.seed += 7; regen(); });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function regen() {
    var r = api.rng(S.seed), i, cx = 3.5 - S.sep / 2 * 0.8, cy = 3.5 - S.sep / 2 * 0.6, dx = S.sep * 0.8, dy = S.sep * 0.6;
    pts = [];
    for (i = 0; i < 40; i++) pts.push({ x: r.normal(cx, 0.8), y: r.normal(cy, 0.8), c: 0 });
    for (i = 0; i < 40; i++) pts.push({ x: r.normal(cx + dx, 0.8), y: r.normal(cy + dy, 0.8), c: 1 });
    reset();
  }
  function reset() { if (loop) loop.stop(); S.w1 = 0.1; S.w2 = -0.1; S.b = 0; S.epoch = 0; hist = []; redraw(); }
  function loss() { var s = 0, i, z; for (i = 0; i < pts.length; i++) { z = S.w1 * pts[i].x + S.w2 * pts[i].y + S.b; s += Math.max(z, 0) - z * pts[i].c + Math.log(1 + Math.exp(-Math.abs(z))); } return s / pts.length; }
  function acc() { var ok = 0, i; for (i = 0; i < pts.length; i++) if ((S.w1 * pts[i].x + S.w2 * pts[i].y + S.b > 0) === (pts[i].c === 1)) ok++; return ok; }
  function advance(n) {
    var k, i, g1, g2, gb, e, n0 = pts.length;
    for (k = 0; k < n; k++) {
      g1 = 0; g2 = 0; gb = 0;
      for (i = 0; i < n0; i++) { e = sig(S.w1 * pts[i].x + S.w2 * pts[i].y + S.b) - pts[i].c; g1 += e * pts[i].x; g2 += e * pts[i].y; gb += e; }
      S.w1 -= S.lr * g1 / n0; S.w2 -= S.lr * g2 / n0; S.b -= S.lr * gb / n0; S.epoch++;
    }
  }
  loop = api.loop(function () { advance(4); redraw(); return S.epoch < 3000; }, { fps: 20, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  view.draw(function (ctx, w, h, C) {
    if (!ready) return;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var N = 30, ix, iy, dx = 8 / N, dy = 8 / N, bx = plot.box, i, q, xa, xb, ya, yb;
    if (S.mapa) for (iy = 0; iy < N; iy++) for (ix = 0; ix < N; ix++) {
      q = sig(S.w1 * (-1 + dx * (ix + 0.5)) + S.w2 * (-1 + dy * (iy + 0.5)) + S.b);
      ctx.globalAlpha = 0.06 + 0.3 * Math.abs(q - 0.5) * 2; ctx.fillStyle = q > 0.5 ? C.cobalto : C.terracota;
      xa = Math.round(plot.x(-1 + dx * ix)); xb = Math.round(plot.x(-1 + dx * (ix + 1))); ya = Math.round(plot.y(-1 + dy * (iy + 1))); yb = Math.round(plot.y(-1 + dy * iy));
      ctx.fillRect(xa, ya, xb - xa, yb - ya);
    }
    ctx.globalAlpha = 1;
    // frontera p = 0.5 (z = 0) y rectas p = 0.1 / 0.9 (z = ∓2.197)
    [[0, C.ink, 2.8, []], [2.1972, C.ink2, 1.2, [4, 4]], [-2.1972, C.ink2, 1.2, [4, 4]]].forEach(function (L) {
      var z0 = L[0], a, b2;
      if (Math.abs(S.w2) > 1e-6) { a = (z0 - S.b - S.w1 * -1) / S.w2; b2 = (z0 - S.b - S.w1 * 7) / S.w2; D.line(ctx, plot.x(-1), plot.y(a), plot.x(7), plot.y(b2), L[1], L[2], L[3]); }
      else if (Math.abs(S.w1) > 1e-6) { a = (z0 - S.b) / S.w1; D.line(ctx, plot.x(a), bx.y, plot.x(a), bx.y + bx.h, L[1], L[2], L[3]); }
    });
    for (i = 0; i < pts.length; i++) {
      var good = (S.w1 * pts[i].x + S.w2 * pts[i].y + S.b > 0) === (pts[i].c === 1);
      D.circle(ctx, plot.x(pts[i].x), plot.y(pts[i].y), 5, pts[i].c ? C.cobalto : C.terracota, good ? C.paper : C.ink, good ? 1.2 : 2.6);
    }
    ctx.restore();
  });
  function redraw() {
    view.redraw();
    var eq = Math.abs(S.w2) > 1e-6 ? "x2 = " + (-S.w1 / S.w2).toFixed(2) + "·x1 " + (-S.b / S.w2 < 0 ? "− " : "+ ") + Math.abs(-S.b / S.w2).toFixed(2) : "recta vertical";
    out.set("época <b>" + S.epoch + "</b> · w1 = <b>" + S.w1.toFixed(3) + "</b> · w2 = <b>" + S.w2.toFixed(3) + "</b> · b = <b>" + S.b.toFixed(3) + "</b><br>" +
      "pérdida BCE = <b>" + loss().toFixed(4) + "</b> · aciertos = <b>" + acc() + " de " + pts.length + "</b><br>" +
      "frontera (z = 0): " + eq + " · las rayas finas son p = 0.1 y p = 0.9 (z = ∓2.2)");
  }
  ready = true; regen();
  return { destroy: function () { loop.stop(); } };
});
