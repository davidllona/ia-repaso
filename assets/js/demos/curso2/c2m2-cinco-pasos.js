/* Experimento: los cinco pasos de un programa Keras y qué método cambia los pesos.
   Una red diminuta 2 → 4 → 1 (ReLU, salida lineal) escrita a mano: predice cuántas horas
   verá un usuario de una película a partir de su gusto por el género y la duración. */
Lab.register("curso2/c2m2-cinco-pasos", function (root, api) {
  var STEPS = [
    { k: "datos", code: "X_train, y_train = ...", lab: "1 · Datos" },
    { k: "seq", code: "model = keras.Sequential([...])", lab: "2 · Sequential" },
    { k: "compile", code: "model.compile(optimizer, loss='mse')", lab: "3 · compile" },
    { k: "fit", code: "model.fit(X_train, y_train, epochs=5)", lab: "4 · fit" },
    { k: "evaluate", code: "model.evaluate(X_test, y_test)", lab: "5 · evaluate" },
    { k: "predict", code: "model.predict(X_nuevo)", lab: "5 · predict" }
  ];
  var H = 4, st, net, prevW;

  function truth(g, d) { return d * (0.25 + 0.75 * g); }     // horas vistas «de verdad»
  function makeData(seed, n) {
    var r = api.rng(seed), X = [], Y = [];
    for (var i = 0; i < n; i++) {
      var g = r.range(0, 1), d = r.range(1.5, 3);
      X.push([g, d]); Y.push(truth(g, d) + r.normal(0, 0.05));
    }
    return { X: X, Y: Y };
  }
  function fresh() {
    st = { data: null, test: null, model: false, compiled: false, epochs: 0, last: -1, msg: "Pulsa los pasos en orden: empieza por <b>1 · Datos</b>.", err: false, changed: null, loss: null };
    net = null; prevW = null;
  }
  function build(seed) {
    var r = api.rng(seed), L1 = Math.sqrt(6 / (2 + H)), L2 = Math.sqrt(6 / (H + 1)), i, j;
    var W1 = [], b1 = [], W2 = [];
    for (i = 0; i < 2; i++) { W1.push([]); for (j = 0; j < H; j++) W1[i].push(r.range(-L1, L1)); }
    for (j = 0; j < H; j++) { b1.push(0.1); W2.push(r.range(-L2, L2)); }
    return { W1: W1, b1: b1, W2: W2, b2: 0 };
  }
  function flat(n) { var a = []; n.W1.forEach(function (r) { a = a.concat(r); }); return a.concat(n.b1, n.W2, [n.b2]); }
  function fwd(x) {
    var h = [], z, j, y = net.b2;
    for (j = 0; j < H; j++) { z = x[0] * net.W1[0][j] + x[1] * net.W1[1][j] + net.b1[j]; h.push(z > 0 ? z : 0); y += h[j] * net.W2[j]; }
    return { h: h, y: y };
  }
  function mse(D) { var s = 0; for (var i = 0; i < D.X.length; i++) { var e = fwd(D.X[i]).y - D.Y[i]; s += e * e; } return s / D.X.length; }
  function trainEpoch(D, lr, bs) {
    var n = D.X.length, steps = 0;
    for (var s = 0; s < n; s += bs) {
      var gW1 = [[0, 0, 0, 0], [0, 0, 0, 0]], gb1 = [0, 0, 0, 0], gW2 = [0, 0, 0, 0], gb2 = 0, m = Math.min(bs, n - s), i, j;
      for (i = s; i < s + m; i++) {
        var x = D.X[i], f = fwd(x), e = 2 * (f.y - D.Y[i]) / m;
        gb2 += e;
        for (j = 0; j < H; j++) {
          gW2[j] += e * f.h[j];
          if (f.h[j] > 0) { var dz = e * net.W2[j]; gb1[j] += dz; gW1[0][j] += dz * x[0]; gW1[1][j] += dz * x[1]; }
        }
      }
      for (j = 0; j < H; j++) { net.W2[j] -= lr * gW2[j]; net.b1[j] -= lr * gb1[j]; net.W1[0][j] -= lr * gW1[0][j]; net.W1[1][j] -= lr * gW1[1][j]; }
      net.b2 -= lr * gb2; steps++;
    }
    return steps;
  }
  function countChanged() {
    if (!prevW || !net) return 0;
    var a = flat(net), c = 0;
    for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - prevW[i]) > 1e-12) c++;
    return c;
  }
  function act(i) {
    var k = STEPS[i].k, n;
    st.err = false;
    prevW = net ? flat(net) : null;
    if (k === "datos") {
      st.data = makeData(11, 40); st.test = makeData(99, 10);
      st.msg = "X_train.shape = (40, 2) · y_train.shape = (40,). Cada fila: gusto por el género (0–1) y duración (horas). Aún no hay red.";
    } else if (k === "seq") {
      net = build(3 + Math.floor(Math.random() * 1000)); st.model = true; st.compiled = false; st.epochs = 0; prevW = null;
      st.msg = "Red 2 → 4 → 1 creada: 17 parámetros con valores <b>aleatorios</b> (Glorot). Todavía no sabe nada.";
    } else if (k === "compile") {
      if (!st.model) return fail("Primero construye el modelo (paso 2).");
      st.compiled = true;
      st.msg = "compile solo apunta la configuración: pérdida MSE y optimizador. No ha mirado ningún dato.";
    } else if (k === "fit") {
      if (!st.model) return fail("NameError: name 'model' is not defined (falta el paso 2).");
      if (!st.data) return fail("No hay X_train ni y_train (falta el paso 1).");
      if (!st.compiled) return fail("ValueError: You must call `compile()` before using the model.");
      var before = mse(st.data), steps = 0;
      for (var e = 0; e < 5; e++) steps += trainEpoch(st.data, 0.04, 8);
      st.epochs += 5;
      st.msg = "fit: 5 épocas × 5 lotes de 8 = <b>" + steps + " actualizaciones</b>. loss (MSE) " + api.fmt(before, 3) + " → <b>" + api.fmt(mse(st.data), 3) + "</b>" + (st.epochs > 5 ? " · ¡Ojo! sigue desde los pesos que ya tenía (" + st.epochs + " épocas en total)." : ".");
    } else if (k === "evaluate") {
      if (!st.model) return fail("NameError: name 'model' is not defined (falta el paso 2).");
      if (!st.compiled) return fail("ValueError: You must call `compile()` before using the model.");
      if (!st.data) return fail("No hay datos de test (falta el paso 1).");
      st.msg = "evaluate con 10 películas que no vio: test MSE = <b>" + api.fmt(mse(st.test), 3) + "</b>" + (st.epochs ? "." : " (sin entrenar: valor malo).");
    } else if (k === "predict") {
      if (!st.model) return fail("NameError: name 'model' is not defined (falta el paso 2).");
      n = fwd([0.9, 2]).y;
      st.msg = "predict([[0.9, 2.0]]): le gusta mucho el género, película de 2 h → <b>" + api.fmt(n, 2) + " h</b> (regla real: " + api.fmt(truth(0.9, 2), 2) + " h)" + (st.epochs ? "." : ". Sin fit, la respuesta es aleatoria.");
    }
    st.last = i; st.changed = (k === "seq") ? "creados" : countChanged();
    update();
  }
  function fail(m) { st.err = true; st.msg = m; st.changed = 0; update(); }

  var view = api.view(root, { aspect: 2.1, minH: 300, maxH: 340, label: "Los cinco pasos de Keras y la red 2-4-1 con sus pesos" });
  var ui = api.controls(root), out = api.readout(root);
  STEPS.forEach(function (s, i) { ui.button(s.lab, function () { act(i); }, i === 3 ? "primary" : null); });
  ui.button("Empezar de cero", function () { fresh(); update(); });

  function draw(ctx, w, h, C) {
    var D = api.d, narrow = w < 560, i, j;
    // columna de pasos (código)
    var cx = 10, cw = narrow ? w - 20 : Math.min(330, w * 0.5), rh = narrow ? 19 : 26, y0 = 10;
    for (i = 0; i < STEPS.length; i++) {
      var y = y0 + i * rh, on = i === st.last, done = (i === 0 && st.data) || (i === 1 && st.model) || (i === 2 && st.compiled) || (i === 3 && st.epochs > 0);
      D.rect(ctx, cx, y, cw, rh - 3, on ? (st.err ? C.terracotaWash : C.cobaltoWash) : C.surface, on ? (st.err ? C.terracota : C.cobalto) : C.line, on ? 2 : 1);
      D.text(ctx, STEPS[i].code, cx + 8, y + rh / 2 + 2, { size: narrow ? 10 : 11.5, mono: true, color: C.ink, weight: on ? 600 : 400 });
      if (done) D.text(ctx, "✓", cx + cw - 10, y + rh / 2 + 3, { align: "right", size: 12, weight: 700, color: C.olivaInk });
    }
    // red
    var nx0 = narrow ? 20 : cw + 40, nx1 = w - 20, ny0 = narrow ? y0 + rh * 6 + 16 : 20, ny1 = h - 44;
    var xs = [nx0 + (narrow ? 62 : 20), (nx0 + nx1) / 2 + (narrow ? 20 : 0), nx1 - 30];
    var py = function (k, n) { return ny0 + (ny1 - ny0) * (k + 0.5) / n; };
    var names = ["gusto", "duración"];
    if (!net) {
      D.text(ctx, st.data ? "Sin red todavía: pulsa 2 · Sequential" : "Sin datos ni red todavía", (nx0 + nx1) / 2, (ny0 + ny1) / 2, { align: "center", size: 12, color: C.muted });
    } else {
      var cur = flat(net), maxw = 0.01;
      cur.forEach(function (v) { maxw = Math.max(maxw, Math.abs(v)); });
      for (i = 0; i < 2; i++) for (j = 0; j < H; j++) {
        var v = net.W1[i][j];
        D.line(ctx, xs[0], py(i, 2), xs[1], py(j, H), v >= 0 ? C.cobalto : C.terracota, 0.6 + 4 * Math.abs(v) / maxw);
      }
      for (j = 0; j < H; j++) { var v2 = net.W2[j]; D.line(ctx, xs[1], py(j, H), xs[2], py(0, 1), v2 >= 0 ? C.cobalto : C.terracota, 0.6 + 4 * Math.abs(v2) / maxw); }
      for (i = 0; i < 2; i++) { D.circle(ctx, xs[0], py(i, 2), 11, C.surface, C.ink, 1.5); D.text(ctx, names[i], xs[0] - 14, py(i, 2) + 4, { align: "right", size: 10.5, color: C.ink2 }); }
      for (j = 0; j < H; j++) D.circle(ctx, xs[1], py(j, H), 10, C.surface, C.ink, 1.5);
      D.circle(ctx, xs[2], py(0, 1), 12, C.surface, C.ink, 1.5);
      D.text(ctx, "horas", xs[2] + 16, py(0, 1) + 4, { size: 10.5, color: C.ink2 });
    }
    // franja: ¿han cambiado los pesos?
    var by = h - 30, txt, col;
    if (st.last < 0) { txt = "¿Cambian los pesos? Pulsa un paso y lo verás aquí."; col = C.muted; }
    else if (st.changed === "creados") { txt = "Pesos CREADOS al azar (17 parámetros)"; col = C.cobaltoInk; }
    else if (st.changed > 0) { txt = "Pesos CAMBIADOS: " + st.changed + " de 17 → esto es aprender"; col = C.olivaInk; }
    else { txt = "Pesos cambiados: 0 de 17"; col = C.ink2; }
    D.rect(ctx, 10, by, w - 20, 24, C.surface, C.line, 1);
    D.text(ctx, txt, w / 2, by + 16, { align: "center", size: 12, weight: 600, color: col });
  }
  function update() { view.redraw(); out.set((st.err ? "<b>Error.</b> " : "") + st.msg); }
  fresh(); view.draw(draw); update();
  return {};
});
