/* Experimento: construye una red con Sequential y mira lo que mostraría model.summary(). */
Lab.register("curso2/c2m2-constructor-red", function (root, api) {
  var st = { task: "multi", nin: 64, nh: 1, u: [64, 16, 8], k: 10, act: "relu", bias: true };
  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 330, label: "Diagrama de la red: capa de entrada, capas ocultas y capa de salida con sus neuronas" });
  var tbl = api.table(root, ["Capa (tipo)", "Output shape", "Param #"]);
  var ui = api.controls(root), out = api.readout(root);
  var sl = [];

  ui.select({ label: "Tarea (decide la capa final)", value: st.task, options: [["reg", "Regresión (minutos): 1 salida"], ["bin", "Binaria (¿la termina?): sigmoide"], ["multi", "Multiclase (género): softmax"]], onChange: function (v) { st.task = v; update(); } });
  var slIn = ui.slider({ label: "Entradas (rasgos de cada película)", min: 1, max: 64, step: 1, value: st.nin, onInput: function (v) { st.nin = v; update(); } });
  var slK = ui.slider({ label: "Clases (solo multiclase)", min: 3, max: 10, step: 1, value: st.k, onInput: function (v) { st.k = v; update(); } });
  ui.segmented({ label: "Capas ocultas", value: 1, options: [[0, "0"], [1, "1"], [2, "2"], [3, "3"]], onChange: function (v) { st.nh = v; update(); } });
  for (var i = 0; i < 3; i++) (function (i) {
    sl[i] = ui.slider({ label: "Neuronas de la capa oculta " + (i + 1), min: 1, max: 64, step: 1, value: st.u[i], onInput: function (v) { st.u[i] = v; update(); } });
  })(i);
  ui.select({ label: "Activación de las ocultas", value: st.act, options: [["relu", "relu"], ["tanh", "tanh"], ["sigmoid", "sigmoid"], ["linear", "ninguna (lineal)"]], onChange: function (v) { st.act = v; update(); } });
  ui.toggle({ label: "use_bias = True", value: true, onChange: function (v) { st.bias = v; update(); } });
  ui.button("Plantilla: dígitos (64 → 64 → 10)", function () { st.task = "multi"; st.nin = 64; st.nh = 1; st.u[0] = 64; st.k = 10; sync(); }, "primary");
  ui.button("Plantilla: minutos vistos (2 → 16 → 8 → 1)", function () { st.task = "reg"; st.nin = 2; st.nh = 2; st.u[0] = 16; st.u[1] = 8; sync(); });
  ui.button("Plantilla: película → género (4 → 8 → 8 → 3)", function () { st.task = "multi"; st.nin = 4; st.nh = 2; st.u[0] = 8; st.u[1] = 8; st.k = 3; sync(); });

  function sync() {
    var selects = ui.el.querySelectorAll("select"), segs = ui.el.querySelectorAll(".seg button");
    selects[0].value = st.task; slIn.set(st.nin, true); slK.set(st.k, true);
    segs.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === st.nh)); });
    for (var i = 0; i < 3; i++) sl[i].set(st.u[i], true);
    update();
  }
  function layers() {
    var L = [], prev = st.nin, i, nOut = st.task === "multi" ? st.k : 1;
    for (i = 0; i < st.nh; i++) { L.push({ n: st.u[i], act: st.act === "linear" ? "" : st.act, nin: prev }); prev = st.u[i]; }
    L.push({ n: nOut, act: st.task === "reg" ? "" : st.task === "bin" ? "sigmoid" : "softmax", nin: prev, out: true });
    return L;
  }
  function bytes(p) {
    var b = 4 * p;
    if (b < 1024) return b.toFixed(2) + " B";
    if (b < 1048576) return (b / 1024).toFixed(2) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }
  function counts() { var L = layers(), tot = 0; L.forEach(function (l) { l.p = l.nin * l.n + (st.bias ? l.n : 0); tot += l.p; }); return { L: L, tot: tot }; }

  function draw(ctx, w, h, C) {
    var D = api.d, info = counts(), L = info.L, cols = [{ n: st.nin, kind: "in" }].concat(L.map(function (l) { return { n: l.n, kind: l.out ? "out" : "hid", act: l.act }; }));
    var nc = cols.length, left = 30, right = w - 30, top = 34, bot = h - 46, MAXD = 7, xs = [], ys = [], c, i, j;
    for (c = 0; c < nc; c++) {
      xs.push(nc === 1 ? w / 2 : left + (right - left) * c / (nc - 1));
      var dn = Math.min(cols[c].n, MAXD), arr = [];
      for (i = 0; i < dn; i++) arr.push(dn === 1 ? (top + bot) / 2 : top + (bot - top) * (0.5 + i) / dn);
      ys.push(arr);
    }
    for (c = 0; c < nc - 1; c++) for (i = 0; i < ys[c].length; i++) for (j = 0; j < ys[c + 1].length; j++)
      D.line(ctx, xs[c], ys[c][i], xs[c + 1], ys[c + 1][j], C.line, 1);
    var r = Math.max(5, Math.min(9, (bot - top) / (2 * MAXD) - 2));
    for (c = 0; c < nc; c++) {
      var col = cols[c], fill = col.kind === "in" ? C.muted : col.kind === "hid" ? C.cobalto : C.oliva;
      for (i = 0; i < ys[c].length; i++) D.circle(ctx, xs[c], ys[c][i], r, fill, C.paper, 1.5);
      if (col.n > MAXD) D.text(ctx, "⋮ " + col.n, xs[c], bot + 12, { align: "center", size: 11, color: C.ink2, weight: 600 });
      else D.text(ctx, String(col.n), xs[c], bot + 12, { align: "center", size: 11, color: C.ink2, weight: 600 });
      var title = col.kind === "in" ? "Input" : "Dense", sub = col.kind === "in" ? "(None, " + col.n + ")" : (col.act || "sin activ.");
      D.text(ctx, title, xs[c], 16, { align: "center", size: 12, weight: 600, color: C.ink });
      D.text(ctx, sub, xs[c], 29, { align: "center", size: 10.5, color: C.muted, mono: true });
    }
    D.text(ctx, "neuronas por capa (se dibujan como mucho " + MAXD + ")", w / 2, h - 8, { align: "center", size: 10.5, color: C.muted });
  }
  function update() {
    var info = counts(), L = info.L, rows = [], i;
    for (i = 0; i < sl.length; i++) {
      sl[i].input.disabled = i >= st.nh; sl[i].input.parentNode.style.opacity = i >= st.nh ? 0.4 : 1;
    }
    slK.input.disabled = st.task !== "multi"; slK.input.parentNode.style.opacity = st.task !== "multi" ? 0.4 : 1;
    L.forEach(function (l, k) {
      var name = (l.out ? "salida" : "oculta" + (k + 1)) + " (Dense)";
      var formula = st.bias ? l.nin + " × " + l.n + " + " + l.n + " = " + l.p : l.nin + " × " + l.n + " = " + l.p;
      rows.push([name, "(None, " + l.n + ")", "<b>" + l.p + "</b><br><span style='opacity:.75;font-size:.85em'>" + formula + "</span>"]);
    });
    tbl.set(rows);
    view.redraw();
    var code = "Sequential([Input(shape=(" + st.nin + ",))" + L.map(function (l) { return ", Dense(" + l.n + (l.act ? ", activation='" + l.act + "'" : "") + (st.bias ? "" : ", use_bias=False") + ")"; }).join("") + "])";
    var loss = st.task === "reg" ? "mse" : st.task === "bin" ? "binary_crossentropy" : "categorical_crossentropy (o sparse_...)";
    out.set("Total params: <b>" + info.tot + "</b> (" + bytes(info.tot) + ") · Trainable params: <b>" + info.tot + "</b> · Non-trainable: <b>0</b><br>" +
      "<span style='opacity:.85'>" + code + "</span><br>loss que le toca: <b>" + loss + "</b>" +
      (st.nh === 0 ? "<br><span class='bad'>Sin capas ocultas la red es solo un modelo lineal (o logístico): no aprende curvas.</span>" : ""));
  }
  view.draw(draw); update();
});
