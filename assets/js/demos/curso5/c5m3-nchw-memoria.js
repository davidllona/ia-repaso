/* Experimento: dónde vive cada número en la memoria según el formato del tensor (NCHW de PyTorch, NHWC de Keras
   y el caso intermedio que produce .permute: forma lógica NCHW con memoria channels_last).
   Todo se calcula con las fórmulas de los strides: nada está dibujado a mano. */
(function () {
  var MODES = {
    nchw: { name: "NCHW contiguo (PyTorch)", logical: "(N, C, H, W)" },
    nhwc: { name: "NHWC contiguo (Keras)", logical: "(N, H, W, C)" },
    cl: { name: "NCHW con memoria channels_last (lo que da .permute)", logical: "(N, C, H, W)" }
  };

  /* posición en memoria del elemento (c, h, w) de un tensor con N = 1 */
  function addr(mode, C, H, W, c, h, w) {
    if (mode === "nchw") return c * H * W + h * W + w;
    return (h * W + w) * C + c;
  }
  /* strides en el orden en que se declara la forma */
  function strides(mode, C, H, W) {
    if (mode === "nchw") return [C * H * W, H * W, W, 1];
    if (mode === "nhwc") return [H * W * C, W * C, C, 1];
    return [H * W * C, 1, W * C, C];
  }
  /* is_contiguous() en el sentido de PyTorch (strides de un tensor C-contiguo para esa forma) */
  function contiguo(mode, C, H, W) { return mode !== "cl" || C === 1 || (H === 1 && W === 1); }
  /* inversa: de la posición de memoria a (c, h, w) */
  function inverse(mode, C, H, W, a) {
    if (mode === "nchw") return { c: Math.floor(a / (H * W)), h: Math.floor((a % (H * W)) / W), w: a % W };
    return { c: a % C, h: Math.floor(Math.floor(a / C) / W), w: Math.floor(a / C) % W };
  }
  var core = { addr: addr, strides: strides, inverse: inverse, contiguo: contiguo };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-nchw-memoria", function (root, api) {
    var D = api.d;
    var S = { mode: "nchw", C: 3, H: 2, W: 3, sel: { c: 1, h: 0, w: 2 } };
    var CHN = [["cobalto", "cobaltoWash", "cobaltoInk"], ["terracota", "terracotaWash", "terracotaInk"], ["oliva", "olivaWash", "olivaInk"], ["marker", "markerWash", "ink"]];

    var view = api.view(root, { aspect: 1.9, minH: 300, maxH: 360, drag: false, label: "Un tensor con C canales de H por W píxeles, y la tira de memoria donde se guardan sus números" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Formato", value: S.mode, options: [["nchw", "NCHW"], ["nhwc", "NHWC"], ["cl", "NCHW + channels_last"]], onChange: function (v) { S.mode = v; update(); } });
    ui.slider({ label: "Canales C", min: 1, max: 4, step: 1, value: S.C, onInput: function (v) { S.C = v; fix(); update(); } });
    ui.slider({ label: "Alto H", min: 1, max: 4, step: 1, value: S.H, onInput: function (v) { S.H = v; fix(); update(); } });
    ui.slider({ label: "Ancho W", min: 1, max: 4, step: 1, value: S.W, onInput: function (v) { S.W = v; fix(); update(); } });

    function fix() {
      S.sel.c = Math.min(S.sel.c, S.C - 1); S.sel.h = Math.min(S.sel.h, S.H - 1); S.sel.w = Math.min(S.sel.w, S.W - 1);
    }

    /* geometría de los planos lógicos y de la tira de memoria */
    function planes(w, h) {
      var C = S.C, H = S.H, W = S.W, gap = 10, top = 40;
      var rows = 1, perRow = C, cell = Math.min(34, (w - 16 - gap * (perRow - 1)) / (perRow * W));
      if (cell < 22 && C > 2) { rows = 2; perRow = Math.ceil(C / 2); cell = Math.min(34, (w - 16 - gap * (perRow - 1)) / (perRow * W)); }
      cell = Math.max(14, cell);
      var pw = cell * W, ph = cell * H, totalW = perRow * pw + (perRow - 1) * gap, x0 = (w - totalW) / 2;
      var list = [];
      for (var c = 0; c < C; c++) {
        var r = Math.floor(c / perRow), k = c % perRow;
        list.push({ c: c, x: x0 + k * (pw + gap), y: top + r * (ph + 24), cell: cell });
      }
      return { list: list, bottom: top + rows * (ph + 24) };
    }
    function memGeom(w, y0) {
      var T = S.C * S.H * S.W, per = Math.max(4, Math.min(24, Math.floor((w - 16) / 24)));
      if (T <= per) per = T;
      var cell = Math.min(34, (w - 16) / per), rows = Math.ceil(T / per);
      return { T: T, per: per, cell: cell, rows: rows, x0: (w - cell * per) / 2, y0: y0 };
    }

    function draw(ctx, w, h, C) {
      var P = planes(w, h), G = memGeom(w, P.bottom + 34), a, c, hh, ww;
      D.text(ctx, (w > 520 ? "Tensor " + MODES[S.mode].logical + ", N = 1: cada casilla muestra su posición en memoria" : "Cada casilla = su posición en memoria"), w / 2, 14, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
      P.list.forEach(function (pl) {
        var col = CHN[pl.c];
        D.text(ctx, "canal " + pl.c, pl.x + (pl.cell * S.W) / 2, pl.y - 3, { size: 10.5, align: "center", color: C[col[2]], weight: 600 });
        for (hh = 0; hh < S.H; hh++) for (ww = 0; ww < S.W; ww++) {
          var isSel = S.sel.c === pl.c && S.sel.h === hh && S.sel.w === ww, x = pl.x + ww * pl.cell, y = pl.y + hh * pl.cell;
          D.rect(ctx, x, y, pl.cell, pl.cell, C[col[1]], isSel ? C.ink : C[col[0]], isSel ? 3 : 1);
          D.text(ctx, String(addr(S.mode, S.C, S.H, S.W, pl.c, hh, ww)), x + pl.cell / 2, y + pl.cell / 2 + 4, { size: Math.min(13, pl.cell * 0.42), align: "center", mono: true, color: C.ink, weight: isSel ? 700 : 400 });
        }
      });
      D.text(ctx, "Memoria: una sola fila de " + G.T + " casillas (0 … " + (G.T - 1) + ")", w / 2, G.y0 - 8, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
      for (a = 0; a < G.T; a++) {
        var inv = inverse(S.mode, S.C, S.H, S.W, a), col2 = CHN[inv.c];
        var r = Math.floor(a / G.per), k = a % G.per, x2 = G.x0 + k * G.cell, y2 = G.y0 + r * (G.cell + 6);
        var sel = inv.c === S.sel.c && inv.h === S.sel.h && inv.w === S.sel.w;
        D.rect(ctx, x2, y2, G.cell, G.cell, C[col2[1]], sel ? C.ink : C[col2[0]], sel ? 3 : 1);
        D.text(ctx, String(a), x2 + G.cell / 2, y2 + G.cell / 2 + 4, { size: Math.min(12, G.cell * 0.4), align: "center", mono: true, color: C.ink, weight: sel ? 700 : 400 });
      }
      /* la tira acaba donde acaban las filas */
      var yEnd = G.y0 + G.rows * (G.cell + 6) + 8;
      D.text(ctx, "color = canal al que pertenece el número", w / 2, Math.min(h - 6, yEnd + 6), { size: 10.5, align: "center", color: C.muted });
    }
    view.draw(draw);
    view.pointer({
      down: function (px, py) {
        var w = view.w, P = planes(w, view.h), G = memGeom(w, P.bottom + 34), hit = null;
        P.list.forEach(function (pl) {
          var ww = Math.floor((px - pl.x) / pl.cell), hh = Math.floor((py - pl.y) / pl.cell);
          if (ww >= 0 && ww < S.W && hh >= 0 && hh < S.H) hit = { c: pl.c, h: hh, w: ww };
        });
        var k = Math.floor((px - G.x0) / G.cell), r = Math.floor((py - G.y0) / (G.cell + 6));
        if (k >= 0 && k < G.per && r >= 0 && r < G.rows && r * G.per + k < G.T) hit = inverse(S.mode, S.C, S.H, S.W, r * G.per + k);
        if (hit) { S.sel = hit; update(); }
      }
    });
    view.canvas.classList.remove("no-cursor"); view.canvas.style.cursor = "pointer";

    function update() {
      var C = S.C, H = S.H, W = S.W, s = S.sel, a = addr(S.mode, C, H, W, s.c, s.h, s.w), st = strides(S.mode, C, H, W);
      var shapeTxt = S.mode === "nhwc" ? "(1, " + H + ", " + W + ", " + C + ")" : "(1, " + C + ", " + H + ", " + W + ")";
      var formula;
      if (S.mode === "nchw") formula = "c·H·W + h·W + w = " + s.c + "·" + H + "·" + W + " + " + s.h + "·" + W + " + " + s.w + " = <b>" + a + "</b>";
      else formula = "(h·W + w)·C + c = (" + s.h + "·" + W + " + " + s.w + ")·" + C + " + " + s.c + " = <b>" + a + "</b>";
      var t = "Forma <b>" + shapeTxt + "</b> · strides <b>(" + st.join(", ") + ")</b> · <code>is_contiguous()</code> = <b>" + (contiguo(S.mode, C, H, W) ? "True" : "False") + "</b>" +
        "<br>Elemento (canal " + s.c + ", fila " + s.h + ", columna " + s.w + ") → posición " + formula + " de " + (C * H * W) + ".";
      if (S.mode === "nchw") t += "<br>Los " + (H * W) + " números de un canal están <b>seguidos</b>; para pasar al canal siguiente hay que saltar " + (H * W) + " casillas.";
      else if (S.mode === "nhwc") t += "<br>Los " + C + " canales de un mismo píxel están <b>seguidos</b>; para pasar al canal siguiente solo hay que saltar 1 casilla.";
      else if (contiguo(S.mode, C, H, W)) t += "<br>Con C = 1 (o con mapas de 1×1) la memoria NCHW y la channels_last son idénticas: no hay nada que reordenar.";
      else t += "<br>El tensor <i>se comporta</i> como NCHW (las capas de PyTorch lo aceptan), pero su memoria es la de NHWC: <span class='bad'><code>x.view(1, -1)</code> falla</span>; <code>x.contiguous()</code> o <code>x.reshape(1, -1)</code> hacen una copia.";
      out.set(t); view.redraw();
    }
    fix(); update();
  });
})();
