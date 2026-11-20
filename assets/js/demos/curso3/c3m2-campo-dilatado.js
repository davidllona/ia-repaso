/* Experimento: tres capas 1-D con filtros de 3 pesos apiladas. Se elige la dilatación de cada capa
   y se ve qué segundos del tráiler (casillas de la entrada) influyen en una neurona de la capa de arriba. */
Lab.register("curso3/c3m2-campo-dilatado", function (root, api) {
  var N = 23, st = { d: [1, 2, 4], pos: 11, t: 3 };

  /* conjuntos de casillas que influyen, de arriba (capa 3) a abajo (entrada) */
  function sets() {
    var out = [], cur = {}, l, i, a;
    cur[st.pos] = 1; out[3] = cur;
    for (l = 2; l >= 0; l--) {
      var nx = {}, d = st.d[l];
      for (i in out[l + 1]) { i = +i; for (a = -1; a <= 1; a++) { var j = i + a * d; if (j >= 0 && j < N) nx[j] = 1; } }
      out[l] = nx;
    }
    return out;
  }
  function campo() { return 1 + 2 * (st.d[0] + st.d[1] + st.d[2]); }

  var view = api.view(root, { aspect: 1.55, minH: 240, maxH: 380, label: "Cuatro filas de casillas: la entrada abajo y tres capas encima; se resaltan las casillas que influyen en una neurona de arriba" });
  var ui = api.controls(root), out = api.readout(root);
  var sP = ui.slider({ label: "Neurona de arriba (posición)", min: 0, max: N - 1, step: 1, value: st.pos, fmt: function (v) { return (v + 1) + " de " + N; }, onInput: function (v) { st.pos = v; st.t = 3; view.redraw(); info(); } });
  ui.button("Normales (1, 1, 1)", function () { preset([1, 1, 1]); }, "primary");
  ui.button("Dilatadas (1, 2, 4)", function () { preset([1, 2, 4]); });
  ui.button("Todas d = 2 (2, 2, 2)", function () { preset([2, 2, 2]); });

  var loop = api.loop(function (dt) {
    st.t = Math.min(3, st.t + dt * 2.2);
    view.redraw();
    return st.t < 3;
  });
  function preset(d) {
    st.d = d.slice(); st.pos = 11; sP.set(11, true);
    if (api.reduceMotion) { st.t = 3; view.redraw(); } else { st.t = 0; loop.start(); }
    info();
  }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, S = sets(), pad = 6, cw = (w - 2 * pad) / N, rowGap = (h - 8) / 4, ch = Math.min(cw * 1.1, rowGap - 26), l, i;
    var fs = Math.max(11, Math.min(13, w / 30));
    function yRow(l) { return 4 + (3 - l) * rowGap + 18; }
    var nombres = ["Entrada: segundos del tráiler", "Capa 1 · d = " + st.d[0], "Capa 2 · d = " + st.d[1], "Capa 3 · d = " + st.d[2]];
    /* líneas de cada casilla activa a sus 3 «agujeros» de la fila de abajo */
    for (l = 3; l >= 1; l--) {
      var shown = (3 - l) < st.t;
      if (!shown) continue;
      var alpha = Math.min(1, st.t - (3 - l));
      ctx.save(); ctx.globalAlpha = 0.45 * alpha;
      for (i in S[l]) {
        i = +i;
        for (var a = -1; a <= 1; a++) {
          var j = i + a * st.d[l - 1];
          if (j < 0 || j >= N) continue;
          D.line(ctx, pad + i * cw + cw / 2, yRow(l) + ch, pad + j * cw + cw / 2, yRow(l - 1), C.terracota, 1);
        }
      }
      ctx.restore();
    }
    for (l = 3; l >= 0; l--) {
      var y = yRow(l), vis = l === 3 || (3 - l) <= st.t, al = l === 3 ? 1 : Math.max(0, Math.min(1, st.t - (3 - l) + 1));
      D.text(ctx, nombres[l], pad, y - 5, { size: Math.max(11, fs), weight: 600, color: C.ink2 });
      for (i = 0; i < N; i++) {
        var x = pad + i * cw, on = vis && S[l][i];
        D.rect(ctx, x, y, cw, ch, C.surface, C.line, 0.6);
        if (on) {
          ctx.save(); ctx.globalAlpha = al;
          D.rect(ctx, x + 0.5, y + 0.5, cw - 1, ch - 1, l === 3 ? C.oliva : (l === 0 ? C.marker : C.terracota));
          ctx.restore();
        }
      }
    }
    if (st.t >= 3) {
      var ks = Object.keys(S[0]).map(Number), lo = Math.min.apply(null, ks), hi = Math.max.apply(null, ks);
      D.rect(ctx, pad + lo * cw - 1, yRow(0) - 1, (hi - lo + 1) * cw + 2, ch + 2, null, C.ink, 2);
    }
  });

  function info() {
    var S = sets(), vistos = Object.keys(S[0]).length, ks = Object.keys(S[0]).map(Number);
    var ancho = Math.max.apply(null, ks) - Math.min.apply(null, ks) + 1;
    var html = "Dilataciones: <b>" + st.d.join(", ") + "</b> · pesos: 3 + 3 + 3 = <b>9</b> (los mismos siempre)<br>";
    html += "La neurona de arriba abarca <b>" + ancho + "</b> segundos del tráiler";
    if (ancho !== vistos) html += ", pero solo mira <b>" + vistos + "</b> de ellos (los demás caen en huecos)";
    html += ".<br>Lejos de los bordes: 1 + 2·(" + st.d.join(" + ") + ") = <b>" + campo() + "</b>.";
    if (st.d.join() === "1,2,4") html += " <span class='good'>Sin huecos: con 1, 2 y 4 cada segundo del campo se mira.</span>";
    if (st.d.join() === "2,2,2") html += " <span class='bad'>Con todas a 2, los segundos impares nunca se miran.</span>";
    out.set(html);
  }
  info();
  return { destroy: function () { loop.stop(); } };
});
