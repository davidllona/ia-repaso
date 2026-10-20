/* Experimento: en qué orden llama Keras a los métodos de un callback durante model.fit().
   El orden es el real de Keras 3.15 (comprobado imprimiendo cada gancho): train_begin → epoch_begin → [train_batch_begin/end]×lotes →
   [test_begin → test_batch_begin/end → test_end] (solo con validación) → epoch_end → … → train_end. */
Lab.register("curso3/c3m5-callbacks-orden", function (root, api) {
  var S = { E: 2, B: 3, val: true, pos: -1, ev: [] };
  var INFO = {
    on_train_begin: "Una vez, antes de la primera época. Sitio para inicializar contadores, abrir ficheros, guardar el lr inicial.",
    on_epoch_begin: "Al empezar cada época (recibe <code>epoch</code>, que cuenta desde 0). Típico: cambiar el learning rate de esta época.",
    on_train_batch_begin: "Antes de cada lote de entrenamiento (recibe <code>batch</code>). Muy frecuente: úsalo con cuidado, ralentiza si haces mucho trabajo.",
    on_train_batch_end: "Tras cada lote; <code>logs</code> trae la pérdida <b>media acumulada de la época</b> hasta este lote (no la del lote suelto). Útil para detectar <code>nan</code> (así funciona <code>TerminateOnNaN</code>).",
    on_test_begin: "Empieza la validación (o <code>evaluate</code>). Se llama al final de cada época cuando hay <code>validation_data</code>.",
    on_test_batch_begin: "Antes de cada lote de validación.",
    on_test_batch_end: "Tras cada lote de validación.",
    on_test_end: "Termina la validación de esta época. Ya existen las métricas <code>val_*</code>.",
    on_epoch_end: "Al terminar la época: <code>logs</code> trae <code>loss</code>, las métricas y <code>val_loss</code>… Aquí viven <code>EarlyStopping</code>, <code>ModelCheckpoint</code> y <code>ReduceLROnPlateau</code>. Se puede parar con <code>self.model.stop_training = True</code>.",
    on_train_end: "Una vez, al final (o cuando se pidió parar). Sitio para cerrar ficheros, restaurar los mejores pesos (lo hace <code>EarlyStopping</code>) o guardar un resumen."
  };
  function build() {
    var ev = [{ n: "on_train_begin", a: "", d: 0 }], e, b;
    for (e = 0; e < S.E; e++) {
      ev.push({ n: "on_epoch_begin", a: "epoch=" + e, d: 1 });
      for (b = 0; b < S.B; b++) { ev.push({ n: "on_train_batch_begin", a: "batch=" + b, d: 2 }); ev.push({ n: "on_train_batch_end", a: "batch=" + b + ", logs={loss}", d: 2 }); }
      if (S.val) {
        ev.push({ n: "on_test_begin", a: "", d: 2 }); ev.push({ n: "on_test_batch_begin", a: "batch=0", d: 3 }); ev.push({ n: "on_test_batch_end", a: "batch=0", d: 3 }); ev.push({ n: "on_test_end", a: "logs={loss}", d: 2 });
      }
      ev.push({ n: "on_epoch_end", a: "epoch=" + e + ", logs={loss" + (S.val ? ", val_loss" : "") + "}", d: 1 });
    }
    ev.push({ n: "on_train_end", a: "", d: 0 });
    S.ev = ev; S.pos = -1;
  }
  var ui = api.controls(root);
  ui.slider({ label: "Épocas (epochs)", min: 1, max: 3, step: 1, value: S.E, onInput: function (v) { S.E = v; build(); update(); } });
  ui.slider({ label: "Lotes de entrenamiento por época", min: 1, max: 4, step: 1, value: S.B, onInput: function (v) { S.B = v; build(); update(); } });
  ui.toggle({ label: "con validation_data", value: S.val, onChange: function (v) { S.val = v; build(); update(); } });
  ui.button("Paso ▶", function () { if (S.pos < S.ev.length - 1) S.pos++; update(); }, "primary");
  ui.button("Hasta el final de la época", function () {
    if (S.pos >= S.ev.length - 1) return;
    do { S.pos++; } while (S.pos < S.ev.length - 1 && S.ev[S.pos].n !== "on_epoch_end"); update();
  });
  ui.button("Reiniciar", function () { S.pos = -1; update(); });
  var box = api.el("div", { class: "lab-readout", style: { maxHeight: "250px", overflowY: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(.7rem, 2.9vw, .82rem)", lineHeight: "1.55", padding: ".5rem .7rem" } });
  root.appendChild(box);
  var out = api.readout(root);

  function update() {
    var html = "", i, cur = null;
    S.ev.forEach(function (e, i) {
      var on = i === S.pos, done = i < S.pos;
      var st = "padding-left:" + (e.d * 1.1) + "rem;" + (on ? "background:var(--terracota);color:var(--paper);font-weight:700;border-radius:3px;" : (done ? "color:var(--ink);" : "color:var(--muted);opacity:.65;"));
      html += "<div id='cb" + i + "' style='" + st + "'>" + (on ? "▶ " : (done ? "✓ " : "· ")) + e.n + "(" + e.a + ")</div>";
    });
    box.innerHTML = html;
    if (S.pos >= 0) { var node = box.querySelector("#cb" + S.pos); if (node) box.scrollTop = Math.max(0, node.offsetTop - box.clientHeight / 2); }
    else box.scrollTop = 0;
    if (S.pos >= 0) cur = S.ev[S.pos];
    var nTrain = S.ev.filter(function (e) { return e.n === "on_train_batch_end"; }).length;
    out.set(cur ? "<b>" + cur.n + "</b> — " + INFO[cur.n] : "Pulsa <b>Paso ▶</b> para ver la primera llamada. En total, para " + S.E + " épocas × " + S.B + " lotes" + (S.val ? " con validación" : "") + " Keras hará <b>" + S.ev.length + "</b> llamadas a ganchos (" + nTrain + " fines de lote de entrenamiento).");
  }
  build(); update();
});
