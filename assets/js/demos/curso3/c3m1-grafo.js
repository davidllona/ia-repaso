/* Experimento: construye un grafo de la API funcional (con atajo Add/Concatenate y una rama paralela)
   y calcula las formas y los parámetros que mostraría model.summary(). Add exige formas iguales; Concatenate suma los anchos. */
Lab.register("curso3/c3m1-grafo", function (root, api) {
  var D = api.d, M = api.math;
  var st = { nin: 8, a: 16, b: 16, r: 8, k: 3, skip: "add", branch: false };
  var view = api.view(root, { aspect: 2.1, minH: 240, maxH: 330, label: "Grafo de capas de un modelo funcional con atajo y rama opcional" });
  var lst = api.readout(root);
  var ui = api.controls(root), out = api.readout(root);
  var sNin = ui.slider({ label: "Entradas (datos del usuario)", min: 2, max: 32, step: 1, value: st.nin, onInput: function (v) { st.nin = v; update(); } });
  var sA = ui.slider({ label: "Neuronas de densa_a", min: 2, max: 64, step: 1, value: st.a, onInput: function (v) { st.a = v; update(); } });
  var sB = ui.slider({ label: "Neuronas de densa_b", min: 2, max: 64, step: 1, value: st.b, onInput: function (v) { st.b = v; update(); } });
  var sR = ui.slider({ label: "Neuronas de la rama paralela", min: 2, max: 32, step: 1, value: st.r, onInput: function (v) { st.r = v; update(); } });
  var seg = ui.segmented({ label: "Cómo se une el atajo (de densa_a a la salida de densa_b)", value: "add", options: [["none", "Sin atajo"], ["add", "Add (sumar)"], ["concat", "Concatenate (pegar)"]], onChange: function (v) { st.skip = v; update(); } });
  var tg = ui.toggle({ label: "Añadir rama paralela desde la entrada", value: false, onChange: function (v) { st.branch = v; update(); } });
  ui.button("Igualar b a a", function () { st.b = st.a; sB.set(st.a, true); update(); }, "primary");
  ui.button("Hacer b ≠ a", function () { st.b = st.a === 16 ? 10 : 16; sB.set(st.b, true); update(); });

  function build() {
    var rows = [], err = null, tot = 0, w;
    function dense(name, nin, n, src) { var p = nin * n + n; tot += p; return { n: name + " (Dense) ← " + src, shape: n, p: p, f: nin + "·" + n + " + " + n + " = " + p }; }
    rows.push({ n: "entrada (InputLayer)", shape: st.nin, p: 0, f: "0" });
    rows.push(dense("densa_a", st.nin, st.a, "entrada"));
    rows.push(dense("densa_b", st.a, st.b, "densa_a"));
    w = st.b;
    if (st.skip === "add") {
      if (st.a !== st.b) err = "ValueError: Inputs have incompatible shapes. Received shapes (" + st.a + ",) and (" + st.b + ",)";
      rows.push({ n: "suma (Add) ← densa_a, densa_b", shape: err ? null : st.a, p: 0, f: "0", bad: !!err });
      w = st.a;
    } else if (st.skip === "concat") {
      w = st.a + st.b;
      rows.push({ n: "union (Concatenate) ← densa_a, densa_b", shape: w, p: 0, f: "0" });
    }
    if (!err) {
      if (st.branch) {
        rows.push(dense("densa_r", st.nin, st.r, "entrada"));
        w += st.r;
        rows.push({ n: "union2 (Concatenate) ← anterior, densa_r", shape: w, p: 0, f: "0" });
      }
      rows.push(dense("salida", w, st.k, st.branch || st.skip !== "none" ? "unión" : "densa_b"));
    }
    return { rows: rows, err: err, tot: tot, wOut: w };
  }

  function draw(ctx, w, h, C) {
    var B = build(), nodes = [], i;
    nodes.push({ id: "in", t: "Input", s: st.nin, c: C.paper });
    nodes.push({ id: "a", t: "Dense", s: st.a, c: C.cobaltoWash });
    nodes.push({ id: "b", t: "Dense", s: st.b, c: C.cobaltoWash });
    if (st.skip !== "none") nodes.push({ id: "m1", t: st.skip === "add" ? "Add" : "Concat", s: st.skip === "add" ? (B.err ? "?" : st.a) : st.a + st.b, c: B.err ? C.terracotaWash : C.terracotaWash, bad: !!B.err });
    if (st.branch) nodes.push({ id: "m2", t: "Concat", s: B.err ? "?" : B.wOut, c: C.terracotaWash });
    nodes.push({ id: "out", t: "Dense", s: st.k, c: C.olivaWash, soft: true });
    var n = nodes.length, cw = w / n, bw = Math.min(86, cw - 14), bh = 48, ym = h * (st.branch ? 0.38 : 0.5), P = {};
    nodes.forEach(function (nd, k) { P[nd.id] = { x: cw * (k + 0.5), y: ym }; });
    var yr = h * 0.82;
    function arrowH(a, b2, col, wd) { D.arrow(ctx, P[a].x + bw / 2, P[a].y, P[b2].x - bw / 2 - 1, P[b2].y, col, wd || 1.6); }
    var order = nodes.map(function (q) { return q.id; });
    /* cadena principal: in→a→b→(m1)→(m2)→out */
    for (i = 0; i < order.length - 1; i++) arrowH(order[i], order[i + 1], B.err && i >= 2 ? C.line : C.ink, 1.6);
    /* atajo */
    if (st.skip !== "none") {
      var xa = P.a.x, xm = P.m1.x, ytop = ym - bh / 2 - 22;
      D.path(ctx, [[xa, ym - bh / 2], [xa, ytop], [xm - 4, ytop]], C.terracota, 2.4);
      D.arrow(ctx, xm - 4, ytop, xm - 4, ym - bh / 2 - 1, C.terracota, 2.4);
      D.text(ctx, "atajo (skip)", (xa + xm) / 2, ytop - 5, { align: "center", size: 11, weight: 700, color: C.terracotaInk });
    }
    /* rama */
    if (st.branch) {
      var xr = (P.a.x + P.b.x) / 2, xend = P.m2.x;
      D.path(ctx, [[P.in.x, ym + bh / 2], [P.in.x, yr], [xr - bw / 2, yr]], C.oliva, 2.4);
      D.rect(ctx, xr - bw / 2, yr - bh / 2 + 2, bw, bh - 4, C.olivaWash, C.ink, 1.4);
      D.text(ctx, "Dense", xr, yr - 3, { align: "center", size: bw < 60 ? 10 : 11, mono: true, weight: 700, color: C.ink });
      D.text(ctx, "(None," + st.r + ")", xr, yr + 11, { align: "center", size: bw < 60 ? 8.5 : 10, mono: true, color: C.ink2 });
      D.path(ctx, [[xr + bw / 2, yr], [xend - 4, yr]], C.oliva, 2.4);
      D.arrow(ctx, xend - 4, yr, xend - 4, ym + bh / 2 + 1, C.oliva, 2.4);
      D.text(ctx, "rama paralela", xr, yr + bh / 2 + 6, { align: "center", size: 11, weight: 700, color: C.olivaInk });
    }
    nodes.forEach(function (nd) {
      var p = P[nd.id];
      D.rect(ctx, p.x - bw / 2, p.y - bh / 2, bw, bh, nd.c, nd.bad ? C.terracota : C.ink, nd.bad ? 3 : 1.6);
      var fs = bw < 60 ? 10 : 11.5;
      D.text(ctx, nd.t, p.x, p.y - 4, { align: "center", size: fs, weight: 700, color: C.ink, mono: true });
      D.text(ctx, nd.bad ? "ERROR" : "(None," + nd.s + ")", p.x, p.y + 12, { align: "center", size: bw < 60 ? 8.5 : 10, mono: true, color: nd.bad ? C.terracotaInk : C.ink2, weight: nd.bad ? 700 : 400 });
    });
  }
  function update() {
    var B = build(), rows = [];
    B.rows.forEach(function (r) {
      var shp = r.shape === null ? "<span class='bad'>—</span>" : "(None, " + r.shape + ")";
      rows.push((r.bad ? "<span class='bad'>" + r.n + "</span>" : "<b>" + r.n.split(" ")[0] + "</b> " + r.n.split(" ").slice(1).join(" ")) + "<br>&nbsp;&nbsp;" + shp + " · <b>" + (r.p || 0) + "</b> parám." + (r.p ? " <span style='opacity:.75'>(" + r.f + ")</span>" : ""));
    });
    lst.set(rows.join("<br>"));
    if (B.err) out.set("<span class='bad'>" + B.err + "</span><br>Add suma tensor con tensor, elemento a elemento: necesita <b>exactamente la misma forma</b>. Iguala b y a, o usa Concatenate.");
    else out.set("Total params: <b>" + B.tot + "</b> (" + (B.tot * 4) + " bytes en float32) · salida final (None, " + st.k + ")<br>" +
      (st.skip === "add" ? "Add no añade parámetros ni cambia el ancho (se queda en " + st.a + "). " : st.skip === "concat" ? "Concatenate no tiene parámetros pero <b>ensancha</b> el tensor a " + (st.a + st.b) + ", y eso agranda la capa siguiente. " : "") +
      (st.branch ? "La rama paralela suma " + (st.nin * st.r + st.r) + " parámetros propios." : ""));
    view.redraw();
  }
  view.draw(draw); update();
});
