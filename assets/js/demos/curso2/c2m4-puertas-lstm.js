/* Experimento: un paso de una LSTM con 1 neurona. Cuatro "cajas" (olvido f, entrada i, candidato g, salida o) se calculan
   con los pesos del texto; tú mueves la entrada, la memoria anterior y los sesgos de las puertas. */
Lab.register("curso2/c2m4-puertas-lstm", function (root, api) {
  var D = api.d, M = api.math;
  var P = { f: [1, 1], i: [2, 0], g: [1, -1], o: [1, 2] };      // (w_x, w_h) de cada caja, como en el texto
  var S = { x: 1, h: 0.5, c: 1, bf: 0, bi: -1, bo: 0 };
  var R;

  function n(v, k) { return v.toFixed(k === undefined ? 3 : k).replace(".", ",").replace("-", "−"); }

  function compute() {
    var z = {
      f: P.f[0] * S.x + P.f[1] * S.h + S.bf,
      i: P.i[0] * S.x + P.i[1] * S.h + S.bi,
      g: P.g[0] * S.x + P.g[1] * S.h + 0,
      o: P.o[0] * S.x + P.o[1] * S.h + S.bo
    };
    var f = M.sigmoid(z.f), i = M.sigmoid(z.i), g = Math.tanh(z.g), o = M.sigmoid(z.o);
    var keep = f * S.c, add = i * g, c = keep + add, tc = Math.tanh(c), h = o * tc;
    R = { z: z, f: f, i: i, g: g, o: o, keep: keep, add: add, c: c, tc: tc, h: h };
  }

  var view = api.view(root, { aspect: 1.7, minH: 385, maxH: 400, label: "Cinta transportadora de la celda de memoria de una LSTM con las puertas de olvido, entrada y salida" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function sl(label, key, lo, hi, step) {
    ui.slider({ label: label, min: lo, max: hi, step: step, value: S[key], fmt: function (v) { return n(v, 2); }, onInput: function (v) { S[key] = v; update(); } });
  }
  sl("Entrada xₜ", "x", -2, 2, 0.05);
  sl("Estado oculto anterior hₜ₋₁", "h", -1, 1, 0.05);
  sl("Memoria anterior cₜ₋₁ (la cinta)", "c", -3, 3, 0.05);
  sl("Sesgo de la puerta de OLVIDO (b_f)", "bf", -5, 5, 0.1);
  sl("Sesgo de la puerta de ENTRADA (b_i)", "bi", -5, 5, 0.1);
  sl("Sesgo de la puerta de SALIDA (b_o)", "bo", -5, 5, 0.1);

  function bar(ctx, cx, base, v, col, C, wd) {
    var hh = v * 20;
    D.rect(ctx, cx - wd / 2, hh >= 0 ? base - hh : base, wd, Math.abs(hh), col, C.ink, 1);
  }
  // Puerta: una ranura; la parte tapada (1 - valor) se cierra desde los dos lados. horizontal=true la gira 90 grados.
  function gate(ctx, x, y, val, C, horizontal) {
    var L = 58, T = 22, c = (L - 4) * (1 - val) / 2;
    if (!horizontal) {
      D.rect(ctx, x - T / 2, y - L / 2, T, L, C.surface, C.ink, 1.6);
      D.rect(ctx, x - T / 2 + 1.5, y - L / 2 + 1.5, T - 3, c, C.terracota);
      D.rect(ctx, x - T / 2 + 1.5, y + L / 2 - 1.5 - c, T - 3, c, C.terracota);
    } else {
      D.rect(ctx, x - L / 2, y - T / 2, L, T, C.surface, C.ink, 1.6);
      D.rect(ctx, x - L / 2 + 1.5, y - T / 2 + 1.5, c, T - 3, C.terracota);
      D.rect(ctx, x + L / 2 - 1.5 - c, y - T / 2 + 1.5, c, T - 3, C.terracota);
    }
  }
  function meter(ctx, x, y, w, label, val, lo, hi, col, C) {
    D.text(ctx, label, x, y - 6, { size: 11, color: C.ink2 });
    D.rect(ctx, x, y, w, 10, C.paper, C.line, 1);
    var zero = x + w * (0 - lo) / (hi - lo), px = x + w * (val - lo) / (hi - lo);
    D.rect(ctx, Math.min(zero, px), y + 1, Math.abs(px - zero), 8, col);
    D.line(ctx, zero, y - 2, zero, y + 12, C.ink, 1);
    D.text(ctx, n(val, 3), x + w + 8, y + 9, { size: 11, mono: true, color: C.ink });
  }
  function draw(ctx, w, h, C) {
    var beltY = 122, base = beltY - 8;
    D.text(ctx, "CELDA DE MEMORIA  c  (la cinta transportadora)", 12, 16, { size: 11.5, color: C.muted, weight: 500 });
    var x0 = w * 0.09, xf = w * 0.27, xk = w * 0.42, xp = w * 0.55, xc = w * 0.70, xo = w * 0.87;
    // cinta
    D.rect(ctx, 8, beltY - 6, w - 16, 12, C.paper2 || C.surface, C.ink, 1.5);
    D.arrow(ctx, 14, beltY, w - 12, beltY, C.muted, 1.2);
    // c_{t-1}
    bar(ctx, x0, base, S.c, C.cobalto, C, 18);
    D.text(ctx, "c\u209c\u208b\u2081", x0, beltY + 22, { size: 11.5, align: "center", weight: 600 });
    D.text(ctx, n(S.c, 2), x0, beltY + 36, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // puerta de olvido (la cinta pasa por su ranura)
    gate(ctx, xf, beltY, R.f, C, false);
    D.text(ctx, "olvido f", xf, beltY - 46, { size: 11, align: "center", weight: 600 });
    D.text(ctx, n(R.f, 2), xf, beltY - 34, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // tras el olvido
    bar(ctx, xk, base, R.keep, C.cobalto, C, 18);
    D.text(ctx, "f·c", xk, beltY + 22, { size: 11.5, align: "center", weight: 600 });
    D.text(ctx, n(R.keep, 2), xk, beltY + 36, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // suma con lo nuevo
    D.circle(ctx, xp, beltY, 12, C.surface, C.ink, 2);
    D.text(ctx, "+", xp, beltY + 5, { size: 17, align: "center", weight: 600 });
    D.arrow(ctx, xp, beltY + 74, xp, beltY + 14, C.oliva, 2);
    D.text(ctx, "lo nuevo  i·g", xp, beltY + 90, { size: 11, align: "center", weight: 600, color: C.olivaInk });
    D.text(ctx, n(R.i, 2) + " × " + n(R.g, 2) + " = " + n(R.add, 2), xp, beltY + 104, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // c_t
    bar(ctx, xc, base, R.c, C.cobalto, C, 18);
    D.text(ctx, "c\u209c", xc, beltY + 22, { size: 11.5, align: "center", weight: 600 });
    D.text(ctx, n(R.c, 2), xc, beltY + 36, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // rama de salida: tanh(c_t) -> puerta o -> h_t
    D.line(ctx, xo, beltY + 6, xo, beltY + 50, C.muted, 1.5, [4, 3]);
    D.text(ctx, "tanh", xo + 5, beltY + 28, { size: 10, color: C.muted });
    gate(ctx, xo, beltY + 62, R.o, C, true);
    D.text(ctx, "salida o", xo - 36, beltY + 58, { size: 11, align: "right", weight: 600 });
    D.text(ctx, n(R.o, 2), xo - 36, beltY + 71, { size: 10.5, align: "right", mono: true, color: C.ink2 });
    D.line(ctx, xo, beltY + 74, xo, beltY + 98, C.muted, 1.5, [4, 3]);
    bar(ctx, xo, beltY + 122, R.h, C.terracota, C, 18);
    D.line(ctx, xo - 18, beltY + 122, xo + 18, beltY + 122, C.line, 1);
    D.text(ctx, "h\u209c", xo, beltY + 138, { size: 11.5, align: "center", weight: 600, color: C.terracotaInk });
    D.text(ctx, n(R.h, 3), xo, beltY + 152, { size: 10.5, align: "center", mono: true, color: C.ink2 });
    // medidores de las cuatro cajas
    var my = h - 56, mw = Math.min(w * 0.30, 160), mx = 14;
    meter(ctx, mx, my, mw, "olvido f = σ(z_f)", R.f, 0, 1, C.terracota, C);
    meter(ctx, mx, my + 30, mw, "entrada i = σ(z_i)", R.i, 0, 1, C.terracota, C);
    var mx2 = w * 0.52;
    meter(ctx, mx2, my, mw, "candidato g = tanh(z_g)", R.g, -1, 1, C.oliva, C);
    meter(ctx, mx2, my + 30, mw, "salida o = σ(z_o)", R.o, 0, 1, C.terracota, C);
  }
  compute();
  view.draw(draw);
  function update() {
    compute();
    view.redraw();
    var verdict;
    if (R.f < 0.2) verdict = "<span class='bad'>Puerta de olvido casi cerrada: la memoria anterior se borra (se conserva el " + Math.round(R.f * 100) + " %).</span>";
    else if (R.f > 0.9) verdict = "<span class='good'>Puerta de olvido casi abierta: la memoria pasa casi intacta (y el gradiente también).</span>";
    else verdict = "Puerta de olvido a medias: se conserva el " + Math.round(R.f * 100) + " % de la memoria.";
    out.set("z_f = 1·" + n(S.x, 2) + " + 1·" + n(S.h, 2) + " + " + n(S.bf, 1) + " = <b>" + n(R.z.f, 3) + "</b> → f = <b>" + n(R.f, 3) + "</b><br>" +
      "z_i = 2·" + n(S.x, 2) + " + 0·" + n(S.h, 2) + " + " + n(S.bi, 1) + " = <b>" + n(R.z.i, 3) + "</b> → i = <b>" + n(R.i, 3) + "</b><br>" +
      "z_g = 1·" + n(S.x, 2) + " − 1·" + n(S.h, 2) + " = <b>" + n(R.z.g, 3) + "</b> → g = <b>" + n(R.g, 3) + "</b><br>" +
      "z_o = 1·" + n(S.x, 2) + " + 2·" + n(S.h, 2) + " + " + n(S.bo, 1) + " = <b>" + n(R.z.o, 3) + "</b> → o = <b>" + n(R.o, 3) + "</b><br>" +
      "cₜ = f·cₜ₋₁ + i·g = " + n(R.f, 3) + "·" + n(S.c, 2) + " + " + n(R.i, 3) + "·" + n(R.g, 3) + " = <b>" + n(R.c, 4) + "</b><br>" +
      "hₜ = o·tanh(cₜ) = " + n(R.o, 3) + "·" + n(R.tc, 4) + " = <b>" + n(R.h, 4) + "</b><br>" + verdict);
  }
  update();
});
