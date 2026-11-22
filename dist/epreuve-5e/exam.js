const main = document.querySelector('#app');
document.body.classList.add('official-exam');
document.title = 'Épreuve de technologie · Énergie · 5e';
document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex"><link rel="stylesheet" href="epreuve-5e/exam.css">');
document.querySelectorAll('.top-progress, .top a:not(.brand):not(.official-link)').forEach(element => { element.hidden = true; });
document.querySelector('.brand').href = './';
document.querySelector('.official-link').setAttribute('aria-current', 'page');
main.innerHTML = `  <section id="welcome">
    <h1>Épreuve de technologie · 5e</h1>
    <p>Sources, formes et chaîne d’énergie · 20 minutes · /20</p>
    <p class="competency">Identifier des constituants de la chaîne d’énergie d’un objet technique (l’organisation de la chaîne d’énergie étant fournie)</p>
    <p>Le chronomètre démarre lorsque tu cliques sur <strong>Démarrer</strong>. Tu peux soumettre ta copie avant la fin. À 00:00, les réponses enregistrées sont remises automatiquement.</p>
    <form id="identity">
      <label>Nom <input name="lastName" maxlength="80" autocomplete="family-name" required></label>
      <label>Prénom <input name="firstName" maxlength="80" autocomplete="given-name" required></label>
      <label>Classe <input name="className" maxlength="30" autocomplete="off" required></label>
      <button type="submit">Démarrer</button>
    </form>
  </section>
  <p id="notice" role="status" aria-live="polite"></p>
  <section id="exam" hidden>
    <header class="official-clock"><strong>Épreuve de technologie · 5e</strong><span id="clock" role="timer">20:00</span></header>
    <form id="work">
      <div id="questions"></div>
      <button type="submit">Soumettre ma copie</button>
    </form>
  </section>
  <section id="received" hidden>
    <h1>Copie remise</h1>
    <p>Ta copie et ta note ont été enregistrées.</p>
  </section>
`;

const endpoint = 'https://yswswuxtdjpewrqzrrnu.supabase.co/functions/v1/energy-exam-5e';
const sessionKey = 'mission-energie-official-5e-session';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const notice = message => { $('#notice').textContent = message; };
let id;
let answers = {};
let selected;
let selectedSource;
let deadline;
let remainingAtSync;
let syncClock;
let revision = 0;
let sentRevision = 0;
let timer;
let queued;
let pending = false;
let submissionRequested = false;
let finished = false;

