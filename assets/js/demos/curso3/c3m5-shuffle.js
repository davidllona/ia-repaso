/* Experimento: ¿qué hace buffer_size en dataset.shuffle(buffer_size)?
   Algoritmo real de tf.data: se llena un buffer con los primeros buffer_size elementos; cada vez que hace falta uno, se elige una
   posición al azar DENTRO del buffer, se emite ese elemento y su hueco se rellena con el siguiente del dataset.
   El dataset llega ORDENADO (60 elementos: 30 de la clase A y luego 30 de la clase B). */
Lab.register("curso3/c3m5-shuffle", function (root, api) {
  var D = api.d, M = api.math, N = 60, BS = 6;
  var S = { buf: 10, seed: 1, out: [] };
  function run() {
    var R = api.rng(S.seed * 17 + 3), buffer = [], next = 0, out = [], i;
    var size = Math.min(S.buf, N);
    while (buffer.length < size && next < N) buffer.push(next++);
    while (buffer.length) {
      var j = Math.floor(R.next() * buffer.length); out.push(buffer[j]);
      if (next < N) buffer[j] = next++; else buffer.splice(j, 1);
    }
    S.out = out;
  }
  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 340, label: "Posición de cada elemento a la salida del shuffle según su posición original" });
  var pl = api.plot(view, { xr: [0, N], yr: [0, N], xticks: 6, yticks: 6, xlabel: "posición original en el dataset (ordenado)", ylabel: "posición a la salida", pad: { l: 42, r: 12, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var vB = api.view(root, { aspect: 5, minH: 78, maxH: 110, label: "Fracción de la clase B en cada lote de 6 de la salida" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "buffer_size", min: 1, max: 60, step: 1, value: S.buf, onInput: function (v) { S.buf = v; update(); } });
  ui.button("Otro sorteo (otra semilla)", function () { S.seed = S.seed % 9 + 1; update(); });
  api.legend(root, [[api.colors().cobalto, "clase A (primeros 30)"], [api.colors().terracota, "clase B (últimos 30)"]]);

  function draw(ctx, w, h, C) {
    pl.axes(ctx);
    D.line(ctx, pl.x(0), pl.y(0), pl.x(N), pl.y(N), C.line, 1.5, [4, 4]);
    S.out.forEach(function (orig, pos) { D.circle(ctx, pl.x(orig), pl.y(pos), 3.4, orig < 30 ? C.cobalto : C.terracota, C.paper, 0.8); });
    D.text(ctx, "diagonal = no se ha barajado nada", pl.box.x + 8, pl.box.y + pl.box.h - 8, { size: 10.5, color: C.muted });
  }
  view.draw(draw);
  function drawB(ctx, w, h, C) {
    var nb = N / BS, bw = (w - 20) / nb, i, j;
    D.text(ctx, (w < 520 ? "Columna = lote de 6; naranja = fracción de clase B" : "Cada columna = un lote de 6 a la salida; la parte naranja es la fracción de clase B"), 10, 12, { size: 10.5, color: C.muted });
    for (i = 0; i < nb; i++) {
      var cnt = 0; for (j = 0; j < BS; j++) if (S.out[i * BS + j] >= 30) cnt++;
      var x = 10 + i * bw, hh = h - 30;
      D.rect(ctx, x + 2, 20, bw - 4, hh, C.cobaltoWash, C.line, 1);
      D.rect(ctx, x + 2, 20 + hh * (1 - cnt / BS), bw - 4, hh * cnt / BS, C.terracota);
    }
  }
  vB.draw(drawB);

  function update() {
    run();
    var firstB = 0, j, disp = 0;
    for (j = 0; j < BS; j++) if (S.out[j] >= 30) firstB++;
    S.out.forEach(function (o, p) { disp += Math.abs(o - p); });
    var maxJump = 0; S.out.forEach(function (o, p) { maxJump = Math.max(maxJump, Math.abs(o - p)); });
    var runs = 0; for (j = 1; j < N; j++) if ((S.out[j] >= 30) !== (S.out[j - 1] >= 30)) runs++;
    out.set("buffer_size = <b>" + S.buf + "</b> de " + N + " elementos · desplazamiento medio de un elemento: <b>" + (disp / N).toFixed(1) + "</b> posiciones (un barajado perfecto daría ≈ 20) · máximo: " + maxJump +
      "<br>Primer lote de " + BS + ": <b class='" + (firstB === 0 ? "bad" : "good") + "'>" + firstB + " de clase B</b> · cambios de clase a lo largo de la salida: <b>" + runs + "</b> (un orden perfecto de A…A B…B tiene 1; uno al azar, ≈ 30)" +
      (S.buf < 6 ? "<br><span class='bad'>Con un buffer tan pequeño, el modelo ve casi solo A durante media época y luego solo B: el gradiente se sesga.</span>" : (S.buf >= N ? "<br><span class='good'>buffer_size ≥ tamaño del dataset: barajado uniforme completo.</span>" : "")));
    view.redraw(); vB.redraw();
  }
  update();
});
