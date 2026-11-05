/* shared code for the paper notes: language switch, maths, canvas helper, quiz */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lang = () => document.documentElement.lang;
const langHooks = [];
const bi = (en, fr) => `<span class="en">${en}</span><span class="fr">${fr}</span>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function fit(cv){
  const d = devicePixelRatio || 1, r = cv.getBoundingClientRect();
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
  return [g, r.width, r.height];
}

function initNotes({titles, quiz}){
  /* ---------- language switch ---------- */
  function setLang(l){
    document.documentElement.lang = l;
    document.title = titles[l];
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === l));
    try { localStorage.setItem('lang', l); } catch (e) {}
    langHooks.forEach(f => f());
  }
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.l));
  setLang(lang());

  /* ---------- maths ---------- */
  addEventListener('DOMContentLoaded', () => {
    if (window.renderMathInElement) renderMathInElement(document.body, {
      delimiters: [{left: '\\[', right: '\\]', display: true}, {left: '\\(', right: '\\)', display: false}],
      throwOnError: false
    });
  });

  /* ---------- quiz ---------- */
  const n = quiz.length, pass = Math.ceil(n * .75);
  const check = document.getElementById('check'), retry = document.getElementById('retry'), scoreEl = document.getElementById('score');
  const catOut = document.getElementById('cat-out'), catArt = document.getElementById('cat-art'), catSay = document.getElementById('cat-say'), catMsg = document.getElementById('cat-msg');
  let sayT;

  document.getElementById('quiz-box').innerHTML = quiz.map((x, i) => `
  <div class="q" id="q${i}">
    <div class="qt"><span class="qn">${i + 1}/${n}</span>${bi(esc(x.q[0]), esc(x.q[1]))}</div>
    <div class="opts">${x.o.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}"><span>${bi(esc(o[0]), esc(o[1]))}</span></label>`).join('')}</div>
    <div class="fb"></div>
  </div>`).join('');

  const catArtFor = eyes => String.raw`   /\_____/\
  /  ${eyes}  \
 ( ==  ^  == )
  )         (
 (           )
( (  )   (  ) )
(__(__)___(__)__)`;

  function showCat(score){
    clearInterval(sayT);
    const good = score >= pass;
    catArt.innerHTML = catArtFor(good ? '<span class="hl">^</span>   <span class="hl">^</span>' : '<span class="hl">-</span>   <span class="hl">-</span>');
    catOut.classList.add('on'); catOut.classList.remove('hop');
    if (good){
      void catOut.offsetWidth;   // force a reflow so the hop animation restarts
      catOut.classList.add('hop');
      const full = score === n ? 'nyaaaaaaa~ ♡' : 'nyaaa~';
      let k = 0; catSay.textContent = '';
      sayT = setInterval(() => { catSay.textContent = full.slice(0, ++k); if (k >= full.length) clearInterval(sayT); }, reduced ? 0 : 90);
      catMsg.innerHTML = score === n
        ? bi('Perfect score. You are ready for the exam.', 'Sans faute. Vous êtes prêt·e pour l’examen.')
        : bi('Well done! Check the explanations above for the ones you missed.', 'Bien joué ! Regardez les explications au-dessus pour celles que vous avez ratées.');
    } else {
      catSay.textContent = 'zzz…';
      catMsg.innerHTML = bi(`The cat fell asleep. Re-read the linked sections and try again: you need ${pass}/${n} to wake it up.`, `Le chat s’est endormi. Relisez les sections indiquées et recommencez : il faut ${pass}/${n} pour le réveiller.`);
    }
  }

  check.onclick = () => {
    const missing = quiz.filter((x, i) => !document.querySelector(`input[name=q${i}]:checked`)).length;
    if (missing){
      scoreEl.innerHTML = bi(`${missing} question(s) left`, `il reste ${missing} question(s)`);
      return;
    }
    let score = 0;
    quiz.forEach((x, i) => {
      const el = document.getElementById('q' + i), pick = +document.querySelector(`input[name=q${i}]:checked`).value, ok = pick === x.a;
      if (ok) score++;
      el.classList.add('done');
      el.querySelectorAll('.opt').forEach((o, j) => {
        o.classList.toggle('right', j === x.a);
        o.classList.toggle('wrong', j === pick && !ok);
        o.querySelector('input').disabled = true;
      });
      el.querySelector('.fb').innerHTML = (ok ? '✓ ' : '✗ ') + bi(esc(x.e[0]), esc(x.e[1])) + ` <a href="${x.s}">↑ section</a>`;
    });
    scoreEl.textContent = `${score} / ${n}`;
    check.hidden = true; retry.hidden = false;
    showCat(score);
  };

  retry.onclick = () => {
    quiz.forEach((x, i) => {
      const el = document.getElementById('q' + i);
      el.classList.remove('done');
      el.querySelectorAll('.opt').forEach(o => {
        o.classList.remove('right', 'wrong');
        const r = o.querySelector('input'); r.disabled = false; r.checked = false;
      });
    });
    scoreEl.textContent = '';
    check.hidden = false; retry.hidden = true;
    catOut.classList.remove('on'); clearInterval(sayT);
    document.getElementById('quiz').scrollIntoView();
  };
}
