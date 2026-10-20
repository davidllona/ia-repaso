/* Experimento: una RNN desplegada en el tiempo. Los pesos son los de la cuenta a mano del texto (1 entrada, 2 neuronas ocultas, tanh)
   y se recalculan de verdad cada vez que cambias la secuencia. Además mide cuánto "recuerda" el último estado del primer valor. */
Lab.register("curso2/c2m4-rnn-desplegada", function (root, api) {
  var M = api.math, D = api.d;
  var Wx = [1, -1], Wh = [[0.5, 0.5], [-0.5, 0.5]], bias = [0, 0];
  var S = { T: 3, x1: 1, preset: "texto", sel: 3 };
  var r = api.rng(11), rnd = [], i;
  for (i = 0; i < 8; i++) rnd.push(Math.round(r.range(-2, 2) * 10) / 10);

  function n(v, k) { return (k === undefined ? v.toFixed(2) : v.toFixed(k)).replace(".", ",").replace("-", "−"); }

  function seq() {
    var x1 = S.x1, xs = [x1], t;
    for (t = 1; t < 8; t++) {
      if (S.preset === "texto") xs.push(t === 1 ? 2 : 0);
      else if (S.preset === "pulso") xs.push(0);
      else if (S.preset === "escalon") xs.push(x1);
      else xs.push(rnd[t]);
    }
    return xs;
  }
  function run(xs, T) {
    var h = [0, 0], out = [], t;
    for (t = 0; t < T; t++) {
      var x = xs[t];
      var z = [Wx[0] * x + Wh[0][0] * h[0] + Wh[0][1] * h[1] + bias[0], Wx[1] * x + Wh[1][0] * h[0] + Wh[1][1] * h[1] + bias[1]];
      var hn = [Math.tanh(z[0]), Math.tanh(z[1])];
      out.push({ x: x, z: z, hPrev: h, h: hn });
      h = hn;
    }
    return out;
  }
  var A, B, dh;
  function compute() {
    var xa = seq(), xb = xa.slice();
    xb[0] = xa[0] + 0.5;                 // misma secuencia, pero con x1 un poco distinto
    A = run(xa, S.T);
    B = run(xb, S.T);
    dh = A.map(function (s, t) { return M.dist(s.h, B[t].h); });
    if (S.sel > S.T) S.sel = S.T;
  }

  var view = api.view(root, { aspect: 2.5, minH: 230, maxH: 330, label: "RNN desplegada en el tiempo: una caja por paso, con la entrada x, el estado oculto h y las flechas de memoria" });
  var view2 = api.view(root, { aspect: 4.2, minH: 120, maxH: 190, label: "Cuánto cambia el estado h de cada paso si se cambia el primer valor x1" });
  var ui = api.controls(root);
  var out = api.readout(root);
  var tab = api.table(root, ["t", "x", "z1", "z2", "h1", "h2"]);

  ui.slider({ label: "Longitud de la secuencia (pasos)", min: 1, max: 8, step: 1, value: S.T, fmt: function (v) { return v; }, onInput: function (v) { S.T = v; S.sel = v; update(); } });
  ui.slider({ label: "Primer valor x₁", min: -2, max: 2, step: 0.1, value: S.x1, fmt: function (v) { return n(v, 1); }, onInput: function (v) { S.x1 = v; update(); } });
  ui.segmented({ label: "Resto de la secuencia", value: S.preset, options: [["texto", "2, 0, 0…"], ["pulso", "todo 0"], ["escalon", "= x₁"], ["azar", "al azar"]], onChange: function (v) { S.preset = v; update(); } });

  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "neurona 1 (h₁)"], [C0.terracota, "neurona 2 (h₂)"]]);

  var BARS = 26;
  function cellGeom(w, T) {
    var padL = 14, padR = 14, cw = (w - padL - padR) / T;
    return { padL: padL, cw: cw, bw: Math.min(cw * 0.66, 78) };
  }
  function draw(ctx, w, h, C) {
    var T = S.T, g = cellGeom(w, T), t, wide = g.cw >= 62;
    var yBars = 52, yBox = h * 0.5, bh = 44, yIn = h - 38;
    D.text(ctx, "mismas matrices Wₓ, Wₕ, b en todos los pasos", w / 2, 16, { size: 11.5, color: C.muted, align: "center" });
    for (t = 0; t < T; t++) {
      var cx = g.padL + g.cw * (t + 0.5), bx = cx - g.bw / 2, s = A[t], on = (t + 1 === S.sel);
      if (on) D.rect(ctx, g.padL + g.cw * t + 1, 26, g.cw - 2, h - 30, C.markerWash || C.cobaltoWash);
      // barras de h
      D.line(ctx, cx - g.bw / 2, yBars, cx + g.bw / 2, yBars, C.line, 1);
      var bwid = Math.max(6, Math.min(18, g.bw * 0.28));
      D.rect(ctx, cx - bwid - 2, s.h[0] >= 0 ? yBars - s.h[0] * BARS : yBars, bwid, Math.abs(s.h[0]) * BARS, C.cobalto);
      D.rect(ctx, cx + 2, s.h[1] >= 0 ? yBars - s.h[1] * BARS : yBars, bwid, Math.abs(s.h[1]) * BARS, C.terracota);
      D.text(ctx, "h" + (t + 1), cx, yBars + BARS + 15, { size: 11.5, color: C.ink2, align: "center", weight: 600 });
      if (g.cw >= 84) D.text(ctx, "(" + n(s.h[0]) + "; " + n(s.h[1]) + ")", cx, yBars + BARS + 29, { size: 10.5, mono: true, align: "center", color: C.muted });
      // caja
      var by = yBox + 10;
      D.rect(ctx, bx, by, g.bw, bh, C.surface, C.ink, 2);
      D.text(ctx, "RNN", cx, by + bh / 2 + 4, { size: 12, weight: 600, align: "center" });
      // flecha de la caja hacia h (arriba)
      D.arrow(ctx, cx, by, cx, yBars + BARS + (g.cw >= 84 ? 36 : 22), C.ink2, 1.3);
      // entrada
      D.arrow(ctx, cx, yIn - 12, cx, by + bh + 1, C.ink2, 1.3);
      D.circle(ctx, cx, yIn, 11, C.paper, C.ink, 1.5);
      D.text(ctx, "x" + (t + 1), cx, yIn + 4, { size: 11, align: "center", weight: 600 });
      D.text(ctx, n(s.x, 1), cx, yIn + 24, { size: 10.5, mono: true, align: "center", color: C.muted });
      // memoria horizontal
      if (t < T - 1) {
        var nx = cx + g.cw;
        D.arrow(ctx, bx + g.bw + 1, by + bh / 2, nx - g.bw / 2 - 2, by + bh / 2, C.terracota, 2);
      }
    }
    D.text(ctx, "h₀ = (0, 0)", g.padL + 2, yBox + 8, { size: 10.5, color: C.muted });
  }
  function draw2(ctx, w, h, C) {
    var T = S.T, g = cellGeom(w, T), t, mx = Math.max.apply(null, dh.concat([0.05])), base = h - 26, top = 24;
    D.text(ctx, "Cuánto cambia hₜ si cambio x₁ en +0,5 (distancia entre los dos h)", 14, 14, { size: 11.5, color: C.ink2, weight: 500 });
    D.line(ctx, g.padL, base, w - 14, base, C.line, 1);
    for (t = 0; t < T; t++) {
      var cx = g.padL + g.cw * (t + 0.5), bh2 = (base - top - 4) * dh[t] / mx;
      D.rect(ctx, cx - g.bw / 3, base - bh2, g.bw * 2 / 3, bh2, C.marker, C.ink, 1);
      D.text(ctx, "h" + (t + 1), cx, h - 9, { size: 11, align: "center", color: C.ink2 });
      if (g.cw >= 40) D.text(ctx, n(dh[t], 3), cx, Math.min(base - bh2 - 4, base - 3), { size: 10, mono: true, align: "center", color: C.ink });
    }
  }
  function pointer(px, py) {
    var g = cellGeom(view.w, S.T), t = Math.floor((px - g.padL) / g.cw) + 1;
    if (t >= 1 && t <= S.T) { S.sel = t; update(); }
  }
  view.pointer({ down: pointer });
  compute();
  view.draw(draw); view2.draw(draw2);

  function update() {
    compute();
    view.redraw(); view2.redraw();
    var s = A[S.sel - 1], t = S.sel;
    var rows = A.map(function (q, k) { return [k + 1, n(q.x, 2), n(q.z[0], 3), n(q.z[1], 3), n(q.h[0], 3), n(q.h[1], 3)]; });
    tab.set(rows);
    var last = dh[S.T - 1], first = dh[0];
    out.set("Paso seleccionado (haz clic en una caja): <b>t = " + t + "</b><br>" +
      "z₁ = 1·" + n(s.x, 1) + " + 0,5·" + n(s.hPrev[0], 3) + " + 0,5·" + n(s.hPrev[1], 3) + " = <b>" + n(s.z[0], 3) + "</b> → h₁ = tanh(z₁) = <b>" + n(s.h[0], 3) + "</b><br>" +
      "z₂ = −1·" + n(s.x, 1) + " − 0,5·" + n(s.hPrev[0], 3) + " + 0,5·" + n(s.hPrev[1], 3) + " = <b>" + n(s.z[1], 3) + "</b> → h₂ = tanh(z₂) = <b>" + n(s.h[1], 3) + "</b><br>" +
      "Efecto de x₁ en el último estado: <b>" + n(last, 3) + "</b> (en h₁ era " + n(first, 3) + ")" +
      (S.T >= 4 ? (last < first * 0.5 ? "<br><span class='bad'>La primera entrada casi se ha olvidado: la memoria se desvanece paso a paso.</span>" : "<br><span class='good'>Todavía se nota la primera entrada.</span>") : ""));
  }
  update();
});
