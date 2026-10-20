/* Experimento: exploración frente a explotación en un pasillo con una recompensa pequeña cerca (+1) y una grande lejos (+10).
   Se entrena Q-learning con cuatro estrategias ε y se promedian 30 semillas. */
Lab.register("curso3/c3m6-explorar", function (root, api) {
  var D = api.d, M = api.math;
  var NC = 9, START = 2, GAMMA = 0.95, ALPHA = 0.5, EPIS = 300, SEEDS = 30, CAP = 100;
  var S = { decay: 0.99, seed0: 100, res: null };
  var v0 = api.view(root, { aspect: 7, minH: 56, maxH: 78, label: "Pasillo de 9 casillas: recompensa +1 en el extremo izquierdo, +10 en el derecho, el agente empieza en la tercera" });
  var v1 = api.view(root, { aspect: 1.75, minH: 230, maxH: 360, label: "Recompensa final media por episodio con cuatro estrategias de exploración" });
  var p = api.plot(v1, { xr: [0, EPIS], yr: [0, 10], xticks: 6, yticks: 5, xlabel: "episodio de entrenamiento", ylabel: "recompensa final", pad: { l: 46, r: 16, t: 10, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Decaimiento de ε (ε ← ε·d cada episodio)", min: 0.9, max: 0.999, step: 0.001, value: S.decay, fmt: function (v) { return v.toFixed(3).replace(".", ","); }, onInput: function (v) { S.decay = v; run(); } });
  ui.button("Otras 30 semillas", function () { S.seed0 += 1000; run(); }, "primary");

  function schedules() {
    return [
      { n: "ε = 0", e: function () { return 0; }, key: "ink" },
      { n: "ε = 0,1", e: function () { return 0.1; }, key: "cobalto" },
      { n: "ε = 1 (azar)", e: function () { return 1; }, key: "muted", dash: [5, 4] },
      { n: "ε decreciente", e: function (ep) { return Math.max(0.02, Math.pow(S.decay, ep)); }, key: "terracota" }
    ];
  }
  function train(sch, seed) {
    var rg = api.rng(seed), Q = [], i, rew = [];
    for (i = 0; i < NC; i++) Q.push([0, 0]);
    for (var ep = 0; ep < EPIS; ep++) {
      var eps = sch.e(ep), s = START, R = 0;
      for (var t = 0; t < CAP; t++) {
        var a;
        if (rg.next() < eps) a = rg.next() < 0.5 ? 0 : 1;
        else if (Q[s][0] === Q[s][1]) a = rg.next() < 0.5 ? 0 : 1;
        else a = Q[s][1] > Q[s][0] ? 1 : 0;
        var s2 = a === 1 ? s + 1 : s - 1, r = 0, term = false;
        if (s2 === 0) { r = 1; term = true; } else if (s2 === NC - 1) { r = 10; term = true; }
        Q[s][a] += ALPHA * (r + (term ? 0 : GAMMA * Math.max(Q[s2][0], Q[s2][1])) - Q[s][a]);
        s = s2; R = r;
        if (term) break;
      }
      rew.push(R);
    }
    // ¿la política greedy final lleva a la meta grande?
    var s3 = START, goesRight = false;
    for (var k = 0; k < 30; k++) {
      if (Q[s3][0] === Q[s3][1]) break;
      s3 += Q[s3][1] > Q[s3][0] ? 1 : -1;
      if (s3 === NC - 1) { goesRight = true; break; } if (s3 === 0) break;
    }
    return { rew: rew, right: goesRight };
  }
  function run() {
    S.res = schedules().map(function (sch) {
      var avg = new Array(EPIS).fill(0), right = 0;
      for (var k = 0; k < SEEDS; k++) { var r = train(sch, S.seed0 + k); r.rew.forEach(function (v, i) { avg[i] += v / SEEDS; }); if (r.right) right++; }
      return { sch: sch, avg: avg, right: right };
    });
    update();
  }
  function smooth(a, w) { return a.map(function (_, i) { var s = 0, n = 0; for (var j = Math.max(0, i - w + 1); j <= i; j++) { s += a[j]; n++; } return s / n; }); }
  function drawCorr(ctx, w, h, C) {
    var m = 6, cw = (w - 2 * m) / NC, ch = h - 2 * m - 10;
    for (var i = 0; i < NC; i++) {
      var x = m + i * cw, fill = C.surface, lab = "";
      if (i === 0) { fill = C.markerWash; lab = "+1"; } else if (i === NC - 1) { fill = C.olivaWash; lab = "+10"; } else if (i === START) { lab = "inicio"; }
      D.rect(ctx, x + 1, m, cw - 2, ch, fill, C.ink, 1.2);
      if (lab) D.text(ctx, lab, x + cw / 2, m + ch / 2 + 4, { align: "center", size: Math.min(12, cw / 3.2), weight: 700, color: C.ink });
    }
    D.text(ctx, "pasillo: la recompensa pequeña está a 2 pasos, la grande a 6", w / 2, h - 3, { align: "center", size: 10.5, color: C.muted });
  }
  function drawCurve(ctx, w, h, C) {
    p.axes(ctx);
    if (!S.res) return;
    ctx.save(); p.clip(ctx);
    S.res.forEach(function (r) {
      var sm = smooth(r.avg, 10), pts = sm.map(function (v, i) { return [p.x(i + 1), p.y(v)]; });
      D.path(ctx, pts, C[r.sch.key], r.sch.key === "terracota" ? 3 : 2.2, r.sch.dash);
    });
    ctx.restore();
  }
  function f(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ","); }
  function update() {
    if (!S.res) return;
    var C = api.colors(), TD = "padding:4px 6px;", s = "<table style='border-collapse:collapse;width:100%;font-size:13px'><tr><th style='text-align:left;" + TD + "'>Estrategia</th><th style='" + TD + "'>Recompensa media</th><th style='" + TD + "'>Llega al +10</th></tr>";
    S.res.forEach(function (r) {
      var last = r.avg.slice(EPIS - 50), m = M.mean(last);
      s += "<tr><td style='" + TD + "'><i style='display:inline-block;width:10px;height:10px;background:" + C[r.sch.key] + ";margin-right:6px'></i>" + r.sch.n + "</td><td style='text-align:center;" + TD + "'><b>" + f(m) + "</b></td><td style='text-align:center;" + TD + "'><b>" + r.right + "</b>/" + SEEDS + "</td></tr>";
    });
    out.set(s + "</table><div style='font-size:12px;margin-top:4px'>Recompensa media: últimos 50 episodios, promedio de 30 semillas. Llega al +10: semillas (de 30) cuya política final, sin explorar, termina en la meta grande.</div>");
    v1.redraw();
  }
  v0.draw(drawCorr); v1.draw(drawCurve); run();
});
