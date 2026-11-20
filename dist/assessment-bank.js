const item = (prompt, answer, explanation, options) => ({ prompt, answer, explanation, options });
const formNames = ['Lumineuse', 'Thermique', 'Cinétique', 'Électrique', 'Potentielle de pesanteur', 'Chimique', 'Nucléaire'];

const sourceExamples = [
  ['Le vent', 'Le pétrole', 'Le Soleil', 'la lumière captée par un panneau solaire'],
  ['L’eau des rivières', 'L’uranium', 'Le vent', 'le mouvement de l’air qui entraîne une éolienne'],
  ['Les marées', 'Le gaz naturel', 'Le bois', 'la chaleur d’un feu de bois'],
  ['La chaleur du sous-sol', 'Le charbon', 'L’eau', 'le mouvement de l’eau qui traverse une turbine'],
  ['Le Soleil', 'Le pétrole utilisé pour fabriquer de l’essence', 'Le gaz naturel', 'la chaleur produite par une chaudière au gaz'],
  ['Le bois d’une forêt qui repousse au rythme des coupes', 'Le charbon extrait d’une mine', 'L’uranium', 'la chaleur libérée dans un réacteur par la fission d’un combustible à base d’uranium'],
  ['Les vagues', 'L’uranium utilisé comme combustible dans une centrale nucléaire', 'Le charbon', 'la chaleur dégagée par un feu de charbon'],
  ['L’eau renouvelée par les pluies', 'Le gaz naturel utilisé pour chauffer un bâtiment', 'Le Soleil', 'la chaleur reçue par un capteur solaire thermique'],
  ['Le bois issu d’une forêt qui se régénère', 'Le pétrole extrait par une pompe', 'La chaleur du sous-sol', 'l’énergie thermique récupérée dans une installation géothermique'],
  ['Le vent au large des côtes', 'Le charbon brûlé pour produire de l’électricité', 'Le pétrole', 'l’énergie chimique du pétrole extrait d’un gisement'],
];

const sourceReasoning = [
  ['Un parc éolien s’arrête faute de vent. Pourquoi sa source reste-t-elle renouvelable ?', 'Le vent revient naturellement.', ['Le vent souffle en permanence.', 'Les éoliennes créent le vent.'], 'Être renouvelable ne veut pas dire être disponible à chaque instant.'],
  ['Dans une forêt, quand le bois peut-il être considéré comme renouvelable ?', 'Quand les arbres repoussent assez vite pour remplacer le bois prélevé.', ['Dès que le bois brûle.', 'Dès que la forêt existe.'], 'La repousse doit pouvoir suivre les prélèvements.'],
  ['Quelle situation montre pourquoi le pétrole est non renouvelable ?', 'On le prélève beaucoup plus vite qu’il ne se forme.', ['Il brûle dans un moteur.', 'On l’extrait du sous-sol.'], 'Le stock se reconstitue trop lentement à l’échelle humaine.'],
  ['Des pluies remplissent de nouveau une retenue d’eau. Quelle idée cela illustre-t-il ?', 'Le renouvellement naturel de l’eau.', ['La formation de pétrole.', 'Le stockage d’énergie chimique dans l’eau.'], 'Les précipitations participent au renouvellement de l’eau.'],
  ['Quel critère permet de classer l’uranium parmi les sources non renouvelables ?', 'Les réserves exploitées ne se reconstituent pas assez vite.', ['Son énergie peut donner de la chaleur.', 'On le trouve dans la nature.'], 'Le critère est lié à la disponibilité et au renouvellement du stock.'],
  ['Deux ressources naturelles ont-elles forcément le même classement ?', 'Non, il faut comparer la vitesse à laquelle elles se renouvellent.', ['Oui, toute ressource naturelle est renouvelable.', 'Oui, toute ressource naturelle est non renouvelable.'], 'Le vent et le pétrole sont tous deux naturels, mais se renouvellent à des rythmes différents.'],
  ['Le Soleil disparaît sous les nuages. Que peut-on conclure ?', 'La lumière disponible varie, mais le Soleil reste une source renouvelable.', ['Le Soleil devient non renouvelable.', 'La lumière devient une source fossile.'], 'La disponibilité instantanée et le renouvellement sont deux notions différentes.'],
  ['Un gisement de charbon est de moins en moins fourni. Pourquoi ?', 'Le charbon extrait ne se reforme pas assez vite.', ['Le charbon extrait se transforme en vent.', 'Toutes les réserves naturelles repoussent rapidement.'], 'Le prélèvement diminue le stock bien plus vite qu’il ne se reconstitue.'],
  ['Pourquoi les marées sont-elles classées comme source renouvelable ?', 'Le phénomène se répète naturellement.', ['Elles dépendent d’une réserve de pétrole.', 'Elles ne s’arrêtent jamais au cours d’une journée.'], 'Les marées reviennent à intervalles réguliers.'],
  ['Quelle idée distingue le gaz naturel du vent ?', 'Le gaz naturel est prélevé dans un stock qui se remplace trop lentement.', ['Le vent prend des millions d’années à se reformer.', 'Le gaz naturel est renouvelable parce qu’il est invisible.'], 'Ce qui compte est le temps de renouvellement de la ressource.'],
];

