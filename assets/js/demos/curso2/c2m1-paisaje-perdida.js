/* Experimento: el paisaje de la pérdida de UN peso y gradient descent con distintos learning rates.
   Modelo: ŷ = w·x con los datos (1, 2) y (2, 4). Pérdida MSE: L(w) = 2,5·(w − 2)². Gradiente: dL/dw = 5·(w − 2).
   Disfraz: x = nota de la crítica, y = nota que tú le das (siempre el doble; escala inventada). */
Lab.register("curso2/c2m1-paisaje-perdida", function (root, api) {
  var M = api.math, D = api.d;
  var DATA = [[1, 2], [2, 4]];
  var S = { w0: 0, eta: 0.1, hist: [0], busted: false };
  function L(w) { return 0.5 * DATA.reduce(function (s, d) { var e = w * d[0] - d[1]; return s + e * e; }, 0); }
  function G(w) { return DATA.reduce(function (s, d) { return s + (w * d[0] - d[1]) * d[0]; }, 0); }   // = 5(w-2)
  function cur() { return S.hist[S.hist.length - 1]; }

  var row = api.el("div", { class: "lab-row" });
  var colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var v1 = api.view(colA, { aspect: 1.1, minH: 250, maxH: 420, label: "Curva de la pérdida L(w) con el recorrido de gradient descent" });
  var p1 = api.plot(v1, { xr: [-2, 6], yr: [0, 45], xticks: 8, yticks: 5, xlabel: "valor del peso w", ylabel: "pérdida L(w)", pad: { l: 46, r: 12, t: 14, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var v2 = api.view(colB, { aspect: 1.1, minH: 250, maxH: 420, label: "Dos películas (nota de la crítica, tu nota) y recta ŷ = w·x con el valor actual de w" });
  var p2 = api.plot(v2, { xr: [0, 3], yr: [0, 8], xticks: 3, yticks: 4, xlabel: "x · nota de la crítica", ylabel: "y · tu nota", pad: { l: 40, r: 12, t: 14, b: 36 } });

  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var slEta = ui.slider({ label: "Learning rate η", min: 0.02, max: 0.5, step: 0.01, value: S.eta, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.eta = v; update(); } });
  var slW = ui.slider({ label: "Punto de partida w₀", min: -2, max: 6, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w0 = v; restart(); } });
  var running = false, loop = null;
  function step() {
    var w = cur(); if (!isFinite(w) || Math.abs(w) > 1e6) { S.busted = true; return false; }
    S.hist.push(w - S.eta * G(w)); if (S.hist.length > 400) S.hist.shift(); return true;
  }
  function restart() { stop(); S.hist = [S.w0]; S.busted = false; update(); }
  function stop() { running = false; if (loop) loop.stop(); btnPlay.textContent = "▶ Animar"; }
  ui.button("Dar 1 paso", function () { stop(); step(); update(); }, "primary");
  ui.button("Dar 10 pasos", function () { stop(); for (var i = 0; i < 10; i++) if (!step()) break; update(); });
  var btnPlay = ui.button("▶ Animar", function () {
    if (running) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 30; i++) if (!step()) break; update(); return; }
    running = true; btnPlay.textContent = "❚❚ Pausa"; loop.start();
  });
  ui.button("Volver al inicio", function () { restart(); });
  var count = 0;
  loop = api.loop(function () {
    if (!step() || ++count > 60) { count = 0; stop(); update(); return false; }
    update();
  }, { fps: 4 });

  function px(w) { return p1.x(w); }
  function drawL(ctx, w, h, C) {
    var i, pts = [], H = S.hist;
    p1.axes(ctx); ctx.save(); p1.clip(ctx);
    for (i = 0; i <= 200; i++) { var ww = -2 + 8 * i / 200; pts.push([p1.x(ww), p1.y(L(ww))]); }
    D.path(ctx, pts, C.cobalto, 3);
    var wc = cur();
    if (isFinite(wc) && Math.abs(wc) < 1e3) {
      var g = G(wc), lw = L(wc), a = wc - 1.2, b = wc + 1.2;
      // tangente
      D.line(ctx, p1.x(a), p1.y(lw + g * (a - wc)), p1.x(b), p1.y(lw + g * (b - wc)), C.terracota, 2, [6, 4]);
      // recorrido
      for (i = 1; i < H.length; i++) if (Math.abs(H[i]) < 1e3 && Math.abs(H[i - 1]) < 1e3) D.line(ctx, p1.x(H[i - 1]), p1.y(L(H[i - 1])), p1.x(H[i]), p1.y(L(H[i])), C.muted, 1.2);
      for (i = 0; i < H.length - 1; i++) if (Math.abs(H[i]) < 1e3) D.circle(ctx, p1.x(H[i]), p1.y(L(H[i])), 4, C.paper, C.ink, 1.5);
      // paso siguiente sobre el eje
      var wn = wc - S.eta * g;
      if (Math.abs(wn - wc) > 0.02 && Math.abs(wn - wc) < 7 && wc > -2.4 && wc < 6.4) {
        D.arrow(ctx, p1.x(wc), p1.y(0) - 6, p1.x(M.clamp(wn, -2.4, 6.4)), p1.y(0) - 6, C.marker, 3);
      }
    }
    ctx.restore();
    if (isFinite(wc) && wc > -2 && wc < 6) {
      D.circle(ctx, p1.x(wc), p1.y(Math.min(L(wc), 44)), 8, C.terracota, C.ink, 2);
    }
    D.text(ctx, "mínimo: w = 2", p1.x(2), p1.y(0) - 36, { size: 11, align: "center", color: C.olivaInk, weight: 600 });
  }
  function drawD(ctx, w, h, C) {
    p2.axes(ctx); ctx.save(); p2.clip(ctx);
    var wc = cur(), ok = isFinite(wc) && Math.abs(wc) < 1e3;
    D.line(ctx, p2.x(0), p2.y(0), p2.x(2), p2.y(4), C.olivaInk, 1.5, [5, 4]);
    if (ok) {
      D.line(ctx, p2.x(0), p2.y(0), p2.x(3.2), p2.y(3.2 * wc), C.terracota, 3);
      DATA.forEach(function (d) { D.line(ctx, p2.x(d[0]), p2.y(d[1]), p2.x(d[0]), p2.y(wc * d[0]), C.ink, 1.5); });
    }
    ctx.restore();
    DATA.forEach(function (d) { D.circle(ctx, p2.x(d[0]), p2.y(d[1]), 7, C.cobalto, C.ink, 2); });
    D.text(ctx, "tu criterio real (w = 2)", p2.box.x + 6, p2.box.y + 16, { size: 11, color: C.olivaInk, weight: 600 });
    D.text(ctx, "lo que predice el modelo ŷ = w·x", p2.box.x + 6, p2.box.y + 32, { size: 11, color: C.terracotaInk, weight: 600 });
  }

  function update() {
    var w = cur(), n = S.hist.length - 1, f = 1 - 5 * S.eta, ok = isFinite(w) && Math.abs(w) < 1e6;
    var msg;
    if (Math.abs(f) < 1e-9 && S.eta > 0.1) msg = "|1 − 5η| = 1: salta de un lado a otro sin acercarse nunca.";
    else if (Math.abs(f) < 1e-9) msg = "factor 0: llega al mínimo exacto en un solo paso.";
    else if (Math.abs(f) > 1) msg = "<span class='bad'>|1 − 5η| = " + Math.abs(f).toFixed(2) + " &gt; 1: cada paso se aleja más del mínimo. DIVERGE.</span>";
    else if (f < 0) msg = "<span class='good'>1 − 5η = " + f.toFixed(2) + " &lt; 0: salta de un lado a otro, pero cada salto es más corto: converge.</span>";
    else msg = "<span class='good'>1 − 5η = " + f.toFixed(2) + ": baja suave, el error se multiplica por " + f.toFixed(2) + " en cada paso.</span>";
    if (!ok) { out.set("Iteración " + n + ": el peso se ha disparado (|w| &gt; 10⁶).<br><span class='bad'>El learning rate era demasiado grande: la pérdida crece en vez de bajar.</span><br>" + msg); }
    else out.set(
      "Iteración <b>" + n + "</b> · w = <b>" + w.toFixed(4) + "</b> · L(w) = <b>" + (L(w) > 1e5 ? L(w).toExponential(2) : L(w).toFixed(4)) + "</b><br>" +
      "Gradiente g = dL/dw = 5·(w − 2) = <b>" + G(w).toFixed(4) + "</b><br>" +
      "Paso: w ← w − η·g = " + w.toFixed(4) + " − " + S.eta.toFixed(2) + "·(" + G(w).toFixed(4) + ") = <b>" + (w - S.eta * G(w)).toFixed(4) + "</b><br>" + msg);
    v1.redraw(); v2.redraw();
  }
  v1.draw(drawL); v2.draw(drawD); update();
  return { destroy: function () { stop(); } };
});
