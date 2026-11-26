import { createAssessment } from '../assessment.js';

const endpoint = 'https://yswswuxtdjpewrqzrrnu.supabase.co/functions/v1/energy-exam-5e';
const sessionKey = 'mission-energie-official-4e-session';
const classes = ['4A', '4B', '4C', '4D', '4E'];
const $ = selector => document.querySelector(selector);
const app = $('#app');
document.title = 'Épreuve de technologie · 4e';
document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">');
document.querySelectorAll('.top-progress, .top a:not(.brand):not(.official-link)').forEach(element => { element.hidden = true; });
$('.brand').href = '?niveau=4e';
const officialLink = $('.official-link');
officialLink.href = '?epreuve=4e';
officialLink.textContent = 'Épreuve 4e';
officialLink.setAttribute('aria-current', 'page');

app.innerHTML = `<section id="fourth-exam-welcome" class="game exam">
  <section class="exam-intro">
    <div>
      <h1>Épreuve de technologie · 4e</h1>
      <p>Sources, formes et chaîne d’énergie · 20 minutes · /20</p>
      <p>Le chronomètre démarre quand tu cliques sur <strong>Démarrer</strong>. Complète les réponses, coche la confirmation et clique sur <strong>Soumettre ma copie</strong> avant la fin du temps.</p>
      <form id="fourth-exam-identity">
        <label>Nom <input name="lastName" maxlength="80" autocomplete="family-name" required></label>
        <label>Prénom <input name="firstName" maxlength="80" autocomplete="given-name" required></label>
        <div class="fourth-class-choice"><label for="fourth-exam-class">Classe</label>
          <select id="fourth-exam-class" name="className" required>
            <option value="" selected disabled>Choisis ta classe</option>
            ${classes.map(className => `<option>${className}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="primary">Démarrer</button>
      </form>
      <p id="fourth-exam-error" role="status"></p>
    </div>
    <img src="photos/electric-bicycle.jpg" alt="Vélo à assistance électrique avec moteur au pédalier">
  </section>
</section>
<div id="fourth-exam-questions" hidden></div>
<section id="fourth-exam-received" class="game exam" hidden>
  <h1 tabindex="-1">Copie remise</h1>
  <p>Ta copie et ta note ont été enregistrées.</p>
  <button type="button" id="fourth-exam-new-student" class="primary">Nouvel élève</button>
</section>`;

let id;
let draft;
let sending = false;
let expired = false;
let timer;
let remainingAtOpen;
let openedAt;

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function storeSession(value) {
  try { sessionStorage.setItem(sessionKey, JSON.stringify(value)); } catch {}
}

async function request(action, fields) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action, id, grade:'4e', ...fields}),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error ?? 'Connexion indisponible.');
    error.expired = data.code === 'expired';
    throw error;
  }
  return data;
}

const assessment = createAssessment($('#fourth-exam-questions'), shuffle, '4e', {saveDraft, submit});

function saveDraft(answers) {
  draft.answers = answers;
  storeSession(draft);
}

function finish() {
  clearInterval(timer);
  storeSession({id, submitted: true});
  $('#fourth-exam-welcome').hidden = true;
  $('#fourth-exam-questions').hidden = true;
  $('#fourth-exam-received').hidden = false;
  $('#fourth-exam-received h1').focus();
}

function updateControls() {
  for (const element of document.querySelectorAll('#fourth-exam-questions .exam-sheet')) {
    element.inert = expired || draft.submissionStarted;
  }
  $('#confirm-submit').disabled = expired || sending;
  assessment.updateOfficialButton();
}

function status(message) {
  $('.official-fourth-status').textContent = message;
}

function expire() {
  expired = true;
  updateControls();
  status('Temps écoulé. Ta copie n’a pas été remise.');
}

function tick() {
  const seconds = Math.max(0, Math.ceil((remainingAtOpen - (performance.now() - openedAt)) / 1000));
  $('.official-fourth-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (seconds === 0) {
    clearInterval(timer);
    if (!draft.submissionStarted) expire();
  }
}

async function submit(answers) {
  if (sending || expired) return;
  tick();
  if (expired) return;
  sending = true;
  draft.submissionStarted = true;
  saveDraft(answers);
  updateControls();
  status('Remise de la copie en cours…');
  try {
    const result = await request('submit', {revision:1, answers:draft.answers});
    if (!result.submitted_at) throw new Error('Remise à vérifier.');
    finish();
  } catch (error) {
    if (error.expired) expire();
    else status('Envoi non confirmé. Clique de nouveau sur « Soumettre ma copie » pour réessayer.');
  } finally {
    sending = false;
    updateControls();
  }
}

function open(saved) {
  draft = saved;
  remainingAtOpen = draft.localDeadline - Date.now();
  openedAt = performance.now();
  $('#fourth-exam-welcome').hidden = true;
  $('#fourth-exam-questions').hidden = false;
  assessment.openQuestions(draft.paper, draft.number, draft.answers);
  updateControls();
  if (draft.submissionStarted) status('Envoi non confirmé. Coche la confirmation, puis soumets de nouveau ta copie.');
  timer = setInterval(tick, 250);
  tick();
}

$('#fourth-exam-identity').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  $('#fourth-exam-error').textContent = 'Chargement du sujet…';
  id ??= crypto.randomUUID();
  try {
    const result = await request('start', Object.fromEntries(new FormData(form)));
    if (result.submitted_at) { finish(); return; }
    const saved = {
      id,
      number: result.subject_number,
      answers: result.answers,
      paper: result.paper,
      localDeadline: Date.now() + (Date.parse(result.deadline) - result.serverTime),
      submissionStarted: false,
    };
    storeSession(saved);
    open(saved);
  } catch (error) {
    $('#fourth-exam-error').textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$('#fourth-exam-new-student').addEventListener('click', () => {
  try { sessionStorage.removeItem(sessionKey); } catch {}
  id = undefined;
  draft = undefined;
  expired = false;
  $('#fourth-exam-questions').replaceChildren();
  $('#fourth-exam-identity').reset();
  $('#fourth-exam-error').textContent = '';
  $('#fourth-exam-received').hidden = true;
  $('#fourth-exam-welcome').hidden = false;
  window.scrollTo(0, 0);
  $('#fourth-exam-identity input').focus({ preventScroll: true });
});

let saved;
try { saved = JSON.parse(sessionStorage.getItem(sessionKey)); } catch {}
if (saved) {
  id = saved.id;
  if (saved.submitted) finish();
  else open(saved);
}
