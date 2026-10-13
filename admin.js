/* =====================================================================
   admin.js — Panel de administración del portafolio
   - Edita el contenido de data.js sin tocar código.
   - Guarda un borrador automático en este navegador.
   - "Publicar" descarga un data.js nuevo para reemplazar el del sitio.
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'pf_draft_v1';
  var esc = PF.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- Estado ---------- */
  var REMOTE = !!(window.PFR && window.PFR.enabled());
  var published, publishedJson, baseData;
  function setPublished(d) {
    baseData = clone(d || {});
    published = PF.normalize(clone(d || {}));
    publishedJson = JSON.stringify(published);
  }
  setPublished(window.PORTFOLIO_DATA || {});
  var AUTO_KEY = 'pf_autopublish_v1', autoTimer = null, publishing = false;
  var S, currentView = 'inicio', saveTimer = null, undoSnapshot = null, pendingFocus = null;

  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    S = PF.normalize(d ? d : clone(baseData));
    S.diplomasTitle = S.diplomasTitle || 'Diplomados de Postgrado';
    S.badgesTitle = S.badgesTitle || 'Insignias & Certificaciones';
    return !!d && JSON.stringify(S) !== publishedJson;
  }

  /* ---------- Acceso a datos por ruta (ej. "experience.2.title") ---------- */
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, S);
  }
  function parent(path) {
    var parts = path.split('.'); var last = parts.pop();
    return { obj: parts.reduce(function (o, k) { return o[k]; }, S), key: last };
  }
  function set(path, v) { var p = parent(path); p.obj[p.key] = v; }

  /* ---------- Guardado automático ---------- */
  function isDirty() { return JSON.stringify(S) !== publishedJson; }
  function setStatus(kind) {
    var el = $('#saveState'); if (!el) return;
    var map = {
      saved: ['check_circle', 'Cambios guardados en este navegador', 'text-secondary'],
      saving: ['sync', 'Guardando…', 'text-on-surface-variant'],
      publishing: ['cloud_sync', 'Publicando…', 'text-primary'],
      error: ['error', 'No se pudo guardar', 'text-error']
    }[kind];
    if (REMOTE && kind === 'saved') map = isDirty() ? ['edit_note', 'Borrador guardado · sin publicar', 'text-tertiary'] : ['check_circle', 'Todo publicado', 'text-secondary'];
    el.innerHTML = '<span class="material-symbols-outlined text-[18px] ' + map[2] + '">' + map[0] + '</span>' + map[1];
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); setStatus('saved'); }
    catch (e) { setStatus('error'); toast('No se pudo guardar el borrador. Si subiste una foto muy pesada, prueba con una más liviana.', { type: 'error' }); }
    $('#dirtyDot').classList.toggle('hidden', !isDirty());
    if (REMOTE) { setStatus('saved'); scheduleAuto(); }
  }
  function autoOn() { try { return localStorage.getItem(AUTO_KEY) === '1'; } catch (e) { return false; } }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!autoOn() || !isDirty() || problems().length) return;
    autoTimer = setTimeout(function () { publishNow({ silent: true }); }, 2500);
  }
  function flushSave() { clearTimeout(saveTimer); save(); }
  function touch() { setStatus('saving'); clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); }

  /* ---------- Avisos y ventanas ---------- */
  function toast(msg, o) {
    o = o || {};
    var t = document.createElement('div');
    var tone = o.type === 'error' ? 'border-error/60' : o.type === 'ok' ? 'border-secondary/60' : 'border-outline-variant/60';
    var ic = o.type === 'error' ? 'error' : o.type === 'ok' ? 'check_circle' : 'info';
    var icColor = o.type === 'error' ? 'text-error' : o.type === 'ok' ? 'text-secondary' : 'text-primary';
    t.className = 'pop pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-highest border ' + tone + ' shadow-2xl text-body-sm font-body-sm text-on-surface w-full';
    t.innerHTML = '<span class="material-symbols-outlined text-[20px] ' + icColor + '">' + ic + '</span><span class="flex-1">' + esc(msg) + '</span>' +
      (o.action ? '<button type="button" class="px-2.5 py-1 rounded-md text-primary hover:bg-primary/10 font-semibold">' + esc(o.action) + '</button>' : '');
    $('#toasts').appendChild(t);
    var gone = function () { if (t.parentNode) t.parentNode.removeChild(t); };
    if (o.action) $('button', t).addEventListener('click', function () { o.onAction(); gone(); });
    setTimeout(gone, o.action ? 8000 : 4000);
  }

  function openModal(html, opts) {
    opts = opts || {};
    var root = $('#modal-root');
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70';
    wrap.innerHTML = '<div role="dialog" aria-modal="true" class="pop w-full ' + (opts.wide || 'max-w-lg') + ' max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container border border-outline-variant/50 shadow-2xl">' + html + '</div>';
    root.appendChild(wrap);
    var close = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    $$('[data-close]', wrap).forEach(function (b) { b.addEventListener('click', close); });
    var f = $('[autofocus], button, input', wrap); if (f) f.focus();
    return { el: wrap, close: close };
  }

  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var m = openModal('<div class="p-6 space-y-4"><h2 class="text-title-lg font-title-lg text-on-surface">' + esc(o.title) + '</h2>' +
        '<p class="text-body-md text-on-surface-variant">' + esc(o.text) + '</p>' +
        '<div class="flex justify-end gap-3 pt-2"><button type="button" data-no class="px-4 py-2 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md">Cancelar</button>' +
        '<button type="button" data-yes class="px-4 py-2 rounded-lg ' + (o.danger ? 'bg-error-container text-on-error-container' : 'bg-primary text-on-primary') + ' text-label-md font-label-md font-bold">' + esc(o.confirm) + '</button></div></div>');
      $('[data-no]', m.el).addEventListener('click', function () { m.close(); resolve(false); });
      $('[data-yes]', m.el).addEventListener('click', function () { m.close(); resolve(true); });
    });
  }

  /* ---------- Piezas de formulario ---------- */
  var INPUT = 'w-full rounded-lg bg-surface-container-lowest border border-outline-variant/60 px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-colors';

  function fid(path) { return 'f-' + path.replace(/[^\w]/g, '-'); }

  function field(o) {
    var id = fid(o.path), val = get(o.path);
    if (o.fmt === 'csv' && Array.isArray(val)) val = val.join(', ');
    if (o.fmt === 'lines' && Array.isArray(val)) val = val.join('\n');
    if (val == null) val = '';
    var bind = 'data-bind="' + o.path + '"' + (o.fmt ? ' data-fmt="' + o.fmt + '"' : '');
    var type = o.type || 'text', control = '', counter = '';
    if (o.count) counter = '<p class="text-label-sm font-label-sm text-on-surface-variant text-right" data-counter-for="' + id + '" data-range="' + o.count.join('-') + '"></p>';
    if (type === 'textarea') {
      control = '<textarea id="' + id + '" ' + bind + ' rows="' + (o.rows || 3) + '" class="' + INPUT + ' resize-y leading-relaxed" placeholder="' + esc(o.ph || '') + '">' + esc(val) + '</textarea>';
    } else if (type === 'range') {
      control = '<div class="flex items-center gap-4"><input id="' + id + '" ' + bind + ' data-fmt="int" type="range" min="0" max="100" step="1" value="' + esc(val) + '" class="flex-1 h-2">' +
        '<output data-range-out="' + id + '" class="w-14 text-right text-title-lg font-title-lg text-primary">' + esc(val) + '%</output></div>';
    } else if (type === 'toggle') {
      return '<label class="flex items-start gap-4 cursor-pointer"><span class="relative inline-flex shrink-0 mt-0.5"><input id="' + id + '" ' + bind + ' type="checkbox" class="sr-only peer" ' + (val ? 'checked' : '') + '>' +
        '<span class="w-11 h-6 rounded-full bg-surface-container-highest border border-outline-variant/60 peer-checked:bg-secondary-container peer-checked:border-secondary transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary"></span>' +
        '<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-surface transition-transform peer-checked:translate-x-5"></span></span>' +
        '<span><span class="block text-label-md font-label-md text-on-surface">' + o.label + '</span>' + (o.help ? '<span class="block text-body-sm text-on-surface-variant">' + o.help + '</span>' : '') + '</span></label>';
    } else {
      control = '<input id="' + id + '" ' + bind + ' type="' + type + '" value="' + esc(val) + '" class="' + INPUT + '" placeholder="' + esc(o.ph || '') + '" ' + (o.inputmode ? 'inputmode="' + o.inputmode + '"' : '') + ' autocomplete="off">';
    }
    return '<div class="space-y-1.5"><label for="' + id + '" class="block text-label-md font-label-md text-on-surface">' + o.label + '</label>' +
      (o.help ? '<p class="text-body-sm font-body-sm text-on-surface-variant">' + o.help + '</p>' : '') + control + counter + '</div>';
  }

  function iconLabel(id) {
    var b = PF.brandById(id); if (b) return b.label;
    for (var i = 0; i < PF.MATERIAL.length; i++) if (PF.MATERIAL[i][0] === id) return PF.MATERIAL[i][1];
    return id || 'Elegir icono';
  }
  function iconBtnInner(id) {
    return '<span class="w-9 h-9 shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">' + PF.icon(id, 20) + '</span>' +
      '<span class="flex-1 text-body-md text-on-surface truncate">' + esc(iconLabel(id)) + '</span><span class="text-label-sm font-label-sm text-primary">Cambiar</span>';
  }
  function iconField(path, label, scope, help) {
    return '<div class="space-y-1.5"><span class="block text-label-md font-label-md text-on-surface">' + label + '</span>' +
      (help ? '<p class="text-body-sm text-on-surface-variant">' + help + '</p>' : '') +
      '<button type="button" data-act="pick-icon" data-path="' + path + '" data-scope="' + scope + '" data-iconbtn="' + path + '" class="flex items-center gap-3 w-full sm:w-72 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 hover:border-primary text-left transition-colors">' +
      iconBtnInner(get(path)) + '</button></div>';
  }
  function colorField(path, label) {
    var v = get(path) || 'primary';
    return '<div class="space-y-1.5"><span class="block text-label-md font-label-md text-on-surface">' + label + '</span>' +
      '<div class="flex items-center gap-2.5" role="radiogroup" aria-label="' + esc(label) + '">' +
      PF.COLOR_KEYS.map(function (k) {
        var c = PF.COLORS[k];
        return '<button type="button" role="radio" aria-checked="' + (k === v) + '" data-act="pick-color" data-path="' + path + '" data-val="' + k + '" title="' + c.label + '" aria-label="' + c.label + '" ' +
          'class="w-9 h-9 rounded-full border-2 ' + (k === v ? 'border-on-surface scale-110' : 'border-transparent opacity-80 hover:opacity-100') + ' transition-all" style="background:' + c.hex + '"></button>';
      }).join('') + '</div></div>';
  }

  function intro(title, text) {
    return '<div class="mb-8"><h2 class="text-headline-md font-headline-md text-on-surface">' + title + '</h2><p class="mt-2 text-body-lg font-body-lg text-on-surface-variant max-w-2xl">' + text + '</p></div>';
  }
  function card(inner, cls) { return '<div class="glass-panel rounded-2xl p-5 lg:p-6 space-y-5 ' + (cls || '') + '">' + inner + '</div>'; }
  function cardTitle(icon, title, help) {
    return '<div class="flex items-start gap-3"><span class="p-2 rounded-lg bg-surface-container-high text-primary border border-primary/30 flex"><span class="material-symbols-outlined text-[20px]">' + icon + '</span></span>' +
      '<div><h3 class="text-title-lg font-title-lg text-on-surface">' + title + '</h3>' + (help ? '<p class="text-body-sm text-on-surface-variant mt-0.5">' + help + '</p>' : '') + '</div></div>';
  }

  /* ---------- Listas editables (trabajos, estudios, herramientas…) ---------- */
  var LISTS = {
    'experience': {
      add: 'Agregar un trabajo', icon: 'work', unshift: true, view: 'experiencia',
      empty: 'Todavía no hay trabajos. Agrega el primero para armar tu trayectoria.',
      blank: function () { return { title: '', company: '', period: '', desc: '', current: false, color: 'primary' }; },
      title: function (i) { return i.title || 'Trabajo sin cargo'; },
      sub: function (i) { return [i.company, i.period].filter(Boolean).join(' · ') || 'Completa los datos de este trabajo'; },
      fields: function (p) {
        return '<div class="grid sm:grid-cols-2 gap-4">' +
          field({ path: p + '.title', label: 'Cargo', ph: 'Ej.: Gerente de Operaciones' }) +
          field({ path: p + '.company', label: 'Empresa', ph: 'Ej.: Mi Empresa C.A.' }) + '</div>' +
          field({ path: p + '.period', label: 'Período', help: 'Escríbelo como quieras que se vea.', ph: 'Ej.: 2021 – Actualidad' }) +
          field({ path: p + '.desc', label: 'Qué hiciste y qué lograste', type: 'textarea', rows: 4, count: [60, 260], ph: 'Describe tus funciones principales y un resultado concreto.' }) +
          '<div class="grid sm:grid-cols-2 gap-5 items-start">' + colorField(p + '.color', 'Color del punto en la línea de tiempo') +
          field({ path: p + '.current', label: 'Es mi trabajo actual', help: 'Resalta la etiqueta del período.', type: 'toggle' }) + '</div>';
      }
    },
    'education': {
      add: 'Agregar estudios', icon: 'school', view: 'educacion',
      empty: 'Agrega tu título universitario o tu formación principal.',
      blank: function () { return { title: '', institution: '', desc: '' }; },
      title: function (i) { return i.title || 'Estudio sin título'; },
      sub: function (i) { return i.institution || 'Completa los datos'; },
      fields: function (p) {
        return field({ path: p + '.title', label: 'Título o carrera', ph: 'Ej.: Ingeniería en Sistemas' }) +
          field({ path: p + '.institution', label: 'Institución', ph: 'Ej.: Universidad Central' }) +
          field({ path: p + '.desc', label: 'Descripción (opcional)', type: 'textarea', rows: 3, ph: 'Qué aprendiste o en qué te especializaste.' });
      }
    },
    'diplomas': {
      add: 'Agregar curso o diplomado', icon: 'menu_book', view: 'educacion',
      empty: 'Aún no hay cursos o diplomados.',
      blank: function () { return { name: '', desc: '' }; },
      title: function (i) { return i.name || 'Curso sin nombre'; },
      sub: function (i) { return i.desc ? i.desc.slice(0, 60) + (i.desc.length > 60 ? '…' : '') : 'Agrega una breve descripción'; },
      fields: function (p) {
        return field({ path: p + '.name', label: 'Nombre del curso o diplomado', ph: 'Ej.: Auditoría Informática' }) +
          field({ path: p + '.desc', label: 'Qué cubre', type: 'textarea', rows: 2, ph: 'Una frase corta.' });
      }
    },
    'badges': {
      add: 'Agregar insignia', icon: 'workspace_premium', max: 8, view: 'educacion',
      empty: 'Aún no hay insignias. Aquí van tus certificaciones (por ejemplo, de n8n o HubSpot).',
      blank: function () { return { label: '', icon: 'workspace_premium' }; },
      title: function (i) { return i.label || 'Insignia sin nombre'; },
      sub: function (i) { return iconLabel(i.icon); },
      fields: function (p) {
        return field({ path: p + '.label', label: 'Nombre de la certificación', ph: 'Ej.: HubSpot Partner' }) +
          iconField(p + '.icon', 'Logo o icono', 'any', 'Si es una marca conocida, elige su logo.');
      }
    },
    'skills': {
      add: 'Agregar herramienta o habilidad', icon: 'bolt', view: 'competencias',
      empty: 'Agrega las herramientas y habilidades que más dominas.',
      blank: function () { return { title: '', subtitle: '', level: 80, desc: '', icon: 'bolt', color: PF.COLOR_KEYS[S.skills.length % 4] }; },
      title: function (i) { return i.title || 'Habilidad sin nombre'; },
      sub: function (i) { return (i.level || 0) + '% · ' + (i.subtitle || 'Sin subtítulo'); },
      fields: function (p) {
        return '<div class="grid sm:grid-cols-2 gap-4">' + field({ path: p + '.title', label: 'Nombre', ph: 'Ej.: Automatización con Make' }) +
          field({ path: p + '.subtitle', label: 'Subtítulo corto', ph: 'Ej.: Integraciones y flujos' }) + '</div>' +
          field({ path: p + '.level', label: 'Nivel de dominio', type: 'range', help: 'Sé honesta: un nivel creíble genera más confianza.' }) +
          field({ path: p + '.desc', label: 'Qué haces con ella', type: 'textarea', rows: 3, count: [60, 220] }) +
          '<div class="grid sm:grid-cols-2 gap-5 items-start">' + iconField(p + '.icon', 'Logo o icono', 'any') + colorField(p + '.color', 'Color') + '</div>';
      }
    },
    'cases': {
      add: 'Agregar un caso de éxito', icon: 'workspace_premium', view: 'casos',
      empty: 'Agrega un proyecto donde resolviste un problema real y mediste el resultado.',
      blank: function () { return { category: '', title: '', chips: [], challenge: '', solution: '', solutionIcon: 'hub', results: [], color: PF.COLOR_KEYS[S.cases.length % 3] }; },
      title: function (i) { return i.title || 'Caso sin título'; },
      sub: function (i) { return i.category || 'Sin categoría'; },
      fields: function (p) {
        return field({ path: p + '.title', label: 'Título del caso', ph: 'Ej.: Automatización del proceso de facturación' }) +
          field({ path: p + '.category', label: 'Categoría', help: 'Aparece sobre el título, después de «Caso 01 •».', ph: 'Ej.: Automatización & Finanzas' }) +
          field({ path: p + '.chips', label: 'Herramientas usadas', fmt: 'csv', help: 'Sepáralas con comas. Las marcas conocidas muestran su logo solas.', ph: 'Make, HubSpot, REST API' }) +
          field({ path: p + '.challenge', label: 'El desafío', type: 'textarea', rows: 3, count: [80, 300], help: 'Qué problema tenía el cliente.' }) +
          field({ path: p + '.solution', label: 'La solución', type: 'textarea', rows: 3, count: [80, 300], help: 'Qué construiste o implementaste.' }) +
          field({ path: p + '.results', label: 'Resultados', type: 'textarea', rows: 4, fmt: 'lines', help: 'Un resultado por línea. Usa **doble asterisco** para poner en negrita las cifras.', ph: '**80% menos** tiempo de proceso\nSin errores de captura' }) +
          '<div class="grid sm:grid-cols-2 gap-5 items-start">' + iconField(p + '.solutionIcon', 'Icono de la solución', 'material') + colorField(p + '.color', 'Color de la tarjeta') + '</div>';
      }
    },
    'phases': {
      add: 'Agregar fase', icon: 'route', max: 6, view: 'metodologia',
      empty: 'Describe los pasos de tu forma de trabajar.',
      blank: function () { return { title: '', desc: '', tag: '', icon: 'lightbulb', color: PF.COLOR_KEYS[S.phases.length % 4] }; },
      title: function (i) { return i.title || 'Fase sin título'; },
      sub: function (i) { return i.tag || 'Sin etiqueta'; },
      fields: function (p) {
        return field({ path: p + '.title', label: 'Nombre de la fase', ph: 'Ej.: Diagnóstico' }) +
          field({ path: p + '.desc', label: 'Qué haces en esta fase', type: 'textarea', rows: 3, count: [60, 220] }) +
          field({ path: p + '.tag', label: 'Frase final', help: 'Aparece al pie de la tarjeta.', ph: 'Ej.: Diagnóstico de fricción' }) +
          '<div class="grid sm:grid-cols-2 gap-5 items-start">' + iconField(p + '.icon', 'Icono', 'material') + colorField(p + '.color', 'Color') + '</div>';
      }
    },
    'profile.stats': {
      add: 'Agregar cifra', icon: 'monitoring', max: 4, view: 'perfil', noOrder: false,
      empty: 'Agrega cifras que destaquen tu experiencia (máximo 4).',
      blank: function () { return { value: '', label: '' }; },
      title: function (i) { return i.value || 'Cifra vacía'; },
      sub: function (i) { return i.label || 'Sin descripción'; },
      fields: function (p) {
        return '<div class="grid sm:grid-cols-2 gap-4">' + field({ path: p + '.value', label: 'Cifra', ph: 'Ej.: +10 Años' }) +
          field({ path: p + '.label', label: 'Qué significa', ph: 'Ej.: Experiencia ejecutiva' }) + '</div>';
      }
    }
  };

  function listCard(key, i, open) {
    var L = LISTS[key], arr = get(key), it = arr[i];
    var btn = 'p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-highest disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors';
    var b = function (act, ic, label, dis) {
      return '<button type="button" data-act="' + act + '" data-list="' + key + '" data-idx="' + i + '" class="' + btn + (act === 'del' ? ' hover:!text-error' : '') + '" aria-label="' + label + '" title="' + label + '"' + (dis ? ' disabled' : '') + '><span class="material-symbols-outlined text-[18px]">' + ic + '</span></button>';
    };
    return '<details class="group rounded-xl bg-surface-container-low/80 border border-outline-variant/40 open:border-primary/40 transition-colors" data-item="' + key + ':' + i + '"' + (open ? ' open' : '') + '>' +
      '<summary class="flex items-center gap-3 px-4 py-3 rounded-xl">' +
      '<span class="material-symbols-outlined text-[20px] text-primary">' + L.icon + '</span>' +
      '<span class="min-w-0 flex-1"><span class="block truncate text-title-lg font-title-lg text-on-surface" data-sum-title>' + esc(L.title(it)) + '</span>' +
      '<span class="block truncate text-label-sm font-label-sm text-on-surface-variant" data-sum-sub>' + esc(L.sub(it)) + '</span></span>' +
      '<span class="flex items-center">' + b('up', 'arrow_upward', 'Subir', i === 0) + b('down', 'arrow_downward', 'Bajar', i === arr.length - 1) + b('dup', 'content_copy', 'Duplicar') + b('del', 'delete', 'Eliminar') + '</span>' +
      '<span class="chev material-symbols-outlined text-[22px] text-on-surface-variant">expand_more</span></summary>' +
      '<div class="px-4 pb-5 pt-2 space-y-5 border-t border-outline-variant/30">' + L.fields(key + '.' + i) + '</div></details>';
  }

  function listHtml(key) {
    var L = LISTS[key], arr = get(key) || [];
    var cards = arr.map(function (_, i) { return listCard(key, i, pendingFocus === key + ':' + i); }).join('');
    var empty = arr.length ? '' : '<div class="rounded-xl border border-dashed border-outline-variant/60 p-6 text-center text-body-md text-on-surface-variant">' + L.empty + '</div>';
    var canAdd = !L.max || arr.length < L.max;
    return '<div class="space-y-3" data-listwrap="' + key + '">' + cards + empty + '</div>' +
      (canAdd ? '<button type="button" data-act="add" data-list="' + key + '" class="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-primary/60 text-primary hover:bg-primary/10 text-label-md font-label-md transition-colors"><span class="material-symbols-outlined text-[20px]">add</span>' + L.add + '</button>'
        : '<p class="mt-3 text-body-sm text-on-surface-variant">Llegaste al máximo de ' + L.max + ' elementos.</p>');
  }

  /* ---------- Salud del perfil (consejos para mejorarlo) ---------- */
  function len(s) { return String(s || '').trim().length; }
  function health() {
    var p = S.profile, c = S.contact, out = [];
    var add = function (label, ok, tip, view) { out.push({ label: label, ok: !!ok, tip: tip, view: view }); };
    add('Tu foto está cargada', p.photo, 'Una foto clara, de frente y con buena luz genera confianza desde el primer segundo.', 'foto');
    add('Tu titular dice qué haces (15 a 80 caracteres)', len(p.headline) >= 15 && len(p.headline) <= 80, 'Resume en una frase a quién ayudas y cómo.', 'perfil');
    add('Tu presentación tiene entre 120 y 320 caracteres', len(p.bio) >= 120 && len(p.bio) <= 320, 'Cuenta qué haces, cuántos años llevas y qué resultados logras.', 'perfil');
    add('Muestras al menos 3 cifras destacadas', p.stats.filter(function (s) { return s.value && s.label; }).length >= 3, 'Los números concretos (años, porcentajes, clientes) dan credibilidad.', 'perfil');
    add('Tienes 3 o más trabajos en tu trayectoria', S.experience.length >= 3, 'Agrega tus roles más relevantes, del más reciente al más antiguo.', 'experiencia');
    add('Cada trabajo tiene una descripción de 60+ caracteres', S.experience.length && S.experience.every(function (e) { return len(e.desc) >= 60; }), 'Explica qué hiciste y qué lograste en cada cargo.', 'experiencia');
    add('Registraste tu educación', S.education.length >= 1, 'Agrega tu título principal y la institución.', 'educacion');
    add('Listaste 3 o más herramientas o habilidades', S.skills.length >= 3, 'Prioriza las que más pide el tipo de cliente que quieres atraer.', 'competencias');
    add('Tienes al menos un caso de éxito con 2 resultados', S.cases.some(function (k) { return k.results && k.results.length >= 2; }), 'Los casos con resultados medibles son lo que más convence.', 'casos');
    add('Tus resultados incluyen números', S.cases.length && S.cases.every(function (k) { return (k.results || []).some(function (r) { return /\d/.test(r); }); }), 'Ejemplo: «80% menos tiempo», «25 horas ahorradas por semana».', 'casos');
    add('Tu WhatsApp, correo y LinkedIn están completos', digitsOk(c.whatsapp) && c.email && c.linkedin, 'Facilita que te contacten por el canal que prefieran.', 'contacto');
    add('Hay un enlace para descargar tu CV', c.cv, 'El botón «Descargar CV» funciona mejor con un PDF.', 'contacto');
    return out;
  }
  function digitsOk(x) { return PF.digits(x).length >= 8; }

  /* ---------- Problemas antes de publicar ---------- */
  function problems() {
    var out = [];
    if (!len(S.profile.name)) out.push({ text: 'Falta tu nombre.', view: 'perfil' });
    S.experience.forEach(function (e, i) { if (!len(e.title) || !len(e.company)) out.push({ text: 'El trabajo #' + (i + 1) + ' necesita cargo y empresa.', view: 'experiencia' }); });
    S.education.forEach(function (e, i) { if (!len(e.title)) out.push({ text: 'Los estudios #' + (i + 1) + ' no tienen título.', view: 'educacion' }); });
    S.skills.forEach(function (e, i) { if (!len(e.title)) out.push({ text: 'La habilidad #' + (i + 1) + ' no tiene nombre.', view: 'competencias' }); });
    S.cases.forEach(function (e, i) { if (!len(e.title)) out.push({ text: 'El caso #' + (i + 1) + ' no tiene título.', view: 'casos' }); });
    return out;
  }

  /* ---------- Vistas ---------- */
  var VIEWS = [
    { id: 'inicio', label: 'Resumen', icon: 'dashboard' },
    { id: 'perfil', label: 'Mi perfil', icon: 'person' },
    { id: 'foto', label: 'Mi foto', icon: 'photo_camera' },
    { id: 'contacto', label: 'Contacto y redes', icon: 'call' },
    { id: 'experiencia', label: 'Experiencia laboral', icon: 'work_history', count: function () { return S.experience.length; } },
    { id: 'educacion', label: 'Educación y certificados', icon: 'school', count: function () { return S.education.length + S.diplomas.length + S.badges.length; } },
    { id: 'competencias', label: 'Herramientas y habilidades', icon: 'bolt', count: function () { return S.skills.length; } },
    { id: 'casos', label: 'Casos de éxito', icon: 'workspace_premium', count: function () { return S.cases.length; } },
    { id: 'metodologia', label: 'Método de trabajo', icon: 'route', count: function () { return S.phases.length; } },
    { id: 'textos', label: 'Títulos y textos', icon: 'edit_note' },
    { id: 'publicar', label: 'Publicar y respaldo', icon: 'cloud_upload' }
  ];

  function renderMenu() {
    $('#menu').innerHTML = VIEWS.map(function (v) {
      var on = v.id === currentView;
      return '<button type="button" data-view="' + v.id + '" ' + (on ? 'aria-current="page"' : '') + ' class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left text-label-md font-label-md transition-colors border-l-2 ' +
        (on ? 'bg-surface-container-high text-primary border-primary' : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface') + '">' +
        '<span class="material-symbols-outlined text-[20px]">' + v.icon + '</span><span class="flex-1">' + v.label + '</span>' +
        (v.count ? '<span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-label-sm font-label-sm text-on-surface-variant">' + v.count() + '</span>' : '') + '</button>';
    }).join('');
    $('#siteName').textContent = S.profile.name || 'Panel de administración';
  }

  var RENDER = {};

  RENDER.inicio = function () {
    var h = health(), done = h.filter(function (x) { return x.ok; }).length, pct = Math.round(done / h.length * 100);
    var first = (S.profile.name || '').split(' ')[0];
    var pending = h.filter(function (x) { return !x.ok; });
    var quick = [
      ['experience', 'work_history', 'Agregar un trabajo', 'Suma un cargo nuevo a tu trayectoria.'],
      ['education', 'school', 'Agregar estudios', 'Registra un título o formación.'],
      ['photo', 'photo_camera', 'Cambiar mi foto', 'Sube y encuadra una foto nueva.'],
      ['bio', 'person', 'Mejorar mi presentación', 'Edita tu titular y tu descripción.']
    ];
    return intro('Hola' + (first ? ', ' + esc(first) : ''), 'Desde aquí editas todo tu portafolio sin tocar código. Cambia lo que quieras y, cuando estés lista, pulsa <strong>Publicar</strong>.') +
      '<div class="space-y-6">' +
      card('<div class="flex flex-col sm:flex-row sm:items-center gap-5"><div class="flex-1 space-y-2"><div class="flex items-baseline justify-between"><h3 class="text-title-lg font-title-lg text-on-surface">Qué tan completo está tu perfil</h3><span class="text-headline-sm font-headline-sm text-primary font-bold">' + pct + '%</span></div>' +
        '<div class="h-2.5 rounded-full bg-surface-container-highest overflow-hidden" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div class="h-2.5 rounded-full bg-gradient-to-r from-primary-container to-primary" style="width:' + pct + '%"></div></div>' +
        '<p class="text-body-sm text-on-surface-variant">' + (pending.length ? 'Te faltan ' + pending.length + ' mejoras para que tu portafolio convenza más.' : 'Tu perfil está completo. Revisa que todo siga actualizado.') + '</p></div></div>' +
        (pending.length ? '<ul class="space-y-2">' + pending.slice(0, 5).map(function (x) {
          return '<li><button type="button" data-act="goto" data-view="' + x.view + '" class="w-full flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/80 border border-outline-variant/30 hover:border-primary/60 text-left transition-colors">' +
            '<span class="material-symbols-outlined text-[20px] text-tertiary mt-0.5">lightbulb</span><span class="flex-1"><span class="block text-label-md font-label-md text-on-surface">' + esc(x.label) + '</span><span class="block text-body-sm text-on-surface-variant">' + esc(x.tip) + '</span></span>' +
            '<span class="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span></button></li>';
        }).join('') + '</ul>' : '') +
        (done ? '<details class="text-body-sm text-on-surface-variant"><summary class="inline-flex items-center gap-1 text-primary hover:underline">Ver lo que ya está bien (' + done + ')</summary><ul class="mt-2 space-y-1">' + h.filter(function (x) { return x.ok; }).map(function (x) { return '<li class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px] text-secondary">check_circle</span>' + esc(x.label) + '</li>'; }).join('') + '</ul></details>' : '')) +
      '<div><h3 class="text-title-lg font-title-lg text-on-surface mb-3">Acciones rápidas</h3><div class="grid sm:grid-cols-2 gap-3">' +
      quick.map(function (q) {
        var act = q[0] === 'photo' ? 'goto" data-view="foto' : q[0] === 'bio' ? 'goto" data-view="perfil' : 'goto-add" data-list="' + q[0];
        return '<button type="button" data-act="' + act + '" class="glass-card-interactive flex items-start gap-3 p-4 rounded-xl text-left"><span class="p-2 rounded-lg bg-surface-container-high text-primary flex"><span class="material-symbols-outlined text-[22px]">' + q[1] + '</span></span>' +
          '<span><span class="block text-title-lg font-title-lg text-on-surface">' + q[2] + '</span><span class="block text-body-sm text-on-surface-variant">' + q[3] + '</span></span></button>';
      }).join('') + '</div></div>' +
      card('<div class="flex items-start gap-3"><span class="material-symbols-outlined text-[22px] text-secondary">info</span><div class="text-body-md text-on-surface-variant space-y-1"><p><strong class="text-on-surface">Tus cambios se guardan solos</strong> en este navegador, así que puedes cerrar y volver cuando quieras.</p>' +
        '<p>Para que los visitantes los vean, usa <strong class="text-on-surface">Vista previa</strong> para revisarlos y luego <strong class="text-on-surface">Publicar</strong> para subirlos a tu sitio.</p></div></div>') + '</div>';
  };

  RENDER.perfil = function () {
    return intro('Mi perfil', 'Es lo primero que ve quien entra a tu portafolio. Escribe con claridad y piensa en tu cliente ideal.') + '<div class="space-y-6">' +
      card(cardTitle('badge', 'Quién eres', 'Aparece en la parte superior de la página.') +
        '<div class="grid sm:grid-cols-2 gap-4">' + field({ path: 'profile.name', label: 'Tu nombre', ph: 'Nombre y apellido' }) +
        field({ path: 'site.navName', label: 'Nombre en el menú superior', help: 'Si lo dejas vacío, se usa tu nombre.' }) + '</div>' +
        field({ path: 'profile.headline', label: 'Titular (lo que haces, en una frase)', count: [15, 80], help: 'Aparece junto a tu nombre, con color.', ph: 'Ej.: Arquitectura de Procesos & RevOps con IA' }) +
        field({ path: 'profile.bio', label: 'Presentación', type: 'textarea', rows: 4, count: [120, 320], help: 'Para resaltar palabras con color, rodéalas con asteriscos: <code class="px-1 rounded bg-surface-container-highest">*Make*</code>.', ph: 'Cuenta qué haces, cuántos años de experiencia tienes y qué resultados logras.' })) +
      card(cardTitle('verified', 'Disponibilidad', 'Mensajes cortos que generan confianza.') +
        field({ path: 'profile.badge', label: 'Mensaje sobre tu titular', ph: 'Ej.: Perfil verificado y disponible para consultoría' }) +
        field({ path: 'profile.available', label: 'Mostrar «Disponible» sobre mi foto', help: 'Muestra un indicador verde sobre la foto.', type: 'toggle' }) +
        field({ path: 'profile.statusLabel', label: 'Texto del indicador', ph: 'Ej.: En línea / Disponible' })) +
      card(cardTitle('monitoring', 'Cifras destacadas', 'Hasta 4 números que resuman tu trayectoria.') + listHtml('profile.stats')) +
      card('<details><summary class="flex items-center gap-2 text-label-md font-label-md text-primary"><span class="material-symbols-outlined text-[20px]">lightbulb</span>Consejos para una buena presentación<span class="chev material-symbols-outlined text-[20px] ml-auto">expand_more</span></summary>' +
        '<ul class="mt-4 space-y-2 text-body-md text-on-surface-variant list-disc pl-5"><li>Empieza por el resultado que logras, no por tu cargo.</li><li>Usa números: años de experiencia, porcentajes de mejora, clientes atendidos.</li><li>Nombra las herramientas que dominas; ayuda a que te encuentren.</li><li>Lee el texto en voz alta: si suena natural, está bien.</li></ul></details>') + '</div>';
  };

  RENDER.foto = function () {
    var p = S.profile, isData = /^data:/.test(p.photo || ''), isUp = /\/storage\/v1\/object\/public\//.test(p.photo || '');
    var kb = isData ? Math.round(p.photo.length * 0.75 / 1024) : 0;
    return intro('Mi foto', 'Sube una foto, muévela para encuadrar tu rostro y acércala o aléjala. Se ajusta sola al tamaño del portafolio.') + '<div class="space-y-6">' +
      '<div class="grid md:grid-cols-2 gap-6">' +
      card(cardTitle('account_circle', 'Foto actual', isData ? 'Subida desde tu equipo · ' + kb + ' KB' : (isUp ? 'Foto subida a tu sitio' : 'Imagen enlazada o por defecto')) +
        '<div class="rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-high aspect-square flex items-center justify-center">' +
        (p.photo ? '<img src="' + esc(p.photo) + '" alt="Foto actual" class="w-full h-full object-cover">' : '<span class="material-symbols-outlined text-[64px] text-on-surface-variant">person</span>') + '</div>' +
        (p.photo ? '<button type="button" data-act="photo-remove" class="inline-flex items-center gap-2 text-label-md font-label-md text-error hover:underline"><span class="material-symbols-outlined text-[18px]">delete</span>Quitar foto</button>' : '')) +
      card(cardTitle('upload', 'Subir una foto nueva', 'JPG, PNG o WebP.') +
        '<label id="photoDrop" class="flex flex-col items-center justify-center gap-2 text-center rounded-xl border-2 border-dashed border-outline-variant/60 hover:border-primary p-8 cursor-pointer transition-colors">' +
        '<span class="material-symbols-outlined text-[36px] text-primary">add_a_photo</span><span class="text-label-md font-label-md text-on-surface">Elegir una imagen</span><span class="text-body-sm text-on-surface-variant">o arrástrala hasta aquí</span>' +
        '<input id="photoFile" type="file" accept="image/*" class="sr-only"></label>' +
        '<div id="cropWrap" class="hidden space-y-4"><p class="text-body-sm text-on-surface-variant">Arrastra la imagen para encuadrarla. Usa el control para acercar o alejar.</p>' +
        '<div class="mx-auto w-full max-w-[320px] rounded-xl overflow-hidden border border-primary/40"><canvas id="cropCanvas" width="320" height="320" class="crop-stage block w-full h-auto"></canvas></div>' +
        '<div class="flex items-center gap-3 max-w-[320px] mx-auto"><span class="material-symbols-outlined text-[20px] text-on-surface-variant">zoom_out</span><input id="cropZoom" type="range" min="1" max="3" step="0.01" value="1" class="flex-1" aria-label="Zoom"><span class="material-symbols-outlined text-[20px] text-on-surface-variant">zoom_in</span></div>' +
        '<div class="flex flex-wrap gap-3 justify-center"><button type="button" id="cropApply" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary text-label-md font-label-md font-bold"><span class="material-symbols-outlined text-[18px]">check</span>Usar esta foto</button>' +
        '<button type="button" id="cropCancel" class="px-4 py-2.5 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md">Cancelar</button></div></div>') + '</div>' +
      card(cardTitle('accessibility_new', 'Detalles de la foto') +
        field({ path: 'profile.photoAlt', label: 'Descripción de la foto', help: 'La leen los lectores de pantalla y aparece si la imagen no carga.', ph: 'Ej.: Retrato profesional de Karina Campos' }) +
        '<div class="space-y-1.5"><label for="photoUrl" class="block text-label-md font-label-md text-on-surface">¿Prefieres usar un enlace de imagen?</label><p class="text-body-sm text-on-surface-variant">Pégalo aquí si tu foto ya está en internet. Sustituye a la actual.</p>' +
        '<div class="flex gap-2"><input id="photoUrl" type="url" class="' + INPUT + '" placeholder="https://…"><button type="button" id="photoUrlBtn" class="px-4 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md">Usar</button></div></div>') + '</div>';
  };

  RENDER.contacto = function () {
    return intro('Contacto y redes', 'Estos datos alimentan los botones de WhatsApp, correo y redes de todo el portafolio.') + '<div class="space-y-6">' +
      card(cardTitle('call', 'WhatsApp y correo') +
        '<div class="grid sm:grid-cols-2 gap-4">' +
        field({ path: 'contact.whatsapp', label: 'Número de WhatsApp', fmt: 'digits', inputmode: 'numeric', help: 'Solo números, con código de país y sin el +.', ph: '584120531095' }) +
        field({ path: 'contact.phoneDisplay', label: 'Cómo se muestra', help: 'Se ve en el botón verde.', ph: '+58 412-0531095' }) + '</div>' +
        field({ path: 'contact.email', label: 'Correo electrónico', type: 'email', ph: 'nombre@correo.com' })) +
      card(cardTitle('share', 'Redes profesionales') +
        field({ path: 'contact.linkedin', label: 'LinkedIn', type: 'url', ph: 'https://www.linkedin.com/in/tu-usuario/', help: 'Déjalo vacío para ocultar el botón.' }) +
        field({ path: 'contact.github', label: 'GitHub', type: 'url', ph: 'https://github.com/tu-usuario', help: 'Déjalo vacío para ocultar el botón.' })) +
      card(cardTitle('description', 'Tu currículum (CV)') +
        field({ path: 'contact.cv', label: 'Enlace o nombre del archivo', ph: 'cv.pdf', help: 'Sube tu PDF junto a los archivos del sitio y escribe aquí su nombre (por ejemplo <strong>cv.pdf</strong>), o pega un enlace completo. Si lo dejas vacío, el botón «Descargar CV» lleva a la sección de contacto.' })) + '</div>';
  };

  RENDER.experiencia = function () {
    return intro('Experiencia laboral', 'Tu trayectoria, del trabajo más reciente al más antiguo. Toca un trabajo para editarlo.') +
      card(listHtml('experience'));
  };

  RENDER.educacion = function () {
    return intro('Educación y certificados', 'Tus estudios, cursos e insignias. Todo lo que respalda lo que sabes hacer.') + '<div class="space-y-6">' +
      card(cardTitle('school', 'Estudios principales', 'Carreras o títulos universitarios.') + listHtml('education')) +
      card(cardTitle('menu_book', 'Cursos y diplomados') + field({ path: 'diplomasTitle', label: 'Título de este bloque' }) + listHtml('diplomas')) +
      card(cardTitle('workspace_premium', 'Insignias y certificaciones') + field({ path: 'badgesTitle', label: 'Título de este bloque' }) + listHtml('badges')) + '</div>';
  };

  RENDER.competencias = function () {
    return intro('Herramientas y habilidades', 'Lo que dominas. Cada tarjeta muestra un logo, una barra de nivel y una breve descripción.') + card(listHtml('skills'));
  };

  RENDER.casos = function () {
    return intro('Casos de éxito', 'Cuenta proyectos reales: el problema, lo que hiciste y el resultado medible. Son lo que más convence a un cliente.') + card(listHtml('cases'));
  };

  RENDER.metodologia = function () {
    return intro('Método de trabajo', 'Los pasos con los que trabajas con tus clientes. Se numeran solos según el orden.') + card(listHtml('phases'));
  };

  RENDER.textos = function () {
    var sec = function (k, name) {
      return '<details class="rounded-xl bg-surface-container-low/80 border border-outline-variant/40"><summary class="flex items-center gap-3 px-4 py-3"><span class="flex-1 text-title-lg font-title-lg text-on-surface">' + name + '</span><span class="chev material-symbols-outlined text-on-surface-variant">expand_more</span></summary><div class="px-4 pb-5 pt-2 space-y-4 border-t border-outline-variant/30">' +
        field({ path: 'sections.' + k + '.eyebrow', label: 'Etiqueta pequeña' }) + field({ path: 'sections.' + k + '.title', label: 'Título' }) +
        field({ path: 'sections.' + k + '.subtitle', label: 'Texto de apoyo', type: 'textarea', rows: 2 }) +
        (k === 'trayectoria' ? field({ path: 'sections.trayectoria.rolesTitle', label: 'Título de la columna de trabajos' }) + field({ path: 'sections.trayectoria.educationTitle', label: 'Título de la columna de estudios' }) : '') + '</div></details>';
    };
    return intro('Títulos y textos', 'Los encabezados de cada sección y los textos generales del sitio.') + '<div class="space-y-6">' +
      card(cardTitle('web', 'Datos generales') + field({ path: 'site.title', label: 'Título de la pestaña del navegador', help: 'Es lo que aparece en Google y en la pestaña.', ph: 'Tu Nombre – Consultora de procesos' }) +
        '<div class="grid sm:grid-cols-2 gap-4">' + field({ path: 'site.footerName', label: 'Nombre en el pie de página' }) + field({ path: 'site.footerCta', label: 'Enlace destacado del pie', ph: 'Reserva Diagnóstico' }) + '</div>') +
      card(cardTitle('view_agenda', 'Encabezados de sección', 'Toca una sección para editar su encabezado.') + '<div class="space-y-3">' +
        sec('metodologia', 'Método de trabajo') + sec('competencias', 'Herramientas y habilidades') + sec('casos', 'Casos de éxito') + sec('trayectoria', 'Trayectoria y credenciales') + '</div>') +
      card(cardTitle('campaign', 'Bloque final de contacto', 'La invitación a contactarte que cierra la página.') +
        field({ path: 'cta.badge', label: 'Etiqueta pequeña' }) + field({ path: 'cta.title', label: 'Título', type: 'textarea', rows: 2 }) + field({ path: 'cta.text', label: 'Texto', type: 'textarea', rows: 3 }) +
        '<div class="grid sm:grid-cols-3 gap-4">' + field({ path: 'cta.whatsappLabel', label: 'Botón de WhatsApp' }) + field({ path: 'cta.linkedinLabel', label: 'Enlace de LinkedIn' }) + field({ path: 'cta.githubLabel', label: 'Enlace de GitHub' }) + '</div>') + '</div>';
  };

  RENDER.publicar = function () { return REMOTE ? publicarRemote() : publicarLocal(); };

  function publicarRemote() {
    var dirty = isDirty(), pr = problems(), ses = window.PFR.session() || {};
    var btn = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md';
    return intro('Publicar y respaldo', 'Con la conexión en línea activa, publicar es un solo clic: tus visitantes ven los cambios al instante, sin subir archivos.') + '<div class="space-y-6">' +
      card('<div class="flex items-center gap-3"><span class="material-symbols-outlined text-[26px] ' + (dirty ? 'text-tertiary' : 'text-secondary') + '">' + (dirty ? 'edit_note' : 'check_circle') + '</span>' +
        '<div><h3 class="text-title-lg font-title-lg text-on-surface">' + (dirty ? 'Tienes cambios sin publicar' : 'Todo está publicado') + '</h3><p class="text-body-sm text-on-surface-variant">' + (dirty ? 'Lo que ves en este panel es distinto de lo que ven tus visitantes.' : 'Tu portafolio público coincide con este panel.') + '</p></div></div>' +
        (pr.length ? '<div class="rounded-xl border border-error/50 bg-error-container/20 p-4 space-y-2"><p class="text-label-md font-label-md text-error">Antes de publicar, revisa esto:</p><ul class="space-y-1">' +
          pr.map(function (x) { return '<li><button type="button" data-act="goto" data-view="' + x.view + '" class="text-body-sm text-on-surface hover:text-primary underline decoration-dotted">' + esc(x.text) + '</button></li>'; }).join('') + '</ul></div>' : '') +
        '<div class="flex flex-wrap gap-3"><button type="button" data-act="publish-now" ' + (dirty ? '' : 'disabled') + ' class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary text-label-md font-label-md font-bold shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"><span class="material-symbols-outlined text-[18px]">cloud_upload</span>Publicar ahora</button>' +
        '<button type="button" data-act="preview" class="' + btn + '"><span class="material-symbols-outlined text-[18px]">visibility</span>Vista previa</button></div>') +
      card(cardTitle('bolt', 'Publicación automática', 'Para quien prefiere no pulsar «Publicar».') +
        '<label class="flex items-start gap-4 cursor-pointer"><span class="relative inline-flex shrink-0 mt-0.5"><input id="autoPub" type="checkbox" class="sr-only peer" ' + (autoOn() ? 'checked' : '') + '>' +
        '<span class="w-11 h-6 rounded-full bg-surface-container-highest border border-outline-variant/60 peer-checked:bg-secondary-container peer-checked:border-secondary transition-colors"></span><span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-surface transition-transform peer-checked:translate-x-5"></span></span>' +
        '<span><span class="block text-label-md font-label-md text-on-surface">Publicar cada cambio automáticamente</span><span class="block text-body-sm text-on-surface-variant">Unos segundos después de editar, el cambio se publica solo (si no hay datos incompletos). Recomendado solo si ya dominas el panel: tus visitantes verán los cambios a medida que los haces.</span></span></label>') +
      card(cardTitle('inventory_2', 'Respaldo', 'Copias de seguridad de tu contenido.') +
        '<div class="flex flex-wrap gap-3"><button type="button" data-act="export" class="' + btn + '"><span class="material-symbols-outlined text-[18px]">save</span>Descargar respaldo</button>' +
        '<label class="' + btn + ' cursor-pointer"><span class="material-symbols-outlined text-[18px]">upload_file</span>Restaurar desde un respaldo<input id="importFile" type="file" accept="application/json,.json" class="sr-only"></label>' +
        '<button type="button" data-act="download" class="' + btn + '"><span class="material-symbols-outlined text-[18px]">download</span>Descargar data.js</button></div>' +
        '<p class="text-body-sm text-on-surface-variant">El archivo <strong class="text-on-surface">data.js</strong> es opcional: si algún día el servicio en línea no responde, el sitio mostrará el contenido de ese archivo. Conviene reemplazarlo de vez en cuando por uno actualizado.</p>') +
      card(cardTitle('restart_alt', 'Volver a lo publicado', 'Descarta los cambios sin publicar y carga lo que ven tus visitantes.') +
        '<button type="button" data-act="discard" ' + (dirty ? '' : 'disabled') + ' class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-error/60 text-error hover:bg-error-container/20 disabled:opacity-40 disabled:hover:bg-transparent text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">undo</span>Descartar mis cambios</button>') +
      '<p class="text-body-sm text-on-surface-variant">Sesión iniciada' + (ses.email ? ' como <strong class="text-on-surface">' + esc(ses.email) + '</strong>' : '') + '. Solo esa cuenta puede publicar cambios.</p></div>';
  }

  function publicarLocal() {
    var dirty = isDirty(), pr = problems();
    var step = function (n, t, body) {
      return '<li class="flex gap-4"><span class="w-8 h-8 shrink-0 rounded-full bg-surface-container-high border border-primary/40 text-primary flex items-center justify-center text-label-md font-label-md font-bold">' + n + '</span><div class="flex-1 space-y-2"><h4 class="text-title-lg font-title-lg text-on-surface">' + t + '</h4>' + body + '</div></li>';
    };
    var big = PF.toDataJs(S).length > 1500000;
    return intro('Publicar y respaldo', 'Tu portafolio público no cambia hasta que reemplaces el archivo <code class="px-1 rounded bg-surface-container-highest">data.js</code> en tu sitio. Son tres pasos.') + '<div class="space-y-6">' +
      card('<div class="flex items-center gap-3"><span class="material-symbols-outlined text-[26px] ' + (dirty ? 'text-tertiary' : 'text-secondary') + '">' + (dirty ? 'edit_note' : 'check_circle') + '</span>' +
        '<div><h3 class="text-title-lg font-title-lg text-on-surface">' + (dirty ? 'Tienes cambios sin publicar' : 'Todo está publicado') + '</h3><p class="text-body-sm text-on-surface-variant">' + (dirty ? 'Lo que ves en este panel es distinto de lo que ven tus visitantes.' : 'Tu portafolio público coincide con este panel.') + '</p></div></div>' +
        (pr.length ? '<div class="rounded-xl border border-error/50 bg-error-container/20 p-4 space-y-2"><p class="text-label-md font-label-md text-error">Antes de publicar, revisa esto:</p><ul class="space-y-1">' +
          pr.map(function (x) { return '<li><button type="button" data-act="goto" data-view="' + x.view + '" class="text-body-sm text-on-surface hover:text-primary underline decoration-dotted">' + esc(x.text) + '</button></li>'; }).join('') + '</ul></div>' : '')) +
      card('<ol class="space-y-6">' +
        step(1, 'Revisa cómo se ve', '<p class="text-body-md text-on-surface-variant">Abre la vista previa para ver tus cambios en computador y en celular.</p><button type="button" data-act="preview" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">visibility</span>Abrir vista previa</button>') +
        step(2, 'Descarga tu archivo actualizado', '<p class="text-body-md text-on-surface-variant">Se descarga un archivo llamado <strong class="text-on-surface">data.js</strong> con todo tu contenido.</p><button type="button" data-act="download" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary text-label-md font-label-md font-bold shadow-lg shadow-primary/20"><span class="material-symbols-outlined text-[18px]">download</span>Descargar data.js</button>' +
          (big ? '<p class="text-body-sm text-tertiary">Tu archivo es grande (probablemente por la foto). Funciona, pero conviene usar una foto más liviana.</p>' : '')) +
        step(3, 'Reemplázalo en tu sitio', '<p class="text-body-md text-on-surface-variant">Sube <strong class="text-on-surface">data.js</strong> a la misma carpeta donde está <strong class="text-on-surface">index.html</strong> y reemplaza el que ya existe (desde el administrador de archivos de tu hosting, FTP o GitHub). Recarga tu portafolio y verás los cambios.</p>') + '</ol>') +
      card(cardTitle('inventory_2', 'Respaldo', 'Guarda una copia por si cambias de computador o navegador.') +
        '<div class="flex flex-wrap gap-3"><button type="button" data-act="export" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">save</span>Descargar respaldo</button>' +
        '<label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/60 hover:border-primary text-on-surface text-label-md font-label-md cursor-pointer"><span class="material-symbols-outlined text-[18px]">upload_file</span>Restaurar desde un respaldo<input id="importFile" type="file" accept="application/json,.json" class="sr-only"></label></div>') +
      card(cardTitle('restart_alt', 'Volver a lo publicado', 'Descarta los cambios de este navegador y carga de nuevo el contenido que está en tu sitio.') +
        '<button type="button" data-act="discard" ' + (dirty ? '' : 'disabled') + ' class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-error/60 text-error hover:bg-error-container/20 disabled:opacity-40 disabled:hover:bg-transparent text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">undo</span>Descartar mis cambios</button>') +
      card('<div class="flex items-start gap-3"><span class="material-symbols-outlined text-[22px] text-primary">bolt</span><div class="text-body-md text-on-surface-variant space-y-1"><p><strong class="text-on-surface">¿Quieres que los cambios se publiquen solos?</strong></p><p>Conecta tu proyecto de Supabase en el archivo <strong class="text-on-surface">config.js</strong> (las instrucciones están en <strong class="text-on-surface">LEEME-supabase.md</strong>). Después, publicar será un solo clic y sin subir archivos.</p></div></div>') + '</div>';
  };

  /* ---------- Navegación ---------- */
  function go(id, opts) {
    if (!RENDER[id]) id = 'inicio';
    currentView = id;
    var v = VIEWS.filter(function (x) { return x.id === id; })[0];
    $('#viewTitle').textContent = v.label;
    document.title = v.label + ' · Panel de administración';
    renderMenu();
    draw();
    closeMenu();
    if (!opts || !opts.keepScroll) window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* noop */ }
  }
  function draw() {
    var view = $('#view');
    view.innerHTML = RENDER[currentView]();
    updateCounters();
    if (currentView === 'foto') initPhoto();
    if (currentView === 'publicar') {
      var f = $('#importFile'); if (f) f.addEventListener('change', importBackup);
      var ap = $('#autoPub');
      if (ap) ap.addEventListener('change', function () {
        try { localStorage.setItem(AUTO_KEY, ap.checked ? '1' : '0'); } catch (e) { /* noop */ }
        toast(ap.checked ? 'Publicación automática activada.' : 'Publicación automática desactivada.', { type: 'ok' }); scheduleAuto();
      });
    }
    if (pendingFocus) {
      var el = $('[data-item="' + pendingFocus + '"]');
      if (el) { el.open = true; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); var i = $('input[type=text],input:not([type]),textarea', el); if (i) setTimeout(function () { i.focus({ preventScroll: true }); }, 250); }
      pendingFocus = null;
    }
    $('#dirtyDot').classList.toggle('hidden', !isDirty());
  }
  function openMenu() { $('#sidebar').classList.remove('-translate-x-full'); $('#scrim').classList.remove('hidden'); }
  function closeMenu() { $('#sidebar').classList.add('-translate-x-full'); $('#scrim').classList.add('hidden'); }

  /* ---------- Contadores de caracteres ---------- */
  function updateCounters(root) {
    $$('[data-counter-for]', root || document).forEach(function (c) {
      var el = document.getElementById(c.dataset.counterFor); if (!el) return;
      var r = c.dataset.range.split('-').map(Number), n = el.value.trim().length;
      var ok = n >= r[0] && n <= r[1];
      c.textContent = n + ' caracteres · ideal entre ' + r[0] + ' y ' + r[1];
      c.className = 'text-label-sm font-label-sm text-right ' + (ok ? 'text-secondary' : 'text-on-surface-variant');
    });
  }

  /* ---------- Eventos de edición ---------- */
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.bind) return;
    var v = t.type === 'checkbox' ? t.checked : t.value, fmt = t.dataset.fmt;
    if (fmt === 'digits') { v = v.replace(/\D/g, ''); if (t.value !== v) t.value = v; }
    else if (fmt === 'int') v = parseInt(v, 10) || 0;
    else if (fmt === 'csv') v = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    else if (fmt === 'lines') v = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    set(t.dataset.bind, v);
    if (t.type === 'range') { var out = $('[data-range-out="' + t.id + '"]'); if (out) out.textContent = v + '%'; }
    var det = t.closest('[data-item]');
    if (det) {
      var parts = det.dataset.item.split(':'), L = LISTS[parts[0]], it = get(parts[0])[+parts[1]];
      $('[data-sum-title]', det).textContent = L.title(it);
      $('[data-sum-sub]', det).textContent = L.sub(it);
    }
    updateCounters(t.parentNode);
    if (t.dataset.bind === 'profile.name' || t.dataset.bind === 'site.navName') $('#siteName').textContent = S.profile.name || 'Panel de administración';
    touch();
  });

  document.addEventListener('click', function (e) {
    var vb = e.target.closest('[data-view]');
    if (vb && !vb.dataset.act) { go(vb.dataset.view); return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    if (b.closest('summary')) e.preventDefault();
    act(b);
  });

  function listIndexOf(key) { return get(key); }

  function act(b) {
    var a = b.dataset.act, key = b.dataset.list, i = +b.dataset.idx, arr = key ? get(key) : null;
    if (a === 'goto') return go(b.dataset.view);
    if (a === 'goto-add') { go(LISTS[key].view); return addItem(key); }
    if (a === 'add') return addItem(key);
    if (a === 'up' || a === 'down') {
      var j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= arr.length) return;
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; pendingFocus = key + ':' + j; touch(); return keepDraw();
    }
    if (a === 'dup') { var cp = clone(arr[i]); arr.splice(i + 1, 0, cp); pendingFocus = key + ':' + (i + 1); touch(); toast('Elemento duplicado.', { type: 'ok' }); return keepDraw(); }
    if (a === 'del') {
      undoSnapshot = JSON.stringify(S); arr.splice(i, 1); touch(); keepDraw(); renderMenu();
      return toast('Elemento eliminado.', { action: 'Deshacer', onAction: function () { S = PF.normalize(JSON.parse(undoSnapshot)); touch(); keepDraw(); renderMenu(); } });
    }
    if (a === 'pick-icon') return pickIcon(b.dataset.path, b.dataset.scope);
    if (a === 'pick-color') {
      set(b.dataset.path, b.dataset.val);
      var p = parent(b.dataset.path); delete p.obj.bar; delete p.obj.companyColor;
      $$('[data-act="pick-color"][data-path="' + b.dataset.path + '"]').forEach(function (x) {
        var on = x === b; x.setAttribute('aria-checked', on);
        x.classList.toggle('border-on-surface', on); x.classList.toggle('scale-110', on); x.classList.toggle('border-transparent', !on); x.classList.toggle('opacity-80', !on);
      });
      return touch();
    }
    if (a === 'publish-now') return publishNow();
    if (a === 'preview') return openPreview();
    if (a === 'download') return download();
    if (a === 'export') return exportBackup();
    if (a === 'discard') return discard();
    if (a === 'photo-remove') { S.profile.photo = ''; touch(); toast('Foto quitada.', { type: 'ok' }); return keepDraw(); }
  }

  function keepDraw() { var y = window.scrollY; draw(); renderMenu(); window.scrollTo(0, y); }

  function addItem(key) {
    var L = LISTS[key], arr = get(key);
    if (L.max && arr.length >= L.max) return;
    var it = L.blank(), idx;
    if (L.unshift) { arr.unshift(it); idx = 0; } else { arr.push(it); idx = arr.length - 1; }
    pendingFocus = key + ':' + idx; touch();
    draw(); renderMenu();
  }

  /* ---------- Selector de logos e iconos ---------- */
  function pickIcon(path, scope) {
    var cur = get(path), tab = scope === 'material' ? 'icons' : (PF.brandById(cur) ? 'brands' : (cur ? 'icons' : 'brands'));
    var m = openModal('<div class="p-5 space-y-4"><div class="flex items-center gap-3"><h2 class="flex-1 text-title-lg font-title-lg text-on-surface">Elige un logo o icono</h2><button type="button" data-close class="p-1.5 rounded-md hover:bg-surface-container-highest" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></div>' +
      (scope === 'any' ? '<div class="flex gap-2" role="tablist"><button type="button" data-tab="brands" class="px-3.5 py-1.5 rounded-full text-label-md font-label-md border">Logos de marcas</button><button type="button" data-tab="icons" class="px-3.5 py-1.5 rounded-full text-label-md font-label-md border">Iconos</button></div>' : '') +
      '<input type="search" id="iconSearch" class="' + INPUT + '" placeholder="Buscar…" autofocus><div id="iconGrid" class="grid grid-cols-3 sm:grid-cols-4 gap-2"></div>' +
      '<p class="text-body-sm text-on-surface-variant">Los logos de marcas se cargan desde internet. Si uno no aparece, elige un icono.</p></div>', { wide: 'max-w-xl' });
    var grid = $('#iconGrid', m.el), search = $('#iconSearch', m.el);
    function paint() {
      var q = search.value.trim().toLowerCase();
      var items = tab === 'brands' ? PF.BRANDS.map(function (b) { return [b.id, b.label]; }) : PF.MATERIAL;
      grid.innerHTML = items.filter(function (x) { return !q || x[1].toLowerCase().indexOf(q) > -1 || x[0].indexOf(q) > -1; }).map(function (x) {
        var on = x[0] === cur;
        return '<button type="button" data-pick="' + x[0] + '" class="flex flex-col items-center gap-2 p-3 rounded-xl border ' + (on ? 'border-primary bg-primary/10' : 'border-outline-variant/40 hover:border-primary/60 bg-surface-container-low') + ' text-center transition-colors">' +
          '<span class="w-9 h-9 flex items-center justify-center text-primary">' + PF.icon(x[0], 26) + '</span><span class="text-label-sm font-label-sm text-on-surface-variant leading-tight">' + esc(x[1]) + '</span></button>';
      }).join('') || '<p class="col-span-full text-center text-on-surface-variant py-6">No hay resultados.</p>';
      $$('[data-tab]', m.el).forEach(function (t) {
        var on = t.dataset.tab === tab; t.className = 'px-3.5 py-1.5 rounded-full text-label-md font-label-md border ' + (on ? 'bg-primary/15 border-primary text-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/60');
      });
    }
    paint();
    search.addEventListener('input', paint);
    m.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; paint(); return; }
      var p = e.target.closest('[data-pick]'); if (!p) return;
      set(path, p.dataset.pick); touch(); m.close();
      var btn = $('[data-iconbtn="' + path + '"]'); if (btn) btn.innerHTML = iconBtnInner(p.dataset.pick);
      var det = btn && btn.closest('[data-item]');
      if (det) { var pr = det.dataset.item.split(':'); $('[data-sum-sub]', det).textContent = LISTS[pr[0]].sub(get(pr[0])[+pr[1]]); }
    });
  }

  /* ---------- Vista previa ---------- */
  function openPreview() {
    flushSave();
    var m = openModal('<div class="flex flex-col h-[88vh]"><div class="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/40"><h2 class="flex-1 text-title-lg font-title-lg text-on-surface">Vista previa de tus cambios</h2>' +
      '<div class="flex rounded-lg border border-outline-variant/50 overflow-hidden" role="group" aria-label="Tamaño"><button type="button" data-dev="100%" class="px-3 py-1.5 text-label-md font-label-md bg-primary/15 text-primary inline-flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">computer</span>Computador</button>' +
      '<button type="button" data-dev="390px" class="px-3 py-1.5 text-label-md font-label-md text-on-surface-variant inline-flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">smartphone</span>Celular</button></div>' +
      '<button type="button" data-close class="p-1.5 rounded-md hover:bg-surface-container-highest" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></div>' +
      '<div class="flex-1 bg-surface-container-lowest flex justify-center overflow-hidden"><iframe title="Vista previa" id="pvFrame" src="index.html?preview=1&t=' + Date.now() + '" class="h-full bg-background transition-all" style="width:100%;border:0"></iframe></div></div>', { wide: 'max-w-6xl' });
    m.el.addEventListener('click', function (e) {
      var d = e.target.closest('[data-dev]'); if (!d) return;
      $('#pvFrame', m.el).style.width = d.dataset.dev;
      $$('[data-dev]', m.el).forEach(function (x) { var on = x === d; x.className = 'px-3 py-1.5 text-label-md font-label-md inline-flex items-center gap-1 ' + (on ? 'bg-primary/15 text-primary' : 'text-on-surface-variant'); });
    });
  }

  /* ---------- Publicación en línea (Supabase) ---------- */
  function authFailed() {
    toast('Tu sesión terminó. Vuelve a entrar para publicar.', { type: 'error' });
    window.PFR.signOut(); showLogin();
  }
  function publishNow(opts) {
    opts = opts || {};
    if (!REMOTE || publishing) return Promise.resolve();
    flushSaveLocal();
    var pr = problems();
    function run() {
      publishing = true; setStatus('publishing');
      return window.PFR.saveContent(S).then(function () {
        setPublished(S);
        try { localStorage.setItem('pf_remote_cache_v1', JSON.stringify(S)); } catch (e) { /* noop */ }
        setStatus('saved'); $('#dirtyDot').classList.add('hidden');
        if (!opts.silent) toast('¡Publicado! Tus visitantes ya ven los cambios.', { type: 'ok' });
        if (currentView === 'publicar') keepDraw();
      }).catch(function (e) {
        setStatus('saved');
        if (e && (e.auth || e.status === 401)) return authFailed();
        if (e && (e.status === 403 || /row-level security|permission/i.test(e.message || ''))) return toast('Tu usuario no tiene permiso para publicar. Revisa que ejecutaste supabase-setup.sql.', { type: 'error' });
        if (e && e.status === 404) return toast('No se encontró la tabla del portafolio. Ejecuta supabase-setup.sql en Supabase.', { type: 'error' });
        toast('No se pudo publicar: ' + ((e && e.message) || 'revisa tu conexión') + '.', { type: 'error' });
      }).then(function () { publishing = false; });
    }
    if (pr.length && !opts.silent) {
      return confirmDialog({ title: 'Hay datos incompletos', text: 'Encontramos ' + pr.length + ' detalle(s) sin completar (por ejemplo: ' + pr[0].text + '). ¿Publicar de todos modos?', confirm: 'Publicar igual' }).then(function (ok) { return ok ? run() : null; });
    }
    if (pr.length) return Promise.resolve();
    return run();
  }
  function flushSaveLocal() { clearTimeout(saveTimer); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* noop */ } }

  /* ---------- Inicio de sesión ---------- */
  function showLogin() { $('#login').classList.remove('hidden'); setTimeout(function () { $('#loginEmail').focus(); }, 50); }
  function hideLogin() { $('#login').classList.add('hidden'); }
  function loginMessage(e) {
    var m = (e && e.message) || '';
    if (e && e.status === 400 && /invalid|credentials/i.test(m)) return 'El correo o la contraseña no son correctos.';
    if (e && e.status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    if (!e || !e.status) return 'No se pudo conectar. Revisa tu conexión a internet.';
    return 'No se pudo entrar: ' + m;
  }
  function bindLogin() {
    $('#loginForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = $('#loginEmail').value.trim(), pass = $('#loginPass').value, err = $('#loginError'), btn = $('#loginBtn');
      err.classList.add('hidden');
      if (!email || !pass) { err.textContent = 'Escribe tu correo y tu contraseña.'; err.classList.remove('hidden'); return; }
      btn.disabled = true; btn.textContent = 'Entrando…';
      window.PFR.signIn(email, pass).then(function () { $('#loginPass').value = ''; enter(); })
        .catch(function (e) { err.textContent = loginMessage(e); err.classList.remove('hidden'); })
        .then(function () { btn.disabled = false; btn.textContent = 'Entrar'; });
    });
    var lo = $('#btnLogout'); lo.classList.remove('hidden'); lo.classList.add('flex');
    lo.addEventListener('click', function () { window.PFR.signOut(); location.reload(); });
  }

  /* ---------- Publicar, respaldo y restaurar ---------- */
  function downloadText(name, text, mime) {
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function download() {
    flushSave();
    var pr = problems();
    var go2 = function () { downloadText('data.js', PF.toDataJs(S), 'text/javascript'); toast('Listo. Ahora reemplaza data.js en tu sitio (paso 3).', { type: 'ok' }); };
    if (!pr.length) return go2();
    confirmDialog({ title: 'Hay datos incompletos', text: 'Encontramos ' + pr.length + ' detalle(s) sin completar (por ejemplo: ' + pr[0].text + '). ¿Descargar de todos modos?', confirm: 'Descargar igual' }).then(function (ok) { if (ok) go2(); });
  }
  function exportBackup() {
    flushSave();
    downloadText('respaldo-portafolio-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(S, null, 2), 'application/json');
    toast('Respaldo descargado.', { type: 'ok' });
  }
  function importBackup(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var d; try { d = JSON.parse(r.result); } catch (err) { d = null; }
      if (!d || typeof d !== 'object' || !d.profile) { toast('Ese archivo no parece un respaldo de tu portafolio.', { type: 'error' }); return; }
      confirmDialog({ title: '¿Restaurar este respaldo?', text: 'Se reemplazará el contenido que tienes ahora en el panel.', confirm: 'Restaurar' }).then(function (ok) {
        if (!ok) return; S = PF.normalize(d); flushSave(); go('inicio'); toast('Respaldo restaurado.', { type: 'ok' });
      });
    };
    r.readAsText(f); e.target.value = '';
  }
  function discard() {
    confirmDialog({ title: '¿Descartar tus cambios?', text: 'Volverás al contenido que está publicado en tu sitio. Los cambios de este navegador se perderán.', confirm: 'Descartar', danger: true }).then(function (ok) {
      if (!ok) return; try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
      load(); setStatus('saved'); go(currentView, { keepScroll: true }); toast('Volviste a la versión publicada.', { type: 'ok' });
    });
  }

  /* ---------- Foto: encuadre y recorte ---------- */
  function initPhoto() {
    var ST = 320, drop = $('#photoDrop'), input = $('#photoFile'), wrap = $('#cropWrap'), cv = $('#cropCanvas'), ctx = cv.getContext('2d'), zoom = $('#cropZoom');
    var st = null;
    function cover() { return ST / Math.min(st.img.naturalWidth, st.img.naturalHeight); }
    function sc() { return cover() * st.z; }
    function clamp() { var s = sc(); st.x = Math.min(0, Math.max(ST - st.img.naturalWidth * s, st.x)); st.y = Math.min(0, Math.max(ST - st.img.naturalHeight * s, st.y)); }
    function draw2() { ctx.fillStyle = '#0f131c'; ctx.fillRect(0, 0, ST, ST); var s = sc(); ctx.drawImage(st.img, st.x, st.y, st.img.naturalWidth * s, st.img.naturalHeight * s); }
    function setZoom(z) {
      var old = sc(), cx = (ST / 2 - st.x) / old, cy = (ST / 2 - st.y) / old;
      st.z = Math.min(3, Math.max(1, z)); var s = sc(); st.x = ST / 2 - cx * s; st.y = ST / 2 - cy * s; clamp(); draw2(); zoom.value = st.z;
    }
    function load2(f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Ese archivo no es una imagen. Usa JPG, PNG o WebP.', { type: 'error' }); return; }
      if (f.size > 20 * 1024 * 1024) { toast('La imagen pesa más de 20 MB. Elige una más liviana.', { type: 'error' }); return; }
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        st = { img: img, z: 1, x: 0, y: 0 }; var s = sc();
        st.x = (ST - img.naturalWidth * s) / 2; st.y = (ST - img.naturalHeight * s) / 2; zoom.value = 1;
        wrap.classList.remove('hidden'); drop.classList.add('hidden'); draw2();
      };
      img.onerror = function () { toast('No se pudo leer esa imagen. Prueba con otra.', { type: 'error' }); };
      img.src = url;
    }
    input.addEventListener('change', function () { load2(input.files[0]); });
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('border-primary'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('border-primary'); }); });
    drop.addEventListener('drop', function (e) { load2(e.dataTransfer.files[0]); });
    var drag = null;
    cv.addEventListener('pointerdown', function (e) { if (!st) return; cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener('pointermove', function (e) {
      if (!drag || !st) return; var k = ST / cv.getBoundingClientRect().width;
      st.x += (e.clientX - drag.x) * k; st.y += (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; clamp(); draw2();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drag = null; }); });
    cv.addEventListener('wheel', function (e) { if (!st) return; e.preventDefault(); setZoom(st.z + (e.deltaY < 0 ? 0.08 : -0.08)); }, { passive: false });
    zoom.addEventListener('input', function () { if (st) setZoom(parseFloat(zoom.value)); });
    $('#cropCancel').addEventListener('click', function () { st = null; wrap.classList.add('hidden'); drop.classList.remove('hidden'); input.value = ''; });
    $('#cropApply').addEventListener('click', function () {
      if (!st) return; var R = 800 / ST, out = document.createElement('canvas'); out.width = out.height = 800;
      var c2 = out.getContext('2d'), s = sc(); c2.fillStyle = '#0f131c'; c2.fillRect(0, 0, 800, 800);
      c2.drawImage(st.img, st.x * R, st.y * R, st.img.naturalWidth * s * R, st.img.naturalHeight * s * R);
      var q = 0.86, data = out.toDataURL('image/jpeg', q);
      while (data.length > 700 * 1024 && q > 0.5) { q -= 0.08; data = out.toDataURL('image/jpeg', q); }
      var done = function (photo) {
        S.profile.photo = photo; if (!S.profile.photoAlt) S.profile.photoAlt = S.profile.name || '';
        flushSave(); toast(REMOTE ? 'Foto subida. Pulsa Publicar para que la vean tus visitantes.' : 'Foto actualizada. Revísala en la vista previa.', { type: 'ok' }); draw();
      };
      if (!REMOTE) return done(data);
      var btnA = $('#cropApply'); btnA.disabled = true; btnA.classList.add('opacity-60');
      out.toBlob(function (blob) {
        window.PFR.uploadImage(blob).then(done).catch(function (e) {
          btnA.disabled = false; btnA.classList.remove('opacity-60');
          if (e && (e.auth || e.status === 401)) return authFailed();
          toast('No se pudo subir la foto: ' + ((e && e.message) || 'revisa tu conexión') + '.', { type: 'error' });
        });
      }, 'image/jpeg', q);
    });
    $('#photoUrlBtn').addEventListener('click', function () {
      var u = PF.safeUrl($('#photoUrl').value);
      if (!/^https?:\/\//i.test(u)) { toast('Pega un enlace que empiece con https://', { type: 'error' }); return; }
      S.profile.photo = u; touch(); toast('Enlace de imagen aplicado.', { type: 'ok' }); draw();
    });
  }

  /* ---------- Arranque ---------- */
  $('#openMenu').addEventListener('click', openMenu);
  $('#scrim').addEventListener('click', closeMenu);
  $('#btnPreview').addEventListener('click', openPreview);
  $('#btnPublish').addEventListener('click', function () { if (REMOTE) publishNow(); else go('publicar'); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); flushSave(); toast('Cambios guardados.', { type: 'ok' }); }
  });

  function startApp(base) {
    setPublished(base || window.PORTFOLIO_DATA || {});
    var hadDraft = load();
    setStatus('saved');
    go((location.hash || '').replace('#', '') || 'inicio');
    $('#dirtyDot').classList.toggle('hidden', !isDirty());
    if (hadDraft) toast('Recuperamos tus cambios sin publicar.', { action: 'Descartar', onAction: discard });
  }

  function enter() {
    hideLogin();
    window.PFR.fetchContent().then(function (row) { startApp(row && row.data ? row.data : window.PORTFOLIO_DATA); })
      .catch(function () { toast('No se pudo leer lo publicado en línea. Se muestra el contenido de data.js.', { type: 'error' }); startApp(window.PORTFOLIO_DATA); });
  }

  if (!REMOTE) { startApp(window.PORTFOLIO_DATA); }
  else {
    bindLogin();
    window.PFR.getSession().then(function (ses) { if (ses) enter(); else showLogin(); });
  }
})();
