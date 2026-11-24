const steps = ['Les sources', 'Les formes', 'La chaîne du vélo'];
const sources = [
  ['wind_source', 'Le vent', true, 'Le vent revient naturellement, même s’il ne souffle pas en permanence.'],
  ['oil_source', 'Le pétrole', false, 'On le prélève beaucoup plus vite qu’il ne se forme.'],
  ['dam', 'L’eau des rivières', true, 'Les précipitations renouvellent l’eau qui alimente les cours d’eau.'],
];
const forms = [
  ['sun', 'Lumineuse', 'Le Soleil est la source. La lumière qu’il émet est une forme d’énergie.'],
  ['fire', 'Thermique', 'Le feu réchauffe l’air autour de lui. On s’intéresse ici à l’énergie liée à la chaleur.'],
  ['bike', 'Cinétique', 'Un vélo qui roule possède de l’énergie cinétique parce qu’il est en mouvement.'],
  ['motor', 'Électrique', 'Le circuit transfère de l’énergie électrique au moteur.'],
  ['dam', 'Potentielle de pesanteur', 'L’eau retenue en hauteur possède cette énergie, même quand elle est immobile.'],
  ['battery', 'Chimique', 'Une batterie chargée stocke de l’énergie sous forme chimique.'],
  ['nuclear', 'Nucléaire', 'La fission des noyaux d’uranium libère de l’énergie dans un réacteur.'],
];
const chain = [
  ['Alimenter', 'Batterie', 'Elle fournit l’énergie électrique au système.'],
  ['Distribuer', 'Contrôleur', 'Il règle le passage du courant vers le moteur.'],
  ['Convertir', 'Moteur au pédalier', 'Il transforme l’énergie électrique en rotation. Il chauffe aussi.'],
  ['Transmettre', 'Chaîne et pignons', 'Ils transmettent la rotation à la roue arrière.'],
];
const chainOptions = [2, 0, 3, 1];
const photo = (file, label) => `<img src="photos/${file}.jpg" alt="${label}">`;
const button = (key, text, pressed) => `<button type="button" class="secondary" data-course="${key}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${text}</button>`;