const sourceDefinitions = [
  ['À quoi sert à répondre le mot « source » ?', 'D’où vient l’énergie ?', ['Comment l’énergie se manifeste-t-elle ?', 'Quel mouvement observe-t-on ?']],
  ['Les termes « renouvelable » et « non renouvelable » classent en priorité…', 'Les sources d’énergie.', ['Les sept formes d’énergie.', 'Les quatre fonctions de la chaîne d’énergie.']],
  ['Que veut dire « non renouvelable » pour une ressource ?', 'Le stock s’épuise et se renouvelle trop lentement.', ['La ressource est toujours artificielle.', 'La ressource ne peut jamais donner de chaleur.']],
  ['Quelle information sert à déterminer si une source est renouvelable ?', 'La rapidité de son renouvellement naturel.', ['La couleur du dispositif qui l’exploite.', 'La forme finale de l’énergie.']],
  ['Un panneau photovoltaïque fournit de l’électricité. Pourquoi « électrique » désigne-t-il une forme ?', 'Ce terme décrit comment l’énergie se manifeste.', ['Ce terme désigne la ressource naturelle d’origine.', 'Ce terme indique que la source s’épuise.']],
  ['Choisis la formulation qui décrit une source renouvelable.', 'Elle revient naturellement assez vite pour continuer à l’utiliser.', ['Elle doit être disponible sans interruption.', 'Elle se renouvelle forcément plus lentement qu’on ne l’utilise.']],
  ['Une même forme d’énergie peut-elle venir de sources différentes ?', 'Oui, le vent et l’eau peuvent tous deux servir à produire de l’électricité.', ['Non, chaque forme correspond à une seule source.', 'Non, toute électricité vient uniquement du Soleil.']],
  ['Que décrit « thermique » dans « énergie thermique » ?', 'Une forme d’énergie liée à la chaleur.', ['Une famille de ressources.', 'Une fonction de la chaîne d’énergie.']],
  ['Qu’est-ce qui sépare la source de la forme ?', 'La source est l’origine, la forme indique comment l’énergie se manifeste.', ['La source est toujours renouvelable, la forme toujours non renouvelable.', 'La source et la forme veulent dire la même chose.']],
  ['Quelle affirmation sur la production d’électricité est correcte ?', 'Des sources renouvelables ou non renouvelables peuvent servir à en produire.', ['Toute production électrique vient du pétrole.', 'Le mot « électrique » signifie toujours « renouvelable ».']],
];

