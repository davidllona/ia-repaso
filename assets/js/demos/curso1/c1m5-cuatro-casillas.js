/* Experimento: colocar las 20 películas del ejemplo, una a una, en su casilla de la matriz de confusión (TN, FP, FN, TP). */
Lab.register("curso1/c1m5-cuatro-casillas", function (root, api) {
  var D = api.d;
  /* [título, ¿te gusta de verdad?, ¿la recomendó el modelo?]  → TP 5, FN 3, TN 10, FP 2 */
  var PELIS = [
    ["El faro", 1, 1], ["Noche de tormenta", 0, 0], ["Robots en Marte", 0, 1], ["El último tren", 1, 0],
    ["Cocina con Ana", 0, 0], ["Detective Luna", 1, 1], ["Planeta azul", 0, 0], ["Risas en el metro", 0, 0],
    ["La isla", 1, 1], ["Ciudad de neón", 0, 1], ["Zombis de vacaciones", 0, 0], ["Dragones de papel", 1, 0],
    ["El jardín secreto", 0, 0], ["Carrera final", 1, 1], ["Tres hermanas", 0, 0], ["Ladrones de guante", 1, 1],
    ["La gran ola", 0, 0], ["Cartas desde Roma", 1, 0], ["El bosque", 0, 0], ["Mañana, quizá", 0, 0]
  ];
  var NOMBRE = { TN: "TN", FP: "FP", FN: "FN", TP: "TP" };
  function casilla(f) { return (f[1] ? (f[2] ? "TP" : "FN") : (f[2] ? "FP" : "TN")); }
  var st = { i: 0, puestas: [], ok: 0, intentos: 0, ultima: null, vuelo: null };

  var view = api.view(root, { aspect: 1.45, minH: 330, label: "Arriba, una película con lo que te gusta y lo que dijo el modelo. Debajo, la matriz de confusión de dos por dos donde se van colocando las películas" });
  var ui = api.controls(root), out = api.readout(root);
  ["TP", "FP", "FN", "TN"].forEach(function (k) { ui.button(k, function () { responder(k); }); });
  ui.button("Que lo haga solo", function () { if (st.i < PELIS.length) colocar(casilla(PELIS[st.i]), null); }, "primary");
  ui.button("Todas de golpe", function () { while (st.i < PELIS.length) colocar(casilla(PELIS[st.i]), null, true); st.vuelo = null; view.redraw(); texto(); });
  ui.button("Empezar de nuevo", function () { st = { i: 0, puestas: [], ok: 0, intentos: 0, ultima: null, vuelo: null }; view.redraw(); texto(); });
  var C0 = api.colors();
  api.legend(root, [[C0.olivaInk, "acierto (TN y TP)"], [C0.terracota, "error (FP y FN)"]]);

  var loop = api.loop(function (dt) {
    if (!st.vuelo) return false;
    st.vuelo.t += (dt || 0.016) / 0.45;
    if (st.vuelo.t >= 1) { st.vuelo = null; view.redraw(); return false; }
    view.redraw();
  }, { fps: 60 });

  function responder(k) {
    if (st.i >= PELIS.length) return;
    st.intentos++;
    var bien = casilla(PELIS[st.i]) === k;
    if (bien) st.ok++;
    colocar(casilla(PELIS[st.i]), { elegida: k, bien: bien });
  }
  function colocar(k, resp, sinVuelo) {
    var f = PELIS[st.i];
    st.puestas.push({ f: f, k: k });
    st.ultima = { f: f, k: k, resp: resp };
    st.i++;
    if (!sinVuelo && !api.reduceMotion) { st.vuelo = { k: k, n: cuenta(k), t: 0 }; loop.start(); }
    view.redraw(); texto();
  }
  function cuenta(k) { return st.puestas.filter(function (p) { return p.k === k; }).length; }

  function geom(w, h) {
    var cardH = 84, top = cardH + 40, left = 34, right = 6, bottom = 6;
    var cw = (w - left - right) / 2, ch = (h - top - bottom) / 2;
    return { cardH: cardH, top: top, left: left, cw: cw, ch: ch,
      cell: function (k) {
        var r = (k === "FN" || k === "TP") ? 1 : 0, c = (k === "FP" || k === "TP") ? 1 : 0;
        return { x: left + c * cw, y: top + r * ch, w: cw, h: ch };
      } };
  }
  function puntoEn(g, k, n, w) {                       /* posición del punto número n (1, 2, …) dentro de su casilla */
    var c = g.cell(k), porFila = 5, r = Math.min(6, (c.w - 20) / (porFila * 2.6));
    var i = n - 1, col = i % porFila, fila = Math.floor(i / porFila);
    return { x: c.x + 14 + r + col * r * 2.6, y: c.y + c.h - 12 - r - fila * r * 2.6, r: r };
  }

  function draw(ctx, w, h, C) {
    var g = geom(w, h), estrecho = w < 480;
    /* tarjeta de la película */
    D.rect(ctx, 0, 0, w, g.cardH, C.surface, C.line, 1);
    if (st.i < PELIS.length) {
      var f = PELIS[st.i];
      D.text(ctx, "Película " + (st.i + 1) + " de " + PELIS.length + ": «" + f[0] + "»", 10, 22, { size: 13, weight: 700, color: C.ink });
      D.text(ctx, "¿Te gusta de verdad?  " + (f[1] ? "Sí" : "No"), 10, 46, { size: 12, color: C.ink2 });
      D.text(ctx, "El modelo dijo:  " + (f[2] ? (estrecho ? "«Sí, te la recomiendo»" : "«Sí, te la recomiendo» (P)") : (estrecho ? "«No»" : "«No» (N)")), 10, 68, { size: 12, color: C.ink2 });
      D.circle(ctx, w - 22, g.cardH / 2, 8, C.cobalto);
    } else {
      D.text(ctx, "Las 20 películas, colocadas", 10, 26, { size: 13, weight: 700, color: C.ink });
      D.text(ctx, "TN " + cuenta("TN") + " · FP " + cuenta("FP") + " · FN " + cuenta("FN") + " · TP " + cuenta("TP"), 10, 52, { size: 13, mono: true, color: C.ink });
      D.text(ctx, "5 + 3 + 10 + 2 = 20", 10, 74, { size: 12, mono: true, color: C.muted });
    }
    /* cabeceras */
    D.text(ctx, "LO QUE DIJO EL MODELO", g.left + g.cw, g.cardH + 16, { size: 11, weight: 600, align: "center", color: C.muted });
    D.text(ctx, "«No»", g.left + g.cw / 2, g.cardH + 33, { size: 12, align: "center", color: C.ink2 });
    D.text(ctx, "«Sí»", g.left + g.cw * 1.5, g.cardH + 33, { size: 12, align: "center", color: C.ink2 });
    D.text(ctx, "No te gusta", 14, g.top + g.ch / 2, { size: 12, align: "center", color: C.ink2, rotate: -Math.PI / 2 });
    D.text(ctx, "Te gusta", 14, g.top + g.ch * 1.5, { size: 12, align: "center", color: C.ink2, rotate: -Math.PI / 2 });
    /* casillas */
    ["TN", "FP", "FN", "TP"].forEach(function (k) {
      var c = g.cell(k), acierto = (k === "TN" || k === "TP");
      D.rect(ctx, c.x, c.y, c.w, c.h, acierto ? C.olivaWash : C.terracotaWash, C.line, 1);
      D.text(ctx, NOMBRE[k], c.x + 10, c.y + 22, { size: 16, weight: 700, color: acierto ? C.olivaInk : C.terracotaInk });
      var nk = cuenta(k) - (st.vuelo && st.vuelo.k === k ? 1 : 0);
      D.text(ctx, String(nk), c.x + c.w - 10, c.y + 22, { size: 16, weight: 700, align: "right", mono: true, color: C.ink });
      if (!estrecho || c.h > 90) D.text(ctx, acierto ? "acierto" : (k === "FP" ? "falsa alarma" : "se le escapa"), c.x + 10, c.y + 40, { size: 11, color: C.muted });
      for (var n = 1; n <= nk; n++) { var p = puntoEn(g, k, n, w); D.circle(ctx, p.x, p.y, p.r, acierto ? C.olivaInk : C.terracota); }
    });
    /* casilla correcta de la última película */
    if (st.ultima && !st.vuelo) { var cu = g.cell(st.ultima.k); D.rect(ctx, cu.x + 1.5, cu.y + 1.5, cu.w - 3, cu.h - 3, null, C.ink, 2.5); }
    /* punto en vuelo */
    if (st.vuelo) {
      var t = st.vuelo.t, e = t * t * (3 - 2 * t), dst = puntoEn(g, st.vuelo.k, st.vuelo.n, w);
      var x0 = w - 22, y0 = g.cardH / 2;
      D.circle(ctx, x0 + (dst.x - x0) * e, y0 + (dst.y - y0) * e - Math.sin(Math.PI * e) * 30, Math.max(dst.r, 6), C.cobalto, C.ink, 1.5);
    }
  }

  function texto() {
    var u = st.ultima, msg = "";
    if (u) {
      var dijo = u.f[2] ? "dijo «sí» (P)" : "dijo «no» (N)", acerto = (u.f[1] === u.f[2]) ? "y acertó (T)" : "y falló (F)";
      msg = "«" + u.f[0] + "»: el modelo " + dijo + " " + acerto + " → <b>" + u.k + "</b>";
      if (u.resp) msg = (u.resp.bien ? "<span class='good'>¡Bien!</span> " : "<span class='bad'>Era " + u.k + ", no " + u.resp.elegida + ".</span> ") + msg;
    } else msg = "Pulsa la casilla de la primera película (TP, FP, FN o TN).";
    out.set(msg + "<br>colocadas: <b>" + st.i + "</b> de 20" + (st.intentos ? " · tus aciertos: <b>" + st.ok + "</b> de " + st.intentos : ""));
  }

  view.draw(draw); texto();
  return { destroy: function () { loop.stop(); } };
});
