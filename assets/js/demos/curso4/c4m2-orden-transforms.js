/* Experimento: Compose con el orden y el tipo de dato. Un dígito 8x8 (PIL uint8) pasa por hasta 4 transformaciones elegidas.
   Cada una acepta unas entradas (PIL o tensor) y produce otras; si el orden es incorrecto se muestra el error real de torchvision. */
Lab.register("curso4/c4m2-orden-transforms", function (root, api) {
  var D = api.d, M = api.math;
  var DIG = {
    "0": [[0,0,5,13,9,1,0,0],[0,0,13,15,10,15,5,0],[0,3,15,2,0,11,8,0],[0,4,12,0,0,8,8,0],[0,5,8,0,0,9,8,0],[0,4,11,0,1,12,7,0],[0,2,14,5,10,12,0,0],[0,0,6,13,10,0,0,0]],
    "3": [[0,0,7,15,13,1,0,0],[0,8,13,6,15,4,0,0],[0,2,1,13,13,0,0,0],[0,0,2,15,11,1,0,0],[0,0,0,1,12,12,1,0],[0,0,0,0,1,10,8,0],[0,0,8,4,5,14,9,0],[0,0,7,13,13,9,0,0]],
    "7": [[0,0,7,8,13,16,15,1],[0,0,7,7,4,11,12,0],[0,0,0,0,8,13,1,0],[0,4,8,8,15,15,6,0],[0,2,11,15,15,4,0,0],[0,0,0,16,5,0,0,0],[0,0,9,15,1,0,0,0],[0,0,13,5,0,0,0,0]]
  };
  var OPS = [["-", "(nada)"], ["resize", "Resize((12, 12))"], ["crop", "CenterCrop(6)"], ["flip", "Flip horizontal (p=1)"], ["totensor", "ToTensor()"], ["norm", "Normalize((0.5,), (0.5,))"]];
  var S = { dig: "3", ops: ["resize", "totensor", "norm", "-"] };

  function start(d) {
    var rows = DIG[d], px = [], r, c;
    for (r = 0; r < 8; r++) { var row = []; for (c = 0; c < 8; c++) row.push(Math.round(rows[r][c] / 16 * 255)); px.push(row); }
    return { kind: "PIL", h: 8, w: 8, ch: 1, px: px, dtype: "uint8" };
  }
  function bil(im, nh, nw) {
    var out = [], r, c, sy = im.h / nh, sx = im.w / nw;
    for (r = 0; r < nh; r++) {
      var row = [], fy = M.clamp((r + 0.5) * sy - 0.5, 0, im.h - 1), y0 = Math.floor(fy), y1 = Math.min(im.h - 1, y0 + 1), ty = fy - y0;
      for (c = 0; c < nw; c++) {
        var fx = M.clamp((c + 0.5) * sx - 0.5, 0, im.w - 1), x0 = Math.floor(fx), x1 = Math.min(im.w - 1, x0 + 1), tx = fx - x0;
        var v = (im.px[y0][x0] * (1 - tx) + im.px[y0][x1] * tx) * (1 - ty) + (im.px[y1][x0] * (1 - tx) + im.px[y1][x1] * tx) * ty;
        row.push(im.dtype === "uint8" ? Math.round(v) : v);
      }
      out.push(row);
    }
    return { kind: im.kind, h: nh, w: nw, ch: im.ch, px: out, dtype: im.dtype };
  }
  function apply(im, op) {
    var n = { kind: im.kind, h: im.h, w: im.w, ch: im.ch, px: im.px, dtype: im.dtype };
    if (op === "resize") return { im: bil(im, 12, 12) };
    if (op === "crop") {
      var t = Math.round((im.h - 6) / 2), l = Math.round((im.w - 6) / 2);
      if (im.h < 6 || im.w < 6) return { err: "la imagen es menor que 6×6 (CenterCrop la rellenaría de ceros)" };
      n.px = im.px.slice(t, t + 6).map(function (r) { return r.slice(l, l + 6); }); n.h = 6; n.w = 6; return { im: n };
    }
    if (op === "flip") { n.px = im.px.map(function (r) { return r.slice().reverse(); }); return { im: n }; }
    if (op === "totensor") {
      if (im.kind === "tensor") return { err: "TypeError: pic should be PIL Image or ndarray. Got <class 'torch.Tensor'>" };
      n.kind = "tensor"; n.dtype = "float32"; n.px = im.px.map(function (r) { return r.map(function (v) { return v / 255; }); }); return { im: n };
    }
    if (op === "norm") {
      if (im.kind === "PIL") return { err: "TypeError: img should be Tensor Image. Got <class 'PIL.Image.Image'>" };
      n.px = im.px.map(function (r) { return r.map(function (v) { return (v - 0.5) / 0.5; }); }); return { im: n };
    }
    return { im: n };
  }
  function minmax(im) { var mn = Infinity, mx = -Infinity; im.px.forEach(function (r) { r.forEach(function (v) { if (v < mn) mn = v; if (v > mx) mx = v; }); }); return [mn, mx]; }

  var view = api.view(root, { aspect: 3.0, minH: 170, maxH: 250, label: "El dígito después de cada transformación, con su tipo, forma y rango" });
  var ui = api.controls(root), out = api.readout(root);
  var selDig = ui.select({ label: "Imagen de partida", options: [["0", "un 0"], ["3", "un 3"], ["7", "un 7"]], value: S.dig, onChange: function (v) { S.dig = v; update(); } });
  var sels = [0, 1, 2, 3].map(function (k) {
    return ui.select({ label: "Paso " + (k + 1), options: OPS, value: S.ops[k], onChange: function (v) { S.ops[k] = v; update(); } });
  });
  function preset(ops) { S.ops = ops.slice(); sels.forEach(function (s, k) { s.set(S.ops[k]); }); update(); }
  ui.button("Receta correcta", function () { preset(["resize", "totensor", "norm", "-"]); }, "primary");
  ui.button("Normalize antes de ToTensor", function () { preset(["norm", "totensor", "-", "-"]); });
  ui.button("ToTensor dos veces", function () { preset(["totensor", "totensor", "-", "-"]); });

  var chain = [];
  function shapeStr(im) { return im.kind === "tensor" ? "(" + im.ch + ", " + im.h + ", " + im.w + ")" : "size (" + im.w + ", " + im.h + ")"; }
  function compute() {
    chain = [{ title: "entrada", im: start(S.dig) }];
    var cur = chain[0].im, k, errAt = -1;
    for (k = 0; k < 4; k++) {
      if (S.ops[k] === "-") continue;
      var name = OPS.filter(function (o) { return o[0] === S.ops[k]; })[0][1], res = apply(cur, S.ops[k]);
      if (res.err) { chain.push({ title: name, err: res.err }); errAt = k; break; }
      cur = res.im; chain.push({ title: name, im: cur });
    }
  }
  function draw(ctx, w, h, C) {
    var n = chain.length, gap = 6, bw = (w - 12 - gap * (n - 1)) / n, bs = Math.min(bw, h - 50), k;
    chain.forEach(function (st, k) {
      var x0 = 6 + k * (bw + gap), cx = x0 + bw / 2;
      if (st.err) {
        D.rect(ctx, x0, 6, bw, bs, C.terracotaWash, C.terracota, 2);
        D.text(ctx, "ERROR", cx, 6 + bs / 2 + 4, { size: 12, color: C.terracotaInk, align: "center", weight: 700 });
        D.text(ctx, st.title.split("(")[0], cx, bs + 20, { size: 9.5, color: C.terracotaInk, align: "center", mono: true });
        return;
      }
      var im = st.im, mm = minmax(im), cell = bs / Math.max(im.h, im.w), r, c, ox = cx - cell * im.w / 2;
      for (r = 0; r < im.h; r++) for (c = 0; c < im.w; c++) {
        var v = (im.px[r][c] - mm[0]) / ((mm[1] - mm[0]) || 1);
        ctx.fillStyle = C.ink; ctx.globalAlpha = M.clamp(v, 0, 1); ctx.fillRect(ox + c * cell, 6 + r * cell, cell + 0.5, cell + 0.5);
      }
      ctx.globalAlpha = 1; D.rect(ctx, ox, 6, cell * im.w, cell * im.h, null, C.line, 1);
      D.text(ctx, st.title.split("(")[0], cx, bs + 20, { size: 9.5, color: C.ink2, align: "center", mono: true });
      D.text(ctx, im.kind + " · " + im.dtype, cx, bs + 33, { size: 9.5, color: im.kind === "tensor" ? C.cobaltoInk : C.olivaInk, align: "center", weight: 600 });
    });
  }
  view.draw(draw);

  function update() {
    compute();
    var last = chain[chain.length - 1], t = "";
    chain.forEach(function (st, k) {
      if (st.err) { t += "<br>" + k + ". <code>" + st.title + "</code> → <span class='bad'><b>" + st.err + "</b></span>"; return; }
      var mm = minmax(st.im);
      t += (k ? "<br>" : "") + k + ". <code>" + st.title + "</code> → <b>" + st.im.kind + "</b> " + st.im.dtype + ", " + shapeStr(st.im) + ", valores de <b>" + mm[0].toFixed(st.im.dtype === "uint8" ? 0 : 3) + "</b> a <b>" + mm[1].toFixed(st.im.dtype === "uint8" ? 0 : 3) + "</b>";
    });
    if (!last.err) t += "<br><span class='" + (last.im.kind === "tensor" ? "good" : "bad") + "'>" + (last.im.kind === "tensor" ? "El resultado es un tensor: ya se puede apilar en un lote." : "El resultado sigue siendo una imagen PIL: el DataLoader no podrá apilarla (falta ToTensor).") + "</span>";
    view.redraw(); out.set(t);
  }
  update();
});
