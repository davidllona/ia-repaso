/* Experimento: backpropagation paso a paso en la red 2-2-1 con ReLU y pérdida cuadrática (la misma del texto).
   Todo se calcula de verdad: forward, regla de la cadena hacia atrás, comprobación numérica y paso de gradient descent. */
Lab.register("curso5/c5m2-backprop-mano", function (root, api) {
  var D = api.d, C0 = api.colors();
  var P = { w11: 1, w12: 0.5, b1: -1, w21: -1, w22: 1, b2: 0.5, v1: 2, v2: -1, c: 0.5 };
  var S = { x1: 1, x2: 2, y: 2, lr: 0.01, phase: 0, steps: 0 };
  var PH = [
    "Forward: z₁ = w₁₁x₁ + w₁₂x₂ + b₁, h = ReLU(z), ŷ = v₁h₁ + v₂h₂ + c, L = (ŷ − y)²",
    "Empezamos por el final: ∂L/∂ŷ = 2(ŷ − y)",
    "Capa de salida: ∂L/∂v_j = (∂L/∂ŷ)·h_j y ∂L/∂c = ∂L/∂ŷ",
    "Retroceder una capa: ∂L/∂h_j = (∂L/∂ŷ)·v_j",
    "Cruzar la ReLU: δ_j = ∂L/∂z_j = (∂L/∂h_j)·[z_j > 0]  (la derivada de ReLU es 1 o 0)",
    "Capa oculta: ∂L/∂w_jk = δ_j·x_k y ∂L/∂b_j = δ_j",
    "Actualizar: parámetro ← parámetro − lr·gradiente, y repetir el forward"
  ];
  function relu(z) { return z > 0 ? z : 0; }
  function fwd(p, x1, x2, y) {
    var z1 = p.w11 * x1 + p.w12 * x2 + p.b1, z2 = p.w21 * x1 + p.w22 * x2 + p.b2, h1 = relu(z1), h2 = relu(z2);
    var yh = p.v1 * h1 + p.v2 * h2 + p.c;
    return { z1: z1, z2: z2, h1: h1, h2: h2, yh: yh, L: (yh - y) * (yh - y) };
  }
  function grads(p, x1, x2, y) {
    var f = fwd(p, x1, x2, y), dy = 2 * (f.yh - y), dh1 = dy * p.v1, dh2 = dy * p.v2;
    var d1 = z1pos(f.z1) * dh1, d2 = z1pos(f.z2) * dh2;
    return { f: f, dy: dy, v1: dy * f.h1, v2: dy * f.h2, c: dy, dh1: dh1, dh2: dh2, d1: d1, d2: d2,
      w11: d1 * x1, w12: d1 * x2, b1: d1, w21: d2 * x1, w22: d2 * x2, b2: d2 };
  }
  function z1pos(z) { return z > 0 ? 1 : 0; }
  var KEYS = ["w11", "w12", "b1", "w21", "w22", "b2", "v1", "v2", "c"];
  var NAMES = { w11: "w₁₁", w12: "w₁₂", b1: "b₁", w21: "w₂₁", w22: "w₂₂", b2: "b₂", v1: "v₁", v2: "v₂", c: "c" };
  function f2(v) { return (Math.abs(v) < 5e-5 ? 0 : v).toFixed(2).replace("-", "−"); }
  function f4(v) { return (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4).replace("-", "−"); }
  function f3(v) { return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−"); }

  var view = api.view(root, { aspect: 1.9, minH: 230, maxH: 300, label: "Red 2-2-1 con los valores del forward arriba de cada neurona y los deltas del backward debajo" });
  var ui = api.controls(root);
  var bstep = ui.button("Paso siguiente ▸", function () { if (S.phase < 6) S.phase++; update(); }, "primary");
  ui.button("◂ Paso anterior", function () { if (S.phase > 0) S.phase--; update(); });
  ui.button("Aplicar la actualización y repetir", function () { applyStep(); });
  ui.slider({ label: "Entrada x₁", min: -2, max: 2, step: 0.1, value: S.x1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x1 = v; update(); } });
  ui.slider({ label: "Entrada x₂", min: -2, max: 2, step: 0.1, value: S.x2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x2 = v; update(); } });
  ui.slider({ label: "Respuesta correcta y", min: -2, max: 4, step: 0.1, value: S.y, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.y = v; update(); } });
  var sb2 = ui.slider({ label: "Bias b₂ de la neurona oculta 2 (bájalo para «matarla»)", min: -4, max: 2, step: 0.1, value: P.b2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { P.b2 = v; update(); } });
  ui.slider({ label: "Learning rate", min: 0.002, max: 0.04, step: 0.002, value: S.lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { S.lr = v; update(); } });
  var out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var tb = api.table(root, ["parám.", "valor", "∂L/∂parám.", "nuevo"]);

  function applyStep() {
    var g = grads(P, S.x1, S.x2, S.y);
    KEYS.forEach(function (k) { P[k] = P[k] - S.lr * g[k]; });
    sb2.set(Math.max(-4, Math.min(2, P.b2)), true);
    S.phase = 0; S.steps++; update();
  }

  function draw(ctx, w, h, C) {
    var g = grads(P, S.x1, S.x2, S.y), f = g.f, ph = S.phase, r = Math.max(15, Math.min(22, w * 0.045));
    var px = [w * 0.13, w * 0.5, w * 0.87], yIn = [h * 0.34, h * 0.70], yH = [h * 0.34, h * 0.70], yO = h * 0.52;
    var N = { x1: [px[0], yIn[0]], x2: [px[0], yIn[1]], h1: [px[1], yH[0]], h2: [px[1], yH[1]], o: [px[2], yO] };
    function edge(a, b, val, lbl, col) {
      D.line(ctx, a[0], a[1], b[0], b[1], col || C.ink2, Math.min(4, 1 + Math.abs(val) * 1.2));
    }
    edge(N.x1, N.h1, P.w11); edge(N.x2, N.h1, P.w12); edge(N.x1, N.h2, P.w21); edge(N.x2, N.h2, P.w22); edge(N.h1, N.o, P.v1); edge(N.h2, N.o, P.v2);
    function node(p, label, fill) { D.circle(ctx, p[0], p[1], r, fill, C.ink, 1.6); D.text(ctx, label, p[0], p[1] + 4, { size: 12, align: "center", color: C.ink, weight: 500 }); }
    node(N.x1, "x₁", C.paper); node(N.x2, "x₂", C.paper);
    var dead1 = f.z1 <= 0, dead2 = f.z2 <= 0;
    node(N.h1, "h₁", dead1 ? C.line : C.cobaltoWash); node(N.h2, "h₂", dead2 ? C.line : C.cobaltoWash); node(N.o, "ŷ", C.terracotaWash);
    var small = w < 480, fs = small ? 10 : 11.5;
    function tag(txt, x, y, align, color, weight) {
      ctx.save(); ctx.font = (weight || 400) + " " + fs + "px 'IBM Plex Mono',monospace";
      var tw = ctx.measureText(txt).width, x0 = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
      ctx.restore();
      D.rect(ctx, x0 - 2, y - fs, tw + 4, fs + 4, C.surface, null);
      D.text(ctx, txt, x, y, { size: fs, mono: true, align: align, color: color, weight: weight });
    }
    D.text(ctx, S.x1.toFixed(1), N.x1[0], N.x1[1] - r - 5, { size: fs, mono: true, align: "center", color: C.ink2 });
    D.text(ctx, S.x2.toFixed(1), N.x2[0], N.x2[1] + r + 13, { size: fs, mono: true, align: "center", color: C.ink2 });
    D.text(ctx, "z=" + f2(f.z1), N.h1[0], N.h1[1] - r - 16, { size: fs, mono: true, align: "center", color: C.ink2 });
    D.text(ctx, "h=" + f2(f.h1), N.h1[0], N.h1[1] - r - 4, { size: fs, mono: true, align: "center", color: C.cobaltoInk, weight: 500 });
    D.text(ctx, "z=" + f2(f.z2), N.h2[0], N.h2[1] + r + 12, { size: fs, mono: true, align: "center", color: C.ink2 });
    D.text(ctx, "h=" + f2(f.h2), N.h2[0], N.h2[1] + r + 24, { size: fs, mono: true, align: "center", color: C.cobaltoInk, weight: 500 });
    D.text(ctx, "ŷ=" + f2(f.yh), N.o[0], N.o[1] - r - 16, { size: fs, mono: true, align: "center", color: C.cobaltoInk, weight: 500 });
    D.text(ctx, "L=" + f2(f.L), N.o[0], N.o[1] - r - 4, { size: fs, mono: true, align: "center", color: C.terracotaInk, weight: 500 });
    var tc = C.terracotaInk;
    if (ph >= 1) tag((small ? "∂ŷ=" : "∂L/∂ŷ=") + f2(g.dy), N.o[0], N.o[1] + r + 13, "center", tc, 500);
    if (ph >= 3) { var nm = small ? "∂h=" : "∂L/∂h="; tag(nm + f2(g.dh1), N.h1[0] + r + 6, N.h1[1] + 4 - (small ? 12 : 0), "left", tc, 400); tag(nm + f2(g.dh2), N.h2[0] + r + 6, N.h2[1] + 4 + (small ? 12 : 0), "left", tc, 400); }
    if (ph >= 4) { tag("δ₁=" + f2(g.d1), N.h1[0] - r - 6, N.h1[1] + 4, "right", tc, 500); tag("δ₂=" + f2(g.d2), N.h2[0] - r - 6, N.h2[1] + 4, "right", tc, 500); }
    if (dead1 || dead2) D.text(ctx, "neurona apagada (z ≤ 0)", w / 2, h - 5, { size: 11, align: "center", color: C.muted });
  }
  view.draw(draw);

  function update() {
    var g = grads(P, S.x1, S.x2, S.y), ph = S.phase, rows = [], k;
    var nw = {}; KEYS.forEach(function (kk) { nw[kk] = P[kk] - S.lr * g[kk]; });
    var after = fwd(nw, S.x1, S.x2, S.y);
    KEYS.forEach(function (kk) {
      var showG = (kk === "v1" || kk === "v2" || kk === "c") ? ph >= 2 : ph >= 5;
      rows.push([NAMES[kk], f3(P[kk]), showG ? "<b>" + f3(g[kk]) + "</b>" : "·", ph >= 6 ? f3(nw[kk]) : "·"]);
    });
    tb.set(rows);
    var eps = 1e-6, pp = {}, pm = {}; KEYS.forEach(function (kk) { pp[kk] = P[kk]; pm[kk] = P[kk]; }); pp.w11 += eps; pm.w11 -= eps;
    var num = (fwd(pp, S.x1, S.x2, S.y).L - fwd(pm, S.x1, S.x2, S.y).L) / (2 * eps);
    var s = "<b>Fase " + (ph + 1) + " de 7.</b> " + PH[ph] + "<br>";
    if (ph >= 5) s += "Comprobación: ∂L/∂w₁₁ por la regla de la cadena = <b>" + f4(g.w11) + "</b> · derivada numérica (diferencias centrales) = <b>" + f4(num) + "</b><br>";
    if (ph >= 6) s += "Pérdida antes: <b>" + f4(g.f.L) + "</b> → después de un paso con lr = " + S.lr.toFixed(3) + ": <b>" + f4(after.L) + "</b>" + (after.L < g.f.L ? " <span class='good'>(baja)</span>" : " <span class='bad'>(¡sube! el paso es demasiado grande)</span>") + "<br>";
    if (g.f.z1 <= 0 || g.f.z2 <= 0) s += "<span class='bad'>Una neurona oculta tiene z ≤ 0: su ReLU corta el gradiente (δ = 0), y sus tres parámetros no se mueven.</span> ";
    if (S.steps) s += "Pasos aplicados: " + S.steps + ".";
    out.set(s); view.redraw();
  }
  update();
});
