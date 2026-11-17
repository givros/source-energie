import { captions } from './missions.js';

export const modeLabels = {
  identify: 'Reconnaissance sur photo', files: 'Enquête', memory: 'Jeu de mémoire',
  link: 'Associations', repair: 'Atelier du ventilateur',
};

const photo = (key, alt = captions[key] ?? '') => `<img src="photos/${key}.jpg" alt="${alt}" draggable="false">`;
const command = (action, text, disabled = false, primary = true) =>
  `<button type="button" class="${primary ? 'primary' : 'secondary'}" data-mechanic="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;

export function createMechanic(round, shuffle) {
  switch (round.mode) {
    case 'identify': return { choices: shuffle(round.choices), selected: null };
    case 'files': return { excluded: new Set() };
    case 'memory': return {
      cards: shuffle(round.pairs.flatMap(([image, clue, label], pair) => [{ image, clue, pair }, { label, pair }])),
      revealed: [], matched: new Set(), misses: 0,
    };
    case 'link': return { active: null, wires: {}, outlets: shuffle(round.pairs.map((_, index) => index)) };
    case 'repair': return { changed: new Set(), faults: 0, message: '' };
    default: throw new Error(`Mécanique inconnue : ${round.mode}`);
  }
}

function identifyView(round, state) {
  return `<div class="recognition">
    <figure>${photo(round.photo)}</figure>
    <div class="recognition-options">${state.choices.map((choice, i) => command(`identify:${i}`, choice, false, false)).join('')}</div>
  </div>`;
}

function filesView(round, state) {
  return `<p>Clique sur les fiches à écarter. Tu peux les remettre dans le dossier avant de le fermer.</p>
    <div class="evidence-grid">${round.items.map(([image, label], index) => {
      const excluded = state.excluded.has(index);
      return `<button type="button" class="evidence-file" data-mechanic="file:${index}" aria-pressed="${excluded}">
        ${photo(image, '')}<span>${label}</span><strong>${excluded ? 'Écartée' : 'Dans le dossier'}</strong></button>`;
    }).join('')}</div>
    <div class="actions">${command('close-files', 'Fermer le dossier', state.excluded.size !== 2)}</div>`;
}

function memoryView(round, state) {
  return `<p>Retourne deux cartes à la fois. Associe chaque scène photographiée au nom de sa forme d’énergie.</p>
    <div class="memory-grid">${state.cards.map((card, index) => {
      const matched = state.matched.has(index);
      const open = matched || state.revealed.includes(index);
      const contents = card.image ? `${photo(card.image, '')}<span>${card.clue}</span>` : `<strong>${card.label ?? ''}</strong>`;
      return `<button type="button" class="memory-card ${open ? 'open' : ''} ${matched ? 'matched' : ''}" data-mechanic="flip:${index}"
        aria-label="${open ? card.clue ?? card.label : `Retourner la carte ${index + 1}`}" ${matched ? 'disabled' : ''}>
        ${open ? contents : `<span>Carte ${index + 1}</span>`}</button>`;
    }).join('')}</div>
    <p class="mechanic-status" role="status">${state.matched.size / 2} / ${round.pairs.length} paires · ${state.misses} essai${state.misses > 1 ? 's' : ''} manqué${state.misses > 1 ? 's' : ''}</p>`;
}

function linkView(round, state) {
  const rows = round.pairs.length;
  const y = index => (index + .5) * 100 / rows;
  return `<p>Clique sur une entrée, puis sur sa sortie. Relier une entrée déjà branchée change son raccordement.</p>
    <div class="wiring" style="--rows:${rows}">
      <div class="terminals">${round.pairs.map(([image, label], index) => `<button type="button" class="terminal" data-mechanic="in:${index}" aria-pressed="${state.active === index}">${photo(image, '')}<span>${label}</span></button>`).join('')}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${Object.entries(state.wires).map(([index, outlet]) => {
        const from = y(Number(index)), to = y(state.outlets.indexOf(outlet));
        return `<path class="wire-${index}" d="M 0 ${from} C 40 ${from}, 60 ${to}, 100 ${to}" />`;
      }).join('')}</svg>
      <div class="terminals">${state.outlets.map(outlet => command(`out:${outlet}`, round.pairs[outlet][2], state.active === null, false)).join('')}</div>
    </div>
    <div class="actions">${command('clear-wires', 'Débrancher tout', !Object.keys(state.wires).length, false)}${command('test-wires', 'Tester les raccordements', Object.keys(state.wires).length !== rows)}</div>`;
}

function repairView(round, state) {
  return `<p>Monte la pièce de rechange qui correspond à la panne, puis essaie de redémarrer le ventilateur.</p>
    <div class="repair-station">
      <figure class="repair-scene">
        <img src="photos/workbench.jpg" alt="" draggable="false">
        <figcaption class="mechanic-status" role="status">${state.message || 'Ventilateur à l’arrêt'}</figcaption>
      </figure>
      <div class="repair-bench">${round.parts.map(([image, label], index) => `<button type="button" class="repair-part" data-mechanic="replace:${index}" aria-pressed="${state.changed.has(index)}">
        ${photo(image, '')}<strong>${label}</strong><span>${state.changed.has(index) ? 'Pièce remplacée' : 'Monter la pièce de rechange'}</span></button>`).join('')}</div>
    </div>
    <div class="actions">${command('restart', 'Essayer le redémarrage', state.changed.size === 0)}</div>`;
}

const views = { identify: identifyView, files: filesView, memory: memoryView, link: linkView, repair: repairView };
export function renderMechanic(round, state) {
  return `<div class="mechanic mechanic-${round.mode}">${views[round.mode](round, state)}</div>`;
}

export function handleMechanic(round, state, button, refresh, conclude) {
  const [action, value] = button.dataset.mechanic.split(':');
  const index = Number(value);
  switch (action) {
    case 'identify':
      state.selected = state.choices[index];
      conclude(state.selected === round.answer);
      return;
    case 'file':
      if (state.excluded.has(index)) state.excluded.delete(index);
      else if (state.excluded.size < 2) state.excluded.add(index);
      refresh(action + ':' + index);
      return;
    case 'close-files':
      conclude(round.items.every((item, i) => state.excluded.has(i) === !item[2]));
      return;
    case 'flip': {
      if (state.revealed.length === 2) state.revealed = [];
      if (state.revealed.includes(index)) return;
      state.revealed.push(index);
      if (state.revealed.length === 2) {
        const [a, b] = state.revealed;
        if (state.cards[a].pair === state.cards[b].pair) {
          state.matched.add(a).add(b);
          state.revealed = [];
        } else state.misses++;
      }
      refresh('flip:' + index);
      if (state.matched.size === state.cards.length) conclude(true);
      return;
    }
    case 'in':
      state.active = state.active === index ? null : index;
      refresh(state.active === null ? 'in:' + index : 'out:' + state.outlets[0]);
      return;
    case 'out': {
      const old = Object.keys(state.wires).find(key => state.wires[key] === index);
      if (old !== undefined) delete state.wires[old];
      state.wires[state.active] = index;
      const next = state.active;
      state.active = null;
      refresh('in:' + next);
      return;
    }
    case 'clear-wires':
      state.wires = {};
      state.active = null;
      refresh('in:0');
      return;
    case 'test-wires':
      conclude(round.pairs.every((_, i) => state.wires[i] === i));
      return;
    case 'replace':
      if (state.changed.has(index)) state.changed.delete(index);
      else state.changed.add(index);
      state.message = 'Pièces prêtes pour un nouvel essai.';
      refresh('replace:' + index);
      return;
    case 'restart':
      if (state.changed.size === 1 && state.changed.has(round.target)) {
        state.message = 'Essai réussi. L’hélice tourne.';
        refresh('restart');
        conclude(state.faults === 0, state.faults > 0);
      } else {
        state.faults++;
        state.message = state.changed.has(round.target)
          ? 'L’hélice tourne. Remets les pièces qui fonctionnaient pour isoler la panne.'
          : 'Le ventilateur reste à l’arrêt. Relis le diagnostic et modifie la réparation.';
        refresh('restart');
      }
      return;
  }
}

export function markMechanicResult(round, state, root) {
  if (round.mode === 'identify') {
    root.querySelectorAll('.recognition-options button').forEach((button, i) => {
      if (state.choices[i] === round.answer) button.classList.add('correct');
      else if (state.choices[i] === state.selected) button.classList.add('wrong');
    });
  } else if (round.mode === 'files') {
    root.querySelectorAll('.evidence-file').forEach((file, i) => {
      file.classList.add(state.excluded.has(i) !== round.items[i][2] ? 'correct' : 'wrong');
    });
  }
  root.querySelectorAll('button').forEach(button => { button.disabled = true; });
}

export function mechanicSolution(round) {
  if (round.mode === 'files') return round.items.filter(item => !item[2]).map(item => item[1]).join(' / ');
  if (round.mode === 'link') return round.pairs.map(([, input, outlet]) => `${input} → ${outlet}`).join(' / ');
  if (round.mode === 'identify') return round.answer;
  if (round.mode === 'repair') return round.parts[round.target][1];
  return '';
}
