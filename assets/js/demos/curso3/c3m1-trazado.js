/* Experimento: tf.function y el trazado (tracing). Cada llamada con una «firma» nueva (dtype + forma de los tensores,
   o valor de los argumentos de Python) obliga a trazar de nuevo la función y guardar un grafo nuevo en la caché.
   Las reglas replican lo observado con TensorFlow 2.21 (reduce_retracing desactivado). */
Lab.register("curso3/c3m1-trazado", function (root, api) {
  var D = api.d;
  var cache = [], log = [], st = { calls: 0, traces: 0, sig: false, last: -1 };
  var CALLS = [
    ["f(tf.constant(1.0))", "tensor", "float32", []],
    ["f(tf.constant(5.0))", "tensor", "float32", []],
    ["f(tf.constant([1., 2.]))", "tensor", "float32", [2]],
    ["f(tf.constant([1., 2., 3.]))", "tensor", "float32", [3]],
    ["f(tf.ones((2, 2)))", "tensor", "float32", [2, 2]],
    ["f(tf.constant(1))  # int32", "tensor", "int32", []],
    ["f(3)  # entero de Python", "py", "int", 3],
    ["f(4)  # entero de Python", "py", "int", 4]
  ];
  var view = api.view(root, { aspect: 3.0, minH: 150, maxH: 230, label: "Caché de grafos de la función: una caja por cada firma trazada" });
  var ui = api.controls(root), out = api.readout(root);
  var logOut = api.readout(root);
  ui.segmented({ label: "Cómo está decorada la función", value: "libre", options: [["libre", "@tf.function"], ["sig", "con input_signature (float32, cualquier forma)"]], onChange: function (v) { st.sig = v === "sig"; reset(); } });
  CALLS.forEach(function (c, i) { ui.button(c[0], function () { call(i); }, i === 0 ? "primary" : null); });
  ui.button("Vaciar la caché", function () { reset(); }, "warm");

  function key(c) {
    if (c[1] === "py") return "Python " + c[3];
    return "Tensor " + c[2] + " " + (c[3].length === 1 ? "(" + c[3][0] + ",)" : "(" + c[3].join(", ") + ")");
  }
  function call(i) {
    var c = CALLS[i], res, traced = false, err = null, k;
    st.calls++;
    if (st.sig) {
      if (c[1] === "tensor" && c[2] !== "float32") err = "TypeError: un tensor " + c[2] + " no encaja en la firma float32";
      else {
        k = "Firma TensorSpec(None, float32)";
        if (cache.indexOf(k) < 0) { cache.push(k); traced = true; }
      }
    } else {
      k = key(c);
      if (cache.indexOf(k) < 0) { cache.push(k); traced = true; }
    }
    if (err) { log.push([st.calls, c[0], "<span class='bad'>" + err + "</span>", "no"]); st.last = -1; }
    else {
      if (traced) st.traces++;
      st.last = cache.indexOf(k);
      log.push([st.calls, c[0], traced ? "<span class='bad'>TRAZA nueva</span> (grafo " + cache.length + ") · <code>print</code> de Python: sí" : "<span class='good'>reutiliza</span> el grafo " + (st.last + 1) + " · <code>print</code> de Python: no", traced ? "se ejecuta" : "no"]);
    }
    update();
  }
  function reset() { cache = []; log = []; st.calls = 0; st.traces = 0; st.last = -1; update(); }

  function draw(ctx, w, h, C) {
    var n = Math.max(cache.length, 1), pad = 10, g = 8, bw = Math.min(150, (w - 2 * pad - g * (Math.min(n, 4) - 1)) / Math.min(n, 4)), per = Math.min(n, 4);
    D.text(ctx, "caché de f (un grafo por firma)", pad, 16, { size: 12, weight: 700, color: C.ink2 });
    if (!cache.length) { D.text(ctx, "vacía: la primera llamada siempre traza", w / 2, h / 2 + 6, { align: "center", size: 13, color: C.muted }); return; }
    cache.forEach(function (k, i) {
      var col = i % 4, row = Math.floor(i / 4), x = pad + col * (bw + g), y = 28 + row * 58, hot = i === st.last;
      D.rect(ctx, x, y, bw, 50, hot ? C.olivaWash : C.cobaltoWash, hot ? C.oliva : C.ink, hot ? 3 : 1.4);
      D.text(ctx, "grafo " + (i + 1), x + 6, y + 15, { size: 11, weight: 700, color: C.ink, mono: true });
      var words = k.split(" "), line1 = words[0] + " " + (words[1] || ""), line2 = words.slice(2).join(" ");
      D.text(ctx, line1.length * 6 > bw - 8 ? words[0] : line1, x + 6, y + 30, { size: bw < 110 ? 9.5 : 10.5, mono: true, color: C.ink2 });
      D.text(ctx, line2 || (line1.length * 6 > bw - 8 ? words.slice(1).join(" ") : ""), x + 6, y + 43, { size: bw < 110 ? 9.5 : 10.5, mono: true, color: C.ink2 });
    });
  }
  function update() {
    logOut.set(log.length ? log.slice(-6).map(function (r) { return "<b>" + r[0] + ".</b> <code>" + r[1] + "</code><br>&nbsp;&nbsp;→ " + r[2]; }).join("<br>") : "Pulsa una de las llamadas de arriba y mira la caché.");
    var py = log.filter(function (r) { return r[3] === "se ejecuta"; }).length;
    out.set("Llamadas: <b>" + st.calls + "</b> · trazados (get_tracing_count): <b>" + st.traces + "</b> · grafos en la caché: <b>" + cache.length + "</b><br>" +
      "El <code>print</code> de Python corrió <b>" + py + "</b> veces (solo al trazar); <code>tf.print</code> corre en <b>cada</b> llamada." +
      (!st.sig && st.traces >= 5 ? "<br><span class='bad'>Muchos trazados: eso es «retracing». Cada uno cuesta mucho más que ejecutar el grafo.</span>" : ""));
    view.redraw();
  }
  view.draw(draw); update();
});
