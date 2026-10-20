/* Experimento: la «cinta» de GradientTape. Primero se graba hacia delante (m = w·x, z = m + b, e = z − t, L = e²);
   después se rebobina hacia atrás multiplicando derivadas locales (regla de la cadena). */
Lab.register("curso3/c3m1-cinta", function (root, api) {
  var D = api.d, M = api.math;
  var S = { x: 3, w: 2, b: 1, t: 10, lr: 0.05, ph: 0, steps: 0 };
  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 340, label: "Grafo de cálculo con la cinta: valores hacia delante y gradientes hacia atrás" });
  var ui = api.controls(root), out = api.readout(root);
  function sl(label, key, mn, mx, st) {
    return ui.slider({ label: label, min: mn, max: mx, step: st, value: S[key], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S[key] = v; update(); } });
  }
  var sx = sl("x (constante: capítulos de la semana pasada)", "x", -3, 3, 0.1);
  var sw = sl("w (tf.Variable)", "w", -4, 4, 0.1);
  var sb = sl("b (tf.Variable)", "b", -4, 4, 0.1);
  var st = sl("t (objetivo: capítulos de esta semana)", "t", -5, 15, 0.1);
  ui.button("◀ Atrás", function () { if (S.ph > 0) S.ph--; update(); });
  ui.button("Paso ▶", function () { if (S.ph < 8) S.ph++; update(); }, "primary");
  ui.button("Ver todo", function () { S.ph = 8; update(); });
  ui.button("Un paso de descenso (lr 0.05)", function () { descend(); }, "warm");
  ui.button("Valores iniciales", function () { S.x = 3; S.w = 2; S.b = 1; S.t = 10; S.ph = 0; S.steps = 0; sx.set(3, true); sw.set(2, true); sb.set(1, true); st.set(10, true); update(); });

  function fw(p) { var m = p.w * p.x, z = m + p.b, e = z - p.t; return { m: m, z: z, e: e, L: e * e }; }
  function bw(p, f) { var ge = 2 * f.e; return { L: 1, e: ge, z: ge, m: ge, b: ge, w: ge * p.x, x: ge * p.w, t: -ge }; }
  function descend() {
    var f = fw(S), g = bw(S, f);
    S.w = M.clamp(S.w - S.lr * g.w, -4, 4); S.b = M.clamp(S.b - S.lr * g.b, -4, 4); S.steps++;
    sw.set(Math.round(S.w * 10) / 10, true); sb.set(Math.round(S.b * 10) / 10, true);
    S.w = sw.get(); S.b = sb.get(); S.ph = 0; update();
  }
  function n2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−"); }

  function draw(ctx, w, h, C) {
    var f = fw(S), g = bw(S, f), ph = S.ph;
    var narrow = w < 480, cw = w / 5, bwid = Math.min(78, cw - (narrow ? 24 : 14)), bh = 56, ym = h * 0.40, yb = h * 0.77, ytop = h * 0.17, ybot = h * 0.63;
    var P = {
      w: [cw * 0.5, ytop + 8, "w", S.w, C.cobaltoWash, 5, "var"], x: [cw * 0.5, ybot - 8, "x", S.x, C.paper, 4, "const"],
      m: [cw * 1.5, ym, narrow ? "m" : "m = w·x", f.m, C.cobaltoWash, 4], z: [cw * 2.5, ym, narrow ? "z" : "z = m+b", f.z, C.cobaltoWash, 3], b: [cw * 2.5, yb, "b", S.b, C.cobaltoWash, 4, "var"],
      e: [cw * 3.5, ym, narrow ? "e" : "e = z−t", f.e, C.cobaltoWash, 2], t: [cw * 3.5, yb, "t", S.t, C.paper, 0, "const"], L: [cw * 4.5, ym, narrow ? "L" : "L = e²", f.L, C.terracotaWash, 1]
    };
    var fwdPh = { m: 1, z: 2, e: 3, L: 4 }, bwdPh = { L: 5, e: 5, z: 6, m: 7, b: 7, w: 8 };
    /* punto donde la recta centro→destino sale de la caja de P[k] */
    function clip(k, tx, ty) {
      var p = P[k], dx = tx - p[0], dy = ty - p[1], hw = bwid / 2, hh = bh / 2;
      var sc = Math.min(dx !== 0 ? hw / Math.abs(dx) : 1e9, dy !== 0 ? hh / Math.abs(dy) : 1e9);
      return [p[0] + dx * sc, p[1] + dy * sc];
    }
    function link(a, b2, color, width, off) {
      var A = P[a], B = P[b2], p1 = clip(a, B[0], B[1]), p2 = clip(b2, A[0], A[1]);
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len * off, ny = dx / len * off;
      D.arrow(ctx, p1[0] + nx, p1[1] + ny, p2[0] + nx, p2[1] + ny, color, width);
    }
    [["w", "m"], ["x", "m"], ["m", "z"], ["b", "z"], ["z", "e"], ["t", "e"], ["e", "L"]].forEach(function (e) { link(e[0], e[1], C.muted, 1.5, -5); });
    [["L", "e", 5], ["e", "z", 6], ["z", "m", 7], ["z", "b", 7], ["m", "w", 8]].forEach(function (e) { if (ph >= e[2]) link(e[0], e[1], C.terracota, 2.4, -5); });
    Object.keys(P).forEach(function (k) {
      var p = P[k], hasG = bwdPh[k] && ph >= bwdPh[k], hot = (fwdPh[k] === ph && ph >= 1 && ph <= 4) || (hasG && bwdPh[k] === ph);
      var isVar = p[6] === "var";
      D.rect(ctx, p[0] - bwid / 2, p[1] - bh / 2, bwid, bh, p[4], hot ? C.terracota : C.ink, hot ? 3 : (isVar ? 2 : 1.2));
      var fs = bwid < 62 ? 9.5 : 11;
      D.text(ctx, p[2], p[0], p[1] - 14, { align: "center", size: fs, weight: 700, color: C.ink, mono: true });
      var known = !fwdPh[k] || ph >= fwdPh[k] || ph >= 5;
      D.text(ctx, known ? n2(p[3]) : "?", p[0], p[1] + 2, { align: "center", size: fs + 1, mono: true, color: known ? C.ink : C.muted, weight: 600 });
      var gs = bwdPh[k] === undefined ? "" : (hasG ? "∂=" + n2(g[k]) : "∂=?");
      if (gs) D.text(ctx, narrow ? gs.replace("∂=", "∂") : gs, p[0], p[1] + 17, { align: "center", size: fs, mono: true, weight: hasG ? 700 : 400, color: hasG ? C.terracotaInk : C.muted });
      if (isVar) D.text(ctx, "Variable", p[0], p[1] + bh / 2 + 11, { align: "center", size: 9.5, color: C.muted });
    });
    D.text(ctx, ph < 1 ? "cinta vacía" : ph <= 4 ? "ida: la cinta graba " + ph + " de 4 operaciones" : "vuelta: la cinta se rebobina (flechas naranja)", w / 2, h - 6, { align: "center", size: 11, color: C.ink2, weight: 600 });
  }

  function update() {
    var f = fw(S), g = bw(S, f), ph = S.ph, s = "";
    var titles = ["Fase 0 · Todo listo: la cinta aún no ha grabado nada", "Fase 1 · Se graba m = w·x", "Fase 2 · Se graba z = m + b", "Fase 3 · Se graba e = z − t", "Fase 4 · Se graba L = e²: fin de la ida",
      "Fase 5 · Vuelta: ∂L/∂e", "Fase 6 · Vuelta: ∂L/∂z", "Fase 7 · Vuelta: ∂L/∂m y ∂L/∂b", "Fase 8 · Vuelta: ∂L/∂w, fin de tape.gradient"];
    s += "<b>" + titles[ph] + "</b><br>";
    if (ph === 0) s += "w = " + n2(S.w) + ", x = " + n2(S.x) + ", b = " + n2(S.b) + ", t = " + n2(S.t) + ". Pulsa «Paso» para grabar y luego rebobinar.";
    if (ph === 1) s += "m = " + n2(S.w) + " · " + n2(S.x) + " = <b>" + n2(f.m) + "</b>";
    if (ph === 2) s += "z = " + n2(f.m) + " + " + n2(S.b) + " = <b>" + n2(f.z) + "</b> (lo que predice el modelo)";
    if (ph === 3) s += "e = " + n2(f.z) + " − " + n2(S.t) + " = <b>" + n2(f.e) + "</b> (lo que se queda corto, o se pasa, la predicción)";
    if (ph === 4) s += "L = (" + n2(f.e) + ")² = <b>" + n2(f.L) + "</b>. La cinta guarda las 4 operaciones y sus valores intermedios.";
    if (ph === 5) s += "∂L/∂e = 2·e = 2 · " + n2(f.e) + " = <b>" + n2(g.e) + "</b> (derivada local de «elevar al cuadrado»)";
    if (ph === 6) s += "∂L/∂z = ∂L/∂e · ∂e/∂z = " + n2(g.e) + " · 1 = <b>" + n2(g.z) + "</b> (restar t no cambia la pendiente respecto a z)";
    if (ph === 7) s += "∂L/∂m = " + n2(g.z) + " · 1 = <b>" + n2(g.m) + "</b><br>∂L/∂b = " + n2(g.z) + " · 1 = <b>" + n2(g.b) + "</b> (sumar b: derivada 1)";
    if (ph === 8) s += "∂L/∂w = ∂L/∂m · ∂m/∂w = " + n2(g.m) + " · x = " + n2(g.m) + " · " + n2(S.x) + " = <b>" + n2(g.w) + "</b><br><code>tape.gradient(L, [w, b])</code> = <b>[" + n2(g.w) + ", " + n2(g.b) + "]</b>";
    var h = 1e-4, num = (fw({ w: S.w + h, x: S.x, b: S.b, t: S.t }).L - fw({ w: S.w - h, x: S.x, b: S.b, t: S.t }).L) / (2 * h);
    s += "<br>Comprobación numérica (diferencias finitas) de ∂L/∂w: " + num.toFixed(3).replace("-", "−") + " · pérdida actual L = " + n2(f.L) + (S.steps ? " · pasos de descenso dados: " + S.steps : "");
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});
