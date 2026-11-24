import { getSubject, subjectCount } from './assessment-bank.js';

const subjectNumbers = Array.from({ length: subjectCount }, (_, index) => index + 1);

const weightOf = question => question.weight ?? 1;
const pointsFor = questions => questions.reduce((sum, question) => sum + weightOf(question), 0);
const normalize = value => (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/)
  .filter(word => !['la', 'le', 'les', 'l', 'un', 'une', 'des'].includes(word)).join(' ');
function isCorrect(question, value) {
  if (question.options || question.interaction) return value === question.answer;
  const written = normalize(value).replace(/^(?:c est(?: de| du)?|(?:bonne )?reponse est|source (?:d energie )?est|forme d energie est|constituant est|fonction (?:est|de)|role est de|il faut) /, '');
  return [question.answer, ...(question.aliases ?? [])].some(answer =>
    normalize(answer) === written || (question.tail && normalize(`${answer} ${question.tail}`) === written));
}
const scoreFor = (questions, answers) => questions.reduce((sum, question) =>
  sum + (isCorrect(question, answers.get(question)) ? weightOf(question) : 0), 0);
const formatPoints = number => new Intl.NumberFormat('fr-FR').format(number);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function createAssessment(root, shuffle, grade = '5e') {
  const isFourthGrade = grade === '4e';
  const historyKey = isFourthGrade ? 'mission-energie-4e-exam-subjects-v1' : 'mission-energie-exam-subjects-v1';
  let attempt;
  let history = [];
  let selection;
  const maxScore = pointsFor(getSubject(1, grade).flatMap(section => section.items));
  const subjectLabel = number => String(number).padStart(3, '0');
  let view = 'intro';

  const focusHeading = () => {
    window.scrollTo(0, 0);
    root.querySelector('h1').focus({ preventScroll: true });
  };

  function drawSubject() {
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey));
      if (Array.isArray(saved)) history = [...new Set(saved.filter(number => subjectNumbers.includes(number)))];
    } catch {
      // Keep the in-memory history when storage is unavailable.
    }
    const last = history.at(-1);
    if (history.length === subjectCount) {
      // Begin a fresh cycle without immediately repeating the last subject.
      history = [];
    }
    const available = subjectNumbers.filter(number => !history.includes(number) && number !== last);
    const number = shuffle(available)[0];
    history.push(number);
    try {
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch {
      // The active page still avoids repeats.
    }
    return number;
  }

  function mixed(words) {
    const reordered = shuffle(words);
    return reordered.every((word, index) => word === words[index])
      ? [...reordered.slice(1), reordered[0]] : reordered;
  }

  function start() {
    selection = null;
    const number = drawSubject();
    const sections = getSubject(number, grade);
    const items = sections.flatMap(section => section.items);
    const chain = sections.find(section => section.chain);
    const written = items.filter(question => question.suggestions);
    const suggestions = [...new Set(written.map(question => question.suggestions))];
    const wordBanks = new Map(suggestions.map(words => [words, mixed(words)]));
    const chainColumns = [0, 1, 2].map(column => chain.items.filter((_, index) => index % 3 === column));
    const chainBanks = chainColumns.map(questions => mixed(questions.map(question => question.answer)));
    const placementBanks = isFourthGrade ? [
      ...suggestions.map(words => ({
        questions: written.filter(question => question.suggestions === words), words: wordBanks.get(words)
      })),
      ...chainColumns.map((questions, index) => ({ questions, words: chainBanks[index] })),
    ] : [];
    attempt = { number, sections, items, answers: new Map(), wordBanks, chainBanks, placementBanks,
      matchingLabels: shuffle(items.filter(question => question.interaction === 'match').map(question => question.answer)),
      options: new Map(items.filter(question => question.options).map(question => [question, shuffle(question.options)])) };
    view = 'questions';
    render();
  }

  function introMarkup() {
    const sections = getSubject(1, grade);
    return `<section class="exam-intro">
      <div><span class="eyebrow">Entraînement individuel · ${grade}</span>
      <h1 tabindex="-1">Contrôle blanc</h1>
      <p>Un sujet est tiré au sort parmi ${subjectCount} au démarrage. Il porte sur les sources, les formes et la chaîne d’énergie d’un vélo à assistance électrique.</p>
      ${isFourthGrade ? `<section class="exam-recap" aria-labelledby="exam-recap-title">
        <h2 id="exam-recap-title">Les notions à retenir</h2>
        <dl>
          <dt>Source d’énergie</dt><dd>Elle indique d’où vient l’énergie. Pour la classer, compare le temps nécessaire à son renouvellement au rythme auquel on l’utilise.</dd>
          <dt>Forme d’énergie</dt><dd>Elle décrit comment l’énergie se manifeste. Dans un téléphone en charge, le câble transfère de l’énergie électrique que la batterie stocke sous forme chimique.</dd>
          <dt>Chaîne d’énergie</dt><dd>Elle indique le trajet de l’énergie et la fonction de chaque pièce. Dans un batteur électrique, le moteur convertit l’énergie électrique en rotation et des engrenages transmettent cette rotation aux fouets.</dd>
        </dl>
      </section>` : ''}
      <ul class="exam-scale">${sections.map(section => `<li><span>${section.title}</span><strong>${pointsFor(section.items)} pts</strong></li>`).join('')}</ul>
      <p>${isFourthGrade ? 'Trie les sources, associe les formes et place les mots dans la chaîne d’énergie du vélo.' : 'Trie les sources, associe les formes et écris tes réponses dans la chaîne d’énergie du vélo.'} Le bouton de validation apparaît quand toutes les réponses sont renseignées.</p>
      <button class="primary" type="button" data-exam="start">Commencer le contrôle blanc</button></div>
      <img src="photos/electric-bicycle.jpg" alt="Vélo à assistance électrique avec moteur au pédalier">
    </section>`;
  }

  function textField(question, label) {
    const id = attempt.items.indexOf(question);
    return `<label class="exam-write"><span>${label}</span>
      <input type="text" data-item="${id}" value="${escapeHtml(attempt.answers.get(question) ?? '')}" maxlength="100" autocomplete="off">
      ${question.tail ? `<small>${question.tail}</small>` : ''}</label>`;
  }

  function wordBank(rows) {
    return `<div class="exam-word-bank">${rows.map(([label, words]) =>
      `<p><strong>${label}</strong><span>${words.join(' · ')}</span></p>`).join('')}</div>`;
  }

  function placementBankIndex(question) {
    return attempt.placementBanks.findIndex(bank => bank.questions.includes(question));
  }

  function placementBank(question, label) {
    const index = placementBankIndex(question);
    const { words } = attempt.placementBanks[index];
    return `<div class="exam-word-bank exam-placement-bank">
      <strong>${label}</strong>
      <div class="exam-token-bank" role="group" aria-label="${label}">${words.map((word, position) =>
        `<button type="button" class="exam-token" draggable="true" aria-pressed="false"
          data-exam-token="word:${index}:${position}">${escapeHtml(word)}</button>`).join('')}</div></div>`;
  }

  function placementField(question, label) {
    const id = attempt.items.indexOf(question);
    const key = `word:${id}`;
    return `<div class="exam-write exam-placement-field">
      <span id="exam-answer-label-${id}">${label}</span>
      <button type="button" class="exam-target" id="exam-answer-${id}" data-exam-target="${key}" data-exam-drop="${key}"
        aria-labelledby="exam-answer-label-${id} exam-answer-${id}">Placer ici</button>
      ${question.tail ? `<small>${question.tail}</small>` : ''}</div>`;
  }

  const placementInstructions = 'Choisis un mot puis clique sur sa case, ou glisse-le dans la case. Clique sur une case remplie pour la vider.';

  function writtenChain(section) {
    const { chainBanks } = attempt;
    const labels = ['Fonctions', 'Verbes pour les rôles', 'Constituants'];
    const field = isFourthGrade ? placementField : textField;
    return `<p class="exam-instruction">Complète le schéma de gauche à droite. ${isFourthGrade ? 'Place' : 'Écris'} chaque fonction, ce qu’elle fait et le constituant qui la réalise. On s’intéresse à l’assistance électrique de la roue arrière.</p>
      ${isFourthGrade ? labels.map((label, index) => placementBank(section.items[index], label)).join('')
        : wordBank(labels.map((label, index) => [label, chainBanks[index]]))}
      <div class="exam-chain">${Array.from({ length: 4 }, (_, index) => {
        const [fn, role, part] = section.items.slice(index * 3, index * 3 + 3);
        return `<fieldset class="exam-chain-stage"><legend>Étape ${index + 1}</legend>
          ${field(fn, 'Fonction')}${field(role, 'Rôle')}${field(part, 'Constituant')}</fieldset>`;
      }).join('')}</div>
      <p class="exam-chain-barème">Par étape : fonction 0,5 pt · rôle 0,5 pt · constituant 1 pt.</p>`;
  }

  function sortMarkup() {
    const group = attempt.items.filter(item => item.interaction === 'sort');
    const categories = ['Renouvelable', 'Non renouvelable'];
    const cards = target => group.filter(item => attempt.answers.get(item) === target).map(item => {
      const id = attempt.items.indexOf(item);
      return `<button type="button" class="exam-token" draggable="true" data-exam-token="sort:${id}"
        aria-pressed="${selection === 'sort:' + id}">${id + 1}. ${item.card}</button>`;
    }).join('');
    return `<section class="exam-manipulation" data-exam-group="sort">
      <h3>Trier deux sources</h3>
      <p>Glisse chaque source dans la bonne colonne, ou clique sur la source puis sur la colonne.</p>
      <div class="exam-token-bank" aria-label="Sources à classer">${cards(undefined) || '<span>Sources classées.</span>'}</div>
      <div class="exam-sort">${categories.map(category => `<div class="exam-drop" data-exam-drop="sort:${category}">
        <button type="button" class="exam-target" data-exam-target="sort:${category}">${category}</button>
        <div class="exam-token-bank">${cards(category) || '<span>Dépose une source ici</span>'}</div></div>`).join('')}</div>
    </section>`;
  }

  function matchMarkup() {
    const group = attempt.items.filter(item => item.interaction === 'match');
    return `<section class="exam-manipulation" data-exam-group="match">
      <h3>Associer une situation à une forme d’énergie</h3>
      <p>Glisse une étiquette dans la case en face de la situation, ou clique sur l’étiquette puis sur la case. Clique sur une case remplie pour libérer son étiquette.</p>
      <div class="exam-token-bank" aria-label="Formes à placer">${attempt.matchingLabels.map((label, index) => {
        const placed = group.some(item => attempt.answers.get(item) === label);
        return `<button type="button" class="exam-token" draggable="${!placed}" data-exam-token="match:${index}"
          aria-pressed="${selection === 'match:' + index}" ${placed ? 'disabled' : ''}>${label}</button>`;
      }).join('')}</div>
      <div class="exam-match">${group.map(item => {
        const id = attempt.items.indexOf(item), response = attempt.answers.get(item);
        return `<div class="exam-match-row"><span>${id + 1}. ${item.prompt}</span>
          <button type="button" class="exam-target ${response ? 'filled' : ''}" data-exam-target="match:${id}"
            data-exam-drop="match:${id}" aria-label="Réponse ${id + 1} : ${response ?? 'à placer'}">${response ?? 'Placer ici'}</button></div>`;
      }).join('')}</div>
    </section>`;
  }

  function standardQuestions(section) {
    const { answers, options, items, wordBanks } = attempt;
    const displayedBanks = new Set();
    return `<div class="exam-questions">${section.items.filter(question => !question.interaction).map(question => {
      const id = items.indexOf(question), choices = options.get(question);
      const response = choices ? `<div class="exam-options">${choices.map((choice, i) => `<label class="exam-choice">
        <input type="radio" name="exam-question-${id}" data-item="${id}" value="${i}" ${answers.get(question) === choice ? 'checked' : ''}>
        <span>${choice}</span></label>`).join('')}</div>` : (isFourthGrade ? placementField : textField)(question, 'Ta réponse');
      const suggestions = question.suggestions;
      const shared = suggestions ? section.items.filter(item => item.suggestions === suggestions) : [];
      const label = shared.length > 1 ? `Mots proposés pour les questions ${shared.map(item => items.indexOf(item) + 1).join(' et ')}` : 'Mots proposés';
      const bank = suggestions && !displayedBanks.has(suggestions)
        ? (isFourthGrade ? placementBank(question, label) : wordBank([[label, wordBanks.get(suggestions)]])) : '';
      if (suggestions) displayedBanks.add(suggestions);
      return `<fieldset class="exam-question"><legend><span>${id + 1}.</span> ${question.prompt}</legend>${bank}${response}</fieldset>`;
    }).join('')}</div>`;
  }

  function questionMarkup() {
    const { answers, sections, items, number } = attempt;
    return `<div class="exam-active">
      <div class="exam-heading">
        <div><span class="eyebrow">Sujet ${subjectLabel(number)} · ${maxScore} points</span>
        <h1 tabindex="-1">Contrôle blanc</h1></div>
      </div>
      <div class="exam-count">
        <output>${answers.size} / ${items.length} réponses</output>
        <progress aria-label="Réponses données" max="${items.length}" value="${answers.size}"></progress>
      </div>
      ${isFourthGrade ? `<p class="exam-instruction">${placementInstructions}</p>` : ''}
      ${sections.map((section, sectionIndex) => `<section class="exam-sheet" aria-labelledby="exam-part-${sectionIndex}">
        <div class="exam-part-heading">
          <div><span class="eyebrow">Partie ${sectionIndex + 1} · ${pointsFor(section.items)} points</span>
          <h2 id="exam-part-${sectionIndex}">${section.title}</h2></div>
          ${section.chain ? `<img src="photos/${section.photo}.jpg" alt="${section.alt}">` : ''}
        </div>
        ${section.chain ? writtenChain(section) : `${sectionIndex === 0 ? sortMarkup() : matchMarkup()}${standardQuestions(section)}`}
      </section>`).join('')}
      <div class="exam-actions">
        <p class="exam-submit-hint" ${answers.size === items.length ? 'hidden' : ''}>Complète toutes les réponses pour pouvoir valider.</p>
        <button class="primary" type="button" data-exam="submit" ${answers.size !== items.length ? 'hidden' : ''}>Valider et voir la note</button>
      </div>
    </div>`;
  }

  function resultMarkup() {
    const { answers, items, sections, number } = attempt;
    return `<section class="exam-result">
      <span class="eyebrow">Bilan d’entraînement · Sujet ${subjectLabel(number)}</span><h1 tabindex="-1">Ton résultat</h1>
      <div class="result exam-score">
        <div class="result-body"><h2>Note indicative</h2><strong>${formatPoints(scoreFor(items, answers))} / ${maxScore}</strong>
        <p>${answers.size} / ${items.length} réponses renseignées. Ce résultat te donne un repère sur les notions à revoir.</p></div>
        <ul class="exam-scale">${sections.map(section => `<li><span>${section.title}</span><strong>${formatPoints(scoreFor(section.items, answers))} / ${pointsFor(section.items)}</strong></li>`).join('')}</ul>
      </div>
      <h2>Correction détaillée</h2>
      ${sections.map(section => `<details class="exam-review"><summary>${section.title} · ${formatPoints(scoreFor(section.items, answers))} / ${pointsFor(section.items)}</summary>
        <ol start="${1 + items.indexOf(section.items[0])}">${section.items.map(question => {
          const selected = answers.get(question), correct = isCorrect(question, selected);
          return `<li><strong>${question.prompt}</strong>
            <p class="${correct ? 'exam-correct' : 'exam-missed'}">${correct ? formatPoints(weightOf(question)) : '0'} / ${formatPoints(weightOf(question))} · Ta réponse : ${escapeHtml(selected ?? 'aucune réponse')}</p>
            ${correct ? '' : `<p>Réponse attendue : <strong>${question.answer}</strong></p>`}
            <p>${question.explanation}</p></li>`;
        }).join('')}</ol></details>`).join('')}
      <div class="actions exam-actions">
        <button class="primary" type="button" data-exam="start">Faire un nouveau sujet</button>
        <a class="secondary" href="#missions">Retour aux missions</a></div>
    </section>`;
  }

  function render() {
    document.querySelector('a[href="#memo"]').hidden = view === 'questions';
    root.innerHTML = `<section class="game exam">
      <a class="back" href="#missions">← Poste de contrôle</a>
      ${view === 'intro' ? introMarkup() : view === 'questions' ? questionMarkup() : resultMarkup()}
    </section>`;
    focusHeading();
  }

  function updateCompletion() {
    const answered = attempt.answers.size;
    const total = attempt.items.length;
    const complete = answered === total;
    root.querySelector('.exam-count output').textContent = `${answered} / ${total} réponses`;
    root.querySelector('.exam-count progress').value = answered;
    root.querySelector('[data-exam="submit"]').hidden = !complete;
    root.querySelector('.exam-submit-hint').hidden = complete;
  }

  function updateWordPlacement() {
    const selectedBank = selection?.startsWith('word:') ? Number(selection.split(':')[1]) : -1;
    for (const token of root.querySelectorAll('[data-exam-token^="word:"]')) {
      const [, bankIndex, wordIndex] = token.dataset.examToken.split(':');
      const { questions, words } = attempt.placementBanks[Number(bankIndex)];
      token.setAttribute('aria-pressed', String(selection === token.dataset.examToken));
      token.classList.toggle('used', questions.some(question => attempt.answers.get(question) === words[Number(wordIndex)]));
    }
    for (const target of root.querySelectorAll('[data-exam-target^="word:"]')) {
      const id = Number(target.dataset.examTarget.split(':')[1]);
      const question = attempt.items[id];
      const answer = attempt.answers.get(question);
      target.textContent = answer ?? 'Placer ici';
      target.classList.toggle('filled', Boolean(answer));
      target.classList.toggle('available', selectedBank === placementBankIndex(question));
    }
  }

  function redrawGroup(mode, attribute, key) {
    if (mode === 'word') {
      updateWordPlacement();
    } else {
      const group = root.querySelector(`[data-exam-group="${mode}"]`);
      group.outerHTML = mode === 'sort' ? sortMarkup() : matchMarkup();
    }
    root.querySelector(`[data-exam-${attribute}="${key}"]`)?.focus({ preventScroll: true });
    updateCompletion();
  }

  function clearSelection(mode) {
    const previous = selection?.split(':')[0];
    selection = null;
    if (previous && previous !== mode) redrawGroup(previous, 'token', '');
  }

  function placeWord(token, target) {
    const question = attempt.items[Number(target.split(':')[1])];
    const bankIndex = placementBankIndex(question);
    if (bankIndex === -1) return;
    if (token) {
      const [mode, index, wordIndex] = token.split(':');
      if (mode !== 'word' || Number(index) !== bankIndex) return;
      const { questions, words } = attempt.placementBanks[bankIndex];
      const word = words[Number(wordIndex)];
      if (!word) return;
      const previous = questions.find(item => attempt.answers.get(item) === word);
      if (previous) attempt.answers.delete(previous);
      attempt.answers.set(question, word);
    } else {
      attempt.answers.delete(question);
    }
    clearSelection('word');
    redrawGroup('word', 'target', target);
  }

  function place(token, target) {
    const [mode, value] = target.split(':');
    if (mode === 'word') {
      placeWord(token, target);
    } else if (mode === 'sort' && token?.startsWith('sort:')) {
      const question = attempt.items[Number(token.split(':')[1])];
      attempt.answers.set(question, value);
      clearSelection(mode);
      redrawGroup(mode, 'token', token);
    } else if (mode === 'match') {
      const question = attempt.items[Number(value)];
      if (token?.startsWith('match:')) {
        const label = attempt.matchingLabels[Number(token.split(':')[1])];
        const previous = [...attempt.answers].find(([item, answer]) => item.interaction === 'match' && answer === label);
        if (previous) attempt.answers.delete(previous[0]);
        attempt.answers.set(question, label);
      } else if (!token) {
        attempt.answers.delete(question);
      } else return;
      clearSelection(mode);
      redrawGroup(mode, 'target', target);
    }
  }

  root.addEventListener('input', event => {
    if (view !== 'questions' || !event.target.matches('input[data-item]')) return;
    const field = event.target;
    const question = attempt.items[Number(field.dataset.item)];
    const value = field.type === 'radio' ? attempt.options.get(question)[Number(field.value)] : field.value.trim();
    if (value) attempt.answers.set(question, value);
    else attempt.answers.delete(question);
    updateCompletion();
  });

  const transferType = 'application/x-mission-energie-assessment';
  root.addEventListener('dragstart', event => {
    const token = event.target.closest('[data-exam-token]');
    if (token && view === 'questions') {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(transferType, token.dataset.examToken);
    }
  });

  root.addEventListener('dragover', event => {
    if (event.target.closest('[data-exam-drop]') && event.dataTransfer.types.includes(transferType)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  });

  root.addEventListener('drop', event => {
    const target = event.target.closest('[data-exam-drop]');
    const token = event.dataTransfer.getData(transferType);
    if (view !== 'questions' || !target || !token) return;
    event.preventDefault();
    place(token, target.dataset.examDrop);
  });

  root.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control) return;
    const { exam: action, examToken, examTarget } = control.dataset;
    if (view === 'questions' && examToken) {
      const [mode] = examToken.split(':');
      const previous = selection?.split(':')[0];
      selection = selection === examToken ? null : examToken;
      if (previous && previous !== mode) redrawGroup(previous, 'token', '');
      redrawGroup(mode, 'token', examToken);
      return;
    }
    if (view === 'questions' && examTarget) {
      place(selection, examTarget);
      return;
    }
    if (action === 'start') start();
    else if (action === 'submit' && view === 'questions' && attempt.answers.size === attempt.items.length) {
      view = 'result';
      render();
    }
  });

  return { render };
}
