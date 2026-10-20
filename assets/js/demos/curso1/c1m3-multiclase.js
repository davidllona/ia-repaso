/* Experimento: clasificación multiclase con clasificadores binarios: One-vs-Rest y One-vs-One. */
Lab.register("curso1/c1m3-multiclase", function (root, api) {
  var D = api.d, M = api.math;
  var mode = "ovr", pts = [], clfs = { ovr: [], ovo: [] }, q = { x: 5.3, y: 6.8 }, XR = [0, 10], YR = [0, 10];
  var NAMES = ["A", "B", "C"], CENTER = [[1.8, 5], [5, 5], [8.2, 5]];

  function gen() {
    var r = api.rng(14), c, i; pts = [];
    for (c = 0; c < 3; c++) for (i = 0; i < 20; i++) pts.push([M.clamp(r.normal(CENTER[c][0], 0.85), 0.2, 9.8), M.clamp(r.normal(CENTER[c][1], 1.7), 0.2, 9.8), c]);
    train();
  }
  /* regresión logística binaria por descenso de gradiente (igual que en el módulo 2) */
  function lr(set, pos) {
    var w = [0, 0], b = 0, it, k, n = set.length;
    for (it = 0; it < 600; it++) {
      var g0 = 0, g1 = 0, gb = 0;
      for (k = 0; k < n; k++) {
        var x0 = (set[k][0] - 5) / 3, x1 = (set[k][1] - 5) / 3, y = pos(set[k]) ? 1 : 0, p = M.sigmoid(w[0] * x0 + w[1] * x1 + b), e = p - y;
        g0 += e * x0; g1 += e * x1; gb += e;
      }
      w[0] -= 0.8 * (g0 / n + 0.002 * w[0]); w[1] -= 0.8 * (g1 / n + 0.002 * w[1]); b -= 0.8 * gb / n;
    }
    return { w: w, b: b };
  }
  function prob(m, x, y) { return M.sigmoid(m.w[0] * (x - 5) / 3 + m.w[1] * (y - 5) / 3 + m.b); }
  function train() {
    var k, a, b;
    clfs.ovr = [0, 1, 2].map(function (c) { var m = lr(pts, function (p) { return p[2] === c; }); m.c = c; return m; });
    clfs.ovo = [];
    for (a = 0; a < 3; a++) for (b = a + 1; b < 3; b++) { var m2 = lr(pts.filter(function (p) { return p[2] === a || p[2] === b; }), function (p) { return p[2] === b; }); m2.ca = a; m2.cb = b; clfs.ovo.push(m2); }
  }
  function predict(x, y) {
    var k;
    if (mode === "ovr") {
      var ps = clfs.ovr.map(function (m) { return prob(m, x, y); }), best = 0;
      for (k = 1; k < 3; k++) if (ps[k] > ps[best]) best = k;
      return { cls: best, ps: ps };
    }
    var votes = [0, 0, 0], conf = [0, 0, 0], det = [];
    clfs.ovo.forEach(function (m) { var p = prob(m, x, y), win = p > 0.5 ? m.cb : m.ca; votes[win]++; conf[m.ca] += 1 - p; conf[m.cb] += p; det.push([m.ca, m.cb, win, p]); });
    var bc = 0; for (k = 1; k < 3; k++) if (votes[k] > votes[bc] || (votes[k] === votes[bc] && conf[k] > conf[bc])) bc = k;
    return { cls: bc, votes: votes, det: det };
  }
  function acc() { var ok = 0; pts.forEach(function (p) { if (predict(p[0], p[1]).cls === p[2]) ok++; }); return ok / pts.length; }

  var view = api.view(root, { aspect: 1.6, minH: 270, drag: true, label: "Películas de terror, comedia y romance según su tono y su ritmo, las fronteras de los clasificadores binarios y la región de cada género" });
  var plot = api.plot(view, { xr: XR, yr: YR, xticks: 5, yticks: 5, grid: false, xlabel: "tono: oscuro → alegre", ylabel: "ritmo →", pad: { l: 26, r: 10, t: 10, b: 36 }, xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Estrategia", options: [["ovr", "One-vs-Rest (3 modelos)"], ["ovo", "One-vs-One (3 modelos)"]], value: mode, onChange: function (v) { mode = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "A = terror"], [api.colors().terracota, "B = comedia"], [api.colors().oliva, "C = romance"]]);

  function line(ctx, m, C, color, label) {
    var b = plot.box, X0 = 5, S = 3, pts2 = [], t;
    /* w0*(x-5)/3 + w1*(y-5)/3 + b = 0 */
    function yAt(x) { return 5 + (-(m.w[0] * (x - X0) / S + m.b) * S / m.w[1]); }
    function xAt(y) { return 5 + (-(m.w[1] * (y - 5) / S + m.b) * S / m.w[0]); }
    if (Math.abs(m.w[1]) > Math.abs(m.w[0])) { pts2 = [[XR[0], yAt(XR[0])], [XR[1], yAt(XR[1])]]; }
    else { pts2 = [[xAt(YR[0]), YR[0]], [xAt(YR[1]), YR[1]]]; }
    D.path(ctx, pts2.map(function (p) { return [plot.x(p[0]), plot.y(p[1])]; }), color, 2.4, [7, 4]);
    if (label) {
      var top = pts2[0][1] > pts2[1][1] ? pts2[0] : pts2[1], tx = plot.x(top[0]) + 5, ty = plot.box.y + 14, tw = 34;
      if (tx + tw > plot.box.x + plot.box.w) tx -= tw + 10;
      D.rect(ctx, tx - 2, ty - 11, tw, 15, C.surface, C.ink, 1);
      D.text(ctx, label, tx + 1, ty, { size: 11, weight: 600, color: C.ink });
    }
    return pts2;
  }
  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = 7, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), i, j, washes = [C.cobaltoWash, C.terracotaWash, C.olivaWash], cols = [C.cobalto, C.terracota, C.oliva];
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var px = b.x + i * cs, py = b.y + j * cs; ctx.fillStyle = washes[predict(plot.ix(px + cs / 2), plot.iy(py + cs / 2)).cls]; ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
    }
    if (mode === "ovr") clfs.ovr.forEach(function (m) { line(ctx, m, C, cols[m.c]); });
    else clfs.ovo.forEach(function (m) { line(ctx, m, C, C.ink, NAMES[m.ca] + "|" + NAMES[m.cb]); });
    pts.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5, cols[p[2]], C.paper, 1.3); });
    var pr = predict(q.x, q.y); D.circle(ctx, plot.x(q.x), plot.y(q.y), 9, cols[pr.cls], C.ink, 3);
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function update() {
    view.redraw();
    var pr = predict(q.x, q.y), txt;
    if (mode === "ovr") txt = "<b>One-vs-Rest</b>: un modelo por clase («ese género» contra «todos los demás»). Probabilidades en el punto marcado: A = <b>" + pr.ps[0].toFixed(2) + "</b> · B = <b>" + pr.ps[1].toFixed(2) + "</b> · C = <b>" + pr.ps[2].toFixed(2) + "</b> → gana la mayor: <b>" + NAMES[pr.cls] + "</b>.";
    else txt = "<b>One-vs-One</b>: un modelo por pareja de clases. Votos en el punto marcado: " + pr.det.map(function (d) { return NAMES[d[0]] + " vs " + NAMES[d[1]] + " → <b>" + NAMES[d[2]] + "</b>"; }).join(" · ") + " → recuento A = <b>" + pr.votes[0] + "</b>, B = <b>" + pr.votes[1] + "</b>, C = <b>" + pr.votes[2] + "</b> → gana <b>" + NAMES[pr.cls] + "</b>.";
    var cnt = [0, 0, 0]; pts.forEach(function (p) { if (predict(p[0], p[1]).cls === p[2]) cnt[p[2]]++; });
    txt += "<br>Acierto en train: <b>" + (acc() * 100).toFixed(1) + " %</b> (A " + cnt[0] + "/20 · B " + cnt[1] + "/20 · C " + cnt[2] + "/20)";
    out.set(txt);
  }
  function move(px, py) { if (!plot.inside(px, py)) return; q.x = M.clamp(plot.ix(px), 0.1, 9.9); q.y = M.clamp(plot.iy(py), 0.1, 9.9); update(); }
  view.pointer({ down: move, drag: move });
  gen(); view.draw(draw); update();
});
