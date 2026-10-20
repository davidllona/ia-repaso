/* Experimento: por qué normalizar las entradas. Descenso de gradiente real sobre una regresión de 2 pesos. */
Lab.register("curso2/c2m2-normalizar", function (root, api) {
  var M = api.math, st = { s: 10, lri: 2, steps: 60, norm: false };
  var LRS = [0.0005, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 0.6];
  var data, mom, WR = [-1, 5];

  var view = api.view(root, { aspect: 1.55, minH: 260, maxH: 400, drag: false, label: "Paisaje de la pérdida en el plano de los dos pesos, con el camino del descenso de gradiente" });
  var plot = api.plot(view, { xr: WR, yr: WR, xticks: 6, yticks: 6, grid: false, xlabel: "peso w₁ (presupuesto)", ylabel: "peso w₂ (días desde estreno)", pad: { l: 44, r: 10, t: 10, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Escala de la feature 2: días desde el estreno (desviación típica)", min: 1, max: 30, step: 1, value: st.s, onInput: function (v) { st.s = v; moments(); update(); } });
  ui.slider({ label: "learning_rate", min: 0, max: LRS.length - 1, step: 1, value: st.lri, fmt: function (v) { return LRS[v]; }, onInput: function (v) { st.lri = v; update(); } });
  ui.slider({ label: "Pasos de gradient descent dibujados", min: 0, max: 150, step: 1, value: st.steps, onInput: function (v) { st.steps = v; update(); } });
  ui.toggle({ label: "Normalizar las entradas (media 0, desviación 1)", value: st.norm, onChange: function (v) { st.norm = v; moments(); update(); } });

  /* Datos: x1 ~ N(0,1), x2 ~ N(0, s). y = 2·x1 + 3·(x2/s) + ruido. */
  function moments() {
    var r = api.rng(8), n = 200, x1 = [], x2 = [], y = [], i, s = st.s;
    for (i = 0; i < n; i++) { var a = r.normal(0, 1), b = r.normal(0, s); x1.push(a); x2.push(b); y.push(2 * a + 3 * b / s + r.normal(0, 0.3)); }
    if (st.norm) {
      var m1 = M.mean(x1), s1 = M.std(x1), m2 = M.mean(x2), s2 = M.std(x2);
      x1 = x1.map(function (v) { return (v - m1) / s1; }); x2 = x2.map(function (v) { return (v - m2) / s2; });
    }
    var A = 0, B = 0, Cc = 0, D = 0, E = 0, F = 0;
    for (i = 0; i < n; i++) { A += x1[i] * x1[i]; B += x1[i] * x2[i]; Cc += x2[i] * x2[i]; D += x1[i] * y[i]; E += x2[i] * y[i]; F += y[i] * y[i]; }
    mom = { A: A / n, B: B / n, C: Cc / n, D: D / n, E: E / n, F: F / n };
    var det = mom.A * mom.C - mom.B * mom.B;
    mom.wopt = [(mom.D * mom.C - mom.E * mom.B) / det, (mom.A * mom.E - mom.B * mom.D) / det];
    mom.lmin = loss(mom.wopt[0], mom.wopt[1]);
  }
  function loss(w1, w2) { return mom.A * w1 * w1 + 2 * mom.B * w1 * w2 + mom.C * w2 * w2 - 2 * mom.D * w1 - 2 * mom.E * w2 + mom.F; }
  function path(n, lr) {
    var w = [0, 0], pts = [[0, 0]], i;
    for (i = 0; i < n; i++) {
      var g1 = 2 * (mom.A * w[0] + mom.B * w[1] - mom.D), g2 = 2 * (mom.B * w[0] + mom.C * w[1] - mom.E);
      w = [w[0] - lr * g1, w[1] - lr * g2]; pts.push(w.slice());
      if (!isFinite(w[0]) || Math.abs(w[0]) > 1e8 || Math.abs(w[1]) > 1e8) break;
    }
    return pts;
  }
  function stepsToGoal(lr) {
    var w = [0, 0], i;
    for (i = 0; i < 4000; i++) {
      if (loss(w[0], w[1]) <= mom.lmin * 1.05 + 0.005) return i;
      var g1 = 2 * (mom.A * w[0] + mom.B * w[1] - mom.D), g2 = 2 * (mom.B * w[0] + mom.C * w[1] - mom.E);
      w = [w[0] - lr * g1, w[1] - lr * g2];
      if (!isFinite(w[0]) || Math.abs(w[0]) > 1e8) return -1;
    }
    return -2;
  }
  function draw(ctx, w, h, C) {
    var D = api.d, b = plot.box, n = 38, cw = b.w / n, ch = b.h / n, i, j, lo = Math.log10(mom.lmin + 1e-3), hi = lo + 3.2;
    plot.axes(ctx);
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var wx = plot.ix(b.x + (i + 0.5) * cw), wy = plot.iy(b.y + (j + 0.5) * ch), L = loss(wx, wy);
      var t = Math.max(0, Math.min(1, (Math.log10(Math.max(L, 1e-9)) - lo) / (hi - lo)));
      t = Math.floor(t * 8) / 8;                      // bandas: cada franja es un nivel de pérdida
      ctx.fillStyle = window.C2M2.mix(C.cobaltoWash, C.terracota, t * 0.55); ctx.fillRect(b.x + i * cw - 0.3, b.y + j * ch - 0.3, cw + 0.6, ch + 0.6);
    }
    ctx.save(); plot.clip(ctx);
    var pts = path(st.steps, LRS[st.lri]), px = [], out = false;
    for (i = 0; i < pts.length; i++) {
      if (Math.abs(pts[i][0]) > 40 || Math.abs(pts[i][1]) > 40) { out = true; break; }
      px.push([plot.x(pts[i][0]), plot.y(pts[i][1])]);
    }
    D.path(ctx, px, C.ink, 1.8);
    for (i = 0; i < px.length; i++) if (i % Math.max(1, Math.ceil(px.length / 40)) === 0) D.circle(ctx, px[i][0], px[i][1], 2.6, C.ink, null);
    D.circle(ctx, plot.x(0), plot.y(0), 5.5, C.cobalto, C.paper, 2);
    var last = px[px.length - 1]; D.circle(ctx, last[0], last[1], 5.5, C.terracota, C.paper, 2);
    if (out) D.text(ctx, "¡se sale del gráfico: diverge!", b.x + b.w / 2, b.y + b.h - 10, { align: "center", size: 11.5, weight: 700, color: C.terracotaInk });
    D.text(ctx, "★", plot.x(mom.wopt[0]), plot.y(mom.wopt[1]) + 5, { align: "center", size: 18, color: C.olivaInk, weight: 700 });
    ctx.restore();
    D.text(ctx, "inicio", plot.x(0) + 8, plot.y(0) - 8, { size: 10.5, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "★ mínimo", b.x + b.w - 6, b.y + 14, { align: "right", size: 10.5, weight: 600, color: C.olivaInk });
    D.text(ctx, "tono rojizo = pérdida alta", b.x + b.w - 6, b.y + 27, { align: "right", size: 10, color: C.muted });
  }
  function update() {
    view.redraw();
    var lr = LRS[st.lri], pts = path(st.steps, lr), last = pts[pts.length - 1], L = loss(last[0], last[1]), div = !isFinite(L) || Math.abs(last[0]) > 1e6 || L > 1e6;
    var need = stepsToGoal(lr), needTxt = need === -1 ? "<span class='bad'>nunca: diverge</span>" : need === -2 ? "<span class='bad'>más de 4 000</span>" : "<b>" + need + "</b>";
    var s1 = st.norm ? 1 : 1, s2 = st.norm ? 1 : st.s, cond = Math.pow(s2 / s1, 2);
    out.set((st.norm ? "entradas <b>normalizadas</b> (ambas con desviación 1)" : "entradas <b>sin normalizar</b> (desviaciones 1 y " + st.s + ": presupuesto y días)") + " · learning_rate <b>" + lr + "</b><br>" +
      "tras " + (pts.length - 1) + " pasos: w = (" + (div ? "∞" : last[0].toFixed(2)) + ", " + (div ? "∞" : last[1].toFixed(2)) + ") · pérdida = <b>" + (div ? "→ ∞ (explota)" : L.toFixed(3)) + "</b> (mínimo posible " + mom.lmin.toFixed(3) + ")<br>" +
      "pasos para llegar casi al mínimo con este learning_rate: " + needTxt + " · lo «alargado» del valle ≈ " + (cond < 1.5 ? "1 (circular)" : cond.toFixed(0) + " : 1") +
      (div ? "<br><span class='bad'>Con un learning_rate tan grande para la feature de escala grande, cada paso se pasa de largo y el error crece.</span>" : need >= 0 && need < 40 ? "<br><span class='good'>El valle es casi redondo: un learning_rate cómodo sirve para los dos pesos.</span>" : "<br><span class='bad'>Valle muy alargado: o el learning_rate es pequeño (lento) o grande (explota). No hay un valor bueno para los dos pesos a la vez.</span>"));
  }
  moments(); view.draw(draw); update();
});
