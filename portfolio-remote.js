/* =====================================================================
   portfolio-remote.js
   Conecta el portafolio con Supabase usando solo fetch (sin librerías).
   Si config.js está vacío, todo esto queda apagado y el sitio funciona
   en "modo local" con data.js.
   ===================================================================== */
(function (root) {
  'use strict';

  var cfg = root.PF_CONFIG || {};
  /* Acepta la dirección tal como se copie y deja solo https://TU-PROYECTO.supabase.co */
  function normalizeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    var link = u.match(/https?:\/\/[^\s\[\]()'"]+/i);   /* por si se pegó como enlace [texto](url) */
    if (link) u = link[0];
    var m = u.match(/dashboard\/project\/([a-z0-9]+)/i);
    if (m) return 'https://' + m[1].toLowerCase() + '.supabase.co';
    if (!/^https?:\/\//i.test(u)) u = /^[a-z0-9]{12,30}$/i.test(u) ? 'https://' + u.toLowerCase() + '.supabase.co' : 'https://' + u;
    try { return new URL(u).origin; } catch (e) { return u.replace(/\/+$/, ''); }
  }
  var URL_ = normalizeUrl(cfg.supabaseUrl);
  var KEY = String(cfg.supabaseAnonKey || '').trim();
  var TABLE = cfg.table || 'portfolio_content';
  var BUCKET = cfg.bucket || 'portfolio-media';
  var SESSION_KEY = 'pf_session_v1';

  function enabled() { return !!(URL_ && KEY); }
  function headers(token, extra) {
    var h = { apikey: KEY };
    /* Las claves nuevas (sb_publishable_…) no son JWT: van solo en apikey. */
    if (token) h.Authorization = 'Bearer ' + token; else if (/^eyJ/.test(KEY)) h.Authorization = 'Bearer ' + KEY;
    for (var k in (extra || {})) h[k] = extra[k];
    return h;
  }

  /* ---------- Respuestas y errores ---------- */
  function parse(res) {
    return res.text().then(function (t) {
      var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; }
      if (!res.ok) {
        var e = new Error((d && (d.error_description || d.msg || d.message || d.error)) || ('Error ' + res.status));
        e.status = res.status; e.body = d;
        try { e.path = new URL(res.url).pathname; } catch (x) { e.path = ''; }
        throw e;
      }
      return d;
    });
  }
  function authError() { var e = new Error('Tu sesión terminó. Vuelve a entrar.'); e.status = 401; e.auth = true; return e; }

  /* ---------- Sesión (solo para el panel) ---------- */
  function readSession() { try { return JSON.parse(root.localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function storeSession(r) {
    var s = { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + ((r.expires_in || 3600) * 1000) - 30000, email: (r.user && r.user.email) || '' };
    try { root.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
    return s;
  }
  function clearSession() { try { root.localStorage.removeItem(SESSION_KEY); } catch (e) { /* noop */ } }

  function signIn(email, password) {
    return fetch(URL_ + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: headers(null, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: email, password: password })
    }).then(parse).then(storeSession);
  }
  function refresh() {
    var s = readSession();
    if (!s || !s.refresh_token) return Promise.reject(authError());
    return fetch(URL_ + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: headers(null, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(parse).then(storeSession).catch(function () { clearSession(); throw authError(); });
  }
  function getSession() {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    if (Date.now() < s.expires_at) return Promise.resolve(s);
    return refresh().catch(function () { return null; });
  }
  function signOut() {
    var s = readSession(); clearSession();
    if (s && s.access_token) fetch(URL_ + '/auth/v1/logout', { method: 'POST', headers: headers(s.access_token) }).catch(function () { /* noop */ });
  }

  /* Petición con la sesión del dueño; si el token venció, lo renueva una vez. */
  function authed(path, opts) {
    opts = opts || {};
    function run(token) {
      var o = {}; for (var k in opts) o[k] = opts[k];
      o.headers = headers(token, opts.headers);
      return fetch(URL_ + path, o);
    }
    return getSession().then(function (s) {
      if (!s) throw authError();
      return run(s.access_token).then(function (res) {
        if (res.status !== 401) return res;
        return refresh().then(function (n) { return run(n.access_token); });
      });
    }).then(parse);
  }

  /* ---------- Contenido ---------- */
  function fetchContent() {
    return fetch(URL_ + '/rest/v1/' + TABLE + '?id=eq.1&select=data,updated_at', { headers: headers() })
      .then(parse).then(function (rows) { return rows && rows[0] ? rows[0] : null; });
  }
  function saveContent(data) {
    return authed('/rest/v1/' + TABLE + '?on_conflict=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 1, data: data, updated_at: new Date().toISOString() })
    });
  }

  /* ---------- Fotos ---------- */
  function publicUrl(path) { return URL_ + '/storage/v1/object/public/' + BUCKET + '/' + path; }
  function uploadImage(blob) {
    var path = 'foto-' + Date.now() + '.jpg';
    return authed('/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg', 'cache-control': 'max-age=31536000' }, body: blob
    }).then(function () { return publicUrl(path); });
  }

  root.PFR = {
    host: URL_.replace(/^https?:\/\//, ''), enabled: enabled, fetchContent: fetchContent, saveContent: saveContent, uploadImage: uploadImage,
    signIn: signIn, signOut: signOut, getSession: getSession, session: readSession, publicUrl: publicUrl
  };
})(window);
