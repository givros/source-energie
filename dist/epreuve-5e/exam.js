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
    <p>Tu as 20 minutes après avoir cliqué sur <strong>Démarrer</strong>. Avant la fin du chrono, coche la confirmation puis clique sur <strong>Soumettre ma copie</strong>.</p>
    <form id="identity">
      <label>Nom <input name="lastName" maxlength="80" autocomplete="family-name" required></label>
      <label>Prénom <input name="firstName" maxlength="80" autocomplete="given-name" required></label>
      <div class="class-choice"><label for="exam-class">Classe</label>
        <select id="exam-class" name="className" required>
          <option value="" selected disabled>Choisis ta classe</option>
          <option value="5C">5C</option>
          <option value="5F">5F</option>
          <option value="5G">5G</option>
        </select>
      </div>
      <button type="submit">Démarrer</button>
    </form>
  </section>
  <p id="notice" role="status" aria-live="polite"></p>
  <section id="exam" hidden>
    <header class="official-clock"><strong>Épreuve de technologie · 5e</strong><span id="clock" role="timer">20:00</span></header>
    <form id="work">
      <div id="questions"></div>
      <label class="submit-confirmation"><input type="checkbox" id="confirm-submit"> Je confirme que je veux remettre ma copie.</label>
      <button type="submit" id="submit-exam" disabled>Soumettre ma copie</button>
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
let draft;
let remainingAtSync;
let syncClock;
let revision = 0;
let timer;
let sending = false;
let expired = false;

async function request(action, extra = {}) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action, id, ...extra}), signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error ?? 'Connexion indisponible.');
    error.expired = payload.code === 'expired';
    throw error;
  }
  return payload;
}
function storeSession(value) {
  try { sessionStorage.setItem(sessionKey, JSON.stringify(value)); } catch {}
}
function finish() {
  clearInterval(timer);
  storeSession({id, submitted: true});
  $('#welcome').hidden = true;
  $('#exam').hidden = true;
  $('#received').hidden = false;
  notice('');
}
function clock() {
  const seconds = Math.max(0, Math.ceil((remainingAtSync - (performance.now() - syncClock)) / 1000));
  $('#clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  if (seconds === 0) {
    clearInterval(timer);
    if (!draft.submissionRevision) expire();
  }
}
function updateControls() {
  const confirmation = $('#confirm-submit');
  $('#questions').inert = expired || Boolean(draft.submissionRevision);
  confirmation.disabled = sending || expired;
  $('#submit-exam').disabled = confirmation.disabled || !confirmation.checked;
}
function expire() {
  expired = true;
  updateControls();
  notice('Temps écoulé. Ta copie n’a pas été remise.');
}
async function submitCopy() {
  sending = true;
  draft.submissionRevision ??= revision + 1;
  storeSession(draft);
  updateControls();
  notice('Remise de la copie en cours…');
  try {
    const result = await request('submit', {
      revision: draft.submissionRevision, answers,
    });
    if (!result.submitted_at) throw new Error('Remise à vérifier.');
    finish();
  } catch (error) {
    if (error.expired) expire();
    else notice('Envoi non confirmé. Clique de nouveau sur « Soumettre ma copie » pour réessayer.');
  } finally {
    sending = false;
    updateControls();
  }
}
function setAnswer(index, value) {
  if (expired || draft.submissionRevision) return;
  answers[index] = value;
  storeSession(draft);
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
  if (expired || draft.submissionRevision || !sourceEntries.some(([,i]) => String(i) === index)) return;
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
function open(saved) {
  draft = saved;
  answers = saved.answers;
  revision = saved.revision;
  remainingAtSync = saved.localDeadline - Date.now();
  syncClock = performance.now();
  render(saved.paper);
  if (saved.subjectNumber) $('.official-clock strong').textContent = `Épreuve de technologie · 5e · Sujet ${String(saved.subjectNumber).padStart(3,'0')}`;
  $('#welcome').hidden = true;
  $('#exam').hidden = false;
  notice(saved.submissionRevision ? 'Envoi non confirmé. Coche la confirmation puis clique sur « Soumettre ma copie » pour réessayer.' : '');
  updateControls();
  timer = setInterval(clock,250);
  clock();
}
$('#identity').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  id ??= crypto.randomUUID();
  try {
    const result = await request('start',{...Object.fromEntries(new FormData(form)), manualOnly: true});
    if (result.submitted_at) { finish(); return; }
    const saved = {
      id, answers: result.answers, revision: result.revision,
      localDeadline: Date.now() + (Date.parse(result.deadline) - result.serverTime),
      subjectNumber: result.subject_number, paper: result.paper,
    };
    storeSession(saved);
    open(saved);
  } catch (error) { notice(error.message); }
  finally { button.disabled = false; }
});
$('#work').addEventListener('input', event => {
  if (event.target.matches('[data-answer]')) setAnswer(event.target.dataset.answer,event.target.value);
});
$('#questions').addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('input[type="text"], input:not([type])')) event.preventDefault();
});
$('#work').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || !draft || expired || draft.submissionRevision) return;
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
  if (card && !expired && !draft.submissionRevision) event.dataTransfer.setData('application/x-energy-source',card.dataset.source);
});
$('#work').addEventListener('dragover', event => {
  if (!expired && !draft.submissionRevision && event.target.closest('[data-source-drop]') &&
      event.dataTransfer.types.includes('application/x-energy-source')) event.preventDefault();
});
$('#work').addEventListener('drop', event => {
  const box = event.target.closest('[data-source-drop]');
  const index = event.dataTransfer.getData('application/x-energy-source');
  if (!box || !index) return;
  event.preventDefault();
  placeSource(index,box.dataset.sourceDrop);
});
$('#confirm-submit').addEventListener('change', updateControls);
$('#work').addEventListener('submit', event => {
  event.preventDefault();
  if (!draft || sending || !$('#confirm-submit').checked) return;
  clock();
  if (!expired) void submitCopy();
});
let saved;
try {
  const stored = sessionStorage.getItem(sessionKey);
  if (stored?.startsWith('{')) saved = JSON.parse(stored);
  else id = stored || undefined;
} catch {}
if (saved) {
  id = saved.id;
  if (saved.submitted) finish();
  else open(saved);
}
