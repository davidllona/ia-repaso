/* Experimento: el flujo de scikit-learn paso a paso (train_test_split -> crear -> fit -> predict -> comparar), con una regresión logística de juguete. */
Lab.register("curso1/c1m1-fit-predict", function (root, api) {
  var M = api.math, step = 0, lr = 0.3, iters = 100, NOMBRES = ["Datos X e y", "train_test_split", "Crear el modelo", "fit", "predict", "Comparar con y_test"];
  var P = [], TEST = [], mo = null, loop = null, anim = 0, aviso = "";

  /* Datos de juguete: 10 clientes que cancelan (pocas horas, más jóvenes) y 10 que se quedan. */
  (function () {
    var r = api.rng(4), i, c1 = [], c0 = [];
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    for (i = 0; i < 10; i++) P.push({ h: cl(r.normal(12, 6), 2, 48), e: cl(r.normal(31, 8), 19, 64), y: 1 });
    for (i = 0; i < 10; i++) P.push({ h: cl(r.normal(30, 9), 2, 48), e: cl(r.normal(42, 10), 19, 64), y: 0 });
    P.forEach(function (p, k) { (p.y ? c1 : c0).push(k); });
    r.shuffle(c1); r.shuffle(c0);
    TEST = c1.slice(0, 3).concat(c0.slice(0, 3)).sort(function (a, b) { return a - b; });
    P.forEach(function (p, k) { p.test = TEST.indexOf(k) >= 0; });
  })();
  function trainSet() { return P.filter(function (p) { return !p.test; }); }
  function testSet() { return P.filter(function (p) { return p.test; }); }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function newModel() {
    var T = trainSet(), n = T.length;
    var mh = M.mean(T.map(function (p) { return p.h; })), me = M.mean(T.map(function (p) { return p.e; }));
    return { w1: 0, w2: 0, b: 0, mh: mh, me: me, sh: M.std(T.map(function (p) { return p.h; })), se: M.std(T.map(function (p) { return p.e; })), n: n, k: 0, fitted: false };
  }
  function z(m, p) { return m.w1 * (p.h - m.mh) / m.sh + m.w2 * (p.e - m.me) / m.se + m.b; }
  function gd(m, times) {
    var T = trainSet(), n = T.length, t;
    for (t = 0; t < times && m.k < iters; t++) {
      var g1 = 0, g2 = 0, gb = 0;
      T.forEach(function (p) { var q = sig(z(m, p)) - p.y; g1 += q * (p.h - m.mh) / m.sh / n; g2 += q * (p.e - m.me) / m.se / n; gb += q / n; });
      m.w1 -= lr * g1; m.w2 -= lr * g2; m.b -= lr * gb; m.k++;
    }
  }
  function pred(p) { return mo && mo.fitted && z(mo, p) > 0 ? 1 : 0; }
  function logloss() {
    var T = trainSet(), s = 0;
    T.forEach(function (p) { var q = Math.min(1 - 1e-9, Math.max(1e-9, sig(z(mo, p)))); s += -(p.y ? Math.log(q) : Math.log(1 - q)); });
    return s / T.length;
  }

  var view = api.view(root, { aspect: 1.65, minH: 290, maxH: 430, label: "Clientes según horas vistas y edad; en los pasos avanzados, frontera aprendida y predicciones sobre los clientes de test" });
  var plot = api.plot(view, { xr: [0, 50], yr: [15, 70], xticks: 5, yticks: 5, pad: { l: 46, r: 12, t: 12, b: 36 }, xlabel: "Horas vistas al mes", ylabel: "Edad" });
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "Cancela (Sí)"], [C0.cobalto, "Se queda (No)"]]);
  root.appendChild(api.el("p", { style: { margin: "0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: "1.45" },
    html: "Círculo = train · cuadrado = test (¿? = el modelo aún no sabe su respuesta) · relleno = predicción · borde = realidad." }));
  var ui = api.controls(root), out = api.readout(root);
  var sLr = ui.slider({ label: "Hiperparámetro: learning_rate", min: 0.02, max: 1, step: 0.02, value: lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { lr = v; retrain(); } });
  var sIt = ui.slider({ label: "Hiperparámetro: max_iter", min: 0, max: 300, step: 5, value: iters, fmt: function (v) { return String(v); }, onInput: function (v) { iters = v; retrain(); } });
  var bBack = ui.button("◀ Paso anterior", function () { goto(step - 1); });
  var bNext = ui.button("Siguiente paso ▶", function () { goto(step + 1); }, "primary");
  var bErr = ui.button("Probar predict() sin entrenar", function () { aviso = (mo && mo.fitted) ? "ok" : "err"; update(); }, "warm");
  var tabla = api.table(root, ["Cliente", "Horas", "Edad", "y_test", "y_pred", ""]);

  function retrain() {
    if (step < 3) { update(); return; }
    stopLoop(); mo = newModel(); gd(mo, iters); mo.fitted = true; update();
  }
  function stopLoop() { if (loop) loop.stop(); }
  function goto(s) {
    s = Math.max(0, Math.min(5, s)); if (s === step) return;
    stopLoop(); aviso = "";
    if (s >= 2 && !mo) mo = newModel();
    if (s < 3) { mo = s >= 2 ? newModel() : null; }
    else if (s >= 3 && !(mo && mo.fitted)) {
      mo = newModel();
      if (s === 3 && !api.reduceMotion && iters > 0) {
        step = s; var per = Math.max(1, Math.ceil(iters / 45));
        loop = loop || api.loop(function () { gd(mo, per); if (mo.k >= iters) { mo.fitted = true; update(); return false; } update(); }, { fps: 30 });
        loop.start(); update(); return;
      }
      gd(mo, iters); mo.fitted = true;
    }
    step = s; update();
  }
  function lab(y) { return y ? "Sí" : "No"; }

  function draw(ctx, w, h, C) {
    var D = api.d, b, i, x, y, cx, cy;
    plot.axes(ctx); b = plot.box;
    if (step >= 3 && mo && mo.k > 0) {
      var line = null, big = 400, far = [-80, 130];
      /* Frontera z = 0 y relleno de cada lado (un único polígono por lado: sin costuras). */
      ctx.save(); plot.clip(ctx);
      if (Math.abs(mo.w2) > 1e-6) {
        var ly = function (hh) { return mo.me + mo.se * (-mo.b - mo.w1 * (hh - mo.mh) / mo.sh) / mo.w2; };
        var up = z(mo, { h: 25, e: ly(25) + 1 }) > 0;   /* ¿el lado de arriba es «Sí»? */
        var poly = function (arriba) { return [[plot.x(far[0]), plot.y(ly(far[0]))], [plot.x(far[1]), plot.y(ly(far[1]))], [plot.x(far[1]), plot.y(arriba ? 5000 : -5000)], [plot.x(far[0]), plot.y(arriba ? 5000 : -5000)]]; };
        [[true, up], [false, !up]].forEach(function (c) {
          var pl = poly(c[0]); ctx.beginPath(); pl.forEach(function (q, i2) { if (i2) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath();
          ctx.globalAlpha = 0.16; ctx.fillStyle = c[1] ? C.terracota : C.cobalto; ctx.fill(); ctx.globalAlpha = 1;
        });
        D.line(ctx, plot.x(far[0]), plot.y(ly(far[0])), plot.x(far[1]), plot.y(ly(far[1])), C.ink, 2.5);
      } else if (Math.abs(mo.w1) > 1e-6) {
        var vx2 = mo.mh + mo.sh * (-mo.b / mo.w1), right = mo.w1 > 0;
        ctx.globalAlpha = 0.16;
        D.rect(ctx, plot.x(vx2), b.y, b.x + b.w - plot.x(vx2), b.h, right ? C.terracota : C.cobalto);
        D.rect(ctx, b.x, b.y, plot.x(vx2) - b.x, b.h, right ? C.cobalto : C.terracota);
        ctx.globalAlpha = 1; D.line(ctx, plot.x(vx2), b.y, plot.x(vx2), b.y + b.h, C.ink, 2.5);
      }
      ctx.restore();
    }
    P.forEach(function (p) {
      cx = plot.x(p.h); cy = plot.y(p.e);
      var col = p.y ? C.terracota : C.cobalto;
      if (!p.test || step === 0) { D.circle(ctx, cx, cy, 6, col, C.paper, 1.5); return; }
      /* clientes de test */
      var pr = pred(p), known = step >= 4, fill = known ? (pr ? C.terracota : C.cobalto) : C.paper2 || C.paper;
      D.rect(ctx, cx - 7, cy - 7, 14, 14, fill, step >= 5 ? col : C.ink, step >= 5 ? 3 : 1.5);
      if (!known) D.text(ctx, "?", cx, cy + 4, { align: "center", size: 11, weight: 700, color: C.ink });
      if (step >= 5) {
        var ok = pr === p.y;
        var bx = cx + 13, by = cy - 11;
        D.circle(ctx, bx, by, 8, ok ? C.oliva : C.terracota, C.paper, 1.5);
        ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath();
        if (ok) { ctx.moveTo(bx - 3.5, by); ctx.lineTo(bx - 1, by + 3); ctx.lineTo(bx + 4, by - 3); }
        else { ctx.moveTo(bx - 3, by - 3); ctx.lineTo(bx + 3, by + 3); ctx.moveTo(bx + 3, by - 3); ctx.lineTo(bx - 3, by + 3); }
        ctx.stroke(); ctx.restore();
      }
    });
  }
  function update() {
    view.redraw();
    bBack.disabled = step === 0; bNext.disabled = step === 5 || (loop && loop.running);
    bErr.style.display = (step === 2 || step === 3) ? "" : "none";
    var T = trainSet(), S = testSet(), html = "<b>Paso " + (step + 1) + " de 6 · " + NOMBRES[step] + "</b><br>";
    if (step === 0) html += "<code>X.shape = (20, 2)</code> (columnas: horas, edad) · <code>y.shape = (20,)</code>: 10 «Sí» y 10 «No".replace('«No', '«No»') + ".";
    else if (step === 1) html += "<code>X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, stratify=y)</code><br>X_train: <b>(" + T.length + ", 2)</b> · X_test: <b>(" + S.length + ", 2)</b>. Los cuadrados del test se guardan en un cajón: el modelo no los ve.";
    else if (step === 2) html += "<code>clf = LogisticRegression(learning_rate=" + lr.toFixed(2) + ", max_iter=" + iters + ")</code><br>Hiperparámetros (los fijas tú): <b>" + lr.toFixed(2) + "</b> y <b>" + iters + "</b>. Parámetros que aprenderá: w₁ = ?, w₂ = ?, b = ? · <b>Crear no es entrenar</b>: aún no ha visto ningún dato.";
    else if (step >= 3) {
      var tAcc = T.filter(function (p) { return pred(p) === p.y; }).length;
      html += "<code>clf.fit(X_train, y_train)</code> → iteración <b>" + mo.k + "</b> de " + iters + (loop && loop.running ? " (aprendiendo…)" : "") + "<br>Parámetros aprendidos: w₁ (horas) = <b>" + mo.w1.toFixed(2) + "</b> · w₂ (edad) = <b>" + mo.w2.toFixed(2) + "</b> · b = <b>" + mo.b.toFixed(2) + "</b><br>Acierto en train: <b>" + tAcc + " de " + T.length + "</b> · pérdida (log-loss): <b>" + logloss().toFixed(3) + "</b>";
      if (step >= 4 && mo.fitted) html += "<br><code>y_pred = clf.predict(X_test)</code> → <b>[" + S.map(function (p) { return lab(pred(p)); }).join(", ") + "]</b>";
      if (step >= 5 && mo.fitted) {
        var okn = S.filter(function (p) { return pred(p) === p.y; }).length, tp = 0, tn = 0, fp = 0, fn = 0;
        S.forEach(function (p) { var q = pred(p); if (p.y && q) tp++; else if (!p.y && !q) tn++; else if (!p.y && q) fp++; else fn++; });
        html += "<br><code>y_test</code> = <b>[" + S.map(function (p) { return lab(p.y); }).join(", ") + "]</b><br>Acierto en test: <span class='" + (okn === S.length ? "good" : "bad") + "'><b>" + okn + " de " + S.length + " = " + (100 * okn / S.length).toFixed(0) + " %</b></span> · matriz [[" + tn + ", " + fp + "], [" + fn + ", " + tp + "]] (filas = realidad No/Sí; columnas = predicción No/Sí)";
      }
    }
    if (aviso === "err") html += "<br><span class='bad'>NotFittedError: This LogisticRegression instance is not fitted yet. Call 'fit' with appropriate arguments before using this estimator.</span>";
    if (aviso === "ok") html += "<br><span class='good'>El modelo ya está entrenado: predict() funciona.</span>";
    out.set(html);
    if (step >= 5 && mo && mo.fitted) tabla.set(S.map(function (p, i) { var q = pred(p); return ["#" + (P.indexOf(p) + 1), p.h.toFixed(0), p.e.toFixed(0), lab(p.y), lab(q), q === p.y ? "<span class='good'>✓</span>" : "<span class='bad'>✗</span>"]; }));
    else tabla.set([]);
    tabla.el.style.display = (step >= 5 && mo && mo.fitted) ? "" : "none";
  }
  view.draw(draw); update();
  return { destroy: function () { stopLoop(); } };
});
