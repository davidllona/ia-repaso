/* Experimento: nn.Linear(in, out) con un lote de N muestras: formas y la cuenta X·Wᵀ + b celda a celda. */
Lab.register("curso4/c4m3-forma-linear", function (root, api) {
  var nin = 2, nout = 2, N = 3, sel = [0, 0];
  var r = api.rng(5), i, j;
  /* matrices máximas (4 muestras, 4 entradas, 3 salidas); las primeras celdas son las del ejemplo del texto */
  var Xf = [[1, 2, -1, 2], [0, 1, 2, -2], [3, 1, 0, 1], [-1, 2, 1, 3]];
  var Wf = [[1, 2, 0, -1], [3, -1, 1, 2], [-2, 1, 2, 0]];
  var bf = [0.5, -1, 1];
  var ui = api.controls(root);
  var sN = ui.slider({ label: "Tamaño del lote N (filas de X)", min: 1, max: 4, step: 1, value: N, fmt: function (v) { return v; }, onInput: function (v) { N = v; fixSel(); render(); } });
  var sI = ui.slider({ label: "in_features (columnas de X)", min: 1, max: 4, step: 1, value: nin, fmt: function (v) { return v; }, onInput: function (v) { nin = v; fixSel(); render(); } });
  var sO = ui.slider({ label: "out_features (salidas)", min: 1, max: 3, step: 1, value: nout, fmt: function (v) { return v; }, onInput: function (v) { nout = v; fixSel(); render(); } });
  var host = api.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "14px 10px", alignItems: "flex-start", justifyContent: "center" } });
  root.appendChild(host);
  var out = api.readout(root);
  window.addEventListener("lab:theme", function () { if (host.isConnected) render(); });

  function fixSel() { sel[0] = Math.min(sel[0], N - 1); sel[1] = Math.min(sel[1], nout - 1); }
  function fmt(v) { return (Math.round(v * 100) / 100).toString().replace("-", "−"); }
  function block(title, shape, rows, cls) {
    var C = api.colors();
    var wrap = api.el("div", { style: { textAlign: "center" } });
    wrap.appendChild(api.el("div", { style: { font: "600 12px 'IBM Plex Mono',monospace", color: C.ink2 }, text: title }));
    wrap.appendChild(api.el("div", { style: { font: "11px 'IBM Plex Mono',monospace", color: C.muted, marginBottom: "4px" }, text: shape }));
    var g = api.el("div", { style: { display: "inline-grid", gridTemplateColumns: "repeat(" + rows[0].length + ", auto)", gap: "2px", padding: "4px 6px", borderLeft: "2px solid " + C.ink, borderRight: "2px solid " + C.ink } });
    rows.forEach(function (row, ri) {
      row.forEach(function (cell, ci) {
        var hi = cell.hi, st = { font: "13px 'IBM Plex Mono',monospace", minWidth: "32px", padding: "3px 4px", textAlign: "center", color: C.ink, background: hi ? (cell.c === "y" ? C.terracotaWash : C.cobaltoWash) : "transparent", border: "1px solid " + (hi ? (cell.c === "y" ? C.terracota : C.cobalto) : "transparent"), cursor: cell.click ? "pointer" : "default" };
        var c = api.el("div", { style: st, text: cell.t });
        if (cell.click) c.addEventListener("click", cell.click);
        g.appendChild(c);
      });
    });
    wrap.appendChild(g);
    return wrap;
  }
  function op(t) { return api.el("div", { style: { font: "700 20px 'IBM Plex Mono',monospace", alignSelf: "center", marginTop: "28px", color: api.colors().muted }, text: t }); }
  function yhat(a, c) { var s = bf[c], k; for (k = 0; k < nin; k++) s += Xf[a][k] * Wf[c][k]; return s; }

  function render() {
    var Xr = [], Wr = [], br = [[]], Yr = [], a, c, k, sa = sel[0], sc = sel[1];
    for (a = 0; a < N; a++) { Xr.push([]); for (k = 0; k < nin; k++) Xr[a].push({ t: fmt(Xf[a][k]), hi: a === sa }); }
    for (c = 0; c < nout; c++) { Wr.push([]); for (k = 0; k < nin; k++) Wr[c].push({ t: fmt(Wf[c][k]), hi: c === sc }); }
    for (c = 0; c < nout; c++) br[0].push({ t: fmt(bf[c]), hi: c === sc });
    for (a = 0; a < N; a++) { Yr.push([]); for (c = 0; c < nout; c++) (function (a, c) { Yr[a].push({ t: fmt(yhat(a, c)), hi: a === sa && c === sc, c: "y", click: function () { sel = [a, c]; render(); } }); })(a, c); }
    host.innerHTML = "";
    host.appendChild(block("X", "(" + N + ", " + nin + ")", Xr));
    host.appendChild(op("· Wᵀ"));
    host.appendChild(block("weight  W", "(" + nout + ", " + nin + ") · se usa su traspuesta", Wr));
    host.appendChild(op("+"));
    host.appendChild(block("bias", "(" + nout + ")", br));
    host.appendChild(op("="));
    host.appendChild(block("ŷ = model(X)", "(" + N + ", " + nout + ")", Yr));
    var terms = [], k2;
    for (k2 = 0; k2 < nin; k2++) terms.push(fmt(Xf[sa][k2]) + "·" + fmt(Wf[sc][k2]));
    var tot = nin * nout + nout;
    out.set("nn.Linear(<b>" + nin + "</b>, <b>" + nout + "</b>) · lote de <b>" + N + "</b> muestras<br>" +
      "X: (" + N + ", " + nin + ") · Wᵀ: (" + nin + ", " + nout + ") + b: (" + nout + ") → ŷ: <b>(" + N + ", " + nout + ")</b><br>" +
      "ŷ[" + (sa + 1) + "," + (sc + 1) + "] = " + terms.join(" + ") + " + " + fmt(bf[sc]) + " = <b>" + fmt(yhat(sa, sc)) + "</b>  (haz clic en otra celda de ŷ)<br>" +
      "parámetros = out·in + out = " + nout + "·" + nin + " + " + nout + " = <b>" + tot + "</b> · parámetros no dependen de N");
  }
  render();
});
