(function(){
  /* ===== Waitlist =====
     Paste your Formspree form ID here (the part after /f/ in your form's endpoint).
     Example: https://formspree.io/f/xyzabcd  ->  FORMSPREE_ID = 'xyzabcd'          */
  var FORMSPREE_ID = 'xnpdqoda';

  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function aud(n){ return '$' + n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); }

  /* ---------- header: solid on scroll, mobile menu ---------- */
  var head = document.querySelector('.site-head');
  function onScrollHead(){ if (head) head.classList.toggle('scrolled', window.scrollY > 24); }
  onScrollHead();
  window.addEventListener('scroll', onScrollHead, {passive:true});
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function(){
      var open = doc.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.nav a').forEach(function(a){
      a.addEventListener('click', function(){ doc.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded','false'); });
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) { doc.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.focus(); }
    });
  }

  /* ---------- headline reveal (once, on load) ---------- */
  requestAnimationFrame(function(){
    document.querySelectorAll('.reveal-lines').forEach(function(el){ el.classList.add('in'); });
  });

  /* ---------- in-view triggers (used sparingly) ---------- */
  var ioEls = document.querySelectorAll('[data-inview]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:0.35});
    ioEls.forEach(function(el){ io.observe(el); });
  } else { ioEls.forEach(function(el){ el.classList.add('in'); }); }

  /* ---------- waitlist forms ---------- */
  var host = location.hostname;
  var isLive = /(^|\.)paydaymate\.com\.au$/.test(host) || /\.vercel\.app$/.test(host);
  var configured = FORMSPREE_ID && FORMSPREE_ID !== 'YOUR_FORM_ID';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var TICK = '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#9BE8B0"/><path d="M6.5 11.3l3 3 6-6.3" fill="none" stroke="#0F3D2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function success(form){
    form.classList.add('done');
    form.innerHTML = '<div class="done-msg" tabindex="-1">' + TICK + '<div><strong>You’re on the list.</strong><span>We’ll be in touch before we open early access.</span></div></div>';
    var d = form.querySelector('.done-msg'); if (d) d.focus({preventScroll:true});
  }
  document.querySelectorAll('form.waitlist').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var input = form.querySelector('input[type=email]');
      var msg = form.querySelector('.form-msg');
      var btn = form.querySelector('button');
      var email = (input.value || '').trim();
      msg.textContent = ''; msg.className = 'form-msg';
      if (!EMAIL_RE.test(email)) { msg.textContent = 'Enter an email address like name@company.com.au.'; msg.classList.add('err'); input.focus(); return; }
      if (form.querySelector('[name=_gotcha]').value) { success(form); return; }
      if (!isLive) { success(form); return; }              // preview: show the confirmed state, send nothing
      if (!configured) { msg.textContent = 'Sign-ups aren’t connected yet. Add the Formspree form ID to go live.'; msg.classList.add('err'); return; }
      btn.disabled = true; btn.textContent = 'Joining…';
      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method:'POST',
        headers:{'Accept':'application/json','Content-Type':'application/json'},
        body: JSON.stringify({email:email, source:(form.dataset.source || '') + ' (' + location.pathname + ')', _subject:'New Payday Mate waitlist sign-up'})
      }).then(function(r){ if (r.ok) return success(form); throw new Error('bad'); })
        .catch(function(){ btn.disabled = false; btn.textContent = 'Join the waitlist'; msg.textContent = 'That didn’t go through. Check your connection and try again.'; msg.classList.add('err'); });
    });
  });

  /* ---------- home hero statement: one load sequence ---------- */
  var st = document.getElementById('statement');
  if (st) {
    var totalEl = document.getElementById('st-total');
    requestAnimationFrame(function(){
      st.classList.add('run');
      if (reduce) return;
      var target = 3238, start = null, delay = 1150, dur = 900;
      totalEl.textContent = aud(0);
      (function tick(ts){
        if (ts) { if (!start) start = ts;
          var p = Math.min(1, Math.max(0, (ts - start - delay) / dur));
          totalEl.textContent = aud(target * (1 - Math.pow(1 - p, 3)));
          if (p >= 1) return; }
        requestAnimationFrame(tick);
      })();
    });
  }

  /* ---------- how a pay run works: scroll-driven ---------- */
  var how = document.querySelector('.how-track');
  if (how) {
    var steps = how.querySelectorAll('.step');
    var rows = how.querySelectorAll('.tk-row');
    var status = how.querySelector('.status');
    var rail = how.querySelector('.steps');
    var meter = how.querySelector('.meter');
    var meterLbl = how.querySelector('.tk-foot span');
    var counter = how.querySelector('.step-count');
    var N = steps.length, last = -1;
    var labels = Array.prototype.map.call(steps, function(s){ return s.dataset.status; });
    function update(){
      var r = how.getBoundingClientRect();
      var total = how.offsetHeight - window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / total));
      var idx = Math.min(N - 1, Math.floor(p * N));
      rail.style.setProperty('--p', Math.min(1, Math.max(0, (p * N - 0.5) / (N - 1))).toFixed(4));
      meter.style.setProperty('--p', ((idx + 1) / N).toFixed(3));
      if (idx === last) return;
      last = idx;
      steps.forEach(function(s, i){ s.classList.toggle('active', i === idx); s.classList.toggle('done', i < idx); });
      rows.forEach(function(row){ row.classList.toggle('show', +row.dataset.step <= idx); });
      status.textContent = labels[idx];
      status.classList.toggle('final', idx === N - 1);
      meterLbl.textContent = 'Step ' + (idx + 1) + ' of ' + N;
      if (counter) counter.textContent = 'Step ' + (idx + 1) + ' of ' + N;
    }
    var ticking = false;
    window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(function(){ ticking = false; update(); }); } }, {passive:true});
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Payday Super calculator ---------- */
  var payday = document.getElementById('c-payday');
  if (payday) {
    var SG_RATE = 0.12;
    var amount = document.getElementById('c-amount');
    var dueEl = document.getElementById('c-due'), inEl = document.getElementById('c-in');
    var supEl = document.getElementById('c-super'), totEl = document.getElementById('c-total');
    var daysEl = document.getElementById('c-days');
    var today = new Date(); today.setHours(0,0,0,0);
    function iso(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
    function parseISO(s){ var p = s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
    // Weekdays only. Whole-state public holidays anywhere in Australia push the deadline later,
    // so this gives the earliest possible (always safe) due date.
    function businessDaysAfter(d, n){ var out = [], x = new Date(d); while (out.length < n) { x.setDate(x.getDate()+1); var w = x.getDay(); if (w !== 0 && w !== 6) out.push(new Date(x)); } return out; }
    var f = new Date(today); f.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
    payday.value = iso(f);
    var lastKey = '';
    function render(){
      var amt = parseFloat(String(amount.value).replace(/[^0-9.]/g,'')) || 0;
      var sup = Math.round(amt * SG_RATE * 100) / 100;
      supEl.textContent = aud(sup); totEl.textContent = aud(amt + sup);
      if (!payday.value) { dueEl.textContent = 'Pick a payday'; inEl.innerHTML = '&nbsp;'; if (daysEl) daysEl.innerHTML = ''; return; }
      var pd = parseISO(payday.value);
      var list = businessDaysAfter(pd, 7), due = list[6];
      dueEl.textContent = due.toLocaleDateString('en-AU',{weekday:'long', day:'numeric', month:'long'});
      var days = Math.round((due - today) / 86400000), cal = Math.round((due - pd) / 86400000);
      inEl.textContent = days > 1 ? days + ' days from today, ' + cal + ' calendar days after payday.' : days === 1 ? 'That’s tomorrow.' : days === 0 ? 'That’s today.' : 'That date has already passed.';
      if (daysEl && payday.value !== lastKey) {
        lastKey = payday.value;
        daysEl.innerHTML = list.map(function(d){ return '<span title="' + d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'}) + '">' + d.toLocaleDateString('en-AU',{weekday:'short'}).slice(0,2) + ' ' + d.getDate() + '</span>'; }).join('');
        var spans = daysEl.querySelectorAll('span');
        spans.forEach(function(s, i){ setTimeout(function(){ s.classList.add('on'); }, reduce ? 0 : 60 * i); });
      }
    }
    amount.addEventListener('input', render);
    amount.addEventListener('blur', function(){ var v = parseFloat(String(amount.value).replace(/[^0-9.]/g,'')); if (!isNaN(v)) amount.value = v.toLocaleString('en-AU',{maximumFractionDigits:2}); });
    payday.addEventListener('input', render);
    payday.addEventListener('change', render);
    render();
  }

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
