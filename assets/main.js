(function () {
  var player = document.getElementById('player');
  var video = document.getElementById('playerVideo');
  var btn = document.getElementById('playFull');
  if (!player || !video || !btn) return;

  var conn = navigator.connection || {};
  var saveData = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFull = false;

  // Легке прев'ю (без звуку, по колу) вантажимо лише коли блок з'являється на екрані
  function loadPreview() {
    if (isFull || saveData || reduceMotion) return;
    video.src = video.dataset.preview;
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (isFull) return;
        if (e.isIntersecting) {
          if (!video.src) loadPreview(); else video.play().catch(function () {});
        } else if (video.src) {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    io.observe(player);
  } else {
    loadPreview();
  }

  // Повне відео зі звуком — тільки після кліку
  btn.addEventListener('click', function () {
    isFull = true;
    player.classList.add('is-full');
    video.pause();
    video.removeAttribute('loop');
    video.muted = false;
    video.controls = true;
    video.preload = 'auto';
    video.src = video.dataset.full;
    video.setAttribute('aria-label', 'Відео «За нами дім»');
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
    video.focus();
  });

  // Липка кнопка на мобільному: з'являється після шапки
  var sticky = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero');
  var donate = document.querySelector('.donate');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVisible = true, donateVisible = false;
    var upd = function () { sticky.classList.toggle('is-visible', !heroVisible && !donateVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; upd(); }).observe(hero);
    if (donate) new IntersectionObserver(function (e) { donateVisible = e[0].isIntersecting; upd(); }).observe(donate);
  }

  // Лайтбокс для фото в блоках
  var lb = document.getElementById('lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('.lightbox__img');
    document.querySelectorAll('.story__photo').forEach(function (b) {
      b.addEventListener('click', function () {
        var img = b.querySelector('img');
        lbImg.src = b.dataset.full; lbImg.alt = img ? img.alt : '';
        lb.showModal();
      });
    });
    lb.querySelector('.lightbox__close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  // Карусель фото в блоках
  document.querySelectorAll('.story__gallery').forEach(function (g, gi) {
    var slides = g.querySelectorAll('.story__photo');
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('is-active'); return; }
    var dots = document.createElement('div');
    dots.className = 'story__dots';
    var cur = 0, timer = null;
    function show(i) {
      slides[cur].classList.remove('is-active'); dots.children[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active'); dots.children[cur].classList.add('is-active');
    }
    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Фото ' + (i + 1));
      d.addEventListener('click', function () { show(i); restart(); });
      dots.appendChild(d);
    });
    g.appendChild(dots);
    slides[0].classList.add('is-active'); dots.children[0].classList.add('is-active');
    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () { show(cur + 1); }, 4500);
    }
    if (!reduceMotion) setTimeout(restart, gi * 2000);
    g.addEventListener('mouseenter', function () { clearInterval(timer); });
    g.addEventListener('mouseleave', restart);
  });

  // Шкала збору: дані з банки monobank
  var prog = document.getElementById('jarProgress');
  if (prog) {
    var fill = prog.querySelector('.progress__fill');
    var raisedEl = prog.querySelector('.progress__raised');
    var track = prog.querySelector('.progress__track');
    var fmt = function (n) { return Math.floor(n).toLocaleString('uk-UA').replace(/\u00a0|\u202f/g, ' '); };
    var render = function (amount, goal) {
      var pct = goal > 0 ? Math.min(100, amount / goal * 100) : 0;
      fill.style.width = (amount > 0 ? Math.max(pct, 1.5) : 0) + '%';
      raisedEl.textContent = fmt(amount / 100) + ' грн';
      track.setAttribute('aria-valuenow', String(Math.floor(amount / 100)));
    };
    var load = function () {
      fetch('https://api.monobank.ua/bank/jar/' + prog.dataset.jar, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { render(d.amount || 0, Number(prog.dataset.goal) || d.goal || 0); })
        .catch(function () { if (raisedEl.textContent.indexOf('—') === 0) raisedEl.textContent = 'дані оновлюються'; });
    };
    load();
    setInterval(load, 120000);
  }
})();
