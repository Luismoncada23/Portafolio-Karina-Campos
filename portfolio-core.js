/* =====================================================================
   portfolio-core.js
   Lo usan el portafolio (index.html) y el panel (admin.html).
   Convierte los datos de data.js en el HTML del portafolio, con las
   mismas clases y la misma paleta de siempre.
   ===================================================================== */
(function (root) {
  'use strict';

  var SI = 'https://cdn.simpleicons.org/';
  var IO = 'https://api.iconify.design/logos:';

  /* ---------- Logos de marcas conocidas ---------- */
  var BRANDS = [
    { id: 'n8n',            label: 'n8n',             slug: 'n8n',            color: 'EA4B71', kw: /\bn8n\b/i },
    { id: 'make',           label: 'Make',            slug: 'make',           color: 'A66BFF', kw: /\bmake\b|integromat/i },
    { id: 'zapier',         label: 'Zapier',          slug: 'zapier',         color: 'FF4A00', kw: /zapier/i },
    { id: 'hubspot',        label: 'HubSpot',         slug: 'hubspot',        color: 'FF7A59', kw: /hubspot/i },
    { id: 'powerbi',        label: 'Power BI',        slug: 'powerbi',        color: 'F2C811', kw: /power\s?bi/i },
    { id: 'powerautomate',  label: 'Power Automate',  slug: 'powerautomate',  color: '3B82F6', kw: /power\s?automate/i },
    { id: 'excel',          label: 'Excel',           slug: 'microsoftexcel', color: '21A366', kw: /\bexcel\b/i },
    { id: 'googlesheets',   label: 'Google Sheets',   slug: 'googlesheets',   color: '34A853', kw: /google\s?sheets/i },
    { id: 'airtable',       label: 'Airtable',        slug: 'airtable',       color: '18BFFF', kw: /airtable/i },
    { id: 'notion',         label: 'Notion',          slug: 'notion',         color: 'white', kw: /notion/i },
    { id: 'salesforce',     label: 'Salesforce',      url: IO + 'salesforce.svg',          kw: /salesforce/i },
    { id: 'slack',          label: 'Slack',           url: IO + 'slack-icon.svg',          kw: /slack/i },
    { id: 'openai',         label: 'OpenAI',          slug: 'openai',         color: 'white', kw: /openai|chatgpt/i },
    { id: 'anthropic',      label: 'Anthropic',       slug: 'anthropic',      color: 'white', kw: /anthropic|claude/i },
    { id: 'whatsapp',       label: 'WhatsApp',        slug: 'whatsapp',       color: '25D366', kw: /whatsapp/i },
    { id: 'gmail',          label: 'Gmail',           slug: 'gmail',          color: 'EA4335', kw: /gmail/i },
    { id: 'linkedin',       label: 'LinkedIn',        url: IO + 'linkedin-icon.svg',       kw: /linkedin/i },
    { id: 'github',         label: 'GitHub',          slug: 'github',         color: 'white', kw: /github/i },
    { id: 'python',         label: 'Python',          slug: 'python',         color: '4B8BBE', kw: /python/i },
    { id: 'javascript',     label: 'JavaScript',      slug: 'javascript',     color: 'F7DF1E', kw: /javascript/i },
    { id: 'postgresql',     label: 'PostgreSQL',      slug: 'postgresql',     color: '4F8FD9', kw: /postgres/i },
    { id: 'mysql',          label: 'MySQL',           slug: 'mysql',          color: '4F9BC9', kw: /mysql/i },
    { id: 'jira',           label: 'Jira',            slug: 'jira',           color: '2684FF', kw: /\bjira\b/i },
    { id: 'trello',         label: 'Trello',          slug: 'trello',         color: '4C9AFF', kw: /trello/i },
    { id: 'asana',          label: 'Asana',           slug: 'asana',          color: 'F06A6A', kw: /asana/i },
    { id: 'googledrive',    label: 'Google Drive',    slug: 'googledrive',    color: '4285F4', kw: /google\s?drive/i },
    { id: 'zoom',           label: 'Zoom',            slug: 'zoom',           color: '4C8DFF', kw: /\bzoom\b/i }
  ];

  /* ---------- Iconos genéricos (nombre en Material Symbols, etiqueta en español) ---------- */
  var MATERIAL = [
    ['smart_toy', 'Robot / IA'], ['sync_alt', 'Integración'], ['hub', 'Conexiones'], ['bar_chart', 'Gráfico de barras'],
    ['schema', 'Diagrama'], ['data_object', 'Código y datos'], ['troubleshoot', 'Diagnóstico'], ['account_tree', 'Procesos'],
    ['neurology', 'Inteligencia'], ['query_stats', 'Analítica'], ['monitoring', 'Monitoreo'], ['insights', 'Resultados'],
    ['trending_up', 'Crecimiento'], ['speed', 'Rapidez'], ['bolt', 'Energía'], ['rocket_launch', 'Lanzamiento'],
    ['lightbulb', 'Idea'], ['settings', 'Ajustes'], ['database', 'Base de datos'], ['cloud', 'Nube'],
    ['security', 'Seguridad'], ['shield', 'Protección'], ['groups', 'Equipos'], ['handshake', 'Alianzas'],
    ['support_agent', 'Atención'], ['checklist', 'Lista de tareas'], ['verified', 'Verificado'], ['workspace_premium', 'Certificado'],
    ['school', 'Educación'], ['work', 'Trabajo'], ['code', 'Programación'], ['language', 'Web'],
    ['mail', 'Correo'], ['call', 'Teléfono'], ['warning', 'Alerta']
  ];

  /* ---------- Colores de la paleta ---------- */
  var COLORS = {
    primary:   { label: 'Cian',    hex: '#4cd7f6', text: 'text-primary',       tagText: 'text-primary',           num: 'text-primary',       border: 'border-primary/30',       tagBg: 'bg-primary/10',           tagBorder: 'border-primary/30',           dot: 'bg-primary',           bar: 'from-primary-container to-primary',      borderL: 'border-l-primary' },
    tertiary:  { label: 'Violeta', hex: '#d0bcff', text: 'text-tertiary',      tagText: 'text-tertiary',          num: 'text-tertiary',      border: 'border-tertiary/30',      tagBg: 'bg-tertiary/10',          tagBorder: 'border-tertiary/30',          dot: 'bg-tertiary',          bar: 'from-tertiary to-tertiary-fixed',        borderL: 'border-l-tertiary' },
    secondary: { label: 'Verde',   hex: '#4edea3', text: 'text-secondary',     tagText: 'text-secondary',         num: 'text-secondary',     border: 'border-secondary/30',     tagBg: 'bg-secondary/10',         tagBorder: 'border-secondary/30',         dot: 'bg-secondary',         bar: 'from-secondary-container to-secondary',  borderL: 'border-l-secondary' },
    fixed:     { label: 'Celeste', hex: '#acedff', text: 'text-primary-fixed', tagText: 'text-primary-fixed-dim', num: 'text-primary-fixed', border: 'border-primary-fixed/30', tagBg: 'bg-primary-fixed-dim/10', tagBorder: 'border-primary-fixed-dim/30', dot: 'bg-primary-fixed-dim', bar: 'from-primary-fixed-dim to-primary-fixed', borderL: 'border-l-primary-fixed' }
  };
  var COLOR_KEYS = ['primary', 'tertiary', 'secondary', 'fixed'];
  var STAT_ORDER = ['primary', 'secondary', 'tertiary', 'fixed'];

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bold(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function col(k) { return COLORS[k] || COLORS.primary; }
  function brandById(id) { for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].id === id) return BRANDS[i]; return null; }
  function brandFor(text) { for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].kw && BRANDS[i].kw.test(text || '')) return BRANDS[i]; return null; }
  function brandUrl(b, color) { return b.url || (SI + b.slug + '/' + (color || b.color)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function waLink(d) { return 'https://wa.me/' + digits(d.contact.whatsapp); }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|data:image\/|\.{0,2}\/|#)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
    return u.indexOf(':') === -1 ? u : '';
  }

  /* Logo de marca o icono genérico */
  function icon(id, px, extra, colorOverride) {
    var b = brandById(id);
    if (b) {
      return '<img src="' + brandUrl(b, colorOverride) + '" alt="' + esc(b.label) + '" loading="lazy" class="h-[' + px + 'px] w-[' + px + 'px] object-contain shrink-0" ' +
        'onerror="this.outerHTML=\'<span class=&quot;material-symbols-outlined text-[' + px + 'px]&quot;>extension</span>\'">';
    }
    var name = /^[a-z0-9_]+$/.test(id || '') ? id : 'extension';
    return '<span class="material-symbols-outlined ' + (extra ? extra + ' ' : '') + 'text-[' + px + 'px]">' + name + '</span>';
  }

  /* ---------- Datos: valores por defecto y cuidado de campos faltantes ---------- */
  function normalize(d) {
    d = d || {};
    d.profile = d.profile || {};
    d.profile.stats = d.profile.stats || [];
    d.contact = d.contact || {};
    d.site = d.site || {};
    d.sections = d.sections || {};
    ['metodologia', 'competencias', 'casos', 'trayectoria'].forEach(function (k) { d.sections[k] = d.sections[k] || {}; });
    d.cta = d.cta || {};
    ['phases', 'skills', 'cases', 'experience', 'education', 'diplomas', 'badges'].forEach(function (k) { d[k] = d[k] || []; });
    return d;
  }

  /* ---------- Generadores de HTML ---------- */
  function sectionHead(s, eyebrowColor) {
    s = s || {};
    return '<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-4">' +
      '<div><span class="text-label-sm font-label-sm ' + eyebrowColor + ' tracking-widest uppercase">' + esc(s.eyebrow) + '</span>' +
      '<h2 class="text-headline-md font-headline-md text-on-surface">' + esc(s.title) + '</h2></div>' +
      '<p class="text-body-sm font-body-sm text-on-surface-variant max-w-md">' + esc(s.subtitle) + '</p></div>';
  }

  function bioHtml(text) {
    var n = 0, cls = ['text-primary', 'text-tertiary', 'text-secondary', 'text-primary-fixed-dim'];
    return esc(text).replace(/\*(.+?)\*/g, function (_, w) {
      return '<span class="' + cls[(n++) % 4] + ' font-medium">' + w + '</span>';
    });
  }

  function brandHeader(d) {
    return '<a class="text-headline-sm font-headline-sm tracking-tight text-primary dark:text-primary font-bold flex items-center gap-2 group" href="#hero">' +
      '<span class="p-1 rounded bg-surface-container-high border border-outline-variant/50 text-primary flex items-center justify-center">' +
      '<span class="material-symbols-outlined text-[18px]">terminal</span></span>' +
      '<span class="">' + esc(d.site.navName || d.profile.name) + '</span></a>';
  }

  function headerActions(d) {
    var cv = safeUrl(d.contact.cv);
    var cvAttrs = cv ? ' href="' + esc(cv) + '" target="_blank" rel="noopener noreferrer" download' : ' href="#contacto"';
    return '<a class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:border-secondary text-label-md font-label-md text-secondary hover:bg-secondary/10 transition-all duration-150" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank"><span class="">contáctame</span></a>' +
      '<a class="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-label-md text-label-md font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"' + cvAttrs + '><span class="">Descargar CV</span></a>';
  }

  function hero(d) {
    var p = d.profile, c = d.contact;
    var stats = p.stats.map(function (s, i) {
      return '<div class="glass-panel p-3.5 rounded-xl border border-outline-variant/30 text-center">' +
        '<p class="text-headline-sm font-headline-sm ' + col(STAT_ORDER[i % 4]).text + ' font-bold">' + esc(s.value) + '</p>' +
        '<p class="text-label-sm font-label-sm text-on-surface-variant mt-0.5">' + esc(s.label) + '</p></div>';
    }).join('');
    var phone = c.phoneDisplay ? ' (' + esc(c.phoneDisplay) + ')' : '';
    var dock = '';
    if (safeUrl(c.linkedin)) dock += '<a class="p-1.5 rounded-lg bg-surface-container hover:bg-primary/20 text-on-surface hover:text-primary transition-colors flex items-center" href="' + esc(safeUrl(c.linkedin)) + '" rel="noopener noreferrer" target="_blank" title="LinkedIn Oficial">' + icon('linkedin', 18) + '</a>';
    if (safeUrl(c.github)) dock += '<a class="p-1.5 rounded-lg bg-surface-container hover:bg-tertiary/20 text-on-surface hover:text-tertiary transition-colors flex items-center" href="' + esc(safeUrl(c.github)) + '" rel="noopener noreferrer" target="_blank" title="GitHub Repos">' + icon('github', 18) + '</a>';
    if (digits(c.whatsapp)) dock += '<a class="p-1.5 rounded-lg bg-surface-container hover:bg-secondary/20 text-on-surface hover:text-secondary transition-colors flex items-center" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank" title="WhatsApp Directo">' + icon('whatsapp', 18) + '</a>';
    var buttons = '';
    if (digits(c.whatsapp)) buttons += '<a class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-secondary-container to-secondary text-on-secondary font-label-md text-label-md font-bold hover:shadow-lg hover:shadow-secondary/20 transition-all" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank">' + icon('whatsapp', 18, '', '003824') + '<span class="">WhatsApp Directo' + phone + '</span></a>';
    if (c.email) buttons += '<a class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:border-primary text-on-surface text-label-md font-label-md transition-all" href="#contacto">' + icon('gmail', 18) + '<span class="">' + esc(c.email) + '</span></a>';
    var status = p.available !== false && p.statusLabel ?
      '<div class="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 border border-secondary/40 text-secondary text-label-sm font-label-sm shadow-md backdrop-blur-md"><span class="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span class="">' + esc(p.statusLabel) + '</span></div>' : '';
    var photo = p.photo ?
      '<img alt="' + esc(p.photoAlt || p.name) + '" class="w-full h-80 md:h-96 object-cover rounded-2xl shadow-2xl" src="' + esc(p.photo) + '">' :
      '<div class="w-full h-80 md:h-96 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[64px]">person</span></div>';
    return '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">' +
      '<div class="lg:col-span-7 space-y-6">' +
      (p.badge ? '<div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-label-md font-label-md"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span></span><span class="">' + esc(p.badge) + '</span></div>' : '') +
      '<div class="space-y-3"><h1 class="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface tracking-tight">' + esc(p.name) + (p.headline ? ': <span class="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent">' + esc(p.headline) + '</span>' : '') + '</h1>' +
      '<p class="text-body-lg font-body-lg text-on-surface-variant leading-relaxed">' + bioHtml(p.bio) + '</p></div>' +
      (stats ? '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">' + stats + '</div>' : '') +
      (buttons ? '<div class="pt-2 flex flex-wrap items-center gap-3">' + buttons + '</div>' : '') +
      '</div>' +
      '<div class="lg:col-span-5 flex justify-center order-first lg:order-none"><div class="relative w-full max-w-sm">' +
      '<div class="absolute -inset-1.5 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-3xl blur-xl opacity-30 animate-pulse"></div>' +
      '<div class="relative glass-panel p-3 rounded-2xl border border-primary/40 shadow-2xl">' + photo + status +
      (dock ? '<div class="mt-3 py-2 px-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 flex items-center justify-between"><span class="text-label-sm font-label-sm text-on-surface-variant">Conexiones Profesionales</span><div class="flex items-center gap-2">' + dock + '</div></div>' : '') +
      '</div></div></div></div>';
  }

  function phases(d) {
    var cards = d.phases.map(function (f, i) {
      var c = col(f.color);
      return '<div class="glass-card-interactive p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">' +
        '<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span class="text-headline-xl font-headline-xl font-extrabold ' + c.num + '">' + pad2(i + 1) + '</span></div>' +
        '<div class="space-y-3"><span class="inline-block px-2.5 py-1 rounded ' + c.tagBg + ' border ' + c.tagBorder + ' ' + c.tagText + ' text-label-sm font-label-sm">Fase ' + pad2(i + 1) + '</span>' +
        '<h3 class="text-title-lg font-title-lg text-on-surface font-bold">' + esc(f.title) + '</h3>' +
        '<p class="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">' + esc(f.desc) + '</p></div>' +
        '<div class="pt-6 mt-4 border-t border-outline-variant/20 flex items-center text-label-sm font-label-sm ' + c.tagText + ' gap-1">' + icon(f.icon, 16) + '<span class="">' + esc(f.tag) + '</span></div></div>';
    }).join('');
    return sectionHead(d.sections.metodologia, 'text-primary') + (cards ? '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">' + cards + '</div>' : '');
  }

  function skills(d) {
    var cards = d.skills.map(function (s) {
      var c = col(s.color), lv = Math.max(0, Math.min(100, parseInt(s.level, 10) || 0));
      return '<div class="glass-panel p-5 rounded-2xl space-y-4"><div class="flex items-center justify-between"><div class="flex items-center gap-2.5">' +
        '<span class="p-2 rounded-lg bg-surface-container-high ' + c.text + ' border ' + c.border + '">' + icon(s.icon, 20) + '</span>' +
        '<div><h4 class="text-title-lg font-title-lg text-on-surface">' + esc(s.title) + '</h4>' +
        '<p class="text-label-sm font-label-sm text-on-surface-variant">' + esc(s.subtitle) + '</p></div></div>' +
        '<span class="text-headline-sm font-headline-sm ' + c.text + ' font-bold">' + lv + '%</span></div>' +
        '<div class="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden"><div class="bg-gradient-to-r ' + (s.bar || c.bar) + ' h-2 rounded-full" style="width: ' + lv + '%"></div></div>' +
        '<p class="text-body-sm font-body-sm text-on-surface-variant">' + esc(s.desc) + '</p></div>';
    }).join('');
    return sectionHead(d.sections.competencias, 'text-secondary') + (cards ? '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">' + cards + '</div>' : '');
  }

  function cases(d) {
    var cards = d.cases.map(function (k, i) {
      var c = col(k.color);
      var chips = (k.chips || []).map(function (t) {
        var b = brandFor(t);
        return '<span class="' + (b ? 'inline-flex items-center gap-1.5 ' : '') + 'px-2.5 py-1 rounded bg-surface-container-highest text-on-surface-variant text-label-sm font-label-sm border border-outline-variant/30">' + (b ? icon(b.id, 14) : '') + esc(t) + '</span>';
      }).join('');
      var li = (k.results || []).map(function (r) {
        return '<li class="flex items-center gap-1.5 text-secondary"><span class="material-symbols-outlined text-[16px]">check_circle</span><span class="">' + bold(r) + '</span></li>';
      }).join('');
      return '<div class="glass-panel p-6 lg:p-8 rounded-2xl border-l-4 ' + c.borderL + ' space-y-6">' +
        '<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div>' +
        '<span class="text-label-sm font-label-sm ' + c.text + ' font-semibold tracking-wider uppercase">Caso ' + pad2(i + 1) + (k.category ? ' • ' + esc(k.category) : '') + '</span>' +
        '<h3 class="text-headline-sm font-headline-sm text-on-surface font-bold mt-1">' + esc(k.title) + '</h3></div>' +
        '<div class="flex flex-wrap items-center gap-2">' + chips + '</div></div>' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">' +
        '<div class="p-4 rounded-xl bg-surface-container-low/80 border border-outline-variant/20 space-y-2"><div class="flex items-center gap-2 text-error text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">warning</span><span class="">El Desafío</span></div>' +
        '<p class="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">' + esc(k.challenge) + '</p></div>' +
        '<div class="p-4 rounded-xl bg-surface-container-low/80 border border-outline-variant/20 space-y-2"><div class="flex items-center gap-2 ' + c.text + ' text-label-md font-label-md"><span class="material-symbols-outlined text-[18px]">' + esc(k.solutionIcon || 'hub') + '</span><span class="">La Arquitectura de Solución</span></div>' +
        '<p class="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">' + esc(k.solution) + '</p></div>' +
        '<div class="p-4 rounded-xl bg-surface-container-low/80 border border-secondary/30 space-y-2 bg-secondary/5"><div class="flex items-center gap-2 text-secondary text-label-md font-label-md font-bold"><span class="material-symbols-outlined text-[18px]">verified</span><span class="">El Impacto Cuantificado</span></div>' +
        '<ul class="text-body-sm font-body-sm text-on-surface space-y-1.5">' + li + '</ul></div></div></div>';
    }).join('');
    return sectionHead(d.sections.casos, 'text-tertiary') + (cards ? '<div class="space-y-6">' + cards + '</div>' : '');
  }

  function career(d) {
    var tl = d.experience.map(function (r) {
      var c = col(r.color);
      var comp = col(r.companyColor || (r.color === 'primary' ? 'secondary' : r.color));
      var badge = r.current ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant';
      return '<div class="relative group"><span class="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full ' + c.dot + ' ring-4 ring-background"></span>' +
        '<div class="glass-panel p-5 rounded-xl space-y-2 border border-outline-variant/30">' +
        '<div class="flex flex-wrap items-center justify-between gap-2"><h4 class="text-title-lg font-title-lg text-on-surface font-bold">' + esc(r.title) + '</h4>' +
        (r.period ? '<span class="px-2.5 py-0.5 rounded-full ' + badge + ' text-label-sm font-label-sm">' + esc(r.period) + '</span>' : '') + '</div>' +
        '<p class="text-label-md font-label-md ' + comp.text + '">' + esc(r.company) + '</p>' +
        '<p class="text-body-sm font-body-sm text-on-surface-variant">' + esc(r.desc) + '</p></div></div>';
    }).join('');
    var edu = d.education.map(function (e) {
      return '<div class="glass-panel p-5 rounded-xl border border-secondary/30 space-y-3 bg-secondary/5"><div class="flex items-center gap-3">' +
        '<div class="p-2.5 rounded-lg bg-surface-container text-secondary"><span class="material-symbols-outlined text-[24px]">verified_user</span></div>' +
        '<div><h4 class="text-title-lg font-title-lg text-on-surface font-bold">' + esc(e.title) + '</h4>' +
        '<p class="text-label-sm font-label-sm text-secondary">' + esc(e.institution) + '</p></div></div>' +
        (e.desc ? '<p class="text-body-sm font-body-sm text-on-surface-variant">' + esc(e.desc) + '</p>' : '') + '</div>';
    }).join('');
    var dipCol = ['text-primary', 'text-tertiary', 'text-secondary'];
    var dip = d.diplomas.length ? '<div class="glass-panel p-5 rounded-xl border border-outline-variant/30 space-y-3"><h4 class="text-label-md font-label-md text-primary tracking-wide uppercase">' + esc(d.diplomasTitle) + '</h4><ul class="space-y-2 text-body-sm font-body-sm text-on-surface">' +
      d.diplomas.map(function (x, i) {
        return '<li class="flex items-start gap-2"><span class="material-symbols-outlined ' + dipCol[i % 3] + ' text-[16px] mt-0.5">check_circle</span><span class=""><strong>' + esc(x.name) + (x.desc ? ':' : '') + '</strong>' + (x.desc ? ' ' + esc(x.desc) : '') + '</span></li>';
      }).join('') + '</ul></div>' : '';
    var bcol = ['text-primary', 'text-tertiary', 'text-secondary', 'text-primary-fixed-dim'];
    var bad = d.badges.length ? '<div class="glass-panel p-5 rounded-xl border border-outline-variant/30 space-y-3"><h4 class="text-label-md font-label-md text-tertiary tracking-wide uppercase">' + esc(d.badgesTitle) + '</h4><div class="grid grid-cols-2 gap-2.5">' +
      d.badges.map(function (b, i) {
        return '<div class="p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 flex items-center gap-2">' + icon(b.icon, 18, bcol[i % 4]) + '<span class="text-label-sm font-label-sm text-on-surface font-semibold">' + esc(b.label) + '</span></div>';
      }).join('') + '</div></div>' : '';
    var s = d.sections.trayectoria;
    return sectionHead(s, 'text-primary') + '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">' +
      '<div class="lg:col-span-7 space-y-6"><h3 class="text-title-lg font-title-lg text-primary flex items-center gap-2"><span class="material-symbols-outlined text-[20px]">work_history</span><span class="">' + esc(s.rolesTitle) + '</span></h3>' +
      '<div class="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">' + tl + '</div></div>' +
      '<div class="lg:col-span-5 space-y-6"><h3 class="text-title-lg font-title-lg text-secondary flex items-center gap-2"><span class="material-symbols-outlined text-[20px]">school</span><span class="">' + esc(s.educationTitle) + '</span></h3>' + edu + dip + bad + '</div></div>';
  }

  function contact(d) {
    var c = d.contact, t = d.cta;
    var btns = '';
    if (digits(c.whatsapp)) btns += '<a class="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary-container to-secondary text-on-secondary text-label-md font-label-md font-bold shadow-lg shadow-secondary/20 hover:shadow-secondary/40 active:scale-95 transition-all" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank">' + icon('whatsapp', 20) + '<span class="">' + esc(t.whatsappLabel || 'WhatsApp') + '</span></a>';
    if (c.email) btns += '<a class="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:border-primary text-on-surface text-label-md font-label-md font-bold hover:bg-surface-container-highest active:scale-95 transition-all" href="mailto:' + esc(c.email) + '">' + icon('gmail', 20) + '<span class="">' + esc(c.email) + '</span></a>';
    var links = [];
    if (safeUrl(c.linkedin)) links.push('<a class="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors" href="' + esc(safeUrl(c.linkedin)) + '" rel="noopener noreferrer" target="_blank">' + icon('linkedin', 16) + '<span class="">' + esc(t.linkedinLabel || 'LinkedIn') + '</span></a>');
    if (safeUrl(c.github)) links.push('<a class="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-tertiary transition-colors" href="' + esc(safeUrl(c.github)) + '" rel="noopener noreferrer" target="_blank">' + icon('github', 16) + '<span class="">' + esc(t.githubLabel || 'GitHub') + '</span></a>');
    links.push('<a class="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors" href="javascript:window.print()"><span class="material-symbols-outlined text-[16px]">print</span><span class="">Imprimir Dossier</span></a>');
    return '<div class="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>' +
      '<div class="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>' +
      '<div class="relative z-10 max-w-3xl mx-auto text-center space-y-6">' +
      (t.badge ? '<span class="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-label-sm font-label-sm font-semibold">' + esc(t.badge) + '</span>' : '') +
      '<h2 class="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface tracking-tight">' + esc(t.title) + '</h2>' +
      '<p class="text-body-lg font-body-lg text-on-surface-variant leading-relaxed">' + esc(t.text) + '</p>' +
      (btns ? '<div class="pt-4 flex flex-wrap items-center justify-center gap-4">' + btns + '</div>' : '') +
      '<div class="pt-6 flex items-center justify-center gap-6 border-t border-outline-variant/20 text-body-sm font-body-sm">' + links.join('<span class="text-outline-variant">•</span>') + '</div></div>';
  }

  function footer(d) {
    var c = d.contact, cls = 'inline-flex items-center gap-1.5 text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary transition-colors';
    var links = '';
    if (safeUrl(c.linkedin)) links += '<a class="' + cls + '" href="' + esc(safeUrl(c.linkedin)) + '" rel="noopener noreferrer" target="_blank">' + icon('linkedin', 14) + 'LinkedIn</a>';
    if (safeUrl(c.github)) links += '<a class="' + cls + '" href="' + esc(safeUrl(c.github)) + '" rel="noopener noreferrer" target="_blank">' + icon('github', 14) + 'GitHub</a>';
    if (digits(c.whatsapp)) links += '<a class="' + cls + '" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank">' + icon('whatsapp', 14) + 'WhatsApp (+' + digits(c.whatsapp) + ')</a>' +
      (d.site.footerCta ? '<a class="text-secondary dark:text-secondary font-medium hover:text-primary transition-colors" href="' + waLink(d) + '" rel="noopener noreferrer" target="_blank">' + esc(d.site.footerCta) + '</a>' : '');
    var nm = esc(d.site.footerName || d.profile.name);
    return '<div class="flex flex-col md:flex-row items-center justify-between gap-4 px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full">' +
      '<div class="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left order-2 md:order-1"><span class="text-headline-sm font-headline-sm text-primary dark:text-primary font-bold select-none" data-pf-secret>' + nm + '</span>' +
      '<span class="hidden sm:inline text-outline-variant">|</span>' +
      '<span class="text-body-sm font-body-sm text-on-surface-variant">© ' + (new Date().getFullYear()) + ' ' + nm + ' • Todos los derechos reservados</span></div>' +
      '<div class="flex flex-wrap items-center justify-center gap-5 text-label-sm font-label-sm order-1 md:order-2">' + links + '</div></div>';
  }

  /* ---------- Aplicar los datos a la página ---------- */
  function setHtml(sel, html) { var el = root.document.querySelector(sel); if (el) el.innerHTML = html; }

  function apply(data, isPreview) {
    var d = normalize(data);
    root.document.title = d.site.title || d.profile.name;
    setHtml('#pf-brand', brandHeader(d));
    setHtml('#pf-actions', headerActions(d));
    setHtml('#hero', hero(d));
    setHtml('#metodologia', phases(d));
    setHtml('#competencias', skills(d));
    setHtml('#casos', cases(d));
    setHtml('#trayectoria', career(d));
    setHtml('#contacto', contact(d));
    setHtml('#pf-footer', footer(d));
    if (isPreview) {
      var bar = root.document.createElement('div');
      bar.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full bg-surface-container-highest border border-tertiary/50 text-on-surface text-label-md font-label-md shadow-2xl';
      bar.innerHTML = '<span class="material-symbols-outlined text-[18px] text-tertiary">visibility</span><span>Vista previa de tus cambios (aún no publicados)</span>';
      root.document.body.appendChild(bar);
    }
  }

  var CACHE_KEY = 'pf_remote_cache_v1';
  var secretBound = false;

  /* Cinco clics seguidos sobre el nombre del pie de página abren el panel. */
  function bindSecret() {
    if (secretBound) return; secretBound = true;
    var count = 0, last = 0;
    root.document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-pf-secret]') : null;
      if (!t) return;
      var now = Date.now();
      count = (now - last < 1500) ? count + 1 : 1; last = now;
      if (count >= 5) { count = 0; root.location.href = 'admin.html'; }
    });
  }

  function boot() {
    var doc = root.document, html = doc.documentElement;
    bindSecret();
    var preview = /[?&]preview=1/.test(root.location.search), data = root.PORTFOLIO_DATA;
    if (preview) {
      try { var draft = JSON.parse(root.localStorage.getItem('pf_draft_v1')); if (draft) data = draft; } catch (e) { /* sin borrador */ }
    }
    if (!data) {
      var m = doc.querySelector('main');
      if (m) m.innerHTML = '<p class="text-on-surface-variant py-20 text-center">No se encontró data.js. Verifica que el archivo esté junto a index.html.</p>';
      return;
    }
    var R = root.PFR;
    if (preview || !R || !R.enabled()) { apply(data, preview); return; }

    /* Modo en línea: muestra lo último que se vio (o espera un instante) y se actualiza con lo publicado. */
    var cache = null, shown = null;
    try { cache = JSON.parse(root.localStorage.getItem(CACHE_KEY)); } catch (e) { cache = null; }
    function show(d) { var j = JSON.stringify(d); if (j !== shown) { shown = j; apply(d, false); } html.classList.remove('pf-wait'); }
    var timer = null;
    if (cache) { show(cache); } else {
      html.classList.add('pf-wait');
      timer = root.setTimeout(function () { show(data); }, 2500);
    }
    R.fetchContent().then(function (row) {
      root.clearTimeout(timer);
      if (row && row.data) {
        try { root.localStorage.setItem(CACHE_KEY, JSON.stringify(row.data)); } catch (e) { /* noop */ }
        show(row.data);
      } else { show(cache || data); }
    }).catch(function () { root.clearTimeout(timer); show(cache || data); });
  }

  function toDataJs(data) {
    return '/* Contenido del portafolio. Lo genera el panel de administración (admin.html).\n   Reemplaza este archivo en tu hosting para publicar los cambios. */\n' +
      'window.PORTFOLIO_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  }

  root.PF = {
    BRANDS: BRANDS, MATERIAL: MATERIAL, COLORS: COLORS, COLOR_KEYS: COLOR_KEYS, STAT_ORDER: STAT_ORDER,
    esc: esc, icon: icon, brandById: brandById, brandFor: brandFor, brandUrl: brandUrl, safeUrl: safeUrl, digits: digits,
    normalize: normalize, apply: apply, boot: boot, toDataJs: toDataJs,
    render: { hero: hero, phases: phases, skills: skills, cases: cases, career: career, contact: contact, footer: footer, brandHeader: brandHeader, headerActions: headerActions }
  };
})(typeof window !== 'undefined' ? window : globalThis);
