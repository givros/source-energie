import { missions as fifthGradeMissions, fourthGradeMissions } from './missions.js';
import { createCourse } from './course.js';
import { createAssessment } from './assessment.js';
import { modeLabels, createMechanic, renderMechanic, handleMechanic, markMechanicResult, mechanicSolution } from './mechanics.js';

const app = document.querySelector('#app');
const progressLabel = document.querySelector('#top-progress');
const isFourthGrade = new URLSearchParams(location.search).get('niveau') === '4e';
const grade = isFourthGrade ? '4e' : '5e';
const missions = isFourthGrade ? fourthGradeMissions : fifthGradeMissions;
const storageKey = `mission-energie-${grade}-v4`;
const gradeLink = document.querySelector('.grade-link');
gradeLink.href = isFourthGrade ? './' : '?niveau=4e';
gradeLink.textContent = isFourthGrade ? 'Version 5e' : 'Version 4e';
if (isFourthGrade) {
  document.title = 'Mission Énergie · Technologie 4e';
  document.querySelector('.brand').href = '#cours';
  document.querySelector('.official-link').hidden = true;
}
const retainedMissions = new Set(['sources-tri', 'chaine-ordre', 'chaine-pieces']);
const scores = readScores();
let run;
const assessment = createAssessment(app, shuffled, grade);
const course = isFourthGrade ? createCourse(app) : null;
let selectedMission = missions[0];

function readScores() {
  try {
    const current = localStorage.getItem(storageKey);
    const saved = JSON.parse(current ?? (isFourthGrade ? null : localStorage.getItem('mission-energie-5e-v3')));
    return Object.fromEntries(missions.flatMap(({ id, rounds }) =>
      (current !== null || retainedMissions.has(id)) && Number.isInteger(saved?.[id]) && saved[id] >= 0 && saved[id] <= rounds.length ? [[id, saved[id]]] : []
    ));
  } catch {
    return {};
  }
}

function saveScore() {
  scores[run.mission.id] = Math.max(scores[run.mission.id] ?? 0, run.points);
  try {
    localStorage.setItem(storageKey, JSON.stringify(scores));
  } catch {
    // Progress remains available while this page is open.
  }
}