const formScenarios = [
  [
    'Une DEL éclaire la piste cyclable.', 'La lumière d’un projecteur atteint un mur.', 'Le Soleil éclaire le toit d’une maison.',
    'La lampe du vélo rend le cycliste visible.', 'Une enseigne éclairée est visible dans la nuit.',
    'Un éclair rend les nuages visibles un instant.', 'Un écran allumé émet de la lumière.',
    'Une lampe de lecture éclaire une page.', 'La lumière d’une bougie traverse une vitre.', 'Un phare éclaire un bateau depuis la côte.',
  ],
  [
    'Un radiateur réchauffe l’air.', 'Une poêle chaude réchauffe les aliments.', 'La chaleur d’un feu réchauffe les mains.',
    'Un frein chaud réchauffe l’air autour de lui.', 'Un chauffe-eau réchauffe l’eau de la douche.',
    'Un fer chaud réchauffe le tissu.', 'Un four réchauffe un plat.', 'De l’eau chaude réchauffe une bouillotte.',
    'Le sol chauffé par le Soleil réchauffe l’air.', 'Une chaudière réchauffe l’eau des radiateurs.',
  ],
  [
    'Un ballon roule sur le sol.', 'Une roue de vélo tourne.', 'L’eau de la rivière s’écoule.',
    'Une pale tourne sous l’effet du vent.', 'Une trottinette roule dans la cour.', 'Une pierre est en train de tomber.',
    'L’air se déplace dans une rafale.', 'Une balle se déplace après un lancer.', 'Un train roule sur ses rails.', 'Une turbine tourne au passage de l’eau.',
  ],
  [
    'Le courant passe dans les fils et alimente un moteur.', 'Une pile fournit de l’énergie à un circuit fermé.',
    'Une dynamo alimente un éclairage par des fils.', 'Le moteur du vélo reçoit de l’énergie par un câble.',
    'Une prise alimente le circuit d’une bouilloire.', 'Un panneau photovoltaïque alimente un circuit.',
    'Un alternateur fournit de l’énergie au réseau.', 'Une batterie alimente le moteur d’un jouet.',
    'Un courant alimente une DEL dans un circuit.', 'Un chargeur transfère de l’énergie à une batterie par ses câbles.',
  ],
  [
    'L’eau est retenue en hauteur derrière un barrage.', 'Un sac est posé en haut d’un escalier.',
    'Un rocher est immobile au bord d’une falaise.', 'Un vélo reste immobile au sommet d’une côte.',
    'Un seau d’eau est posé sur une étagère en hauteur.', 'Une bille est immobile au sommet d’une rampe.',
    'Un bloc soulevé reste suspendu à un câble.', 'Un ballon est tenu en hauteur avant d’être lâché.',
    'Une luge est immobile au sommet d’une pente.', 'Une caisse est posée au bord d’une plateforme surélevée.',
  ],
  [
    'De l’énergie est stockée dans une pile.', 'Les muscles emploient l’énergie stockée dans les aliments.',
    'Du bois sec contient de l’énergie avant d’être brûlé.', 'L’essence stocke de l’énergie dans le réservoir.',
    'Le gaz naturel contient de l’énergie avant sa combustion.', 'Le charbon stocke de l’énergie avant de brûler.',
    'Les substances d’une batterie chargée stockent de l’énergie.', 'Les sucres d’un fruit contiennent de l’énergie.',
    'Des granulés de bois contiennent de l’énergie avant d’être brûlés.', 'Des molécules de carburant stockent de l’énergie.',
  ],
  [
    'La fission de l’uranium libère de l’énergie dans une centrale.', 'Dans le Soleil, des noyaux s’assemblent et libèrent de l’énergie.',
    'Dans un réacteur, un noyau d’uranium se scinde et libère de l’énergie.', 'Dans le cœur d’une étoile, la fusion de noyaux libère de l’énergie.',
    'Un combustible libère de l’énergie quand ses noyaux se divisent.', 'La chaleur du réacteur provient d’abord de l’énergie libérée par la fission.',
    'Dans le Soleil, des noyaux d’hydrogène fusionnent pour former de l’hélium.', 'Un noyau se sépare en noyaux plus petits, ce qui libère de l’énergie.',
    'Avant de chauffer l’eau, la centrale libère de l’énergie par fission dans le combustible.', 'Deux noyaux légers se réunissent et libèrent de l’énergie.',
  ],
];

const formPrompts = [
  'Quelle forme est liée directement à la lumière émise ?',
  'Quelle forme est liée à la chaleur transférée ?',
  'Quelle forme est associée au mouvement ?',
  'Quelle forme est transférée par le circuit électrique ?',
  'Quelle forme est liée à la hauteur par rapport au sol ou au niveau bas ?',
  'Quelle forme est stockée dans ces substances ?',
  'Quelle forme est libérée lors de cette transformation des noyaux ?',
];
const formExplanations = [
  'L’énergie lumineuse est transportée par la lumière.', 'L’énergie thermique est liée à la chaleur et à la température.',
  'L’énergie cinétique est liée au mouvement.', 'Dans ce cas, un circuit transfère de l’énergie électrique.',
  'L’énergie potentielle de pesanteur dépend de la hauteur.', 'Les substances contiennent de l’énergie chimique.',
  'La fission ou la fusion libère de l’énergie nucléaire. La chaleur ou la lumière observée ensuite est une autre forme.',
];

