/* Experimento: Recomendar por vecinos: quién se parece a ti */
Lab.register("curso1/c1m4-recomendador", function (root, api) {
//NOPRELUDE
var GEN = ["Acción", "SciFi", "Romance", "Comedia", "Terror"];
var USERS = [
  { n: "Lucía",  t: [8, 9, 2, 3, 1], f: ["Interstellar", "Blade Runner 2049"] },
  { n: "Marcos", t: [9, 7, 1, 4, 3], f: ["Mad Max: Fury Road", "Interstellar"] },
  { n: "Sara",   t: [2, 1, 9, 8, 1], f: ["Notting Hill", "Mamma Mia!"] },
  { n: "Pablo",  t: [1, 2, 8, 9, 2], f: ["Mamma Mia!", "Superbad"] },
  { n: "Irene",  t: [3, 2, 1, 4, 9], f: ["El resplandor", "Hereditary"] },
  { n: "Diego",  t: [7, 9, 3, 1, 4], f: ["Matrix", "Interstellar"] },
  { n: "Eva",    t: [6, 5, 5, 5, 5], f: ["Matrix", "Superbad"] }
];
var SEEN = ["Mad Max: Fury Road", "Matrix"];
var me = [9, 8, 2, 2, 3], K = 3;

var ui = api.controls(root);
GEN.forEach(function (g, i) {
  ui.slider({ label: "Tu gusto por «" + g + "» (0-10)", min: 0, max: 10, step: 1, value: me[i], onInput: function (v) { me[i] = v; update(); } });
});
ui.slider({ label: "K: cuántos vecinos consultas", min: 1, max: 5, step: 1, value: K, onInput: function (v) { K = v; update(); } });
var view = api.view(root, { aspect: 1.5, minH: 270, maxH: 330, label: "Distancia de cada persona a tus gustos; las más cercanas son tus vecinos" });
var out = api.readout(root);
var ranked = [];

function rank() {
  ranked = USERS.map(function (u) {
    var s = 0; for (var i = 0; i < 5; i++) s += (u.t[i] - me[i]) * (u.t[i] - me[i]);
    return { u: u, d: Math.sqrt(s) };
  }).sort(function (a, b) { return a.d - b.d; });
}
function draw(ctx, w, h, C) {
  var D = api.d, top = 18, rows = ranked.length, rh = (h - top - 6) / rows, i, maxd = Math.sqrt(5 * 100);
  var x0 = Math.min(150, w * 0.42), x1 = w - 46;
  for (i = 0; i < rows; i++) {
    var r = ranked[i], y = top + i * rh, isN = i < K, bw = Math.max(2, (x1 - x0) * r.d / maxd);
    if (isN) D.rect(ctx, 2, y + 1, w - 4, rh - 2, C.cobaltoWash, null);
    D.text(ctx, r.u.n, 8, y + rh * 0.45, { size: 12.5, weight: isN ? 700 : 500, color: C.ink });
    D.text(ctx, "(" + r.u.t.join(", ") + ")", 8, y + rh * 0.82, { size: 10.5, mono: true, color: C.ink2 });
    D.rect(ctx, x0, y + rh * 0.25, bw, rh * 0.5, isN ? C.cobalto : C.muted, null);
    D.text(ctx, r.d.toFixed(2), x0 + bw + 5, y + rh * 0.62, { size: 11.5, mono: true, weight: isN ? 700 : 400, color: C.ink });
  }
  D.text(ctx, "distancia euclídea a tus gustos", x0, top - 6, { size: 10.5, color: C.ink2 });
}
function update() {
  rank();
  var nb = ranked.slice(0, K), votes = {}, order = [];
  nb.forEach(function (r) { r.u.f.forEach(function (f) { if (SEEN.indexOf(f) < 0) { if (!votes[f]) { votes[f] = 0; order.push(f); } votes[f]++; } }); });
  order.sort(function (a, b) { return votes[b] - votes[a]; });
  view.redraw();
  out.set("Tus gustos (" + GEN.join(", ") + ") = <b>(" + me.join(", ") + ")</b> · ya has visto: " + SEEN.join(" y ") + "<br>" +
    "Tus " + K + " vecinos: <b>" + nb.map(function (r) { return r.u.n + " (" + r.d.toFixed(2) + ")"; }).join(", ") + "</b><br>" +
    (order.length ? "Recomendación (películas que gustaron a tus vecinos y no has visto): <b>" + order.map(function (f) { return f + " ×" + votes[f]; }).join(", ") + "</b>" :
      "Tus vecinos no tienen ninguna película que tú no hayas visto."));
}
rank(); view.draw(draw); update();

});