function updateProgress() {
  progressLabel.textContent = `${Object.keys(scores).length} / ${missions.length} mini-jeux terminés`;
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function missionCard(mission) {
  const completed = Object.hasOwn(scores, mission.id);
  return `<button type="button" class="mission" data-mission="${mission.id}" aria-pressed="${selectedMission === mission}">
    <img src="photos/${mission.cover}.jpg" alt="">
    <strong>${mission.title}</strong>
    ${completed ? `<em aria-label="Record ${scores[mission.id]} sur ${mission.rounds.length}">${scores[mission.id]}/${mission.rounds.length}</em>` : ''}
  </button>`;
}

function missionBrief(mission) {
  const number = String(missions.indexOf(mission) + 1).padStart(2, '0');
  const mode = mission.rounds[0].board ? 'Cartes à manipuler' : modeLabels[mission.rounds[0].mode];
  return `<img class="brief-photo" src="photos/${mission.cover}.jpg" alt="">
          <div class="brief-content">
            <div class="eyebrow">Mission ${number} · ${mission.zone}</div>
            <h2>${mission.title}</h2>
            <p>${mission.summary}</p>
            <div class="brief-controls">
              <a class="primary" href="#jeu/${mission.id}">Jouer</a>
              <span>${mode} · ${mission.rounds.length} manches</span>
            </div>
          </div>`;
}

function showHome(jumpToMissions) {
  const zones = [...new Set(missions.map(mission => mission.zone))];
  app.innerHTML = `<section class="control-room" id="missions" aria-labelledby="mission-title">
    <div class="room-console">
      <div class="room-heading">
        <div class="eyebrow">Technologie ${grade}${isFourthGrade ? "" : " · Séquence 02"}</div>
        <h1 id="mission-title" tabindex="-1">Poste de contrôle</h1>
      </div>
      <div class="console-grid">
        <div class="mission-bank" aria-label="Sélection des missions">
          ${zones.map(zone => `<section class="mission-zone"><h2>${zone}</h2>${missions.filter(mission => mission.zone === zone).map(missionCard).join('')}</section>`).join('')}
        </div>
        <section class="brief" aria-live="polite">${missionBrief(selectedMission)}</section>
      </div>
    </div>
    </section>`;
  if (jumpToMissions) document.querySelector('#mission-title').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function selectMission(button) {
  selectedMission = missions.find(mission => mission.id === button.dataset.mission);
  app.querySelector('.mission[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-pressed', 'true');
  app.querySelector('.brief').innerHTML = missionBrief(selectedMission);
}

function memoContent(dialog = false) {
  return `<section class="credits course-memo">
    ${dialog ? '<form method="dialog"><button type="submit" class="secondary">Reprendre la mission</button></form>' : '<a class="back" href="#missions">← Poste de contrôle</a>'}
    <h1 id="memo-title" tabindex="-1">Mémo du cours</h1>
    <section>
      <h2>1. Les sources d’énergie</h2>
      <p>Une source indique d’où vient l’énergie.</p>
      <p><strong>Renouvelable.</strong> Une source renouvelable revient naturellement assez vite pour qu’on puisse continuer à l’utiliser. Exemples : le Soleil, le vent et l’eau des rivières.</p>
      <p><strong>Non renouvelable.</strong> Une source non renouvelable s’épuise quand on l’utilise, car elle se renouvelle trop lentement. Exemples : le pétrole, le charbon, le gaz naturel et l’uranium.</p>
    </section>
    <section>
      <h2>2. Les sept formes d’énergie</h2>
      <p>Une forme indique comment l’énergie se manifeste. Par exemple, le <strong>Soleil</strong> est la source et la <strong>lumière</strong> est la forme que l’on observe.</p>
      <dl class="memo-table">
        <dt>Lumineuse</dt><dd>La lumière du Soleil.</dd>
        <dt>Thermique</dt><dd>La chaleur d’un feu.</dd>
        <dt>Cinétique</dt><dd>Le mouvement d’un vélo.</dd>
        <dt>Électrique</dt><dd>L’énergie reçue par le moteur du ventilateur.</dd>
        <dt>Potentielle de pesanteur</dt><dd>L’énergie de l’eau retenue en hauteur.</dd>
        <dt>Chimique</dt><dd>L’énergie stockée dans une pile.</dd>
        <dt>Nucléaire</dt><dd>L’énergie libérée par la fission de l’uranium.</dd>
      </dl>
    </section>
    <section>
      <h2>3. La chaîne d’énergie du ventilateur</h2>
      <p><strong>Alimenter → Distribuer → Convertir → Transmettre</strong></p>
      <dl class="memo-table">
        <dt>Alimenter · les piles</dt><dd>Fournir l’énergie.</dd>
        <dt>Distribuer · l’interrupteur</dt><dd>Contrôler le passage de l’énergie.</dd>
        <dt>Convertir · le moteur</dt><dd>Transformer l’énergie électrique en rotation.</dd>
        <dt>Transmettre · l’axe</dt><dd>Transmettre la rotation à l’hélice, qui met l’air en mouvement.</dd>
      </dl>
    </section>
    ${isFourthGrade ? `<section>
      <h2>4. Suivre une conversion d’énergie</h2>
      <p>Pour décrire une conversion, repère la forme reçue et la forme utile obtenue. Le moteur d’un vélo électrique reçoit de l’énergie électrique et produit une rotation. Le moteur chauffe aussi, mais cette chaleur ne sert pas à faire avancer le vélo.</p>
      <h3>Application au vélo à assistance électrique</h3>
      <div class="course-bike">
        <img src="photos/electric-bicycle.jpg" alt="Vélo à assistance électrique avec moteur au pédalier">
        <dl class="memo-table">
          <dt>Alimenter</dt><dd>La batterie fournit l’énergie électrique.</dd>
          <dt>Distribuer</dt><dd>Le contrôleur règle le passage du courant vers le moteur.</dd>
          <dt>Convertir</dt><dd>Le moteur transforme l’énergie électrique en rotation.</dd>
          <dt>Transmettre</dt><dd>La chaîne et les pignons transmettent la rotation à la roue arrière.</dd>
        </dl>
      </div>
    </section>` : ''}
  </section>`;
}

function showMemo() {
  app.innerHTML = memoContent();
  window.scrollTo(0, 0);
  app.querySelector('h1').focus();
}

function showCredits() {
  app.innerHTML = `<section class="credits">
    <a class="back" href="#missions">← Poste de contrôle</a>
    <h1 tabindex="-1">Crédits photo</h1>
    <ul>
      <li><a href="https://ebikexl.nl/products/dutch-id-tour-n8-bosch-classic-line-middenmotor-26-lichtblauw-grijs">Vélo électrique Dutch ID Tour N8, eBikeXL</a></li>
      <li>Le poste de contrôle, le décor de l’atelier et le dos des cartes ont été créés pour le jeu.</li>
      <li>Soleil, éoliennes, eau et extraction pétrolière. Photos Wikimedia Commons reprises du diaporama de la séance, dont Courtney Celley / USFWS et Jon Sullivan.</li>
      <li>Ventilateur et composants. Photos Wikimedia Commons reprises des supports de cours, dont Raimond Spekking et TubeTimeUS.</li>
      <li><a href="https://npgallery.nps.gov/AssetDetail/NRIS/81000382">Barrage Hoover, National Park Service</a></li>
      <li><a href="https://www.ot-hautlignon.com/decouvrir/a-proximite/voie-verte-via-fluvia/">Via Fluvia, Un Monde à Vélo / Office de tourisme du Haut-Lignon</a></li>
      <li><a href="https://oe1.orf.at/programm/2023/1/20/7056191/Atomkraft-als-Chance">Centrale de Temelín, ORF</a></li>
      <li><a href="https://www.protok21.org.rs/vesti/saznajte-kako-da-prijavite-paljenje-vatre">Feu de bois, Pro.Tok21</a></li>
    </ul></section>`;
  app.querySelector('h1').focus();
}

function start(mission) {
  run = { mission, index: 0, points: 0, answered: false };
  prepareRound();
}

function prepareRound() {
  run.round = run.mission.rounds[run.index];
  run.options = run.round.board ? shuffled(run.round.board.cards) : [];
  run.mechanic = run.round.board ? null : createMechanic(run.round, shuffled);
  run.placements = run.options.map(() => -1);
  run.active = null;
  run.answered = false;
  renderRound();
}

function roundStatus() {
  const { index, mission, points } = run;
  return `Manche ${index + 1} / ${mission.rounds.length} · ${points} point${points === 1 ? '' : 's'}`;
}

function renderRound() {
  const { mission, round, index } = run;
  app.innerHTML = `<section class="game">
    <a class="back" href="#missions">← Poste de contrôle</a>
    <div class="game-heading">
      <div><div class="eyebrow">${mission.zone}</div><h1>${mission.title}</h1></div>
      <div class="game-status">${roundStatus()}</div>
    </div>
    <progress value="${index}" max="${mission.rounds.length}" aria-label="Manches terminées"></progress>
    <div class="playfield photo-field">
      <div class="play">
        <h2 tabindex="-1">${round.prompt}</h2>
        ${round.board ? boardMarkup() : renderMechanic(round, run.mechanic)}
        <p class="feedback" role="status"></p>
        <div class="actions"><button class="primary" type="button" data-action="next" hidden>${index + 1 === mission.rounds.length ? 'Voir le résultat' : 'Manche suivante'}</button></div>
      </div>
    </div></section>`;
  app.querySelector('h2').focus();
}

function boardMarkup() {
  const { zones, single } = run.round.board;
  const card = (item, index) => `<button type="button" class="play-card" draggable="true" data-card="${index}" aria-pressed="${run.active === index}">
    ${item.photo ? `<img src="photos/${item.photo}.jpg" alt="" draggable="false">` : ''}
    <span>${item.label}</span>
  </button>`;
  const cardsAt = zone => run.options.map((item, index) => run.placements[index] === zone ? card(item, index) : '').join('');
  const tray = cardsAt(-1);
  return `<div class="board">
    <p>Glisse les cartes. Tu peux aussi sélectionner une carte, puis cliquer sur sa destination.</p>
    <div class="tray" data-zone="-1">
      <button type="button" class="zone-title" data-place="-1" ${run.active === null ? 'disabled' : ''}>Cartes à placer</button>
      <div class="card-list">${tray || '<span class="zone-hint">Toutes les cartes sont placées.</span>'}</div>
    </div>
    <div class="drop-grid ${single ? 'single' : 'sort'}">${zones.map((label, zone) => `<div class="drop-area" data-zone="${zone}">
      <button type="button" class="zone-title" data-place="${zone}" ${run.active === null ? 'disabled' : ''}>${label}</button>
      <div class="card-list">${cardsAt(zone) || '<span class="zone-hint">Dépose une carte ici</span>'}</div>
    </div>`).join('')}</div>
    <div class="actions">
      <button class="secondary" type="button" data-action="reset" ${run.placements.every(zone => zone === -1) ? 'disabled' : ''}>Recommencer le placement</button>
      <button class="primary" type="button" data-action="check" ${run.placements.includes(-1) ? 'disabled' : ''}>Valider</button>
    </div>
  </div>`;
}

function redrawBoard(focusTarget) {
  app.querySelector('.board').outerHTML = boardMarkup();
  (app.querySelector(focusTarget) ?? app.querySelector('[data-action="check"]')).focus();
}

function moveCard(cardIndex, zoneIndex) {
  if (!run?.round.board || run.answered || !Number.isInteger(cardIndex) ||
      cardIndex < 0 || cardIndex >= run.options.length || !Number.isInteger(zoneIndex) ||
      zoneIndex < -1 || zoneIndex >= run.round.board.zones.length) return;
  const origin = run.placements[cardIndex];
  if (origin !== zoneIndex && zoneIndex !== -1 && run.round.board.single) {
    const occupant = run.placements.indexOf(zoneIndex);
    if (occupant !== -1) run.placements[occupant] = origin;
  }
  run.placements[cardIndex] = zoneIndex;
  run.active = null;
  redrawBoard(`[data-card="${cardIndex}"]`);
}

function finishRound(correct, recovered = false) {
  if (run.answered) return;
  run.answered = true;
  run.points += Number(correct);
  const { round } = run;
  if (round.board) {
    app.querySelectorAll('.board button').forEach(button => {
      button.disabled = true;
      button.draggable = false;
    });
    app.querySelectorAll('[data-card]').forEach(card => {
      const index = Number(card.dataset.card);
      card.classList.add(run.options[index].target === run.placements[index] ? 'correct' : 'wrong');
    });
  } else {
    markMechanicResult(round, run.mechanic, app.querySelector('.mechanic'));
  }
  const expected = round.board
    ? round.board.zones.map((zone, index) => `${zone} · ${round.board.cards.filter(card => card.target === index).map(card => card.label).join(', ')}`).join(' / ')
    : mechanicSolution(round);
  const feedback = app.querySelector('.feedback');
  const verdict = correct ? 'Bien joué !'
    : recovered ? 'Réparation réussie après un nouvel essai'
    : expected ? 'Réponse attendue · ' + expected : 'Observe la zone indiquée.';
  feedback.innerHTML = `<strong>${verdict}</strong><br>${round.explanation}`;
  app.querySelector('progress').value = run.index + 1;
  app.querySelector('.game-status').textContent = roundStatus();
  const next = app.querySelector('[data-action="next"]');
  next.hidden = false;
  next.focus();
}

function advance() {
  if (!run.answered) return;
  run.index++;
  if (run.index < run.mission.rounds.length) {
    prepareRound();
    return;
  }
  const { mission, points } = run;
  saveScore();
  updateProgress();
  app.innerHTML = `<section class="game">
    <a class="back" href="#missions">← Poste de contrôle</a>
    <div class="eyebrow">${mission.zone}</div><h1 tabindex="-1">${mission.title}</h1>
    <div class="result">
      <img class="result-photo" src="photos/${mission.cover}.jpg" alt="">
      <div class="result-body"><h2>Mission terminée</h2><strong>${points} / ${mission.rounds.length}</strong><p>Ton record pour ce mini-jeu est de ${scores[mission.id]} / ${mission.rounds.length}.</p></div>
    </div>
    <div class="actions"><button class="primary" type="button" data-action="retry">Rejouer</button><a class="secondary" href="#missions">Choisir un autre mini-jeu</a></div>
  </section>`;
  app.querySelector('h1').focus();
}

function route() {
  const hash = location.hash;
  const mission = missions.find(item => hash === `#jeu/${item.id}`);
  updateProgress();
  document.querySelector('a[href="#memo"]').hidden = false;
  if (hash === '#evaluation') {
    assessment.render();
  } else if (mission) {
    selectedMission = mission;
    window.scrollTo(0, 0);
    start(mission);
  } else if (hash === '#memo') {
    showMemo();
  } else if (isFourthGrade && (!hash || hash === '#cours')) {
    window.scrollTo(0, 0);
    course.render();
  } else if (hash === '#credits') {
    showCredits();
  } else {
    showHome(hash === '#missions');
    if (hash !== '#missions') window.scrollTo(0, 0);
  }
}

app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.mission) {
    selectMission(button);
    return;
  }
  if (!run) return;
  if (button.dataset.mechanic) {
    if (!run.answered) handleMechanic(run.round, run.mechanic, button, control => {
      app.querySelector('.mechanic').outerHTML = renderMechanic(run.round, run.mechanic);
      const replacement = app.querySelector(`[data-mechanic="${control}"]:enabled`);
      const available = app.querySelector('[data-mechanic]:enabled');
      (replacement ?? available)?.focus();
    }, finishRound);
  } else if (button.dataset.card !== undefined) {
    const card = Number(button.dataset.card);
    run.active = run.active === card ? null : card;
    redrawBoard(run.active === null ? `[data-card="${card}"]` : '[data-place="0"]');
  } else if (button.dataset.place !== undefined && run.active !== null) {
    moveCard(run.active, Number(button.dataset.place));
  } else if (button.dataset.action === 'reset') {
    run.placements.fill(-1);
    run.active = null;
    redrawBoard('[data-card]');
  } else if (button.dataset.action === 'check') {
    finishRound(run.options.every((card, index) => card.target === run.placements[index]));
  } else if (button.dataset.action === 'next') {
    advance();
  } else if (button.dataset.action === 'retry') {
    start(run.mission);
  }
});