const stages = [
  {
    fn: 'Alimenter', fnAliases: ['Alimentation'],
    verb: 'Fournir', tail: 'l’énergie électrique.', roleAliases: ['Apporter', 'Délivrer', 'Donner', 'Fournir du courant', 'Donner de l’électricité', 'Fournir de l’électricité au vélo', 'Alimenter le circuit', 'Fournit', 'Délivre', 'La batterie fournit le courant'],
    part: 'La batterie', partAliases: ['Accumulateur', 'Batterie rechargeable', 'Batterie du vélo', 'Batterie électrique', 'Batterie du VAE', 'Bloc batterie', 'Bloc d’accumulateurs'],
  },
  {
    fn: 'Distribuer', fnAliases: ['Distribution'],
    verb: 'Contrôler', tail: 'le passage de l’énergie vers le moteur.',
    roleAliases: ['Régler', 'Gérer', 'Commander', 'Réguler', 'Doser', 'Contrôler le courant', 'Régler le courant', 'Gérer le courant', 'Contrôler le passage du courant', 'Réguler le courant qui arrive au moteur', 'Doser l’énergie envoyée au moteur', 'Contrôle', 'Régule', 'Le contrôleur règle le courant'],
    part: 'Le contrôleur', partAliases: ['Contrôleur électronique', 'Contrôleur du moteur', 'Variateur', 'Variateur électronique', 'Carte de commande', 'Boîtier de commande', 'Module de commande', 'Circuit de commande', 'Régulateur électronique'],
  },
  {
    fn: 'Convertir', fnAliases: ['Conversion'],
    verb: 'Transformer', tail: 'l’énergie électrique en rotation.',
    roleAliases: ['Convertir', 'Changer', 'Transformer l’électricité en mouvement', 'Transformer l’énergie électrique en mouvement', 'Convertir l’électricité en rotation', 'Transformer l’énergie électrique en énergie mécanique', 'Convertir l’énergie électrique en énergie cinétique', 'Créer un mouvement à partir de l’électricité', 'Mettre l’axe en rotation', 'Transforme', 'Convertit', 'Le moteur transforme l’électricité en mouvement'],
    part: 'Le moteur électrique', partAliases: ['Moteur', 'Moteur au pédalier', 'Moteur électrique au pédalier', 'Moteur central', 'Moteur d’assistance', 'Moteur électrique central', 'Moteur du vélo'],
  },
  {
    fn: 'Transmettre', fnAliases: ['Transmission'],
    verb: 'Transmettre', tail: 'la rotation à la roue arrière.',
    roleAliases: ['Communiquer', 'Amener', 'Transférer', 'Faire passer', 'Passer', 'Transmettre le mouvement', 'Transmettre la rotation du moteur à la roue arrière', 'Transmettre le mouvement à la roue', 'Entraîner la roue arrière', 'Faire tourner la roue arrière', 'Faire passer la rotation à la roue', 'Transmet', 'La chaîne transmet le mouvement à la roue arrière'],
    part: 'La chaîne et les pignons', partAliases: ['Chaîne et pignons', 'Chaîne', 'Pignons et chaîne', 'Transmission par chaîne', 'Chaîne de transmission', 'Chaîne du vélo', 'Chaîne et engrenages', 'Chaîne et plateau', 'Chaîne, plateau et pignons'],
  },
];

const sourceAliases = {
  'Le Soleil': ['L’astre solaire', 'Rayonnement du Soleil'],
  'Le vent': ['Air qui se déplace', 'Air en mouvement', 'Déplacement de l’air'],
  'Le bois': ['Bois de chauffage', 'Bois brûlé', 'Bûches', 'Bûches de bois', 'Bois en combustion'],
  'L’eau': ['Eau en mouvement', 'Eau du barrage', 'Eau de la rivière', 'Courant d’eau'],
  'Le gaz naturel': ['Gaz de ville', 'Gaz de la chaudière', 'Gaz naturel de la chaudière', 'Gaz fossile'],
  'L’uranium': ['Uranium du réacteur', 'Uranium utilisé comme combustible', 'Combustible à base d’uranium'],
  'Le charbon': ['Charbon brûlé', 'Charbon de ce feu', 'Charbon utilisé comme combustible', 'Charbon fossile'],
  'La chaleur du sous-sol': ['Chaleur de la Terre', 'Géothermie', 'Énergie géothermique', 'Chaleur souterraine', 'Chaleur interne de la Terre', 'Chaleur du sol profond'],
  'Le pétrole': ['Pétrole brut', 'Pétrole extrait du gisement', 'Pétrole du sous-sol', 'Pétrole fossile'],
};

