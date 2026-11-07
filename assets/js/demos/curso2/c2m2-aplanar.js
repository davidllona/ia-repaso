/* Experimento: aplanar una imagen de 8×8 (un 0 de load_digits) en un vector de 64 números
   y normalizar los píxeles dividiendo entre 16. Toca un píxel para ver su posición f·8 + c. */
Lab.register("curso2/c2m2-aplanar", function (root, api) {
  var IMG = [
    [0, 0, 5, 13, 9, 1, 0, 0],
    [0, 0, 13, 15, 10, 15, 5, 0],
    [0, 3, 15, 2, 0, 11, 8, 0],
    [0, 4, 12, 0, 0, 8, 8, 0],
    [0, 5, 8, 0, 0, 9, 8, 0],
    [0, 4, 11, 0, 1, 12, 7, 0],
    [0, 2, 14, 5, 10, 12, 0, 0],
    [0, 0, 6, 13, 10, 0, 0, 0]
  ];
  var st = { sel: 10, norm: false, prog: 64 }, loop, geo = null;

  var view = api.view(root, { aspect: 2.2, minH: 370, maxH: 390, drag: true, label: "Imagen de 8 por 8 píxeles y el vector de 64 números que sale al aplanarla" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Píxel seleccionado (posición en el vector)", min: 0, max: 63, step: 1, value: st.sel, onInput: function (v) { st.sel = v; update(); } });
  var bPlay = ui.button("▶ Aplanar fila a fila", function () { play(); }, "primary");
  ui.toggle({ label: "Normalizar (÷ 16)", value: false, onChange: function (on) { st.norm = on; update(); } });

  function val(p) { var v = IMG[Math.floor(p / 8)][p % 8]; return st.norm ? v / 16 : v; }
  function txt(p) { var v = val(p); return st.norm ? (v === 0 ? "0" : v.toFixed(2).replace(/^0/, "")) : String(v); }
  function play() {
    if (loop.running) { loop.stop(); return; }
    if (api.reduceMotion) { st.prog = 64; update(); return; }
    st.prog = 0; loop.start();
  }
  loop = api.loop(function (dt) {
    st.prog = Math.min(64, st.prog + dt * 16);
    update();
    if (st.prog >= 64) return false;
  }, { fps: 30, onState: function (on) { bPlay.textContent = on ? "⏸ Pausa" : "▶ Aplanar fila a fila"; } });

  function draw(ctx, w, h, C) {
    var D = api.d, narrow = w < 560, i, p;
    var vcN = (w - 20) / 16;
    var gs = narrow ? Math.min(w - 40, h - 60 - 4 * (vcN + 12)) : Math.min(h - 40, w * 0.42);
    gs = Math.max(120, gs);
    var gx = narrow ? (w - gs) / 2 : 14, gy = 22, cs = gs / 8;
    D.text(ctx, "imagen (8, 8)", gx, 14, { size: 11, weight: 600, color: C.ink });
    for (p = 0; p < 64; p++) {
      var f = Math.floor(p / 8), c = p % 8, v = IMG[f][c] / 16, copied = p < Math.floor(st.prog);
      var x = gx + c * cs, y = gy + f * cs;
      ctx.save(); ctx.globalAlpha = 0.12 + 0.88 * v; D.rect(ctx, x, y, cs, cs, C.ink, null); ctx.restore();
      D.rect(ctx, x, y, cs, cs, null, C.line, 1);
      if (cs > 22) D.text(ctx, txt(p), x + cs / 2, y + cs / 2 + 4, { align: "center", size: Math.min(12, cs * 0.36), mono: true, color: v > 0.45 ? C.paper : C.ink });
      if (!copied && st.prog < 64) { ctx.save(); ctx.globalAlpha = 0.55; D.rect(ctx, x, y, cs, cs, C.surface, null); ctx.restore(); }
    }
    var sf = Math.floor(st.sel / 8), sc = st.sel % 8;
    D.rect(ctx, gx + sc * cs, gy + sf * cs, cs, cs, null, C.terracota, 3);
    D.rect(ctx, gx, gy, gs, gs, null, C.ink, 1.5);
    // vector en 4 filas de 16
    var vx = narrow ? 10 : gx + gs + 30, vw = w - vx - 10, vc = vw / 16, vy = narrow ? gy + gs + 34 : gy + 20, rowGap = 12;
    D.text(ctx, "vector (64,)  ·  se lee fila tras fila", vx, vy - 12, { size: 11, weight: 600, color: C.ink });
    for (p = 0; p < 64; p++) {
      var r = Math.floor(p / 16), k = p % 16, xx = vx + k * vc, yy = vy + r * (vc + rowGap);
      var origRow = Math.floor(p / 8), band = origRow % 2 ? C.terracotaWash : C.cobaltoWash;
      var shown = p < Math.floor(st.prog) || st.prog >= 64;
      D.rect(ctx, xx, yy, vc, vc, shown ? band : C.surface, C.line, 1);
      if (shown && vc > 17) D.text(ctx, txt(p), xx + vc / 2, yy + vc / 2 + 4, { align: "center", size: Math.min(11, vc * 0.42), mono: true, color: C.ink });
      if (k === 0 || k === 8) D.text(ctx, String(p), xx + 1, yy + vc + 10, { size: 9, mono: true, color: C.muted });
    }
    var sr = Math.floor(st.sel / 16), sk = st.sel % 16;
    D.rect(ctx, vx + sk * vc, vy + sr * (vc + rowGap), vc, vc, null, C.terracota, 3);
    geo = { gx: gx, gy: gy, cs: cs, vx: vx, vy: vy, vc: vc, rowGap: rowGap };
  }
  function pick(px, py) {
    if (!geo) return;
    var c = Math.floor((px - geo.gx) / geo.cs), f = Math.floor((py - geo.gy) / geo.cs);
    if (c >= 0 && c < 8 && f >= 0 && f < 8) { st.sel = f * 8 + c; sl.set(st.sel, true); update(); return; }
    var k = Math.floor((px - geo.vx) / geo.vc), r = Math.floor((py - geo.vy) / (geo.vc + geo.rowGap));
    if (k >= 0 && k < 16 && r >= 0 && r < 4) { st.sel = r * 16 + k; sl.set(st.sel, true); update(); }
  }
  view.pointer({ down: pick, drag: pick });

  function update() {
    view.redraw();
    var f = Math.floor(st.sel / 8), c = st.sel % 8, v = IMG[f][c];
    out.set("Píxel de la <b>fila " + f + ", columna " + c + "</b> → posición <b>" + f + "·8 + " + c + " = " + st.sel + "</b> del vector." +
      "<br>Valor: " + v + (st.norm ? " → " + v + " / 16 = <b>" + (v / 16).toFixed(4) + "</b> (entre 0 y 1)" : " (escala 0–16; activa «Normalizar» para dividir entre 16)") +
      "<br>Para la red densa son 64 números sueltos: ya no sabe que el píxel " + st.sel + " tiene encima el " + (st.sel >= 8 ? st.sel - 8 : "— (fila 0)") + ".");
  }
  view.draw(draw); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});
