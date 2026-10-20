/* Experimento: una sola neurona (w1, w2, b + sigmoide) frente a AND, OR y XOR.
   Se pueden mover los tres números a mano, pedir la mejor recta posible (búsqueda exhaustiva)
   o entrenar con descenso del gradiente y entropía cruzada binaria, como en el fragmento 1. */
Lab.register("curso5/c5m1-una-neurona", function (root, api) {
  var D = api.d, M = api.math;
  var PTS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  var TARGETS = { and: [0, 0, 0, 1], or: [0, 1, 1, 1], xor: [0, 1, 1, 0] };
  var NAMES = { and: "AND: avisar si has visto las dos", or: "OR: avisar si has visto alguna", xor: "XOR: avisar si has visto solo una" };
  var WHO = ["ninguna", "solo Shrek", "solo Toy Story", "las dos"];
  var S = { data: "xor", w1: 1, w2: 1, b: -1.5, steps: 0 };

  var view = api.view(root, { aspect: 1.25, minH: 270, maxH: 420, label: "Plano de los cuatro tipos de usuario según hayan visto Toy Story y Shrek, la recta de la neurona y su zona de aviso" });
  var plot = api.plot(view, { xr: [-0.45, 1.45], yr: [-0.45, 1.45], xticks: 4, yticks: 4, xlabel: "x1 · ¿has visto Toy Story?", ylabel: "x2 · ¿Shrek?", pad: { l: 40, r: 12, t: 10, b: 36 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);

  function p(i) { return M.sigmoid(S.w1 * PTS[i][0] + S.w2 * PTS[i][1] + S.b); }
  function stats() {
    var t = TARGETS[S.data], ok = 0, loss = 0, i, q;
    for (i = 0; i < 4; i++) {
      q = Math.min(1 - 1e-9, Math.max(1e-9, p(i)));
      if ((p(i) > 0.5) === (t[i] === 1)) ok++;
      loss -= t[i] ? Math.log(q) : Math.log(1 - q);
    }
    return { ok: ok, loss: loss / 4 };
  }

  var sW1, sW2, sB;
  function setSliders(w1, w2, b) {
    S.w1 = w1; S.w2 = w2; S.b = b;
    sW1.set(w1, true); sW2.set(w2, true); sB.set(b, true); update();
  }
  ui.select({ label: "Función que debe aprender", value: S.data, options: Object.keys(NAMES).map(function (k) { return [k, NAMES[k]]; }),
    onChange: function (v) { S.data = v; S.steps = 0; update(); } });
  sW1 = ui.slider({ label: "w1 (peso de x1)", min: -8, max: 8, step: 0.1, value: S.w1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w1 = v; update(); } });
  sW2 = ui.slider({ label: "w2 (peso de x2)", min: -8, max: 8, step: 0.1, value: S.w2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w2 = v; update(); } });
  sB = ui.slider({ label: "b (bias)", min: -8, max: 8, step: 0.1, value: S.b, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.b = v; update(); } });

  ui.button("Buscar la mejor recta", function () {
    var t = TARGETS[S.data], best = null, a, b, c, i, w1, w2, bb;
    for (a = -8; a <= 8; a += 0.5) for (b = -8; b <= 8; b += 0.5) for (c = -8; c <= 8; c += 0.5) {
      var ok = 0, loss = 0;
      for (i = 0; i < 4; i++) {
        var z = a * PTS[i][0] + b * PTS[i][1] + c, q = Math.min(1 - 1e-9, Math.max(1e-9, M.sigmoid(z)));
        if ((z > 0) === (t[i] === 1)) ok++;
        loss -= t[i] ? Math.log(q) : Math.log(1 - q);
      }
      if (!best || ok > best.ok || (ok === best.ok && loss < best.loss - 1e-9)) best = { ok: ok, loss: loss, w1: a, w2: b, b: c };
    }
    setSliders(best.w1, best.w2, best.b);
  }, "primary");
  ui.button("Entrenar 200 pasos", function () {
    var t = TARGETS[S.data], k, i, lr = 0.5;
    for (k = 0; k < 200; k++) {
      var g1 = 0, g2 = 0, gb = 0;
      for (i = 0; i < 4; i++) { var e = p(i) - t[i]; g1 += e * PTS[i][0] / 4; g2 += e * PTS[i][1] / 4; gb += e / 4; }
      S.w1 -= lr * g1; S.w2 -= lr * g2; S.b -= lr * gb;
    }
    S.steps += 200;
    setSliders(M.clamp(S.w1, -8, 8), M.clamp(S.w2, -8, 8), M.clamp(S.b, -8, 8));
  }, "warm");
  ui.button("w = 0, b = 0", function () { S.steps = 0; setSliders(0, 0, 0); });

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    var bx = plot.box, t = TARGETS[S.data], i;
    ctx.save(); plot.clip(ctx);
    // zona donde la neurona dice "clase 1" (z > 0): se sombrea con una malla fina
    var N = 28, ix, iy, dx = (plot.xr[1] - plot.xr[0]) / N, dy = (plot.yr[1] - plot.yr[0]) / N;
    for (iy = 0; iy < N; iy++) for (ix = 0; ix < N; ix++) {
      var x1 = plot.xr[0] + dx * (ix + 0.5), x2 = plot.yr[0] + dy * (iy + 0.5);
      var q = M.sigmoid(S.w1 * x1 + S.w2 * x2 + S.b);
      ctx.globalAlpha = 0.07 + 0.2 * Math.abs(q - 0.5) * 2;
      ctx.fillStyle = q > 0.5 ? C.cobalto : C.terracota;
      var xa = Math.round(plot.x(plot.xr[0] + dx * ix)), xb = Math.round(plot.x(plot.xr[0] + dx * (ix + 1))), ya = Math.round(plot.y(plot.yr[0] + dy * (iy + 1))), yb = Math.round(plot.y(plot.yr[0] + dy * iy));
      ctx.fillRect(xa, ya, xb - xa, yb - ya);
    }
    ctx.globalAlpha = 1;
    // la recta w1 x1 + w2 x2 + b = 0
    var x0 = plot.xr[0], x1e = plot.xr[1], y0 = plot.yr[0], y1e = plot.yr[1], pts = [];
    if (Math.abs(S.w2) > 1e-6) {
      pts = [[x0, -(S.w1 * x0 + S.b) / S.w2], [x1e, -(S.w1 * x1e + S.b) / S.w2]];
    } else if (Math.abs(S.w1) > 1e-6) {
      var xv = -S.b / S.w1; pts = [[xv, y0], [xv, y1e]];
    }
    if (pts.length) D.line(ctx, plot.x(pts[0][0]), plot.y(pts[0][1]), plot.x(pts[1][0]), plot.y(pts[1][1]), C.ink, 2.5);
    ctx.restore();
    for (i = 0; i < 4; i++) {
      var good = (p(i) > 0.5) === (t[i] === 1), cx = plot.x(PTS[i][0]), cy = plot.y(PTS[i][1]);
      D.circle(ctx, cx, cy, 11, t[i] ? C.cobalto : C.terracota, good ? C.paper : C.ink, good ? 2 : 3);
      D.text(ctx, String(t[i]), cx, cy + 4, { size: 12, align: "center", weight: 700, color: C.paper });
      if (!good) D.text(ctx, "✗", cx + (PTS[i][0] ? -20 : 20), cy - 12, { size: 14, align: "center", weight: 700, color: C.terracotaInk });
      D.text(ctx, WHO[i], cx, cy + 27, { size: 10.5, align: "center", weight: 600, color: C.ink2 });
    }
  });

  function update() {
    var s = stats(), t = TARGETS[S.data], i, lines = "";
    for (i = 0; i < 4; i++) {
      var z = S.w1 * PTS[i][0] + S.w2 * PTS[i][1] + S.b, q = M.sigmoid(z), good = (q > 0.5) === (t[i] === 1);
      lines += "(" + PTS[i][0] + "," + PTS[i][1] + ") " + WHO[i] + ": z=" + (z < 0 ? "−" : "") + Math.abs(z).toFixed(2) + " p=" + q.toFixed(2) + " (aviso: debe ser " + t[i] + ") " + (good ? "<span class='good'>✓</span>" : "<span class='bad'>✗</span>") + "<br>";
    }
    var verdict = s.ok === 4 ? "<span class='good'>¡Una recta basta para esta función!</span>"
      : (S.data === "xor" ? "Con XOR nunca pasarás de <b>3 de 4</b>: ninguna recta separa a quien ha visto una sola de quien no ha visto ninguna o ha visto las dos." : "Todavía fallan usuarios: mueve la recta o pulsa «Buscar».");
    out.set(lines + "Aciertos: <b>" + s.ok + " de 4</b> · pérdida media (BCE) = <b>" + s.loss.toFixed(3) + "</b>" + (S.steps ? " · pasos entrenados: <b>" + S.steps + "</b>" : "") + "<br>" + verdict);
    view.redraw();
  }
  update();
});
