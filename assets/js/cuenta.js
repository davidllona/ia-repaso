/* =========================================================================
   Cuaderno de IA · cuenta y sincronización del progreso (Firebase)
   - Correo y contraseña con Firebase Authentication (API REST, sin librerías).
   - La sesión se queda guardada en el navegador: sigues dentro hasta que
     pulses «Cerrar sesión» (el token se renueva solo).
   - El progreso se guarda en Firestore, en progreso/{tu-uid}, y se fusiona
     entre dispositivos: para cada lección gana el cambio más reciente.
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.CUADERNO_CUENTA || {};
  var DONE_KEY = "cuaderno-ia:hecho:v1";
  var CHANGES_KEY = "cuaderno-ia:cambios:v1";
  var SESSION_KEY = "cuaderno-ia:sesion:v1";
  var configured = !!(CFG.apiKey && CFG.projectId);
  var AUTH = "https://identitytoolkit.googleapis.com/v1/accounts:";
  var TOKEN = "https://securetoken.googleapis.com/v1/token?key=";
  var DOCS = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(CFG.projectId || "") + "/databases/(default)/documents/progreso/";

  var btn = document.getElementById("cuenta-btn");
  if (!btn) return;
  var label = btn.querySelector(".cuenta-label");
  var session = null, pushTimer = null, syncing = false, lastStatus = "";

  /* ---------- almacenamiento local ---------- */
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function loadSession() { try { var s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return s && s.refreshToken ? s : null; } catch (e) { return null; } }
  function saveSession(s) { session = s; try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  /* ---------- Firebase Auth (REST) ---------- */
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j.error && j.error.message) || ("HTTP " + r.status)); return j; }); });
  }
  function fromAuth(j) {
    return { uid: j.localId, email: j.email, idToken: j.idToken, refreshToken: j.refreshToken, exp: Date.now() + (parseInt(j.expiresIn, 10) || 3600) * 1000 };
  }
  function signIn(email, pass) { return post(AUTH + "signInWithPassword?key=" + CFG.apiKey, { email: email, password: pass, returnSecureToken: true }).then(fromAuth); }
  function signUp(email, pass) { return post(AUTH + "signUp?key=" + CFG.apiKey, { email: email, password: pass, returnSecureToken: true }).then(fromAuth); }
  function sendReset(email) { return post(AUTH + "sendOobCode?key=" + CFG.apiKey, { requestType: "PASSWORD_RESET", email: email }); }
  function idToken() {
    if (!session) return Promise.reject(new Error("Sin sesión"));
    if (session.idToken && Date.now() < session.exp - 60000) return Promise.resolve(session.idToken);
    return fetch(TOKEN + CFG.apiKey, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(session.refreshToken) })
      .then(function (r) { return r.json().then(function (j) {
        if (!r.ok) { var m = (j.error && j.error.message) || ""; if (/TOKEN_EXPIRED|USER_DISABLED|USER_NOT_FOUND|INVALID_REFRESH_TOKEN/.test(m)) { saveSession(null); setStatus(""); } throw new Error(m || "HTTP " + r.status); }
        saveSession({ uid: j.user_id, email: session.email, idToken: j.id_token, refreshToken: j.refresh_token, exp: Date.now() + (parseInt(j.expires_in, 10) || 3600) * 1000 });
        return session.idToken;
      }); });
  }

  /* ---------- Firestore (REST): un documento por usuario ---------- */
  function pull() {
    return idToken().then(function (t) {
      return fetch(DOCS + session.uid, { headers: { Authorization: "Bearer " + t } });
    }).then(function (r) {
      if (r.status === 404) return {};
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
        try { return (JSON.parse(j.fields.datos.stringValue) || {}).c || {}; } catch (e) { return {}; }
      });
    });
  }
  function push(state) {
    return idToken().then(function (t) {
      return fetch(DOCS + session.uid, {
        method: "PATCH", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { datos: { stringValue: JSON.stringify({ v: 1, c: state }) }, email: { stringValue: session.email || "" }, actualizado: { timestampValue: new Date().toISOString() } } })
      });
    }).then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error((j.error && j.error.message) || "HTTP " + r.status); }); });
  }

  /* ---------- fusión ---------- */
  function localState() {
    var done = readJSON(DONE_KEY), ch = readJSON(CHANGES_KEY), out = {};
    Object.keys(done).forEach(function (k) { out[k] = [1, 0]; });
    Object.keys(ch).forEach(function (k) { var e = ch[k]; if (Array.isArray(e) && e.length === 2) out[k] = [e[0] ? 1 : 0, +e[1] || 0]; });
    return out;
  }
  function merge(a, b) {
    var out = {}, k;
    for (k in a) out[k] = a[k];
    for (k in b) if (Array.isArray(b[k]) && (!out[k] || b[k][1] > out[k][1] || (b[k][1] === out[k][1] && b[k][0] > out[k][0]))) out[k] = [b[k][0] ? 1 : 0, +b[k][1] || 0];
    return out;
  }
  function applyLocal(state) {
    var done = {}, before = JSON.stringify(readJSON(DONE_KEY));
    Object.keys(state).forEach(function (k) { if (state[k][0]) done[k] = 1; });
    writeJSON(CHANGES_KEY, state); writeJSON(DONE_KEY, done);
    return JSON.stringify(done) !== before;
  }
  function sync(reloadIfChanged) {
    if (!session || syncing) return Promise.resolve();
    syncing = true; setStatus("sync");
    return pull().then(function (remote) {
      var merged = merge(localState(), remote), changed = applyLocal(merged);
      return push(merged).then(function () { setStatus("ok"); if (changed && reloadIfChanged) location.reload(); });
    }).catch(function (e) { setStatus(session ? "error" : "", e && e.message); })
      .then(function () { syncing = false; });
  }
  window.addEventListener("cuaderno:progreso", function () {
    if (!session) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync(false); }, 1200);
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && session) sync(true); });

  /* ---------- botón de la barra ---------- */
  function setStatus(s, msg) {
    lastStatus = s;
    btn.classList.toggle("is-in", !!session);
    btn.classList.toggle("is-error", s === "error");
    if (!session) { label.textContent = "Entrar"; btn.title = "Inicia sesión para guardar tu progreso en todos tus dispositivos"; btn.setAttribute("aria-label", "Entrar en tu cuenta"); return; }
    var name = (session.email || "").split("@")[0];
    label.textContent = name.length > 12 ? name.slice(0, 11) + "…" : name;
    btn.setAttribute("aria-label", "Tu cuenta (" + session.email + ")");
    btn.title = s === "sync" ? "Sincronizando…" : s === "error" ? "No se pudo sincronizar: " + (msg || "") : "Progreso sincronizado (" + session.email + ")";
    var st = document.querySelector(".cuenta-modal .cm-sync");
    if (st) st.textContent = s === "sync" ? "Sincronizando…" : s === "error" ? "⚠ No se pudo sincronizar (" + traducir(msg) + "). Se reintentará." : "✓ Tu progreso está guardado en la nube.";
  }

  /* ---------- ventana de cuenta ---------- */
  var dlg = null;
  function openModal(view) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "cuenta-modal"; dlg.setAttribute("aria-labelledby", "cm-title");
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    }
    render(view || (session ? "perfil" : "entrar"));
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function closeBtn() { return '<button type="button" class="cm-close" aria-label="Cerrar">×</button>'; }
  function render(view) {
    var html;
    if (!configured) {
      html = closeBtn() + '<h2 id="cm-title">Tu cuenta</h2><p>La cuenta aún no está activada en esta web, así que el progreso se guarda solo en este navegador.</p><p class="cm-note">Para activarla hay que pegar la configuración de Firebase en <code>assets/js/cuenta-config.js</code> (instrucciones en <code>docs/CUENTA_Y_SINCRONIZACION.md</code>).</p>';
    } else if (view === "perfil") {
      html = closeBtn() + '<h2 id="cm-title">Tu cuenta</h2><p>Has iniciado sesión como <strong>' + esc(session.email) + '</strong>. Seguirás dentro en este dispositivo hasta que cierres sesión.</p><p class="cm-sync" role="status"></p><div class="cm-actions"><button type="button" class="btn" data-act="sync">Sincronizar ahora</button><button type="button" class="btn" data-act="salir">Cerrar sesión</button></div>';
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
        else { saveSession(null); setStatus(""); dlg.close(); }
      });
    });
    var f = dlg.querySelector("form"); if (f) f.addEventListener("submit", onSubmit);
    if (view === "perfil") setStatus(lastStatus || "ok");
    var first = dlg.querySelector("input"); if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function traducir(m) {
    m = String(m || "");
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(m)) return "Correo o contraseña incorrectos.";
    if (/EMAIL_EXISTS/.test(m)) return "Ese correo ya tiene cuenta. Pulsa «Ya tengo cuenta».";
    if (/WEAK_PASSWORD/.test(m)) return "La contraseña debe tener al menos 6 caracteres.";
    if (/INVALID_EMAIL/.test(m)) return "Ese correo no parece válido.";
    if (/TOO_MANY_ATTEMPTS/.test(m)) return "Demasiados intentos seguidos. Espera un poco.";
    if (/OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/.test(m)) return "El acceso con correo y contraseña no está activado en Firebase.";
    if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(m)) return "Las reglas de Firestore no permiten guardar.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Sin conexión. Inténtalo de nuevo.";
    return m;
  }
  function onSubmit(e) {
    e.preventDefault();
    var f = e.target, kind = f.getAttribute("data-form"), msg = f.querySelector(".cm-msg"), b = f.querySelector("button[type=submit]");
    var email = f.email.value.trim(), pass = f.pass ? f.pass.value : "";
    msg.className = "cm-msg"; msg.textContent = ""; b.disabled = true;
    var p = kind === "entrar" ? signIn(email, pass) : kind === "registro" ? signUp(email, pass) : sendReset(email);
    p.then(function (res) {
      b.disabled = false;
      if (kind === "olvido") { msg.className = "cm-msg ok"; msg.textContent = "Listo: revisa tu correo (y la carpeta de spam)."; return; }
      saveSession(res); setStatus("ok"); dlg.close(); sync(true);
    }).catch(function (err) { b.disabled = false; msg.textContent = traducir(err && err.message); });
  }

  btn.addEventListener("click", function () { openModal(); });
  if (configured) session = loadSession();
  setStatus(session ? "ok" : "");
  if (session) sync(true);
})();