async function request(action, extra = {}) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action, id, ...extra}), signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Connexion indisponible.');
  return payload;
}
function finish() {
  finished = true;
  clearInterval(timer);
  clearTimeout(queued);
  $('#welcome').hidden = true;
  $('#exam').hidden = true;
  $('#received').hidden = false;
  notice('');
}
function clock() {
  const seconds = Math.max(0, Math.ceil((remainingAtSync - (performance.now() - syncClock)) / 1000));
  $('#clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  if (seconds === 0 && !submissionRequested) {
    submissionRequested = true;
    lock();
    void flush();
  }
}
function lock() {
  $('#work').querySelectorAll('input,button').forEach(control => { control.disabled = true; });
  notice('Remise de la copie en cours…');
}
function schedule(delay) {
  clearTimeout(queued);
  queued = setTimeout(flush, delay);
}
async function flush() {
  if (pending || finished || (!submissionRequested && revision <= sentRevision)) return;
  pending = true;
  const submitting = submissionRequested;
  let retry = false;
  try {
    const result = await request(submitting ? 'submit' : 'save', {
      revision: submitting ? ++revision : revision, answers: {...answers},
    });
    sentRevision = Math.max(sentRevision,result.revision);
    if (result.submitted_at) finish();
    else notice('');
  } catch {
    notice(submitting ? 'Remise en attente de connexion. Laisse cette page ouverte.' : 'Connexion interrompue. Enregistrement en cours de réessai.');
    retry = true;
  } finally {
    pending = false;
    if (!finished && (retry || submissionRequested || revision > sentRevision)) schedule(retry ? 1400 : 0);
  }
}
function setAnswer(index, value) {
  if (submissionRequested || finished) return;
  answers[index] = value;
  revision++;
  schedule(220);
}
function input(question, index, label) {
  return `<label>${escape(label)}<input class="exam-text" data-answer="${index}" value="${escape(answers[index] ?? '')}" maxlength="300" autocomplete="off">${question.tail ? `<small>${escape(question.tail)}</small>` : ''}</label>`;
}
function associationLabels() {
  const occupied = new Set([...document.querySelectorAll('[data-match]')].map(button => answers[button.dataset.match]));
  document.querySelectorAll('[data-label]').forEach(button => {
    button.disabled = occupied.has(button.dataset.label);
    button.setAttribute('aria-pressed', String(selected === button.dataset.label));
  });
}
function standard(question, index) {
  const words = question.suggestions ?? question.hints ?? [];
  return `<fieldset class="question"><legend>${index + 1}. ${escape(question.prompt)}</legend>
    ${question.options ? question.options.map(option => `<label class="radio-line"><input type="radio" name="question-${index}" data-answer="${index}" value="${escape(option)}" ${answers[index] === option ? 'checked' : ''}> ${escape(option)}</label>`).join('') :
    `${words.length ? `<div class="word-help">Mots proposés · ${words.map(escape).join(' · ')}</div>` : ''}${input(question,index,'Ta réponse')}`}</fieldset>`;
}
function sortSources(entries) {
  const boxes = ['Renouvelable','Non renouvelable'];
  const cards = category => entries.filter(([,i]) => answers[i] === category || (!category && !answers[i]))
    .map(([q,i]) => `<button type="button" draggable="true" data-source="${i}" aria-pressed="${String(selectedSource === String(i))}">${i+1}. ${escape(q.card)}</button>`).join('');
  return `<p>Choisis une source puis sa catégorie, ou glisse-la dans la bonne colonne.</p>
    <div class="form-bank">${cards(undefined)}</div>
    <div class="source-sort">${boxes.map(category => `<div data-source-drop="${category}"><button type="button" data-category="${category}">${category}</button>
      <div class="form-bank">${cards(category)}</div></div>`).join('')}</div>`;
}
let sourceEntries = [];
function placeSource(index, category) {
  if (submissionRequested || finished || !sourceEntries.some(([,i]) => String(i) === index)) return;
  setAnswer(index,category);
  selectedSource = undefined;
  $('#source-sort-group').innerHTML = sortSources(sourceEntries);
  document.querySelector(`[data-source="${index}"]`)?.focus({preventScroll:true});
}
function render(paper) {
  let offset = 0;
  $('#questions').innerHTML = paper.map((section, part) => {
    const start = offset;
    offset += section.items.length;
    const points = section.items.reduce((sum, question) => sum + question.points,0);
    let body;
    if (section.chain) {
      body = `<img src="photos/electric-bicycle.jpg" width="200" alt="Vélo à assistance électrique">
        <div class="word-help">${section.banks.map(([label,words]) => `<div><strong>${escape(label)}</strong> · ${words.map(escape).join(' · ')}</div>`).join('')}</div>
        <div class="chain">${Array.from({length:4},(_,i) => `<fieldset><legend>Étape ${i+1}${i<3 ? ' →' : ''}</legend>${section.items.slice(i*3,i*3+3).map((q,j) => input(q,start+i*3+j,q.prompt)).join('')}</fieldset>`).join('')}</div>`;
    } else {
      const entries = section.items.map((question,i) => [question,start+i]);
      const sorting = entries.filter(([q]) => q.interaction === 'sort');
      const matching = section.labels ? entries.filter(([q]) => q.interaction === 'match' || !q.suggestions) : [];
      if (sorting.length) sourceEntries = sorting;
      body = sorting.length ? `<div id="source-sort-group">${sortSources(sorting)}</div>` : '';
      if (matching.length) body += `<p>Sélectionne une étiquette puis la situation correspondante. Clique sur une case remplie pour libérer l’étiquette.</p>
        <div class="form-bank">${section.labels.map(label => `<button type="button" data-label="${escape(label)}" aria-pressed="false">${escape(label)}</button>`).join('')}</div>
        ${matching.map(([q,i]) => `<div class="association"><span>${i+1}. ${escape(q.prompt)}</span><button type="button" data-match="${i}">${escape(answers[i] || 'Associer ici')}</button></div>`).join('')}`;
      body += entries.filter(entry => !sorting.includes(entry) && !matching.includes(entry)).map(([q,i]) => standard(q,i)).join('');
    }
    return `<section><h2>${part+1}. ${escape(section.title)} · ${points} points</h2><p>${escape(section.guide)}</p>${body}</section>`;
  }).join('');
  associationLabels();
}
function open(result) {
  if (result.submitted_at) { finish(); return; }
  answers = result.answers;
  revision = sentRevision = result.revision;
  deadline = Date.parse(result.deadline);
  remainingAtSync = deadline - result.serverTime;
  syncClock = performance.now();
  render(result.paper);
  if (result.subject_number) $('.official-clock strong').textContent = `Épreuve de technologie · 5e · Sujet ${String(result.subject_number).padStart(3,'0')}`;
  $('#welcome').hidden = true;
  $('#exam').hidden = false;
  notice('');
  clock();
  timer = setInterval(clock,250);
}
$('#identity').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  id ??= crypto.randomUUID();
  try {
    const result = await request('start',Object.fromEntries(new FormData(form)));
    try { sessionStorage.setItem(sessionKey,id); } catch {}
    open(result);
  } catch (error) { notice(error.message); }
  finally { button.disabled = false; }
});
$('#work').addEventListener('input', event => {
  if (event.target.matches('[data-answer]')) setAnswer(event.target.dataset.answer,event.target.value);
});
$('#work').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || submissionRequested) return;
  if (button.dataset.source) {
    selectedSource = selectedSource === button.dataset.source ? undefined : button.dataset.source;
    document.querySelectorAll('[data-source]').forEach(card =>
      card.setAttribute('aria-pressed', String(card.dataset.source === selectedSource)));
  } else if (button.dataset.category && selectedSource !== undefined) {
    placeSource(selectedSource, button.dataset.category);
  } else if (button.dataset.label) {
    selected = selected === button.dataset.label ? undefined : button.dataset.label;
    associationLabels();
  } else if (button.dataset.match) {
    setAnswer(button.dataset.match,selected ?? '');
    button.textContent = selected ?? 'Associer ici';
    selected = undefined;
    associationLabels();
  }
});
$('#work').addEventListener('dragstart', event => {
  const card = event.target.closest('[data-source]');
  if (card && !submissionRequested) event.dataTransfer.setData('application/x-energy-source',card.dataset.source);
});
$('#work').addEventListener('dragover', event => {
  if (!submissionRequested && event.target.closest('[data-source-drop]') &&
      event.dataTransfer.types.includes('application/x-energy-source')) event.preventDefault();
});
$('#work').addEventListener('drop', event => {
  const box = event.target.closest('[data-source-drop]');
  const index = event.dataTransfer.getData('application/x-energy-source');
  if (!box || !index) return;
  event.preventDefault();
  placeSource(index,box.dataset.sourceDrop);
});
$('#work').addEventListener('submit', event => {
  event.preventDefault();
  if (submissionRequested) return;
  submissionRequested = true;
  lock();
  void flush();
});
window.addEventListener('online', () => { if (id && deadline) schedule(0); });
window.addEventListener('pagehide', () => {
  if (!deadline || finished || (!submissionRequested && revision <= sentRevision)) return;
  void fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
    body:JSON.stringify({action:submissionRequested?'submit':'save',id,revision:submissionRequested?++revision:revision,answers})}).catch(()=>{});
});
try { id = sessionStorage.getItem(sessionKey); } catch {}
if (id) {
  const button = $('#identity button');
  button.disabled = true;
  request('resume').then(open).catch(error => notice(error.message)).finally(() => { button.disabled = false; });
}