const cardTransferType = 'application/x-mission-energie-card';
app.addEventListener('dragstart', event => {
  const card = event.target.closest('[data-card]');
  if (!card || run.answered) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(cardTransferType, card.dataset.card);
});

app.addEventListener('dragover', event => {
  const zone = event.target.closest('[data-zone]');
  if (!zone || run.answered || !event.dataTransfer.types.includes(cardTransferType)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  zone.classList.add('drag-over');
});

app.addEventListener('dragleave', event => {
  const zone = event.target.closest('[data-zone]');
  if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('drag-over');
});

app.addEventListener('dragend', () => {
  app.querySelectorAll('.drag-over').forEach(zone => zone.classList.remove('drag-over'));
});

app.addEventListener('drop', event => {
  const zone = event.target.closest('[data-zone]');
  const cardIndex = event.dataTransfer.getData(cardTransferType);
  if (!zone || !cardIndex) return;
  event.preventDefault();
  moveCard(Number(cardIndex), Number(zone.dataset.zone));
});

document.querySelector('a[href="#memo"]').addEventListener('click', event => {
  if (!app.querySelector('.game')) return;
  event.preventDefault();
  const dialog = document.querySelector('#memo-dialog');
  dialog.innerHTML = memoContent(true);
  dialog.showModal();
  dialog.querySelector('h1').focus();
});

window.addEventListener('hashchange', route);
route();
