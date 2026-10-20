/* Experimento: la capa oculta cambia de sitio los puntos. Dos neuronas ocultas miran x1 + x2 con
   umbrales distintos (c1, c2). A la derecha se ven los puntos ya transformados (h1, h2) y la recta
   de la neurona de salida v1·h1 + v2·h2 = umbral. XOR se puede separar allí, no en el plano original. */
Lab.register("curso5/c5m1-espacio-oculto", function (root, api) {
  var D = api.d, M = api.math;
  var PTS = [[0, 0], [0, 1], [1, 0], [1, 1]], T = [0, 1, 1, 0];
  var WHO = ["ninguna", "solo Shrek", "solo Toy Story", "las dos"];
  var S = { act: "relu", c1: 0, c2: 1, v1: 1, v2: -2, th: 0.5 };
  var ACT = {
    id: { name: "Ninguna (identidad)", f: function (z) { return z; } },
    relu: { name: "ReLU", f: function (z) { return Math.max(0, z); } },
    sig: { name: "Sigmoide (pendiente 10)", f: function (z) { return M.sigmoid(10 * z); } }
  };

  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var vA = api.view(colA, { aspect: 1.05, minH: 240, maxH: 380, label: "Plano de los cuatro tipos de usuario (Toy Story, Shrek) con las dos rectas de las neuronas ocultas" });
  var pA = api.plot(vA, { xr: [-0.5, 1.5], yr: [-0.5, 1.5], xticks: 4, yticks: 4, xlabel: "x1 · Toy Story", ylabel: "x2 · Shrek", pad: { l: 38, r: 10, t: 24, b: 34 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var vB = api.view(colB, { aspect: 1.05, minH: 240, maxH: 380, label: "Espacio oculto (h1, h2) con la recta de la neurona de salida" });
  var pB = api.plot(vB, { xr: [-0.5, 2.5], yr: [-0.5, 2.5], xticks: 6, yticks: 6, xlabel: "h1", ylabel: "h2", pad: { l: 38, r: 10, t: 24, b: 34 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);

  function hid(i) {
    var s = PTS[i][0] + PTS[i][1], f = ACT[S.act].f;
    return [f(s - S.c1), f(s - S.c2)];
  }
  function score(h) { return S.v1 * h[0] + S.v2 * h[1]; }
  function acc(st) {
    var ok = 0, i, h, f = ACT[st.act].f, s;
    for (i = 0; i < 4; i++) {
      s = PTS[i][0] + PTS[i][1]; h = [f(s - st.c1), f(s - st.c2)];
      if ((st.v1 * h[0] + st.v2 * h[1] > st.th) === (T[i] === 1)) ok++;
    }
    return ok;
  }

  var sc1, sc2, sv1, sv2, sth, selAct;
  function load(a, c1, c2, v1, v2, th) {
    S.act = a; S.c1 = c1; S.c2 = c2; S.v1 = v1; S.v2 = v2; S.th = th;
    selAct.set(a); sc1.set(c1, true); sc2.set(c2, true); sv1.set(v1, true); sv2.set(v2, true); sth.set(th, true); update();
  }
  selAct = ui.select({ label: "Activación de las neuronas ocultas", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].name]; }), onChange: function (v) { S.act = v; update(); } });
  sc1 = ui.slider({ label: "c1: umbral de la neurona oculta 1", min: -0.5, max: 2.5, step: 0.05, value: S.c1, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.c1 = v; update(); } });
  sc2 = ui.slider({ label: "c2: umbral de la neurona oculta 2", min: -0.5, max: 2.5, step: 0.05, value: S.c2, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.c2 = v; update(); } });
  sv1 = ui.slider({ label: "v1: peso de h1 en la salida", min: -3, max: 3, step: 0.1, value: S.v1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.v1 = v; update(); } });
  sv2 = ui.slider({ label: "v2: peso de h2 en la salida", min: -3, max: 3, step: 0.1, value: S.v2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.v2 = v; update(); } });
  sth = ui.slider({ label: "umbral de la salida", min: -2, max: 3, step: 0.05, value: S.th, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.th = v; update(); } });
  ui.button("Cargar solución con ReLU", function () { load("relu", 0, 1, 1, -2, 0.5); }, "primary");
  ui.button("Cargar solución con sigmoide", function () { load("sig", 0.5, 1.5, 1, -1, 0.5); });
  ui.button("Buscar la mejor configuración", function () {
    var best = null, c1, c2, v1, v2, th;
    busca: for (c1 = 0; c1 <= 2; c1 += 0.25) for (c2 = 0; c2 <= 2; c2 += 0.25) for (v1 = -3; v1 <= 3; v1 += 0.5) for (v2 = -3; v2 <= 3; v2 += 0.5) for (th = -2; th <= 3; th += 0.25) {
      var st = { act: S.act, c1: c1, c2: c2, v1: v1, v2: v2, th: th }, a = acc(st);
      if (!best || a > best.a) best = { a: a, st: st };
      if (a === 4) break busca;
    }
    var b = best.st; load(S.act, b.c1, b.c2, b.v1, b.v2, b.th);
    bestNote = "La búsqueda (" + ACT[S.act].name + ") encontró como mucho <b>" + best.a + " de 4</b>.";
    update();
  }, "warm");
  var bestNote = "";

  vA.draw(function (ctx, w, h, C) {
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    [S.c1, S.c2].forEach(function (c, k) {
      // recta x1 + x2 = c
      D.line(ctx, pA.x(-0.5), pA.y(c + 0.5), pA.x(1.5), pA.y(c - 1.5), k ? C.terracota : C.cobalto, 2.5, [7, 4]);
    });
    ctx.restore();
    D.text(ctx, "rectas x1 + x2 = c1 (azul) y c2 (rojo)", pA.box.x + 4, 14, { size: 10.5, color: C.muted });
    PTS.forEach(function (q, i) {
      D.circle(ctx, pA.x(q[0]), pA.y(q[1]), 11, T[i] ? C.cobalto : C.terracota, C.paper, 2);
      D.text(ctx, String(T[i]), pA.x(q[0]), pA.y(q[1]) + 4, { size: 12, align: "center", weight: 700, color: C.paper });
      ctx.save(); ctx.font = "600 10px 'IBM Plex Sans',system-ui,sans-serif"; var tw = ctx.measureText(WHO[i]).width; ctx.restore();
      D.rect(ctx, pA.x(q[0]) - tw / 2 - 2, pA.y(q[1]) + 15, tw + 4, 15, C.paper);   // fondo para que las rectas no pisen el texto
      D.text(ctx, WHO[i], pA.x(q[0]), pA.y(q[1]) + 26, { size: 10, align: "center", weight: 600, color: C.ink2 });
    });
  });
  vB.draw(function (ctx, w, h, C) {
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    // recta v1 h1 + v2 h2 = th, y el lado de la clase 1
    var pts = [], xr = pB.xr, yr = pB.yr;
    if (Math.abs(S.v2) > 1e-6) pts = [[xr[0], (S.th - S.v1 * xr[0]) / S.v2], [xr[1], (S.th - S.v1 * xr[1]) / S.v2]];
    else if (Math.abs(S.v1) > 1e-6) pts = [[S.th / S.v1, yr[0]], [S.th / S.v1, yr[1]]];
    var N = 22, ix, iy, dx = (xr[1] - xr[0]) / N, dy = (yr[1] - yr[0]) / N;
    for (iy = 0; iy < N; iy++) for (ix = 0; ix < N; ix++) {
      var a = xr[0] + dx * (ix + 0.5), b = yr[0] + dy * (iy + 0.5);
      ctx.globalAlpha = 0.16; ctx.fillStyle = S.v1 * a + S.v2 * b > S.th ? C.cobalto : C.terracota;
      var xa = Math.round(pB.x(xr[0] + dx * ix)), xb = Math.round(pB.x(xr[0] + dx * (ix + 1))), ya = Math.round(pB.y(yr[0] + dy * (iy + 1))), yb = Math.round(pB.y(yr[0] + dy * iy));
      ctx.fillRect(xa, ya, xb - xa, yb - ya);
    }
    ctx.globalAlpha = 1;
    if (pts.length) D.line(ctx, pB.x(pts[0][0]), pB.y(pts[0][1]), pB.x(pts[1][0]), pB.y(pts[1][1]), C.ink, 2.5);
    ctx.restore();
    D.text(ctx, "recta de la salida: v1·h1 + v2·h2 = umbral", pB.box.x + 4, 14, { size: 10.5, color: C.muted });
    // los puntos: los dos de clase 1 caen en el mismo sitio; se dibujan con desplazamiento mínimo
    var drawn = {};
    PTS.forEach(function (q, i) {
      var hh = hid(i), key = hh[0].toFixed(3) + "," + hh[1].toFixed(3), n = drawn[key] || 0; drawn[key] = n + 1;
      var cx = pB.x(hh[0]) + n * 9, cy = pB.y(hh[1]) - n * 9;
      D.circle(ctx, cx, cy, 9, T[i] ? C.cobalto : C.terracota, C.paper, 2);
    });
  });

  function update() {
    var ok = 0, lines = "", i;
    for (i = 0; i < 4; i++) {
      var h = hid(i), s = score(h), pred = s > S.th, good = pred === (T[i] === 1);
      if (good) ok++;
      lines += "(" + PTS[i][0] + "," + PTS[i][1] + ") " + WHO[i] + " → h = (" + h[0].toFixed(2) + ", " + h[1].toFixed(2) + ") → v·h = " + s.toFixed(2).replace("-", "−") + " → clase " + (pred ? 1 : 0) + " (aviso: debe ser " + T[i] + ") " + (good ? "<span class='good'>✓</span>" : "<span class='bad'>✗</span>") + "<br>";
    }
    out.set(lines + "Aciertos: <b>" + ok + " de 4</b>" + (bestNote ? "<br>" + bestNote : ""));
    bestNote = "";
    vA.redraw(); vB.redraw();
  }
  update();
});
