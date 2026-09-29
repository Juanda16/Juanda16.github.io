/* Juan Arismendy — personal site
 * Vanilla JS, no build step. Handles: i18n (EN/ES), theme toggle, mobile menu
 * and rendering of the data-driven sections (skills, projects, publications).
 */
(function () {
  'use strict';

  var LANGS = ['en', 'es'];
  var DEFAULT_LANG = 'en';
  var root = document.documentElement;

  var strings = {};      // cache: lang -> translations
  var data = null;       // { projects, skills, publications }
  var currentLang = DEFAULT_LANG;

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.className) node.className = opts.className;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { node.setAttribute(k, opts.attrs[k]); });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function lookup(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function t(key) {
    var value = lookup(strings[currentLang], key);
    if (value == null) return key;
    return typeof value === 'string' ? value.replace('{year}', String(new Date().getFullYear())) : value;
  }

  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignore */ } }

  /* ---------- language ---------- */
  function initialLang() {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (LANGS.indexOf(fromUrl) !== -1) return fromUrl;
    var saved = safeGet('lang');
    if (LANGS.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || navigator.userLanguage || DEFAULT_LANG).toLowerCase();
    return nav.indexOf('es') === 0 ? 'es' : 'en';
  }

  // GitHub Pages caches files for 10 minutes. Bump this value (and the ?v= in
  // index.html) whenever you edit content, so visitors get the new files.
  var VERSION = '4';

  function loadJSON(url) {
    return fetch(url + '?v=' + VERSION).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.json();
    });
  }

  function loadLang(lang) {
    if (strings[lang]) return Promise.resolve();
    return loadJSON('i18n/' + lang + '.json').then(function (json) { strings[lang] = json; });
  }

  function setMeta(id, value) { var node = document.getElementById(id); if (node) node.setAttribute('content', value); }

  function applyStatic() {
    $$('[data-i18n]').forEach(function (node) { node.textContent = t(node.getAttribute('data-i18n')); });
    $$('[data-i18n-attr]').forEach(function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        if (parts.length === 2) node.setAttribute(parts[0].trim(), t(parts[1].trim()));
      });
    });

    document.title = t('meta.title');
    setMeta('meta-description', t('meta.description'));
    setMeta('og-title', t('meta.title'));
    setMeta('og-description', t('meta.description'));
    setMeta('og-locale', t('meta.ogLocale'));
    setMeta('og-locale-alt', t('meta.ogLocaleAlt'));
  }

  /* ---------- data-driven sections ---------- */
  function renderHighlights() {
    var list = $('#hero-highlights');
    list.textContent = '';
    (t('hero.highlights') || []).forEach(function (h) {
      list.appendChild(el('li', {}, [el('strong', { text: h.value }), el('span', { text: h.label })]));
    });
  }

  function renderFacts() {
    var list = $('#about-facts');
    list.textContent = '';
    (t('about.facts') || []).forEach(function (f) {
      list.appendChild(el('div', {}, [el('dt', { text: f.label }), el('dd', { text: f.value })]));
    });
  }

  function chips(items) {
    return el('ul', { className: 'chips' }, items.map(function (item) {
      return el('li', { className: 'chip', text: item });
    }));
  }

  // Tech list drawn like an IC pinout (datasheet look).
  function pinout(tags) {
    return el('div', { className: 'pinout-wrap' }, [
      el('p', { className: 'pinout-title', text: t('projects.pinout') }),
      el('ol', { className: 'pinout' }, tags.map(function (tag, i) {
        return el('li', {}, [
          el('span', { className: 'pin-n', text: String(i + 1).padStart(2, '0'), attrs: { 'aria-hidden': 'true' } }),
          el('span', { className: 'pin-s', text: tag })
        ]);
      }))
    ]);
  }

  function renderSkills() {
    var grid = $('#skills-grid');
    grid.textContent = '';
    data.skills.forEach(function (group) {
      grid.appendChild(el('article', { className: 'skill-card' }, [
        el('h3', { text: t('skills.groups.' + group.id) }),
        chips(group.items)
      ]));
    });
  }

  function renderProjects() {
    var grid = $('#projects-grid');
    grid.textContent = '';
    data.projects.forEach(function (p, i) {
      var base = 'projects.items.' + p.id + '.';
      var footer;
      if (p.links.length) {
        footer = el('div', { className: 'project-links' }, p.links.map(function (l) {
          return el('a', {
            text: l.label + ' ↗',
            attrs: {
              href: l.url,
              target: '_blank',
              rel: 'noopener noreferrer',
              'aria-label': t('projects.viewRepo') + ' ' + l.label
            }
          });
        }));
      } else {
        footer = el('p', { className: 'project-private', text: t('projects.private') });
      }

      grid.appendChild(el('article', { className: 'project' }, [
        el('div', { className: 'ds-head' }, [
          el('span', { className: 'ds-ref', text: 'JA-' + String(i + 1).padStart(3, '0') + ' · REV A', attrs: { 'aria-hidden': 'true' } }),
          el('span', { className: 'ds-kind', text: t(base + 'kind') })
        ]),
        el('div', { className: 'ds-body' }, [
          el('h3', { text: t(base + 'title') }),
          el('p', { text: t(base + 'desc') }),
          pinout(p.tags),
          footer
        ])
      ]));
    });
  }

  function renderPublications() {
    var pubs = $('#pubs-list');
    var certs = $('#certs-list');
    pubs.textContent = '';
    certs.textContent = '';
    data.publications.publications.forEach(function (p) {
      pubs.appendChild(el('li', {}, [el('span', { text: p.title }), p.note ? el('small', { text: p.note }) : null]));
    });
    data.publications.certifications.forEach(function (c) {
      certs.appendChild(el('li', { text: c.title }));
    });
  }

  function renderDynamic() {
    renderHighlights();
    renderFacts();
    renderSkills();
    renderProjects();
    renderPublications();
  }

  /* ---------- theme ---------- */
  var THEMES = ['light', 'dark'];
  var THEME_COLORS = { light: '#f5f6f1', dark: '#0a1a2f' };

  function updateThemeButton() {
    var btn = $('#theme-toggle');
    var theme = root.dataset.theme;
    btn.setAttribute('aria-label', t('a11y.theme').replace('{name}', t('themes.' + theme)));
    btn.title = btn.getAttribute('aria-label');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);
  }

  function setTheme(theme, persist) {
    if (THEMES.indexOf(theme) === -1) return;
    root.dataset.theme = theme;
    if (persist) safeSet('theme', theme);
    updateThemeButton();
  }

  function initTheme() {
    $('#theme-toggle').addEventListener('click', function () {
      var next = THEMES[(THEMES.indexOf(root.dataset.theme) + 1) % THEMES.length];
      setTheme(next, true);
    });
    // Follow OS changes while the user has not chosen a theme manually.
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) { if (!safeGet('theme')) setTheme(e.matches ? 'dark' : 'light', false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }
  }

  /* ---------- menu ---------- */
  function initMenu() {
    var btn = $('#menu-toggle');
    var nav = $('#site-nav');
    function close() { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); btn.focus(); }
    });
  }

  /* ---------- command palette (Ctrl/Cmd + K) ---------- */
  var pal = { dialog: null, input: null, list: null, out: null, items: [], active: 0 };

  function norm(str) {
    return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function openUrl(url) { window.open(url, '_blank', 'noopener,noreferrer'); }

  function commandList() {
    var cmds = [];
    [['about', 'nav.about'], ['skills', 'nav.skills'], ['projects', 'nav.projects'],
     ['publications', 'nav.publications'], ['contact', 'nav.contact']].forEach(function (n) {
      cmds.push({
        label: t('palette.go') + ' ' + t(n[1]), group: t('palette.goGroup'),
        keys: n[0] + ' go ir ' + t(n[1]),
        run: function () { window.location.hash = '#' + n[0]; }
      });
    });
    LANGS.forEach(function (l) {
      cmds.push({
        label: l === 'en' ? 'English' : 'Español', group: t('palette.langGroup'),
        keys: l + ' language idioma', run: function () { setLang(l, true); }
      });
    });
    THEMES.forEach(function (th) {
      cmds.push({
        label: t('themes.' + th), group: t('palette.themeGroup'),
        keys: 'theme tema ' + th, run: function () { setTheme(th, true); }
      });
    });
    cmds.push({ label: t('palette.openGitHub'), group: t('palette.linkGroup'), keys: 'github', run: function () { openUrl('https://github.com/Juanda16'); } });
    cmds.push({ label: t('palette.openLinkedIn'), group: t('palette.linkGroup'), keys: 'linkedin', run: function () { openUrl('https://www.linkedin.com/in/juanarismendy16/'); } });
    cmds.push({
      label: t('palette.copyEmail'), group: t('palette.linkGroup'), keys: 'email correo mail copy copiar', keep: true,
      run: function () {
        var done = function (msg) { pal.out.textContent = msg; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('juand16@gmail.com').then(function () { done(t('palette.copied')); }, function () { done(t('palette.copyFail')); });
        } else { done(t('palette.copyFail')); }
      }
    });
    cmds.push({ label: 'whoami', group: t('palette.helpGroup'), keys: 'who quien', keep: true, run: function () { pal.out.textContent = t('palette.whoami'); } });
    cmds.push({ label: 'help', group: t('palette.helpGroup'), keys: 'ayuda ?', keep: true, run: function () { pal.out.textContent = t('palette.help'); } });
    return cmds;
  }

  function renderPalette() {
    var words = norm(pal.input.value).split(/\s+/).filter(Boolean);
    pal.items = commandList().filter(function (c) {
      var hay = norm(c.label + ' ' + c.keys + ' ' + c.group);
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
    if (pal.active >= pal.items.length) pal.active = 0;
    pal.list.textContent = '';
    if (!pal.items.length) {
      pal.list.appendChild(el('li', { className: 'palette-empty', text: t('palette.empty'), attrs: { role: 'presentation' } }));
    }
    pal.items.forEach(function (c, i) {
      var li = el('li', {
        className: 'palette-item',
        attrs: { role: 'option', id: 'palette-opt-' + i, 'aria-selected': String(i === pal.active) }
      }, [el('span', { text: c.label }), el('small', { text: c.group })]);
      li.addEventListener('click', function () { runCommand(i); });
      li.addEventListener('mousemove', function () { if (pal.active !== i) { pal.active = i; markActive(); } });
      pal.list.appendChild(li);
    });
    markActive(true);
  }

  function markActive(noScroll) {
    $$('.palette-item', pal.list).forEach(function (li, i) {
      li.setAttribute('aria-selected', String(i === pal.active));
      if (i === pal.active && !noScroll) li.scrollIntoView({ block: 'nearest' });
    });
    if (pal.items.length) pal.input.setAttribute('aria-activedescendant', 'palette-opt-' + pal.active);
    else pal.input.removeAttribute('aria-activedescendant');
  }

  function runCommand(i) {
    var c = pal.items[i];
    if (!c) return;
    if (c.keep) { c.run(); return; }
    pal.dialog.close();
    c.run();
  }

  function openPalette() {
    if (pal.dialog.open) return;
    pal.input.value = '';
    pal.out.textContent = '';
    pal.active = 0;
    pal.dialog.showModal();
    renderPalette();
    pal.input.focus();
  }

  function initPalette() {
    pal.dialog = $('#palette');
    if (!pal.dialog || typeof pal.dialog.showModal !== 'function') {
      var b = $('#palette-btn'); if (b) b.hidden = true;
      return;
    }
    pal.input = $('#palette-input');
    pal.list = $('#palette-list');
    pal.out = $('#palette-output');

    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
    $('#palette-kbd').textContent = isMac ? '⌘K' : 'Ctrl K';

    $('#palette-btn').addEventListener('click', openPalette);
    pal.input.addEventListener('input', function () { pal.active = 0; pal.out.textContent = ''; renderPalette(); });
    pal.input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (pal.items.length) { pal.active = (pal.active + 1) % pal.items.length; markActive(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (pal.items.length) { pal.active = (pal.active - 1 + pal.items.length) % pal.items.length; markActive(); } }
      else if (e.key === 'Enter') { e.preventDefault(); runCommand(pal.active); }
    });
    // click on the backdrop closes the dialog
    pal.dialog.addEventListener('click', function (e) { if (e.target === pal.dialog) pal.dialog.close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (pal.dialog.open) pal.dialog.close(); else openPalette();
      }
    });
  }

  /* ---------- apply language ---------- */
  function setLang(lang, persist) {
    return loadLang(lang).then(function () {
      currentLang = lang;
      root.lang = lang;
      if (persist) safeSet('lang', lang);
      $$('[data-lang-btn]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-btn') === lang));
      });
      applyStatic();
      renderDynamic();
      updateThemeButton();
      if (pal.dialog && pal.dialog.open) renderPalette();
      root.classList.remove('is-loading');
    });
  }

  function initLangToggle() {
    $$('[data-lang-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        var lang = b.getAttribute('data-lang-btn');
        if (lang !== currentLang) setLang(lang, true);
      });
    });
  }

  function fail(err) {
    if (window.console) console.error(err);
    root.classList.remove('is-loading');
    var main = $('#main');
    if (main) main.insertBefore(el('p', { className: 'container noscript', text: 'Could not load the content. Please reload the page. / No se pudo cargar el contenido. Recarga la página.' }), main.firstChild);
  }

  function init() {
    initTheme();
    initMenu();
    initLangToggle();
    initPalette();

    var lang = initialLang();
    Promise.all([
      loadJSON('data/projects.json'),
      loadJSON('data/skills.json'),
      loadJSON('data/publications.json')
    ]).then(function (res) {
      data = { projects: res[0], skills: res[1], publications: res[2] };
      return setLang(lang, false);
    }).catch(fail);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
