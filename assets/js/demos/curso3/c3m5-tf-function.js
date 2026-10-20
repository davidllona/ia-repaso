/* Experimento: la caché de trazados de @tf.function.
   Regla (TensorFlow 2.x): para cada argumento Tensor, la clave es (dtype, forma); para un número de Python, el VALOR.
   Si la clave ya está en la caché se reutiliza el grafo; si no, Python vuelve a ejecutar el cuerpo («trazar»).
   Con reduce_retracing=True, al ver otra forma del mismo dtype y rango se traza una versión generalizada (None). */
Lab.register("curso3/c3m5-tf-function", function (root, api) {
  var D = api.d;
  var S = { cache: [], calls: [], traces: 0, reduce: false, msg: "Todavía no has llamado a la función. Pulsa un botón de llamada.", gen: {} };

  var CALLS = [
    { id: "t0", label: "f(tf.constant(3.0))", kind: "tensor", dtype: "float32", shape: [] },
    { id: "t1", label: "f(tf.constant(4.0))", kind: "tensor", dtype: "float32", shape: [] },
    { id: "v2", label: "f(tf.constant([1., 2.]))", kind: "tensor", dtype: "float32", shape: [2] },
    { id: "v3", label: "f(tf.constant([1., 2., 3.]))", kind: "tensor", dtype: "float32", shape: [3] },
    { id: "v4", label: "f(tf.constant([1., 2., 3., 4.]))", kind: "tensor", dtype: "float32", shape: [4] },
    { id: "i0", label: "f(tf.constant(5))  (int32)", kind: "tensor", dtype: "int32", shape: [] },
    { id: "p3", label: "f(3)  (int de Python)", kind: "py", value: 3 },
    { id: "p4", label: "f(4)  (int de Python)", kind: "py", value: 4 }
  ];
  function shapeStr(sh) { return "(" + sh.map(function (d) { return d === null ? "None" : d; }).join(", ") + (sh.length === 1 ? "," : "") + ")"; }
  function sigOf(c) { return c.kind === "py" ? "Python int = " + c.value : c.dtype + " " + shapeStr(c.shape); }

  function call(c) {
    var sig = sigOf(c), hit = null, relaxedSig = null, i, e;
    for (i = 0; i < S.cache.length; i++) {
      e = S.cache[i];
      if (e.sig === sig) { hit = e; break; }
      if (S.reduce && c.kind === "tensor" && e.relaxed && e.dtype === c.dtype && e.rank === c.shape.length) { hit = e; break; }
    }
    var rec = { sig: sig, trace: false };
    if (hit) {
      hit.uses++; S.msg = "<b>Caché: acierto.</b> La firma <code>" + sig + "</code> ya estaba" + (hit.sig !== sig ? " (cubierta por la versión generalizada <code>" + hit.sig + "</code>)" : "") + ". Se ejecuta el grafo guardado y <b>Python no ejecuta el cuerpo</b>: el <code>print</code> de dentro no sale.";
    } else {
      var nsig = sig, relaxed = false;
      if (S.reduce && c.kind === "tensor") {
        var same = S.cache.filter(function (q) { return q.dtype === c.dtype && q.rank === c.shape.length && !q.relaxed && c.shape.length > 0; });
        if (same.length) { nsig = c.dtype + " " + shapeStr(c.shape.map(function () { return null; })); relaxed = true; }
      }
      S.traces++; rec.trace = true;
      S.cache.push({ sig: nsig, uses: 1, id: S.traces, dtype: c.dtype, rank: c.shape ? c.shape.length : 0, relaxed: relaxed });
      S.msg = "<b>Trazado nº " + S.traces + ".</b> Firma nueva <code>" + sig + "</code>: Python ejecuta el cuerpo (aquí sale el <code>print</code>), TensorFlow graba el grafo y lo guarda en la caché" + (relaxed ? " con la forma generalizada <code>" + nsig + "</code>, que valdrá para cualquier longitud." : ".");
    }
    S.calls.push(rec); if (S.calls.length > 16) S.calls.shift();
    S.total = (S.total || 0) + 1;
    update();
  }
  function loopPy() { for (var i = 0; i < 5; i++) call({ kind: "py", value: i }); S.msg = "<b>Bucle <code>for i in range(5): f(i)</code> con enteros de Python:</b> cada valor es una firma distinta, así que se traza 5 veces (si ya había alguno, menos). Es el fallo de rendimiento más común."; update(); }
  function loopTensor() { for (var i = 0; i < 5; i++) call({ kind: "tensor", dtype: "int32", shape: [] }); S.msg = "<b>Bucle <code>for i in range(5): f(tf.constant(i))</code>:</b> las 5 llamadas comparten firma (<code>int32 ()</code>): un único trazado y cuatro aciertos."; update(); }

  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 330, label: "Historial de llamadas y caché de trazados" });
  var ui = api.controls(root), out = api.readout(root);
  CALLS.forEach(function (c) { ui.button(c.label, function () { call(c); }); });
  ui.button("for i in range(5): f(i)", loopPy, "warm");
  ui.button("for i in range(5): f(tf.constant(i))", loopTensor, "warm");
  ui.toggle({ label: "reduce_retracing=True", value: false, onChange: function (v) { S.reduce = v; reset(); } });
  ui.button("Vaciar caché", function () { reset(); });
  function reset() { S.cache = []; S.calls = []; S.traces = 0; S.total = 0; S.msg = "Caché vacía. Pulsa un botón de llamada."; update(); }

  function draw(ctx, w, h, C) {
    var narrow = w < 480, pad = 12, i, e;
    D.text(ctx, (narrow ? "Llamadas: verde = reutiliza · naranja = traza" : "Últimas llamadas (verde = reutiliza el grafo · naranja = traza de nuevo)"), pad, 18, { size: narrow ? 10.5 : 12, weight: 600, color: C.ink2 });
    var n = 16, gap = 3, bw = Math.min(40, (w - 2 * pad - gap * (n - 1)) / n);
    for (i = 0; i < S.calls.length; i++) {
      var c = S.calls[i], x = pad + i * (bw + gap);
      D.rect(ctx, x, 28, bw, 26, c.trace ? C.terracota : C.olivaWash, c.trace ? C.terracotaInk : C.oliva, 1.5);
      D.text(ctx, c.trace ? "T" : "ok", x + bw / 2, 45, { align: "center", size: 11, weight: 700, color: c.trace ? C.paper : C.olivaInk, mono: true });
    }
    D.text(ctx, "Caché de trazados (una fila por grafo guardado)", pad, 82, { size: narrow ? 10.5 : 12, weight: 600, color: C.ink2 });
    if (!S.cache.length) D.text(ctx, "vacía", pad, 106, { size: 12, color: C.muted });
    var rowH = 24, y0 = 90, maxRows = Math.floor((h - y0 - 6) / (rowH + 4));
    for (i = 0; i < Math.min(S.cache.length, maxRows); i++) {
      e = S.cache[i];
      var y = y0 + i * (rowH + 4);
      D.rect(ctx, pad, y, w - 2 * pad, rowH, e.relaxed ? C.markerWash : C.cobaltoWash, e.relaxed ? C.marker : C.cobalto, 1.5);
      D.text(ctx, "grafo " + e.id + ": " + e.sig, pad + 8, y + 16, { size: narrow ? 10.5 : 12, mono: true, color: C.ink, weight: 600 });
      D.text(ctx, e.uses + (e.uses === 1 ? " uso" : " usos"), w - pad - 8, y + 16, { align: "right", size: narrow ? 10.5 : 12, mono: true, color: C.ink2 });
    }
    if (S.cache.length > maxRows) D.text(ctx, "… y " + (S.cache.length - maxRows) + " más", pad, h - 6, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  view.draw(draw);

  function update() {
    var total = S.total || 0;
    out.set(S.msg + "<br>Llamadas: <b>" + total + "</b> · trazados: <b class='" + (S.traces > 3 ? "bad" : "good") + "'>" + S.traces + "</b> · veces que Python ejecutó el cuerpo: <b>" + S.traces + "</b>" +
      (S.cache.length > 6 ? "<br><span class='bad'>Demasiados trazados: cada uno cuesta decenas o cientos de ms y llena memoria. TensorFlow avisa («triggered tf.function retracing»).</span>" : ""));
    view.redraw();
  }
  update();
});
