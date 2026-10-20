/* Experimento: softmax (logits → probabilidades), temperatura, entropía cruzada y su gradiente p − y.
   Disfraz: la red mira el tráiler de una película y decide su género (acción, comedia, terror). */
Lab.register("curso2/c2m1-softmax", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var NAMES = ["acción", "comedia", "terror"];
  var S = { z: [2.0, 1.0, 0.1], T: 1, cls: 0 };

  var view = api.view(root, { aspect: 2.1, minH: 250, maxH: 380, label: "Tres paneles para los géneros acción, comedia y terror: logits, probabilidades softmax y gradiente de la entropía cruzada" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var sl = [];
  NAMES.forEach(function (n, i) {
    sl.push(ui.slider({ label: "Logit z de «" + n + "»", min: -4, max: 4, step: 0.1, value: S.z[i], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z[i] = v; update(); } }));
  });
  ui.slider({ label: "Temperatura T (1 = softmax normal)", min: 0.2, max: 4, step: 0.1, value: 1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.T = v; update(); } });
  ui.segmented({ label: "Género real de la película (la etiqueta correcta, en verde)", value: 0, options: NAMES.map(function (n, i) { return [i, n]; }), onChange: function (v) { S.cls = v; update(); } });

  function probs() { return M.softmax(S.z, S.T); }

  function draw(ctx, w, h, C) {
    var P = probs(), g = P.map(function (p, i) { return p - (i === S.cls ? 1 : 0); });
    var top = 40, bot = 24, ph = h - top - bot, pw = w / 3, i;
    var panels = [
      { t: "logits z", sub: "puntuaciones crudas" }, { t: "softmax p", sub: "probabilidades (suman 1)" }, { t: "gradiente p − y", sub: "dL/dz de cada logit" }
    ];
    panels.forEach(function (pn, k) {
      var x0 = k * pw;
      if (k > 0) D.line(ctx, x0, 8, x0, h - 8, C.line, 1, [3, 3]);
      D.text(ctx, pn.t, x0 + pw / 2, 18, { size: Math.min(13, pw / 9), weight: 600, align: "center", color: C.ink });
      if (w > 520) D.text(ctx, pn.sub, x0 + pw / 2, 33, { size: 11, align: "center", color: C.muted });
    });
    var bw = Math.min(40, pw / 5), mid = top + ph / 2, fs = pw < 150 ? 9.5 : 11;
    for (i = 0; i < 3; i++) {
      var cx1 = pw * 0.5 + (i - 1) * pw * 0.34, cx2 = pw + cx1, cx3 = 2 * pw + cx1;
      var isC = i === S.cls;
      // logits
      var zh = S.z[i] / 4 * (ph / 2 - 14);
      D.line(ctx, pw * 0.08, mid, pw * 0.92, mid, C.muted, 1);
      D.rect(ctx, cx1 - bw / 2, zh >= 0 ? mid - zh : mid, bw, Math.abs(zh), C.cobalto, C.ink, 1.2);
      D.text(ctx, S.z[i].toFixed(1), cx1, zh >= 0 ? mid - zh - 5 : mid - zh + 14, { size: fs, mono: true, weight: 600, align: "center" });
      // probabilidades
      var base = top + ph, p = P[i], hh = p * (ph - 16);
      D.line(ctx, pw + pw * 0.08, base, pw + pw * 0.92, base, C.muted, 1);
      D.rect(ctx, cx2 - bw / 2, base - hh, bw, hh, isC ? C.oliva : C.terracota, C.ink, 1.2);
      D.text(ctx, p.toFixed(3), cx2, base - hh - 5, { size: fs, mono: true, weight: 600, align: "center", color: C.ink });
      // gradiente
      var gh = g[i] * (ph / 2 - 14);
      D.line(ctx, 2 * pw + pw * 0.08, mid, 2 * pw + pw * 0.92, mid, C.muted, 1);
      D.rect(ctx, cx3 - bw / 2, gh >= 0 ? mid - gh : mid, bw, Math.abs(gh), g[i] < 0 ? C.oliva : C.terracota, C.ink, 1.2);
      D.text(ctx, g[i].toFixed(3), cx3, gh >= 0 ? mid - gh - 5 : mid - gh + 14, { size: fs, mono: true, weight: 600, align: "center" });
      // nombres
      [cx1, cx2, cx3].forEach(function (cx) { D.text(ctx, NAMES[i], cx, h - 7, { size: Math.min(12, pw / 9, pw * 0.34 / 3.7), align: "center", weight: isC ? 700 : 400, color: isC ? C.olivaInk : C.ink2 }); });
    }
  }

  function update() {
    var P = probs(), pc = P[S.cls], L = -Math.log(Math.max(pc, 1e-12));
    var e = S.z.map(function (z) { return Math.exp((z - Math.max.apply(null, S.z)) / S.T); });
    var raw = S.z.map(function (z) { return Math.exp(z / S.T); }), sum = M.sum(raw);
    var g = P.map(function (p, i) { return p - (i === S.cls ? 1 : 0); });
    out.set(
      "e^(z/T): " + raw.map(function (v) { return v.toFixed(3); }).join(" · ") + " → suma = <b>" + sum.toFixed(3) + "</b><br>" +
      "p = e^(z/T) / suma = <b>" + P.map(function (p) { return p.toFixed(3); }).join(" · ") + "</b> (suman " + M.sum(P).toFixed(3) + ")<br>" +
      "Correcta: «" + NAMES[S.cls] + "» → pérdida L = −ln(" + pc.toFixed(3) + ") = <b>" + L.toFixed(3) + "</b><br>" +
      "Gradiente sobre los logits (p − y): " + g.map(function (v) { return (v >= 0 ? "+" : "") + v.toFixed(3); }).join(" · ") + "<br>" +
      (pc > 0.9 ? "<span class='good'>Red muy segura y acertada: L casi 0 y gradiente casi 0.</span>" :
        pc < 0.2 ? "<span class='bad'>La red da poca probabilidad a la clase correcta: pérdida alta y gradiente fuerte.</span>" :
        "La pérdida solo mira la probabilidad de la clase correcta.") +
      (S.T < 1 ? "<br>T &lt; 1 acentúa al ganador (más «seguro»)." : S.T > 1 ? "<br>T &gt; 1 reparte las probabilidades (más «dudoso»)." : "")
    );
    view.redraw();
  }
  view.draw(draw); update();
});
