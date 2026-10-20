/* Experimento: etiquetas enteras u One-Hot, y qué loss hay que usar con cada formato. */
Lab.register("curso2/c2m2-onehot-sparse", function (root, api) {
  var M = api.math, st = { C: 4, fmt: "int", loss: "sparse", seed: 3, real: "mnist" };
  var N = 6, logits, ys;
  var REAL = { mnist: ["MNIST (60 000 imágenes, 10 clases)", 60000, 10], cifar: ["CIFAR-100 (50 000 imágenes, 100 clases)", 50000, 100],
    imagenet: ["ImageNet-1k (1 281 167 imágenes, 1000 clases)", 1281167, 1000], vocab: ["Modelo de lenguaje (1 000 000 de ejemplos, 50 000 palabras)", 1000000, 50000] };

  var tbl = api.table(root, ["n.º", "p (softmax)", "y", "−ln p[y]"]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Número de clases C", min: 3, max: 6, step: 1, value: st.C, onInput: function (v) { st.C = v; gen(); update(); } });
  ui.segmented({ label: "Formato de las etiquetas y", value: st.fmt, options: [["int", "enteros: 2, 0, 1…"], ["oh", "One-Hot: [0,0,1,0]"]], onChange: function (v) { st.fmt = v; update(); } });
  ui.select({ label: "loss en compile()", value: st.loss, options: [["sparse", "sparse_categorical_crossentropy"], ["cat", "categorical_crossentropy"]], onChange: function (v) { st.loss = v; update(); } });
  ui.select({ label: "Escala real (para el cálculo de memoria)", value: st.real, options: Object.keys(REAL).map(function (k) { return [k, REAL[k][0]]; }), onChange: function (v) { st.real = v; update(); } });
  ui.button("Otras muestras", function () { st.seed += 5; gen(); update(); }, "warm");

  function gen() {
    var r = api.rng(10 + st.seed), i, j; logits = []; ys = [];
    for (i = 0; i < N; i++) {
      var z = []; for (j = 0; j < st.C; j++) z.push(r.normal(0, 1.4));
      var t = r.int(0, st.C - 1); z[t] += r.range(0.4, 2.2);
      logits.push(z); ys.push(t);
    }
  }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function bytes(b) {
    if (b < 1024) return b + " B"; if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB"; return (b / 1073741824).toFixed(2) + " GB";
  }
  function update() {
    var rows = [], tot = 0, i, j;
    for (i = 0; i < N; i++) {
      var p = M.softmax(logits[i]), l = -Math.log(p[ys[i]]); tot += l;
      var yv = st.fmt === "int" ? String(ys[i]) : "[" + p.map(function (_, k) { return k === ys[i] ? 1 : 0; }).join(", ") + "]";
      rows.push([i + 1, "[" + p.map(function (v) { return v.toFixed(2); }).join(", ") + "]", "<b>" + yv + "</b>", l.toFixed(3)]);
    }
    tbl.set(rows);
    tbl.el.firstChild.style.fontSize = root.clientWidth < 520 ? ".72rem" : "";
    var shape = st.fmt === "int" ? "(" + N + ",)" : "(" + N + ", " + st.C + ")";
    var ok = (st.fmt === "int" && st.loss === "sparse") || (st.fmt === "oh" && st.loss === "cat");
    var lossName = st.loss === "sparse" ? "sparse_categorical_crossentropy" : "categorical_crossentropy";
    var msg;
    if (ok) msg = "<span class='good'>✔ model.fit funciona.</span> loss media del lote = (" + rows.map(function (r) { return r[3]; }).join(" + ") + ") / " + N + " = <b>" + (tot / N).toFixed(3) + "</b>";
    else if (st.fmt === "int") msg = "<span class='bad'>✘ ValueError: Arguments `target` and `output` must have the same rank (ndim). Received: target.shape=(None,), output.shape=(None, " + st.C + ")</span><br>categorical_crossentropy espera un vector One-Hot por muestra y ha recibido un único número.";
    else msg = "<span class='bad'>✘ ValueError: Argument `output` must have rank (ndim) `target.ndim - 1`. Received: target.shape=(None, " + st.C + "), output.shape=(None, " + st.C + ")</span><br>sparse_categorical_crossentropy espera un número por muestra y ha recibido un vector entero.";
    var R = REAL[st.real], nOh = R[1] * R[2], bOh = nOh * 4, bInt = R[1] * 4;
    var conv = st.fmt === "oh" ? "y = keras.utils.to_categorical(y_enteros, num_classes=" + st.C + ")" : "y = y_enteros   # tal cual, sin convertir";
    out.set("y.shape = <b>" + shape + "</b> · compile(loss=\"" + lossName.replace(/_/g, "_<wbr>") + "\")<br><span style='opacity:.85'>" + conv + "</span><br>" + msg +
      "<br><br>Memoria de las etiquetas en " + R[0].split(" (")[0] + ": enteros <b>" + fmtN(R[1]) + "</b> valores ≈ " + bytes(bInt) + " · One-Hot <b>" + fmtN(nOh) + "</b> valores ≈ " + bytes(bOh) + " (" + fmtN(R[2]) + " veces más)");
  }
  gen(); update();
});
