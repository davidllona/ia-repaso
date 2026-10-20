/* Experimento: NumPy ↔ PyTorch y la memoria compartida. Cada objeto es una «etiqueta» que apunta a un bloque de memoria.
   torch.from_numpy y .numpy() apuntan al MISMO bloque; torch.tensor y astype copian. Se modifica un lado y se ve el otro. */
Lab.register("curso4/c4m1-numpy", function (root, api) {
  var D = api.d;
  var MODES = {
    from: { title: "t = torch.from_numpy(arr)", share: true, dt: "float64" },
    tens: { title: "t = torch.tensor(arr)", share: false, dt: "float64" },
    num:  { title: "t = torch.tensor([...]);  arr = t.numpy()", share: true, dt: "float32" },
    cast: { title: "t = torch.from_numpy(arr.astype(np.float32))", share: false, dt: "float32" }
  };
  var st = { mode: "from", mem1: [1, 2, 3, 4], mem2: null, log: "" };
  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 340, label: "Dos objetos apuntando a un bloque de memoria compartido o a dos bloques separados" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Cómo se crea el tensor", value: "from", options: [["from", "torch.from_numpy(arr)"], ["tens", "torch.tensor(arr)"], ["num", "t.numpy()  (de tensor a array)"], ["cast", "from_numpy(arr.astype(float32))"]], onChange: function (v) { st.mode = v; reset(); } });
  ui.button("arr[1] = 99", function () { poke("arr", 1, 99); }, "primary");
  ui.button("t[2] = -5", function () { poke("t", 2, -5); }, "warm");
  ui.button("arr[3] += 10", function () { poke("arr", 3, null); });
  function reset() { st.mem1 = [1, 2, 3, 4]; st.mem2 = MODES[st.mode].share ? null : [1, 2, 3, 4]; st.log = ""; update(); }
  /* arr siempre ve mem1; t ve mem1 si comparten, mem2 si no */
  function memOf(who) { return who === "arr" ? st.mem1 : (st.mem2 || st.mem1); }
  function poke(who, idx, v) {
    var m = memOf(who); m[idx] = v === null ? m[idx] + 10 : v;
    st.log = "Cambiaste " + (who === "arr" ? "arr" : "t") + "[" + idx + "] → " + (MODES[st.mode].share ? "el otro lado <b>también cambió</b>: es la misma memoria." : "el otro lado <b>no cambió</b>: son dos bloques separados (una copia).");
    update();
  }
  function draw(ctx, w, h, C) {
    var M = MODES[st.mode], narrow = w < 480, bx = narrow ? 46 : 64, cw = Math.min(46, (w - bx - 40) / 4 - 4);
    var shared = M.share, tY = 52, aY = 52;
    function mem(x, y, arr, col, title) {
      D.text(ctx, title, x + 2 * cw + 4, y - 6, { align: "center", size: 10.5, color: C.muted });
      for (var q = 0; q < 4; q++) {
        D.rect(ctx, x + q * (cw + 2), y, cw, 32, col, C.ink, 1.2);
        D.text(ctx, arr[q].toFixed(1), x + q * (cw + 2) + cw / 2, y + 20, { align: "center", size: 12, mono: true, weight: 700 });
      }
    }
    function tag(x, y, label, sub, col, dt) {
      D.rect(ctx, x, y, bx + 54, 44, col, C.ink, 1.4);
      D.text(ctx, label, x + (bx + 54) / 2, y + 18, { align: "center", size: 12.5, mono: true, weight: 700 });
      D.text(ctx, sub, x + (bx + 54) / 2, y + 34, { align: "center", size: 9.5, mono: true, color: C.muted });
    }
    var lx = 10, mx = w - 12 - 4 * (cw + 2);
    var aDt = st.mode === "num" ? "float32" : st.mode === "cast" ? "float64" : "float64";
    var tDt = M.dt;
    /* arr */
    tag(lx, 34, "arr", "np." + aDt, C.cobaltoWash);
    tag(lx, 34 + 96, "t", "torch." + tDt, C.terracotaWash);
    if (shared) {
      mem(mx, 80, st.mem1, C.olivaWash, "notas de 4 películas (un solo bloque)");
      D.arrow(ctx, lx + bx + 54, 56, mx - 4, 90, C.cobaltoInk, 1.8);
      D.arrow(ctx, lx + bx + 54, 152, mx - 4, 108, C.terracotaInk, 1.8);
      D.text(ctx, "misma lista → lo que cambies en uno lo ve el otro", w / 2, h - 10, { align: "center", size: 11, color: C.olivaInk, weight: 600 });
    } else {
      mem(mx, 36, st.mem1, C.cobaltoWash, "notas de arr");
      mem(mx, 142, st.mem2, C.terracotaWash, "notas de t (copia)");
      D.arrow(ctx, lx + bx + 54, 56, mx - 4, 54, C.cobaltoInk, 1.8);
      D.arrow(ctx, lx + bx + 54, 152, mx - 4, 160, C.terracotaInk, 1.8);
      D.text(ctx, "dos listas → cada una cambia por su cuenta", w / 2, h - 10, { align: "center", size: 11, color: C.terracotaInk, weight: 600 });
    }
  }
  view.draw(draw);
  function update() {
    var M = MODES[st.mode], a = st.mem1, t = memOf("t");
    var aDt = st.mode === "num" ? "float32" : "float64";
    out.set("<b>" + M.title + "</b><br>arr = [" + a.map(function (v) { return v.toFixed(1); }).join(", ") + "] (" + aDt + ") · t = [" + t.map(function (v) { return v.toFixed(1); }).join(", ") + "] (" + M.dt + ")" +
      "<br>¿Misma memoria? <b>" + (M.share ? "sí" : "no") + "</b>" + (M.dt === "float64" ? " · ojo: NumPy usa float64 por defecto, y el tensor hereda float64 (los modelos esperan float32)." : "") +
      (st.log ? "<br>" + st.log : "<br>Pulsa un botón para modificar un lado."));
    view.redraw();
  }
  reset();
});
