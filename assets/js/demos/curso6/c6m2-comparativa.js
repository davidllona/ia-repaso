/* Experimento: Keras frente a PyTorch con las cifras MEDIDAS en este cuaderno para la misma CNN de pósters
   (89.249 parámetros, 800 pósters de entrenamiento, 400 de test, 12 épocas, CPU con 1 hilo).
   Se elige la métrica; los puntos son cada semilla y la barra la media. El cuadro dice si la diferencia
   supera al ruido entre semillas. */
Lab.register("curso6/c6m2-comparativa", function (root, api) {
  var M = {
    acc: { nombre: "Accuracy en test", unidad: "", mejor: "alto", dec: 3,
      k: [0.965, 0.94, 0.89], p: [0.935, 0.952, 0.958], nota: "3 semillas, 12 épocas fijas, sin EarlyStopping." },
    tiempo: { nombre: "Segundos por época", unidad: " s", mejor: "bajo", dec: 2,
      k: [0.33, 0.32, 0.32], p: [0.39, 0.35, 0.34], nota: "CPU compartida, 1 hilo. En otra ejecución del mismo script salieron 0,45 y 0,47 s: un 10 % de diferencia en el reloj no es fiable." },
    params: { nombre: "Parámetros", unidad: "", mejor: "igual", dec: 0,
      k: [89249], p: [89249], nota: "Misma arquitectura capa a capa: tiene que salir el mismo número." },
    lineas: { nombre: "Líneas para entrenar, validar y guardar el mejor", unidad: "", mejor: "bajo", dec: 0,
      k: [9], p: [21], nota: "compile + 2 callbacks + fit frente al bucle escrito a mano." },
    disco: { nombre: "Tamaño del archivo guardado", unidad: " KB", mejor: "bajo", dec: 0,
      k: [1093], p: [352], nota: "mejor.keras incluye el estado de Adam (2 copias más de los pesos); mejor.pt solo los pesos." },
    latencia: { nombre: "Milisegundos para 1 póster", unidad: " ms", mejor: "bajo", dec: 2,
      k: [8.21], p: [0.27], nota: "Keras llamando a m(x) en modo eager. Con predict() fueron 62,64 ms; envuelto en tf.function, 1,11 ms." }
  };
  var S = { m: "acc" };

  var view = api.view(root, { aspect: 2, minH: 220, maxH: 320, label: "Barras con la media de Keras y de PyTorch en la métrica elegida y un punto por cada medición" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Qué comparas", value: S.m, options: [["acc", "Accuracy en test"], ["tiempo", "Segundos por época"],
    ["params", "Parámetros"], ["lineas", "Líneas de código"], ["disco", "Tamaño en disco"], ["latencia", "Latencia de 1 póster"]],
    onChange: function (v) { S.m = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "Keras"], [C0.cobalto, "PyTorch"]]);

  var mean = function (a) { return api.math.mean(a); };
  var sd = function (a) { return a.length > 1 ? api.math.std(a) : 0; };

  function draw(ctx, w, h, C) {
    var m = M[S.m], todos = m.k.concat(m.p), maxV = Math.max.apply(null, todos), minV = 0;
    if (S.m === "acc") { minV = 0.85; maxV = 1; }
    var top = 26, bot = h - 34, left = 16, right = w - 16;
    var bw = Math.min(110, (right - left) / 4), xs = [left + (right - left) * 0.3, left + (right - left) * 0.7];
    var yv = function (v) { return bot - (bot - top) * (v - minV) / ((maxV - minV) * 1.12 || 1); };
    api.d.line(ctx, left, bot, right, bot, C.line, 1);
    if (minV > 0) api.d.text(ctx, "el eje empieza en " + minV, left, bot + 28, { size: 10, color: C.muted });
    [[m.k, C.terracota, C.terracotaWash, "Keras"], [m.p, C.cobalto, C.cobaltoWash, "PyTorch"]].forEach(function (g, i) {
      var mu = mean(g[0]), x = xs[i], y = yv(mu);
      api.d.rect(ctx, x - bw / 2, y, bw, bot - y, g[2], g[1], 1.5);
      g[0].forEach(function (v, j) {
        var dx = g[0].length > 1 ? (j - (g[0].length - 1) / 2) * 14 : 0;
        api.d.circle(ctx, x + dx, yv(v), 4.5, g[1], C.paper, 1.2);
      });
      var s = sd(g[0]);
      var et = mu.toFixed(m.dec).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + m.unidad + (s > 0 ? " ± " + s.toFixed(m.dec) : "");
      var yTop = Math.min(y, yv(Math.max.apply(null, g[0])) - 6);
      api.d.text(ctx, et, x, Math.max(top + 10, yTop - 10), { align: "center", size: 12, weight: 700, color: C.ink });
      api.d.text(ctx, g[3], x, bot + 15, { align: "center", size: 12, weight: 600, color: g[1] });
    });
  }

  function update() {
    view.redraw();
    var m = M[S.m], mk = mean(m.k), mp = mean(m.p), dif = Math.abs(+mk.toFixed(m.dec) - +mp.toFixed(m.dec)), ruido = sd(m.k) + sd(m.p), veredicto;
    if (m.mejor === "igual") veredicto = "<span class='good'>Idénticos: misma red en los dos frameworks.</span>";
    else if (S.m === "tiempo" && dif / Math.max(mk, mp) < 0.15) veredicto = "<span class='good'>Empate práctico: " + Math.round(100 * dif / Math.max(mk, mp)) + " % de diferencia, menos de lo que baila el reloj entre ejecuciones.</span>";
    else if (m.k.length > 2 && dif <= ruido) veredicto = "<span class='good'>Empate: la diferencia (" + dif.toFixed(m.dec) + ") es menor que el ruido entre semillas (" + ruido.toFixed(m.dec) + ").</span>";
    else {
      var gana = (m.mejor === "alto") === (mk > mp) ? "Keras" : "PyTorch";
      var ratio = Math.max(mk, mp) / Math.min(mk, mp);
      veredicto = "Gana <b>" + gana + "</b> (" + (ratio >= 1.5 ? "×" + ratio.toFixed(1) : "un " + Math.round((ratio - 1) * 100) + " %") + ").";
    }
    out.set("<b>" + m.nombre + "</b> (" + (m.mejor === "alto" ? "más es mejor" : m.mejor === "bajo" ? "menos es mejor" : "deben coincidir") + ")<br>" +
      veredicto + "<br>" + m.nota);
  }
  view.draw(draw); update();
});
