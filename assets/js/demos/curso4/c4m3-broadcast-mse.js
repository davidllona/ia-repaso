/* Experimento: la trampa de las formas en MSELoss: (3,1) frente a (3,) se emparejan todos con todos. */
Lab.register("curso4/c4m3-broadcast-mse", function (root, api) {
  var X = [1, 2, 3], Y = [2, 5, 8], w = 3, b = -1, mode = "bien", NAMES = ["Shrek", "Toy Story", "El Rey León"];
  var ui = api.controls(root);
  ui.segmented({ label: "Forma de y", options: [["bien", "y: (3, 1)  ✔"], ["mal", "y: (3,)  ✘"]], value: mode, onChange: function (v) { mode = v; render(); } });
  var sw = ui.slider({ label: "w", min: -1, max: 5, step: 0.1, value: w, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { w = v; render(); } });
  var sb = ui.slider({ label: "b", min: -4, max: 4, step: 0.1, value: b, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { b = v; render(); } });
  ui.button("Poner w = 3, b = −1 (el modelo perfecto)", function () { w = 3; b = -1; sw.set(3, true); sb.set(-1, true); render(); }, "primary");
  var host = api.el("div", { style: { overflowX: "auto" } });
  root.appendChild(host);
  var out = api.readout(root);
  window.addEventListener("lab:theme", function () { if (host.isConnected) render(); });

  function f(v) { return (Math.round(v * 100) / 100).toFixed(2).replace("-", "−"); }
  function render() {
    var C = api.colors(), yh = X.map(function (x) { return w * x + b; }), i, j, tot = 0, cnt = 0;
    var cell = function (t, bg, col, bold) { return "<td style='padding:4px 10px;text-align:right;background:" + (bg || "transparent") + ";color:" + (col || C.ink) + ";font-weight:" + (bold ? 700 : 400) + ";border:1px solid " + C.line + "'>" + t + "</td>"; };
    var head = function (t) { return "<th style='padding:4px 10px;text-align:center;color:" + C.muted + ";font-weight:500;border:1px solid " + C.line + "'>" + t + "</th>"; };
    var h = "<table style='border-collapse:collapse;font:13px \"IBM Plex Mono\",monospace;margin:0 auto'>";
    if (mode === "bien") {
      h += "<tr>" + head("") + head("ŷᵢ") + head("yᵢ") + head("(ŷᵢ − yᵢ)²") + "</tr>";
      for (i = 0; i < 3; i++) { var e = (yh[i] - Y[i]) * (yh[i] - Y[i]); tot += e; cnt++; h += "<tr>" + head(NAMES[i]) + cell(f(yh[i])) + cell(f(Y[i])) + cell(f(e), C.olivaWash, C.olivaInk, true) + "</tr>"; }
    } else {
      h += "<tr>" + head("(ŷᵢ − yⱼ)²") + Y.map(function (v, j) { return head(NAMES[j] + "<br>y = " + f(v)); }).join("") + "</tr>";
      for (i = 0; i < 3; i++) {
        h += "<tr>" + head(NAMES[i] + "<br>ŷ = " + f(yh[i]));
        for (j = 0; j < 3; j++) { var e2 = (yh[i] - Y[j]) * (yh[i] - Y[j]); tot += e2; cnt++; h += cell(f(e2), i === j ? C.olivaWash : C.terracotaWash, i === j ? C.olivaInk : C.terracotaInk, i === j); }
        h += "</tr>";
      }
    }
    h += "</table>";
    host.innerHTML = h;
    var good = 0; for (i = 0; i < 3; i++) good += (yh[i] - Y[i]) * (yh[i] - Y[i]); good /= 3;
    if (mode === "bien") out.set("MSE = (" + [0, 1, 2].map(function (i) { return f((yh[i] - Y[i]) * (yh[i] - Y[i])); }).join(" + ") + ") / 3 = <b>" + f(good) + "</b>  <span class='good'>(3 errores, uno por película)</span>");
    else out.set("MSE que calcula PyTorch = suma de las 9 casillas / 9 = <b>" + f(tot / cnt) + "</b><br>MSE que querías = solo la diagonal verde / 3 = <b>" + f(good) + "</b><br><span class='bad'>Las 6 casillas rojas comparan cada predicción con las horas de OTRA película. " + (good < 1e-9 ? "Con el modelo perfecto, el «MSE» sigue sin ser 0." : "El optimizador intentará bajar también esas casillas.") + "</span>");
  }
  render();
});
