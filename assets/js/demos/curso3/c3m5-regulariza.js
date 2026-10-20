/* Experimento: L1 frente a L2 en el espacio de dos pesos (w₁, w₂).
   Pérdida de datos J₀(w) = ½(w−w*)ᵀA(w−w*) con w* = (2,2; 0,7) y A = [[1; 0,8], [0,8; 1]] (dos variables muy correlacionadas).
   Se minimiza J₀ + λ·penalización con el método exacto de cada caso:
     L2 (Keras l2(λ) = λ·Σw²):  w = (A + 2λI)⁻¹·A·w*      L1 (l1(λ) = λ·Σ|w|): descenso por coordenadas con umbral blando. */
Lab.register("curso3/c3m5-regulariza", function (root, api) {
  var D = api.d, M = api.math;
  var A = [[1, 0.8], [0.8, 1]], WS = [2.2, 0.7];
  var S = { pen: "l1", lam: 0.6 };
  function soft(z, t) { return z > t ? z - t : (z < -t ? z + t : 0); }
  function solve(pen, lam) {
    if (pen === "none" || lam === 0) return WS.slice();
    if (pen === "l2") {
      var a = A[0][0] + 2 * lam, b = A[0][1], d = A[1][1] + 2 * lam, det = a * d - b * b;
      var r0 = A[0][0] * WS[0] + A[0][1] * WS[1], r1 = A[1][0] * WS[0] + A[1][1] * WS[1];
      return [(d * r0 - b * r1) / det, (-b * r0 + a * r1) / det];
    }
    var w = WS.slice(), it, i, j, z;
    for (it = 0; it < 400; it++) for (i = 0; i < 2; i++) { j = 1 - i; z = WS[i] - A[i][j] * (w[j] - WS[j]) / A[i][i]; w[i] = soft(z, lam / A[i][i]); }
    return w;
  }
  function J0(w) { var d0 = w[0] - WS[0], d1 = w[1] - WS[1]; return 0.5 * (A[0][0] * d0 * d0 + 2 * A[0][1] * d0 * d1 + A[1][1] * d1 * d1); }
  function pen(p, w) { return p === "l1" ? Math.abs(w[0]) + Math.abs(w[1]) : (p === "l2" ? w[0] * w[0] + w[1] * w[1] : 0); }

  var view = api.view(root, { aspect: 1.5, minH: 260, maxH: 420, label: "Contornos de la pérdida de datos, forma de la penalización y camino de la solución al subir lambda" });
  var plot = api.plot(view, { xr: [-0.8, 3.2], yr: [-1, 2], grid: false, xticks: 1, yticks: 1, pad: { l: 34, r: 12, t: 12, b: 30 }, xfmt: function () { return ""; }, yfmt: function () { return ""; }, xlabel: "w₁ (peso de «minutos vistos»)", ylabel: "w₂ («capítulos vistos»)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Regularizador", value: S.pen, options: [["none", "ninguno"], ["l1", "L1 · l1(λ)"], ["l2", "L2 · l2(λ)"]], onChange: function (v) { S.pen = v; update(); } });
  ui.slider({ label: "λ (el número que va dentro de l1(...) o l2(...))", min: 0, max: 1.6, step: 0.02, value: S.lam, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lam = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "curvas de nivel de la pérdida de datos"], [api.colors().terracota, "borde de la penalización que pasa por la solución"], [api.colors().ink, "camino de la solución al subir λ"]]);

  function draw(ctx, w, h, C) {
    var b = plot.box, sc = b.w / 4.0, k, i;
    plot.yr = [2 - (b.h / sc) * 0.5 - 0.5, 2 - (b.h / sc) * 0.5 - 0.5 + b.h / sc];      // misma escala en x e y
    var y0 = 0.5 - b.h / sc / 2; plot.yr = [y0, y0 + b.h / sc];
    plot.axes(ctx);
    for (k = -0; k <= 3; k++) { D.line(ctx, plot.x(k), b.y, plot.x(k), b.y + b.h, C.line, 1); D.text(ctx, String(k), plot.x(k), b.y + b.h + 14, { align: "center", size: 11, color: C.muted, mono: true }); }
    for (k = Math.ceil(plot.yr[0]); k <= Math.floor(plot.yr[1]); k++) { D.line(ctx, b.x, plot.y(k), b.x + b.w, plot.y(k), C.line, 1); D.text(ctx, String(k), b.x - 6, plot.y(k) + 4, { align: "right", size: 11, color: C.muted, mono: true }); }
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), b.y, plot.x(0), b.y + b.h, C.ink2, 1.2); D.line(ctx, b.x, plot.y(0), b.x + b.w, plot.y(0), C.ink2, 1.2);
    // elipses de J0: autovalores 1,8 (v = (1,1)/√2) y 0,2 (v = (1,−1)/√2)
    [0.08, 0.25, 0.6, 1.2, 2.2].forEach(function (L, idx) {
      var pts = [], th, r1 = Math.sqrt(2 * L / 1.8), r2 = Math.sqrt(2 * L / 0.2), q = Math.SQRT1_2;
      for (th = 0; th <= 6.2832 + 0.05; th += 0.08) {
        var u = r1 * Math.cos(th), v = r2 * Math.sin(th);
        pts.push([plot.x(WS[0] + q * (u + v)), plot.y(WS[1] + q * (u - v))]);
      }
      D.path(ctx, pts, C.cobalto, idx === 0 ? 2 : 1.4);
    });
    var sol = solve(S.pen, S.lam), path = [], lam;
    if (S.pen !== "none") {
      for (lam = 0; lam <= S.lam + 1e-9; lam += 0.02) { var q2 = solve(S.pen, lam); path.push([plot.x(q2[0]), plot.y(q2[1])]); }
      D.path(ctx, path, C.ink, 2.2);
      var r = pen(S.pen, sol);
      if (S.pen === "l2") { ctx.beginPath(); ctx.arc(plot.x(0), plot.y(0), Math.sqrt(r) * sc, 0, 6.2832); ctx.strokeStyle = C.terracota; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]); }
      else D.path(ctx, [[plot.x(r), plot.y(0)], [plot.x(0), plot.y(r)], [plot.x(-r), plot.y(0)], [plot.x(0), plot.y(-r)], [plot.x(r), plot.y(0)]], C.terracota, 2.2, [6, 4]);
    }
    ctx.restore();
    D.circle(ctx, plot.x(WS[0]), plot.y(WS[1]), 5, C.paper, C.cobalto, 2.4);
    D.text(ctx, "w* (sin regularizar)", plot.x(WS[0]) - 9, plot.y(WS[1]) - 9, { align: "right", size: 11, color: C.cobaltoInk, weight: 600 });
    D.circle(ctx, plot.x(sol[0]), plot.y(sol[1]), 6.5, C.terracota, C.ink, 2);
  }
  view.draw(draw);

  function f2(v) { return (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3).replace("-", "−"); }
  function update() {
    var sol = solve(S.pen, S.lam), j = J0(sol), p = S.pen === "none" ? 0 : S.lam * pen(S.pen, sol);
    var zero = Math.abs(sol[1]) < 1e-6 || Math.abs(sol[0]) < 1e-6;
    var penTxt = S.pen === "l1" ? "λ·(|w₁| + |w₂|) = " + S.lam.toFixed(2) + "·" + (Math.abs(sol[0]) + Math.abs(sol[1])).toFixed(3) : (S.pen === "l2" ? "λ·(w₁² + w₂²) = " + S.lam.toFixed(2) + "·" + (sol[0] * sol[0] + sol[1] * sol[1]).toFixed(3) : "—");
    out.set("Solución: w₁ = <b>" + f2(sol[0]) + "</b>, w₂ = <b>" + f2(sol[1]) + "</b>" + (S.pen === "l1" && zero ? " <b class='good'>← un peso vale exactamente 0 (esquina del rombo)</b>" : "") +
      "<br>Pérdida de datos J₀ = <b>" + j.toFixed(3) + "</b> · penalización " + penTxt + " = <b>" + p.toFixed(3) + "</b> · total = <b>" + (j + p).toFixed(3) + "</b>" +
      "<br>Tamaño de los pesos: |w₁| + |w₂| = " + (Math.abs(sol[0]) + Math.abs(sol[1])).toFixed(3) + " · w₁² + w₂² = " + (sol[0] * sol[0] + sol[1] * sol[1]).toFixed(3));
    view.redraw();
  }
  update();
});