const writtenFormAliases = {
  Cinétique: ['Énergie cinétique', 'Énergie de mouvement', 'Énergie du mouvement', 'Énergie liée au mouvement', 'Énergie cinétique de déplacement', 'Énergie cinétique de translation'],
  Chimique: ['Énergie chimique', 'Énergie chimique stockée', 'Énergie stockée sous forme chimique', 'Énergie stockée dans les molécules', 'Énergie des liaisons chimiques'],
};

function chainItems() {
  return stages.flatMap(({ fn, fnAliases, verb, tail, part, partAliases, roleAliases }, stage) => {
    const prefix = `Étape ${stage + 1}`;
    const explanation = `${fn} · ${part} permet de ${verb.toLowerCase()} ${tail}`;
    return [
      { prompt: `${prefix} · Fonction`, answer: fn, aliases: fnAliases, explanation, weight: .5 },
      { prompt: `${prefix} · Rôle`, answer: verb, aliases: roleAliases, tail, explanation, weight: .5 },
      { prompt: `${prefix} · Constituant`, answer: part, aliases: partAliases, explanation, weight: 1 },
    ];
  });
}

function sourceItems(index) {
  const [renewable, limited, source, situation] = sourceExamples[index];
  const [reason, expected, distractors, explanation] = sourceReasoning[index];
  const [definition, answer, others] = sourceDefinitions[index];
  return [
    { prompt: `Classe cette source : ${renewable}.`, card: renewable, interaction: 'sort', answer: 'Renouvelable', explanation: 'Cette ressource se renouvelle naturellement assez vite à l’échelle humaine.' },
    { prompt: `Classe cette source : ${limited}.`, card: limited, interaction: 'sort', answer: 'Non renouvelable', explanation: 'Le stock est limité et se reconstitue trop lentement pour remplacer ce que l’on prélève.' },
    item(definition, answer, 'La source indique d’où vient l’énergie. Sa famille dépend de son renouvellement.', [answer, ...others]),
    item(reason, expected, explanation, [expected, ...distractors]),
    { prompt: `Pour ${situation}, quelle est la source ?`, answer: source,
      aliases: sourceAliases[source] ?? [],
      suggestions: [source, ...Object.keys(sourceAliases).filter(name => name !== source).slice(index % 4, index % 4 + 4)],
      explanation: 'La source est à l’origine de l’énergie observée dans la situation.' },
  ];
}

export const subjectCount = 100;

export function getSubject(number, grade = '5e') {
  if (!Number.isInteger(number) || number < 1 || number > subjectCount) throw new RangeError('Numéro de sujet hors limites.');
  const sourceIndex = Math.floor((number - 1) / 10);
  const formIndex = (number - 1) % 10;
  const sources = sourceItems(sourceIndex);
  if (grade === '4e') {
    const [prompt, answer, alternatives, explanation] = sourceReasoning[(sourceIndex + 4) % sourceReasoning.length];
    sources[2] = item(prompt, answer, explanation, [answer, ...alternatives]);
  }
  return [
    { title: 'Les sources d’énergie', photo: 'dam', alt: 'Barrage Hoover', items: sources },
    { title: 'Les formes d’énergie', photo: 'fire', alt: 'Feu de bois', items: [0, 1, 3, 4, 6, 2, 5].map(i => {
      const name = formNames[i];
      const situation = formScenarios[i][(formIndex + 3 * i) % 10];
      if (i !== 2 && i !== 5) {
        return { prompt: `${situation} ${formPrompts[i]}`, card: situation, interaction: 'match', answer: name, explanation: formExplanations[i] };
      }
      return { prompt: `${situation} ${formPrompts[i]}`, answer: name, aliases: writtenFormAliases[name] ?? [], suggestions: formNames, explanation: formExplanations[i] };
    }) },
    { title: 'La chaîne d’énergie du vélo électrique', photo: 'electric-bicycle', alt: 'Vélo à assistance électrique avec moteur au pédalier', chain: true, items: chainItems() },
  ];
}