export function createCourse(root) {
  let step = 0;
  let sourceIndex = 0;
  let formIndex = 0;
  let sourceAnswer;
  let usefulAnswer;
  let order = [];

  function sourcePage() {
    const [file, label, renewable, explanation] = sources[sourceIndex];
    return `<h2>D’où vient l’énergie ?</h2>
      <p>Une <strong>source d’énergie</strong> indique d’où vient l’énergie. Un chauffe-eau solaire utilise le rayonnement du Soleil pour réchauffer de l’eau.</p>
      <p class="lesson-takeaway">Une source <strong>renouvelable</strong> se renouvelle à l’échelle humaine. Le stock d’une source <strong>non renouvelable</strong> se reconstitue trop lentement par rapport à sa consommation.</p>
      <h3>À toi de classer les ressources</h3>
      <div class="lesson-options">${sources.map((source, i) => button(`source:${i}`, source[1], i === sourceIndex)).join('')}</div>
      <div class="lesson-scene"><figure>${photo(file, label)}</figure><div>
        <h3>Cette ressource se renouvelle-t-elle assez vite ?</h3>
        <div class="lesson-options">${button('classify:yes', 'Renouvelable', sourceAnswer === 'yes')}${button('classify:no', 'Non renouvelable', sourceAnswer === 'no')}</div>
        ${sourceAnswer === undefined ? '' : `<p class="lesson-feedback" role="status"><strong>${(sourceAnswer === 'yes') === renewable ? 'Exact.' : 'À revoir.'}</strong> ${explanation}</p>`}
      </div></div>`;
  }

  function formPage() {
    const [file, label, explanation] = forms[formIndex];
    return `<h2>Comment l’énergie se manifeste-t-elle ?</h2>
      <p>La <strong>forme</strong> décrit comment l’énergie est stockée, transférée ou se manifeste. Explore les sept formes à partir des photos.</p>
      <div class="lesson-options">${forms.map((form, i) => button(`form:${i}`, form[1], i === formIndex)).join('')}</div>
      <div class="lesson-scene"><figure>${photo(file, label)}</figure><div><h3>Énergie ${label.toLowerCase()}</h3><p aria-live="polite">${explanation}</p></div></div>
      <p class="lesson-takeaway"><strong>Convertir</strong>, c’est transformer une forme d’énergie en une autre. Dans une lampe, l’énergie reçue est électrique. La lumière est utile pour éclairer et la lampe peut aussi chauffer.</p>
      <h3>Le moteur tourne et chauffe. Qu’est-ce qui fait avancer le vélo ?</h3>
      <div class="lesson-options">${button('useful:rotation', 'La rotation', usefulAnswer === 'rotation')}${button('useful:heat', 'La chaleur', usefulAnswer === 'heat')}</div>
      ${usefulAnswer ? `<p class="lesson-feedback" role="status"><strong>${usefulAnswer === 'rotation' ? 'Exact.' : 'À revoir.'}</strong> L’énergie reçue est électrique. La rotation est la forme utile, liée au mouvement. Une partie de l’énergie est aussi dissipée sous forme de chaleur.</p>` : ''}`;
  }

  function chainPage() {
    const correct = order.length === chain.length && order.every((value, index) => value === index);
    return `<h2>Suis l’énergie dans le vélo</h2>
      <p>La <strong>chaîne d’énergie</strong> suit l’énergie depuis son arrivée dans le système jusqu’à l’action obtenue. Chaque fonction dit ce qui est fait. Le <strong>constituant</strong> est la pièce qui la réalise.</p>
      <p class="lesson-takeaway">Dans une visseuse sans fil, la batterie <strong>alimente</strong> le circuit, la gâchette et son circuit <strong>distribuent</strong> l’énergie au moteur, le moteur la <strong>convertit</strong> en rotation et les engrenages <strong>transmettent</strong> le mouvement à l’embout.</p>
      <div class="lesson-scene lesson-bike"><figure>${photo('electric-bicycle', 'Vélo à assistance électrique')}</figure>
        <div><h3>À toi de reconstituer la chaîne du vélo</h3><p>Place les quatre étiquettes dans l’ordre, de la batterie à la roue arrière. Une fois l’ordre trouvé, les pièces et leur rôle s’affichent.</p></div>
      </div>
      <div class="lesson-options">${chainOptions.map(index => `<button type="button" class="secondary" data-course="stage:${index}" ${order.includes(index) ? 'disabled' : ''}>${chain[index][0]}</button>`).join('')}</div>
      <ol class="lesson-chain" aria-label="Chaîne reconstituée">${chain.map((_, index) => {
        const entry = chain[order[index]];
        return `<li>${entry ? `<strong>${entry[0]}</strong>${correct ? `<span>${entry[1]}</span><small>${entry[2]}</small>` : ''}` : 'À placer'}</li>`;
      }).join('')}</ol>
      ${order.length ? button('reset', 'Recommencer la chaîne') : ''}
      ${order.length === chain.length ? `<p class="lesson-feedback" role="status">${correct ? 'Chaîne complète. Les quatre fonctions et les pièces correspondantes sont indiquées ci-dessus.' : 'L’ordre est à revoir. L’énergie doit être fournie avant de pouvoir être distribuée, convertie puis transmise.'}</p>` : ''}`;
  }

  function render(focus) {
    root.innerHTML = `<section class="game guided-lesson">
      <span class="eyebrow">Technologie 4e · Le cours</span>
      <h1 tabindex="-1">Sources, formes et chaîne d’énergie</h1>
      <nav class="lesson-steps" aria-label="Étapes du cours">${steps.map((name, index) => button(`step:${index}`, `${index + 1}. ${name}`, step === index)).join('')}</nav>
      <section class="lesson-panel">${[sourcePage, formPage, chainPage][step]()}</section>
      <div class="actions lesson-navigation">
        ${step > 0 ? button(`step:${step - 1}`, 'Étape précédente') : ''}
        ${step < 2 ? `<button type="button" class="primary" data-course="step:${step + 1}">Étape suivante</button>` : '<a class="primary" href="#missions">Passer aux exercices</a>'}
      </div>
    </section>`;
    const target = focus && root.querySelector(`[data-course="${focus}"]:enabled`);
    (target || root.querySelector('h1')).focus({ preventScroll: true });
  }

  root.addEventListener('click', event => {
    const key = event.target.closest('[data-course]')?.dataset.course;
    if (!key) return;
    const [action, value] = key.split(':');
    switch (action) {
      case 'step':
        step = Number(value);
        window.scrollTo(0, 0);
        break;
      case 'source':
        sourceIndex = Number(value);
        sourceAnswer = undefined;
        break;
      case 'classify': sourceAnswer = value; break;
      case 'form': formIndex = Number(value); break;
      case 'useful': usefulAnswer = value; break;
      case 'stage': order.push(Number(value)); break;
      case 'reset': order = []; break;
    }
    render(action === 'step' ? undefined : key);
  });

  return { render };
}
