/* Experimento: máscara causal. 6 tokens con puntuaciones fijas; con la máscara cada fila solo reparte peso entre el token y los anteriores.
   Haz clic en un token y 'toca' su valor: se ve qué salidas cambian (sin máscara cambian todas; con máscara solo las de ese token y los siguientes). */
Lab.register("curso3/c3m3-mascara-causal", function (root, api) {
  var D = api.d, N = 6, TOK = ["el", "niño", "ve", "Titanic", "hoy", "."]   // subtítulo de una escena;
  var S = { mask: true, t: 3, bump: 0 };
  var r = api.rng(21), SC = [], V = [], i, j;
  for (i = 0; i < N; i++) { SC.push([]); for (j = 0; j < N; j++) SC[i].push(Math.round(r.normal(0, 1.2) * 10) / 10); V.push(Math.round(r.normal(0, 1) * 10) / 10); }
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function att(Vv) {
    var A = [], O = [];
    for (var a = 0; a < N; a++) {
      var row = SC[a].map(function (v, b) { return (S.mask && b > a) ? -Infinity : v; }), m = Math.max.apply(null, row), e = row.map(function (v) { return Math.exp(v - m); }), s = e.reduce(function (x, y) { return x + y; }, 0);
      A.push(e.map(function (v) { return v / s; })); O.push(A[a].reduce(function (acc, w, b) { return acc + w * Vv[b]; }, 0));
    }
    return { A: A, O: O };
  }
  var view = api.view(root, { aspect: 1.55, minH: 270, maxH: 380, drag: false, label: "Mapa de atención de las 6 palabras de un subtítulo y cambio de cada salida al modificar el valor del token elegido" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.toggle({ label: "Máscara causal (-∞ sobre la diagonal)", value: true, onChange: function (v) { S.mask = v; update(); } });
  ui.slider({ label: "Cuánto sumas al valor del token tocado", min: 0, max: 5, step: 0.5, value: 0, fmt: function (v) { return "+" + n(v, 1); }, onInput: function (v) { S.bump = v; update(); } });
  ui.select({ label: "Token que se toca", value: S.t, options: TOK.map(function (t, k) { return [k, (k + 1) + " · " + t]; }), onChange: function (v) { S.t = parseInt(v, 10); update(); } });
  function geom(w, h) { var L = 52, T = 38, side = Math.min((w * (w < 500 ? 0.72 : 0.58) - L) / N, (h - T - 10) / N, 52); return { L: L, T: T, c: side }; }
  var R0 = att(V), R1 = R0;
  view.draw(function (ctx, w, h, C) {
    var g = geom(w, h), a, b, bx = g.L + g.c * N + 18, bw = Math.max(40, w - bx - 10), mx = 0.0001;
    for (a = 0; a < N; a++) mx = Math.max(mx, Math.abs(R1.O[a] - R0.O[a]));
    if (g.c >= 44) D.text(ctx, "claves →", g.L, 11, { size: 10.5, color: C.muted });
    for (b = 0; b < N; b++) {
      if (g.c >= 44) D.text(ctx, TOK[b], g.L + g.c * (b + 0.5), g.T - 8, { size: 11, align: "center", weight: b === S.t ? 700 : 500, color: b === S.t ? C.terracotaInk : C.ink });
      else { ctx.save(); ctx.translate(g.L + g.c * (b + 0.5), g.T - 5); ctx.rotate(-Math.PI / 4); D.text(ctx, TOK[b], 0, 0, { size: 10.5, align: "left", weight: b === S.t ? 700 : 500, color: b === S.t ? C.terracotaInk : C.ink }); ctx.restore(); }
    }
    D.text(ctx, w < 500 ? "cambio" : "cambio de la salida", bx, 11, { size: 10.5, color: C.muted });
    for (a = 0; a < N; a++) {
      D.text(ctx, TOK[a], g.L - 6, g.T + g.c * (a + 0.5) + 4, { size: 11, align: "right", weight: a === S.t ? 700 : 500, color: a === S.t ? C.terracotaInk : C.ink });
      for (b = 0; b < N; b++) {
        var x = g.L + g.c * b, y = g.T + g.c * a, v = R0.A[a][b];
        D.rect(ctx, x, y, g.c, g.c, C.surface, C.line, 1);
        if (S.mask && b > a) { D.line(ctx, x + 5, y + g.c - 5, x + g.c - 5, y + 5, C.line, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.min(1, 0.06 + v * 0.94); ctx.fillStyle = C.cobalto; ctx.fillRect(x + 1, y + 1, g.c - 2, g.c - 2); ctx.restore();
        if (g.c >= 30) D.text(ctx, n(v, 2), x + g.c / 2, y + g.c / 2 + 4, { size: g.c >= 44 ? 11 : 9.5, mono: true, align: "center", color: v > 0.5 ? C.paper : C.ink });
      }
      var dv = Math.abs(R1.O[a] - R0.O[a]), len = dv / mx * (bw - 34);
      D.rect(ctx, bx, g.T + g.c * a + g.c * 0.25, Math.max(dv > 1e-9 ? 2 : 0, len), g.c * 0.5, dv > 1e-9 ? C.terracota : C.line);
      D.text(ctx, dv > 1e-9 ? n(dv, 2) : "0", bx + Math.max(4, len) + 4, g.T + g.c * (a + 0.5) + 4, { size: 10.5, mono: true, color: C.ink2 });
    }
    D.rect(ctx, g.L, g.T, g.c * N, g.c * N, null, C.ink, 1.5);
  });
  view.pointer({ down: function (px, py) {
    var g = geom(view.w, view.h), a = Math.floor((py - g.T) / g.c);
    if (a >= 0 && a < N && px < g.L + g.c * N + 10) { S.t = a; update(); }
  } });
  function update() {
    var V2 = V.slice(); V2[S.t] += S.bump; R0 = att(V); R1 = att(V2);
    view.redraw();
    var ch = [], a; for (a = 0; a < N; a++) if (Math.abs(R1.O[a] - R0.O[a]) > 1e-9) ch.push(TOK[a]);
    out.set("Tocas el valor del token <b>«" + TOK[S.t] + "»</b> (+" + n(S.bump, 1) + "). Salidas que cambian: <b>" + (ch.length ? ch.join(", ") : "ninguna (aún no has sumado nada)") + "</b>.<br>" +
      (S.mask ? (S.bump > 0 ? "<span class='good'>Con máscara solo cambian el token tocado y los <b>posteriores</b>: el pasado no se entera del futuro. Por eso un decoder puede entrenarse con toda la frase de golpe sin hacer trampa.</span>" : "Con máscara, la parte de arriba a la derecha (el futuro) vale 0 en todas las filas.")
             : (S.bump > 0 ? "<span class='bad'>Sin máscara cambian <b>todas</b> las salidas, también las de tokens anteriores: el modelo «leería» la respuesta del futuro.</span>" : "Sin máscara, cada fila reparte peso entre todos los tokens, incluidos los de después."))
      + "<br>Fila de «" + TOK[S.t] + "»: " + R0.A[S.t].map(function (v) { return n(v, 2); }).join(" ; ") + " (suma " + n(R0.A[S.t].reduce(function (x, y) { return x + y; }, 0), 2) + ")");
  }
  update();
});
