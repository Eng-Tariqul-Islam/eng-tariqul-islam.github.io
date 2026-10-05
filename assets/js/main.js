(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  // ---------- Theme ----------
  var themeToggle = $('#themeToggle');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  themeToggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---------- Mobile menu ----------
  var menuBtn = $('#menuToggle');
  var navLinks = $('#navLinks');
  function closeMenu() { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });

  // ---------- Header border + active nav ----------
  var header = $('.site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    var linkFor = {};
    $$('a', navLinks).forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && linkFor[e.target.id]) {
          $$('a', navLinks).forEach(function (a) { a.classList.remove('active'); });
          linkFor[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(linkFor).forEach(function (id) { var s = document.getElementById(id); if (s) navObserver.observe(s); });

    // ---------- Reveal on scroll ----------
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- Tabs ----------
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (!on) $$('video', panel).forEach(function (v) { v.pause(); });
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); select(n); }
      });
    });
  });

  // ---------- Video players: speed + chapters ----------
  $$('[data-player]').forEach(function (player) {
    var video = $('video', player);
    var speedBtns = $$('.speed button', player);
    var chapterBtns = $$('.chapters button', player);
    var initial = $('.speed button.on', player);
    var rate = initial ? parseFloat(initial.dataset.rate) : 1;

    function applyRate() { video.playbackRate = rate; }
    video.addEventListener('loadedmetadata', applyRate);
    video.addEventListener('play', applyRate);

    speedBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        rate = parseFloat(b.dataset.rate);
        applyRate();
        speedBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });

    chapterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        video.currentTime = parseFloat(b.dataset.t);
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      });
    });

    var times = chapterBtns.map(function (b) { return parseFloat(b.dataset.t); });
    var last = -1;
    video.addEventListener('timeupdate', function () {
      var idx = 0;
      for (var i = 0; i < times.length; i++) if (video.currentTime >= times[i]) idx = i;
      if (idx !== last) {
        last = idx;
        chapterBtns.forEach(function (b, i) { b.classList.toggle('current', i === idx); });
        var list = chapterBtns[idx] && chapterBtns[idx].closest('.chapters-scroll');
        if (list && !video.paused) {
          var li = chapterBtns[idx].parentElement;
          list.scrollTo({ top: li.offsetTop - list.clientHeight / 2 + li.clientHeight / 2, behavior: 'smooth' });
        }
      }
    });
  });

  // ---------- Project filters ----------
  var filterBtns = $$('.filters button');
  var cards = $$('#projectCards .card');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.filter;
      filterBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
      cards.forEach(function (c) {
        c.hidden = !(f === 'all' || c.dataset.cat === f);
        if (!c.hidden) c.classList.add('in');
      });
    });
  });

  // ---------- Lightbox ----------
  var lb = $('#lightbox');
  var lbImg = $('img', lb);
  var lbCap = $('figcaption', lb);
  var items = [];
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var fig = items[index];
    var img = $('img', fig);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = $('figcaption', fig).textContent + '  ·  ' + (index + 1) + ' / ' + items.length;
  }
  function open(group, i) {
    items = $$('figure', group);
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-gallery]').forEach(function (group) {
    $$('figure button', group).forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(group, i); });
    });
  });
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-prev', lb).addEventListener('click', function () { show(index - 1); });
  $('.lb-next', lb).addEventListener('click', function () { show(index + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) { if (e.key === 'Escape') closeMenu(); return; }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // ---------- Copy to clipboard ----------
  var toast = $('#toast');
  var toastTimer;
  function flash(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash('Copied ' + text); }, function () { flash(text); });
      } else {
        flash(text);
      }
    });
  });

  $('#year').textContent = new Date().getFullYear();
})();
