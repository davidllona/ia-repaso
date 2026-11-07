/* =========================================================================
   Cuaderno de IA · cuenta y sincronización del progreso
   - Inicia sesión con correo y contraseña (Supabase Auth).
   - La sesión se queda guardada: sigues dentro hasta que pulses «Cerrar sesión».
   - El progreso (lecciones marcadas) se fusiona entre dispositivos:
     para cada lección gana el cambio más reciente.
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.CUADERNO_CUENTA || {};
  var DONE_KEY = "cuaderno-ia:hecho:v1";
  var CHANGES_KEY = "cuaderno-ia:cambios:v1";
  /* supabase-js 2.45.4 (MIT) incluido en la web: no depende de ningún CDN */
  var ROOT = document.body.getAttribute("data-root") || "";
  var SDK = ROOT + "assets/vendor/supabase/supabase.js";
  var TABLE = "progreso";

  var btn = document.getElementById("cuenta-btn");
  if (!btn) return;
  var label = btn.querySelector(".cuenta-label");
  var configured = !!(CFG.url && CFG.anonKey);
  var client = null, user = null, pushTimer = null, syncing = false;

  /* ---------- almacenamiento local ---------- */
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* Estado local completo: clave → [valor, fecha]. Lo marcado antes de existir el registro cuenta con fecha 0. */
  function localState() {
    var done = readJSON(DONE_KEY), ch = readJSON(CHANGES_KEY), out = {};
    Object.keys(done).forEach(function (k) { out[k] = [1, 0]; });
    Object.keys(ch).forEach(function (k) { var e = ch[k]; if (Array.isArray(e) && e.length === 2) out[k] = [e[0] ? 1 : 0, +e[1] || 0]; });
    return out;
  }
  function merge(a, b) {
    var out = {}, k;
    for (k in a) out[k] = a[k];
    for (k in b) {
      if (!out[k] || b[k][1] > out[k][1] || (b[k][1] === out[k][1] && b[k][0] > out[k][0])) out[k] = b[k];
    }
    return out;
  }
  function applyLocal(state) {
    var done = {}, before = JSON.stringify(readJSON(DONE_KEY));
    Object.keys(state).forEach(function (k) { if (state[k][0]) done[k] = 1; });
    writeJSON(CHANGES_KEY, state);
    writeJSON(DONE_KEY, done);
    return JSON.stringify(done) !== before; // ¿ha cambiado lo que se ve?
  }

  /* ---------- sincronización ---------- */
  function pull() {
    return client.from(TABLE).select("datos").eq("user_id", user.id).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return (r.data && r.data.datos && r.data.datos.c) || {}; });
  }
  function push(state) {
    return client.from(TABLE).upsert({ user_id: user.id, datos: { v: 1, c: state }, actualizado: new Date().toISOString() })
      .then(function (r) { if (r.error) throw r.error; });
  }
  function sync(reloadIfChanged) {
    if (!client || !user || syncing) return Promise.resolve();
    syncing = true; setStatus("sync");
    return pull().then(function (remote) {
      var merged = merge(localState(), remote);
      var changed = applyLocal(merged);
      return push(merged).then(function () {
        setStatus("ok");
        if (changed && reloadIfChanged) location.reload();
      });
    }).catch(function (e) { setStatus("error", e && e.message); })
      .then(function () { syncing = false; });
  }
  window.addEventListener("cuaderno:progreso", function () {
    if (!user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync(false); }, 1200);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && user) sync(true);
  });

  /* ---------- botón de la barra ---------- */
  var lastStatus = "";
  function setStatus(s, msg) {
    lastStatus = s;
    btn.classList.toggle("is-in", !!user);
    btn.classList.toggle("is-error", s === "error");
    if (!user) { label.textContent = "Entrar"; btn.title = "Inicia sesión para guardar tu progreso en todos tus dispositivos"; btn.setAttribute("aria-label", "Entrar en tu cuenta"); return; }
    btn.setAttribute("aria-label", "Tu cuenta (" + user.email + ")");
    var name = (user.email || "").split("@")[0];
    label.textContent = name.length > 12 ? name.slice(0, 11) + "…" : name;
    btn.title = s === "sync" ? "Sincronizando…" : s === "error" ? "No se pudo sincronizar: " + (msg || "") : "Progreso sincronizado (" + user.email + ")";
    var st = document.querySelector(".cuenta-modal .cm-sync");
    if (st) st.textContent = s === "sync" ? "Sincronizando…" : s === "error" ? "⚠ No se pudo sincronizar. Se reintentará." : "✓ Tu progreso está guardado en la nube.";
  }

  /* ---------- ventana de cuenta ---------- */
  var dlg = null;
  function h(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function openModal(view) {
    if (!dlg) {
      dlg = h("dialog", { class: "cuenta-modal", "aria-labelledby": "cm-title" });
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    }
    render(view || (user ? "perfil" : "entrar"));
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  function closeBtn() { return '<button type="button" class="cm-close" aria-label="Cerrar">×</button>'; }
  function render(view) {
    var html = "";
    if (!configured) {
      html = closeBtn() + '<h2 id="cm-title">Tu cuenta</h2><p>La cuenta aún no está activada en esta web, así que el progreso se guarda solo en este navegador.</p><p class="cm-note">Para activarla hay que pegar los datos de Supabase en <code>assets/js/cuenta-config.js</code> (instrucciones en <code>docs/CUENTA_Y_SINCRONIZACION.md</code>).</p>';
    } else if (view === "perfil") {
      html = closeBtn() + '<h2 id="cm-title">Tu cuenta</h2><p>Has iniciado sesión como <strong>' + esc(user.email) + '</strong>. Seguirás dentro en este dispositivo hasta que cierres sesión.</p><p class="cm-sync" role="status"></p><div class="cm-actions"><button type="button" class="btn" data-act="sync">Sincronizar ahora</button><button type="button" class="btn" data-act="salir">Cerrar sesión</button></div>';
    } else if (view === "nueva") {
      html = closeBtn() + '<h2 id="cm-title">Nueva contraseña</h2><form data-form="nueva"><label>Contraseña nueva<input type="password" name="pass" autocomplete="new-password" minlength="6" required></label><p class="cm-msg" role="alert"></p><button class="btn primary" type="submit">Guardar contraseña</button></form>';
    } else {
      var reg = view === "registro", olv = view === "olvido";
      html = closeBtn() + '<h2 id="cm-title">' + (reg ? "Crear cuenta" : olv ? "Recuperar contraseña" : "Entrar") + '</h2>' +
        '<p class="cm-note">' + (olv ? "Te enviaremos un correo con un enlace para poner una contraseña nueva." : "Con tu cuenta, las lecciones que marques se guardan y las ves igual en el móvil, la tablet y el ordenador.") + '</p>' +
        '<form data-form="' + (reg ? "registro" : olv ? "olvido" : "entrar") + '">' +
        '<label>Correo<input type="email" name="email" autocomplete="email" required></label>' +
        (olv ? "" : '<label>Contraseña<input type="password" name="pass" autocomplete="' + (reg ? "new-password" : "current-password") + '" minlength="6" required></label>') +
        '<p class="cm-msg" role="alert"></p>' +
        '<button class="btn primary" type="submit">' + (reg ? "Crear cuenta" : olv ? "Enviar enlace" : "Entrar") + '</button></form>' +
        '<p class="cm-links">' + (reg || olv ? '<a href="#" data-go="entrar">Ya tengo cuenta</a>' : '<a href="#" data-go="registro">Crear cuenta</a> · <a href="#" data-go="olvido">He olvidado la contraseña</a>') + '</p>';
    }
    dlg.innerHTML = html;
    var c = dlg.querySelector(".cm-close"); if (c) c.addEventListener("click", function () { dlg.close(); });
    dlg.querySelectorAll("[data-go]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); render(a.getAttribute("data-go")); }); });
    dlg.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("data-act") === "sync") sync(true);
        else client.auth.signOut().then(function () { dlg.close(); });
      });
    });
    var f = dlg.querySelector("form"); if (f) f.addEventListener("submit", onSubmit);
    if (view === "perfil") setStatus(lastStatus || "ok");
    var first = dlg.querySelector("input"); if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function traducir(m) {
    m = String(m || "");
    if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
    if (/Email not confirmed/i.test(m)) return "Aún no has confirmado tu correo: abre el enlace que te enviamos.";
    if (/already registered|already been registered/i.test(m)) return "Ese correo ya tiene cuenta. Pulsa «Ya tengo cuenta».";
    if (/at least 6/i.test(m)) return "La contraseña debe tener al menos 6 caracteres.";
    if (/rate limit/i.test(m)) return "Demasiados intentos seguidos. Espera un minuto.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sin conexión. Inténtalo de nuevo.";
    return m;
  }
  function onSubmit(e) {
    e.preventDefault();
    var f = e.target, kind = f.getAttribute("data-form"), msg = f.querySelector(".cm-msg"), b = f.querySelector("button[type=submit]");
    var email = f.email ? f.email.value.trim() : "", pass = f.pass ? f.pass.value : "";
    var back = location.origin + location.pathname;
    msg.textContent = ""; b.disabled = true;
    var p;
    if (kind === "entrar") p = client.auth.signInWithPassword({ email: email, password: pass });
    else if (kind === "registro") p = client.auth.signUp({ email: email, password: pass, options: { emailRedirectTo: back } });
    else if (kind === "olvido") p = client.auth.resetPasswordForEmail(email, { redirectTo: back });
    else p = client.auth.updateUser({ password: pass });
    p.then(function (r) {
      b.disabled = false;
      if (r.error) { msg.textContent = traducir(r.error.message); return; }
      if (kind === "registro" && !r.data.session) { msg.className = "cm-msg ok"; msg.textContent = "Cuenta creada. Revisa tu correo y pulsa el enlace de confirmación; después ya puedes entrar."; return; }
      if (kind === "olvido") { msg.className = "cm-msg ok"; msg.textContent = "Listo: revisa tu correo (y la carpeta de spam)."; return; }
      if (kind === "nueva") { msg.className = "cm-msg ok"; msg.textContent = "Contraseña cambiada."; setTimeout(function () { render("perfil"); }, 900); return; }
      dlg.close();
    }).catch(function (err) { b.disabled = false; msg.textContent = traducir(err && err.message); });
  }

  btn.addEventListener("click", function () { openModal(); });
  setStatus("");

  /* ---------- arranque ---------- */
  if (!configured) return;
  var sc = document.createElement("script");
  sc.src = SDK; sc.async = true;
  sc.onload = function () {
    if (!window.supabase || !window.supabase.createClient) return;
    client = window.supabase.createClient(CFG.url, CFG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "cuaderno-ia:sesion" }
    });
    client.auth.onAuthStateChange(function (event, session) {
      var prev = user;
      user = session ? session.user : null;
      setStatus(user ? "ok" : "");
      if (event === "PASSWORD_RECOVERY") { openModal("nueva"); return; }
      if (user && (!prev || prev.id !== user.id)) setTimeout(function () { sync(true); }, 0);
      if (dlg && dlg.open && !user) render("entrar");
    });
  };
  sc.onerror = function () { label.textContent = "Entrar"; btn.title = "No se pudo cargar el servicio de cuentas (¿sin conexión?)."; };
  document.head.appendChild(sc);
})();
