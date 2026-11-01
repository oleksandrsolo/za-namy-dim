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
})();
