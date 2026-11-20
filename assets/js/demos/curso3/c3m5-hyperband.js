/* Experimento: una ronda de Hyperband (max_epochs = 9, factor = 3), como ver el primer capítulo de 9 series.
   Cada configuración tiene una curva de aprendizaje oculta: acc(r) = a − b·exp(−r/t) (r = épocas).
   Ronda 0: las 9 se entrenan 1 época; siguen las 3 mejores hasta la época 3; sigue la mejor hasta la 9.
   Cada ronda continúa desde donde se quedó (no vuelve a empezar). Gasto: 9·1 + 3·2 + 1·6 = 21 épocas,
   frente a 9·9 = 81 entrenando todas hasta el final. La medición lleva ruido: a veces descarta a la buena. */
Lab.register("curso3/c3m5-hyperband", function (root, api) {
  var D = api.d, N = 9, PLAN = [1, 3, 9];
  var S = { seed: 4, noise: 0.02, ronda: -1, ver: false, cfg: [] };
  function make() {
    var R = api.rng(S.seed * 101 + 7), i;
    S.cfg = [];
    for (i = 0; i < N; i++) {
      var a = R.range(0.72, 0.93), t = R.range(0.6, 3.2);
      var ruido = [];
      for (var r = 0; r <= 9; r++) ruido.push(R.normal(0, 1));
      S.cfg.push({ a: a, b: R.range(0.25, 0.4), t: t, ruido: ruido, ep: 0, vivo: true });
    }
    S.ronda = -1;
  }
  function real(c, r) { return c.a - c.b * Math.exp(-r / c.t); }
  function medida(c) { return c.ep ? real(c, c.ep) + S.noise * c.ruido[c.ep] : null; }
  function paso() {
    if (S.ronda >= PLAN.length - 1) return;
    S.ronda++;
    var vivos = S.cfg.filter(function (c) { return c.vivo; });
    if (S.ronda > 0) {
      vivos.sort(function (p, q) { return medida(q) - medida(p); });
      var quedan = Math.max(1, Math.floor(vivos.length / 3));
      vivos.forEach(function (c, k) { if (k >= quedan) c.vivo = false; });
      vivos = vivos.slice(0, quedan);
    }
    vivos.forEach(function (c) { c.ep = PLAN[S.ronda]; });
    update();
  }
  function reset() { S.cfg.forEach(function (c) { c.ep = 0; c.vivo = true; }); S.ronda = -1; update(); }

  var view = api.view(root, { aspect: 1.55, minH: 300, maxH: 420, label: "Nueve configuraciones; cada barra muestra cuántas épocas ha entrenado y su nota de validación" });
  var ui = api.controls(root), out = api.readout(root);
  ui.button("Ronda ▶", paso);
  ui.button("Empezar otra vez", reset);
  ui.button("Otras 9 series", function () { S.seed = S.seed % 50 + 1; make(); update(); }, "warm");
  ui.toggle({ label: "ver la nota real al final", value: false, onChange: function (v) { S.ver = v; update(); } });
  ui.slider({ label: "Ruido al medir con pocos datos de validación", min: 0, max: 0.06, step: 0.005, value: S.noise, fmt: function (v) { return "±" + v.toFixed(3); }, onInput: function (v) { S.noise = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "sigue entrenando"], [api.colors().muted, "descartada"], [api.colors().terracota, "ganadora"]]);

  function draw(ctx, w, h, C) {
    var narrow = w < 460, padL = narrow ? 30 : 64, padR = narrow ? 44 : 64, top = 34, bot = 8;
    var gw = w - padL - padR, rowH = (h - top - bot) / N, cw = gw / 9, i, r;
    D.text(ctx, narrow ? "épocas →" : "épocas entrenadas →", padL, 14, { size: 11, color: C.muted });
    [1, 3, 9].forEach(function (e) { D.text(ctx, String(e), padL + cw * e - cw / 2, 28, { align: "center", size: 11, weight: 700, color: C.ink2, mono: true }); });
    for (r = 1; r <= 9; r++) D.line(ctx, padL + cw * r, top - 2, padL + cw * r, h - bot, C.line, 1);
    var fin = S.ronda === PLAN.length - 1;
    for (i = 0; i < N; i++) {
      var c = S.cfg[i], y = top + i * rowH, bh = Math.max(8, rowH - 8);
      D.text(ctx, (narrow ? "" : "serie ") + (i + 1), padL - 6, y + rowH / 2 + 4, { align: "right", size: 11, color: C.ink2, mono: narrow });
      D.rect(ctx, padL, y + 4, gw, bh, null, C.line, 1);
      if (c.ep) {
        var gana = fin && c.vivo;
        D.rect(ctx, padL, y + 4, cw * c.ep, bh, gana ? C.terracota : (c.vivo ? C.cobalto : C.muted));
        var m = medida(c);
        D.text(ctx, m.toFixed(2).replace(".", ","), padL + gw + 6, y + rowH / 2 + 4, { size: 11, mono: true, weight: c.vivo ? 700 : 400, color: c.vivo ? C.ink : C.muted });
      }
      if (S.ver && fin) {
        var fx = padL + gw * Math.min(1, Math.max(0, (real(c, 9) - 0.55) / 0.4));
        D.line(ctx, fx, y + 2, fx, y + 6 + bh, C.ink, 2);
      }
    }
  }
  view.draw(draw);

  function update() {
    var gasto = S.cfg.reduce(function (s, c) { return s + c.ep; }, 0);
    var msg = ["Pulsa <b>Ronda ▶</b>: las 9 series ven su primer capítulo (1 época).",
      "Ronda 1: las 9 entrenaron <b>1 época</b>. Pulsa otra vez: solo siguen las 3 de mejor nota.",
      "Ronda 2: las 3 mejores siguieron hasta la <b>época 3</b> (continúan, no empiezan de cero). Otra vez: solo sigue la mejor.",
      "Ronda 3: la mejor llegó a la <b>época 9</b>."][S.ronda + 1];
    var txt = msg + "<br>Épocas gastadas: <b>" + gasto + "</b> de 21 en esta apuesta · entrenando las 9 hasta el final serían <b>81</b>.";
    if (S.ronda === PLAN.length - 1) {
      var best = 0, win = 0, i;
      for (i = 1; i < N; i++) if (real(S.cfg[i], 9) > real(S.cfg[best], 9)) best = i;
      for (i = 0; i < N; i++) if (S.cfg[i].vivo) win = i;
      txt += win === best ? "<br><span class='good'>La ganadora (serie " + (win + 1) + ") es de verdad la mejor de las 9.</span>"
        : "<br><span class='bad'>La ganadora es la serie " + (win + 1) + ", pero la mejor de verdad era la " + (best + 1) + ": arrancaba despacio y se descartó pronto. Por eso Hyperband hace también apuestas más prudentes.</span>";
    }
    out.set(txt);
    view.redraw();
  }
  make(); update();
});
