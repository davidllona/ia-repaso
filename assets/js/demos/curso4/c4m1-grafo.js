/* Experimento: el grafo de cálculo de PyTorch (L = (w·x + b − t)²) y quién recibe .grad.
   Se activan/desactivan requires_grad, detach() y torch.no_grad() y se calcula de verdad qué nodos tienen grad_fn
   y qué hojas obtienen gradiente (o None) al llamar a L.backward(). */
Lab.register("curso4/c4m1-grafo", function (root, api) {
  var D = api.d;
  var S = { x: 3, t: 10, b: 1, w: 2, rgW: true, rgB: true, rgX: false, detach: false, noGrad: false, retain: false, done: false };
  var view = api.view(root, { aspect: 1.65, minH: 270, maxH: 360, label: "Grafo de cálculo: cada nodo con su requires_grad, su grad_fn y su gradiente tras backward" });
  var ui = api.controls(root), out = api.readout(root);
  var sw = ui.slider({ label: "Valor de w", min: 0, max: 4, step: 0.5, value: 2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w = v; S.done = false; update(); } });
  function tg(label, key, val) { return ui.toggle({ label: label, value: val, onChange: function (v) { S[key] = v; S.done = false; update(); } }); }
  tg("w.requires_grad", "rgW", true); tg("b.requires_grad", "rgB", true); tg("x.requires_grad", "rgX", false);
  tg("m = (w * x).detach()", "detach", false); tg("with torch.no_grad():", "noGrad", false); tg("m.retain_grad() · z.retain_grad()", "retain", false);
  ui.button("L.backward()", function () { S.done = true; update(); }, "primary");
  ui.button("Borrar .grad", function () { S.done = false; update(); });

  function model() {
    var m = S.w * S.x, z = m + S.b, e = z - S.t, L = e * e, ng = S.noGrad;
    var mrg = !ng && !S.detach && (S.rgW || S.rgX), zrg = !ng && (mrg || S.rgB), erg = zrg, Lrg = erg;
    var g = { w: null, x: null, b: null, m: null, z: null }, ge = 2 * e;
    if (Lrg) {
      if (S.rgB) g.b = ge;
      if (mrg && S.rgW) g.w = ge * S.x;
      if (mrg && S.rgX) g.x = ge * S.w;
      if (S.retain) { g.m = mrg ? ge : null; g.z = zrg ? ge : null; }
    }
    return { v: { m: m, z: z, e: e, L: L }, rg: { m: mrg, z: zrg, e: erg, L: Lrg }, g: g, ok: Lrg };
  }
  function f1(v) { return (Math.round(v * 100) / 100).toString().replace("-", "−"); }
  function draw(ctx, w, h, C) {
    var M = model(), narrow = w < 480, cw = w / 5, bwid = Math.min(86, cw - (narrow ? 8 : 12)), bh = narrow ? 66 : 70, ym = h * 0.40, yb = h * 0.78, ytop = h * 0.15, ybot = h * 0.60;
    var P = {
      w: [cw * 0.5, ytop + 10, "w", S.w, "leaf", S.rgW], x: [cw * 0.5, ybot - 4, "x", S.x, "leaf", S.rgX],
      m: [cw * 1.5, ym, "m", M.v.m, "Mul", M.rg.m], z: [cw * 2.5, ym, "z", M.v.z, "Add", M.rg.z], b: [cw * 2.5, yb, "b", S.b, "leaf", S.rgB],
      e: [cw * 3.5, ym, "e", M.v.e, "Sub", M.rg.e], t: [cw * 3.5, yb, "t", S.t, "leaf", false], L: [cw * 4.5, ym, "L", M.v.L, "Pow", M.rg.L]
    };
    function clip(k, tx, ty) {
      var p = P[k], dx = tx - p[0], dy = ty - p[1], hw = bwid / 2, hh = bh / 2;
      var sc = Math.min(dx !== 0 ? hw / Math.abs(dx) : 1e9, dy !== 0 ? hh / Math.abs(dy) : 1e9);
      return [p[0] + dx * sc, p[1] + dy * sc];
    }
    function link(a, b2, on) {
      var A = P[a], B = P[b2], p1 = clip(a, B[0], B[1]), p2 = clip(b2, A[0], A[1]);
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len * 4, ny = dx / len * 4;
      D.arrow(ctx, p1[0] + nx, p1[1] + ny, p2[0] + nx, p2[1] + ny, on ? C.terracota : C.line, on ? 2.2 : 1.4);
    }
    var edges = [["w", "m"], ["x", "m"], ["m", "z"], ["b", "z"], ["z", "e"], ["t", "e"], ["e", "L"]];
    edges.forEach(function (e) {
      var a = e[0], b2 = e[1], src = P[a], dst = P[b2];
      var flow = dst[5] && (src[5] || src[4] !== "leaf") && !(b2 === "m" && S.detach);
      link(a, b2, flow && S.done && M.ok);
    });
    Object.keys(P).forEach(function (k) {
      var p = P[k], leaf = p[4] === "leaf", rg = p[5], gv = M.g[k];
      var fill = leaf ? (rg ? C.cobaltoWash : C.paper) : (rg ? C.terracotaWash : C.paper);
      D.rect(ctx, p[0] - bwid / 2, p[1] - bh / 2, bwid, bh, fill, C.ink, rg ? 2 : 1.1);
      var fs = narrow ? 9 : 10;
      D.text(ctx, p[2] + " = " + f1(p[3]), p[0], p[1] - bh / 2 + 15, { align: "center", size: narrow ? 10 : 11.5, weight: 700, mono: true });
      D.text(ctx, "rg=" + (rg ? "True" : "False"), p[0], p[1] - bh / 2 + 29, { align: "center", size: fs, mono: true, color: rg ? C.cobaltoInk : C.muted });
      var fn = leaf ? "hoja" : (rg ? p[4] + "Bwd" : "grad_fn=None");
      if (k === "m" && S.detach) fn = "detach()";
      D.text(ctx, fn, p[0], p[1] - bh / 2 + 42, { align: "center", size: fs, mono: true, color: C.ink2 });
      if (S.done) {
        var has = gv !== null && gv !== undefined;
        if (k === "e" || k === "L" || k === "t") { if (k === "L" && M.ok) D.text(ctx, "∂=1", p[0], p[1] - bh / 2 + 57, { align: "center", size: fs, mono: true, weight: 700, color: C.terracotaInk }); else if (k === "t") D.text(ctx, "grad=None", p[0], p[1] - bh / 2 + 57, { align: "center", size: fs, mono: true, color: C.muted }); }
        else D.text(ctx, has ? ".grad=" + f1(gv) : ".grad=None", p[0], p[1] - bh / 2 + 57, { align: "center", size: fs, mono: true, weight: has ? 700 : 400, color: has ? C.terracotaInk : C.muted });
      }
    });
    D.text(ctx, S.done ? "tras L.backward(): flechas naranja = por dónde viajó el gradiente" : "pulsa L.backward() para recorrer el grafo hacia atrás", w / 2, h - 6, { align: "center", size: 10.5, color: C.ink2, weight: 600 });
  }
  view.draw(draw);
  function gs(v) { return v === null ? "None" : "tensor(" + f1(v) + ")"; }
  function update() {
    var M = model(), s = "";
    s += "L.requires_grad = <b>" + (M.rg.L ? "True" : "False") + "</b> · L.grad_fn = <b>" + (M.rg.L ? "PowBackward0" : "None") + "</b>";
    if (!S.done) s += "<br>Aún no has llamado a backward(): w.grad = None, b.grad = None, x.grad = None.";
    else if (!M.ok) s += "<br><span class='bad'>L.backward() → RuntimeError: element 0 of tensors does not require grad and does not have a grad_fn</span><br>Ningún camino de L llega a un tensor con requires_grad=True, así que no hay nada que derivar.";
    else s += "<br>w.grad = <b>" + gs(M.g.w) + "</b> · b.grad = <b>" + gs(M.g.b) + "</b> · x.grad = <b>" + gs(M.g.x) + "</b><br>m.grad = <b>" + gs(M.g.m) + "</b> · z.grad = <b>" + gs(M.g.z) + "</b>" + (S.retain ? "" : " (tensores intermedios: PyTorch no guarda su .grad salvo con retain_grad())");
    if (S.done && M.ok) s += "<br>Comprobación a mano: e = " + f1(M.v.e) + " → 2e = " + f1(2 * M.v.e) + "; ∂L/∂w = 2e·x = " + f1(2 * M.v.e * S.x) + "; ∂L/∂b = 2e = " + f1(2 * M.v.e);
    out.set(s); view.redraw();
  }
  update();
});
