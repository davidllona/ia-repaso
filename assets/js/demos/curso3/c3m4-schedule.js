/* Experimento: el schedule de ruido. β_t lineal o coseno → ᾱ_t = Π(1 − β_s). Cuánto ruido hay en cada punto del proceso y
   qué aspecto tiene un dígito real (un «3» de 8×8 de scikit-learn) en esos puntos, con x_t = √ᾱ·x0 + √(1−ᾱ)·ε. */
Lab.register("curso3/c3m4-schedule", function (root, api) {
  var D = api.d, M = api.math;
  var DIG = [0, 0, 9, 16, 13, 6, 0, 0, 0, 0, 6, 5, 16, 16, 0, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 5, 14, 3, 0, 0, 0, 0, 0, 0, 9, 15, 2, 0, 0, 0, 0, 0, 0, 11, 12, 0, 0, 0, 4, 8, 11, 15, 12, 0, 0, 0, 11, 14, 12, 8, 0, 0];
  var S = { kind: "lin", T: 1000, bend: 0.02 }, r = api.rng(8), EPS = []; for (var i = 0; i < 64; i++) EPS.push(r.normal(0, 1));
  var view = api.view(root, { aspect: 1.45, minH: 250, maxH: 380, label: "Curvas de alfa barra para el schedule lineal y el coseno" });
  var strip = api.view(root, { aspect: 5.2, minH: 70, maxH: 120, label: "Un dígito con ruido en seis momentos del proceso" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Schedule elegido", value: "lin", options: [["lin", "Lineal"], ["cos", "Coseno"]], onChange: function (v) { S.kind = v; update(); } });
  ui.slider({ label: "Número de pasos T", min: 50, max: 1000, step: 50, value: S.T, fmt: function (v) { return v; }, onInput: function (v) { S.T = v; update(); } });
  ui.slider({ label: "β final (solo lineal; β₁ = 0,0001)", min: 0.005, max: 0.1, step: 0.005, value: S.bend, fmt: function (v) { return v.toFixed(3).replace(".", ","); }, onInput: function (v) { S.bend = v; update(); } });

  function abarLin(T, bEnd) { var a = [], p = 1, b0 = 1e-4, t; for (t = 0; t < T; t++) { var b = b0 + (bEnd - b0) * (T === 1 ? 0 : t / (T - 1)); p *= 1 - b; a.push(p); } return a; }
  function abarCos(T) { var a = [], s = 0.008, f0 = Math.pow(Math.cos(s / (1 + s) * Math.PI / 2), 2), t; for (t = 1; t <= T; t++) { var ft = Math.pow(Math.cos((t / T + s) / (1 + s) * Math.PI / 2), 2); a.push(Math.max(ft / f0, 0)); } return a; }
  function curves() { return { lin: abarLin(S.T, S.bend), cos: abarCos(S.T) }; }
  var FR = [0, 0.1, 0.25, 0.5, 0.75, 1];
  var pl = api.plot(view, { xr: [0, 1], yr: [0, 1], pad: { l: 52, r: 18, t: 12, b: 36 }, xticks: 4, yticks: 4, xlabel: "t / T  (fracción del proceso)", ylabel: "ᾱ_t (señal que queda)", xfmt: function (v) { return v.toFixed(2).replace(".", ","); }, yfmt: function (v) { return v.toFixed(2).replace(".", ","); } });
  function idx(T, fr) { return Math.max(0, Math.min(T - 1, Math.round(fr * T) - 1)); }
  function draw(ctx, w, h, C) {
    var cv = curves(), T = S.T, t, pts;
    pl.axes(ctx); ctx.save(); pl.clip(ctx);
    D.line(ctx, pl.x(0), pl.y(0.5), pl.x(1), pl.y(0.5), C.muted, 1, [4, 4]);
    ["lin", "cos"].forEach(function (k) {
      var sel = k === S.kind; pts = [];
      for (t = 0; t < T; t++) pts.push([pl.x((t + 1) / T), pl.y(cv[k][t])]);
      pts.unshift([pl.x(0), pl.y(1)]);
      ctx.save(); ctx.globalAlpha = sel ? 1 : 0.45; D.path(ctx, pts, k === "lin" ? C.cobalto : C.terracota, sel ? 3.2 : 1.8, sel ? [] : [5, 4]); ctx.restore();
    });
    FR.forEach(function (fr) { var v = fr === 0 ? 1 : cv[S.kind][idx(T, fr)]; D.circle(ctx, pl.x(fr), pl.y(v), 4.5, C.paper, C.ink, 2); });
    ctx.restore();
    var lx = pl.x(0.52);
    D.text(ctx, "Lineal", lx, pl.y(0.93), { size: 12, weight: 700, color: C.cobaltoInk }); D.text(ctx, "Coseno", lx, pl.y(0.85), { size: 12, weight: 700, color: C.terracotaInk });
    D.text(ctx, "trazo grueso = el elegido · puntos = imágenes de abajo", lx, pl.y(0.77), { size: 10, color: C.muted });
  }
  function drawStrip(ctx, w, h, C) {
    var cv = curves(), a = cv[S.kind], n = FR.length, g = 8, size = Math.min(h - 18, (w - g * (n + 1)) / n), x0 = (w - (size * n + g * (n - 1))) / 2;
    FR.forEach(function (fr, k) {
      var ab = fr === 0 ? 1 : a[idx(S.T, fr)], xx = x0 + k * (size + g), y0 = 2, c = size / 8;
      D.rect(ctx, xx, y0, size, size, C.surface, C.ink, 1.2);
      for (var i = 0; i < 64; i++) {
        var x0v = 2 * DIG[i] / 16 - 1, xt = Math.sqrt(ab) * x0v + Math.sqrt(1 - ab) * EPS[i];
        ctx.save(); ctx.globalAlpha = M.clamp((xt + 1) / 2, 0, 1); ctx.fillStyle = C.ink; ctx.fillRect(xx + (i % 8) * c, y0 + Math.floor(i / 8) * c, c + 0.4, c + 0.4); ctx.restore();
      }
      D.text(ctx, "t/T=" + String(fr).replace(".", ","), xx + size / 2, y0 + size + 13, { size: 10, mono: true, align: "center", color: C.ink2 });
    });
  }
  function firstBelow(a, th) { for (var i = 0; i < a.length; i++) if (a[i] < th) return i + 1; return null; }
  function f4(v) { return v < 0.0001 ? "<0,0001" : v.toFixed(4).replace(".", ","); }
  function update() {
    var cv = curves(), a = cv[S.kind], T = S.T, h = firstBelow(a, 0.5), z = firstBelow(a, 0.05);
    var cl = cv.lin, cc = cv.cos;
    var waste = z === null ? 0 : (T - z + 1) / T;
    out.set("<b>" + (S.kind === "lin" ? "Lineal" : "Coseno") + ", T = " + T + "</b>: ᾱ_T = <b>" + f4(a[T - 1]) + "</b> (señal que queda al final) · ᾱ cruza 0,5 en t = <b>" + (h || "—") + "</b> (fracción " + (h ? (h / T).toFixed(2).replace(".", ",") : "—") + " del proceso)<br>" +
      "Pasos con ᾱ &lt; 0,05 (casi solo ruido): <b>" + Math.round(waste * 100) + " %</b> de los T. <br>Comparación a la misma T: el lineal cruza 0,5 en " + (firstBelow(cl, 0.5) || "—") + " y el coseno en " + (firstBelow(cc, 0.5) || "—") + ". " +
      (S.kind === "lin" && waste > 0.3 ? "<span class='bad'>El lineal destruye la imagen pronto y gasta muchos pasos final en ruido casi puro.</span>" : "<span class='good'>La señal se pierde de forma más gradual.</span>"));
    view.redraw(); strip.redraw();
  }
  view.draw(draw); strip.draw(drawStrip); update();
});
