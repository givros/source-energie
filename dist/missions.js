const board = (prompt, zones, cards, explanation, single = false) => ({
  prompt, board: { zones, cards, single }, explanation,
});
const ordering = (prompt, sequence, explanation) => board(
  prompt, sequence.map((_, i) => `Étape ${i + 1}`),
  sequence.map((label, target) => ({ label, target })), explanation, true,
);
const renewable = (prompt, cards, explanation) => board(
  prompt, ['Renouvelables', 'Non renouvelables'],
  cards.map(([photo, label, target]) => ({ photo, label, target })), explanation,
);
const fanRoles = ['Alimenter', 'Distribuer', 'Convertir', 'Transmettre'];
const fanParts = [['battery', 'Piles'], ['switch', 'Interrupteur'], ['motor', 'Moteur'], ['axle', 'Axe du moteur']];
const connectFan = (prompt, reverse, explanation) => board(
  prompt,
  reverse ? fanParts.map(([, label]) => label) : fanRoles,
  reverse ? fanRoles.map((label, target) => ({ label, target }))
    : fanParts.map(([photo, label], target) => ({ photo, label, target })),
  explanation, true,
);
const scenario = (mode, prompt, data, explanation) => ({ mode, prompt, ...data, explanation });
const identify = (photo, prompt, answer, alternatives, explanation) =>
  scenario('identify', prompt, { photo, answer, choices: [answer, ...alternatives] }, explanation);
const files = (prompt, items, explanation) => scenario('files', prompt, { items }, explanation);
const memory = (pairs, explanation) => scenario('memory', 'Associe chaque exemple à une forme d’énergie.', { pairs }, explanation);
const link = (prompt, pairs, explanation) => scenario('link', prompt, { pairs }, explanation);
const repair = (prompt, target, explanation) => scenario('repair', prompt, { target, parts: fanParts }, explanation);
export const captions = {
  'electric-bicycle': 'Vélo à assistance électrique',
  sun: 'Soleil', fire: 'Feu de bois', bike: 'Cycliste', motor: 'Moteur électrique',
  dam: 'Barrage', battery: 'Piles', nuclear: 'Centrale nucléaire', wind: 'Éoliennes',
  wind_source: 'Parc éolien', oil_source: 'Pompes à pétrole', water_source: 'Eau en mouvement',
  fan_view: 'Ventilateur', switch: 'Interrupteur', axle: 'Axe du moteur',
};

export const missions = [
  {
    id: 'sources-photo', zone: 'Sources d’énergie', title: 'Reconnais les sources',
    summary: 'Retrouve la source utilisée dans chaque situation.', cover: 'wind_source',
    rounds: [

      identify('wind_source', 'D’où vient l’énergie utilisée par les éoliennes ?', 'Du vent', ['Du Soleil', 'De l’eau'],
        'Le vent est la source. Son mouvement fait tourner les pales de l’éolienne.'),
      identify('oil_source', 'Quelle source ces pompes extraient-elles du sous-sol ?', 'Le pétrole', ['L’uranium', 'Le bois'],
        'Le pétrole est une source non renouvelable. Il se forme beaucoup plus lentement qu’on ne l’utilise.'),
      identify('dam', 'Quelle source utilise ce barrage pour produire de l’électricité ?', 'L’eau', ['Le vent', 'Le gaz naturel'],
        'L’eau qui descend met la turbine en mouvement. C’est le principe de l’énergie hydraulique.'),
      identify('sun', 'Quelle est la source de la lumière que l’on voit ici ?', 'Le Soleil', ['La chaleur du sous-sol', 'Le vent'],
        'Le Soleil est la source. La lumière est une forme d’énergie.'),
    ],
  },
  {
    id: 'sources-tri', zone: 'Sources d’énergie', title: 'Le tri des ressources',
    summary: 'Classe chaque ressource dans la bonne famille.', cover: 'oil_source',
    rounds: [
      renewable('Trie les sources d’énergie dans les deux familles.', [
        ['wind_source', 'Le vent', 0], ['oil_source', 'Le pétrole', 1],
        ['dam', 'L’eau des rivières', 0], ['nuclear', 'L’uranium', 1],
      ], 'Le vent et l’eau se renouvellent naturellement. Le pétrole et l’uranium proviennent de stocks limités.'),
      renewable('Classe les sources en tenant compte de leur renouvellement.', [
        ['sun', 'Le Soleil', 0], ['fire', 'Le bois d’une forêt qui se régénère', 0],
        ['oil_source', 'Le pétrole', 1], ['nuclear', 'L’uranium', 1],
      ], 'Le Soleil et le bois se renouvellent à l’échelle humaine dans ces situations. Les stocks de pétrole et d’uranium diminuent à mesure qu’on les exploite.'),
    ],
  },
  {
    id: 'sources-diagnostic', zone: 'Sources d’énergie', title: 'Dossiers sous enquête',
    summary: 'Écarte les fiches qui contiennent une erreur.', cover: 'dam',
    rounds: [

      files('Le rapport d’enquête mélange faits et erreurs. Écarte les deux fiches erronées.', [
        ['oil_source','Le pétrole devient renouvelable parce qu’il se forme dans la nature.', false],
        ['wind_source','Le vent reste renouvelable même s’il ne souffle pas tout le temps.', true],
        ['nuclear','L’uranium est disponible sans limite.', false],
        ['sun','Le Soleil est une source renouvelable à l’échelle humaine.', true],
      ], 'Le pétrole se forme trop lentement et les réserves d’uranium sont limitées.'),
      files('Relis les observations de terrain et écarte les deux erreurs.', [
        ['fire','Une forêt se renouvelle même si on coupe les arbres plus vite qu’ils ne repoussent.', false],
        ['dam','L’eau du barrage peut être renouvelée par les précipitations.', true],
        ['wind_source','Une éolienne tire son énergie du gaz naturel.', false],
        ['oil_source','Le pétrole est une source non renouvelable.', true],
      ], 'La biomasse doit avoir le temps de repousser. Une éolienne est entraînée par le vent.'),
    ],
  },
  {
    id: 'formes', zone: 'Formes d’énergie', title: 'Mémoire des sept formes',
    summary: 'Retourne les cartes et reforme les paires.', cover: 'fire',
    rounds: [

      memory([
        ['fire','Chaleur dégagée par le feu','Thermique'], ['sun','Rayons du Soleil','Lumineuse'],
        ['bike','Vélo en train de rouler','Cinétique'], ['motor','Énergie reçue par les fils du moteur','Électrique'],
      ], 'Chaleur, lumière, mouvement et électricité correspondent ici à quatre formes différentes.'),
      memory([
        ['dam','Eau retenue en hauteur','Potentielle de pesanteur'], ['battery','Énergie stockée dans une pile','Chimique'],
        ['nuclear','Énergie libérée lors de la fission','Nucléaire'],
      ], 'La hauteur de l’eau, les réactions d’une pile et la fission mettent en jeu trois formes d’énergie différentes.'),
    ],
  },
  {
    id: 'photo-match', zone: 'Formes d’énergie', title: 'Source ou forme',
    summary: 'Distingue ce qui fournit l’énergie de la façon dont elle se manifeste.', cover: 'bike',
    rounds: [

      link('Pour chaque photo, relie la source à la forme que la phrase décrit.', [
        ['sun','Soleil · il éclaire','Lumineuse'],
        ['wind_source','Vent · il se déplace','Cinétique'],
        ['fire','Bois en combustion · il chauffe','Thermique'],
      ], 'Le Soleil, le vent et le bois sont des sources. La lumière, le mouvement et la chaleur correspondent à des formes d’énergie.'),
      link('Associe chaque situation à sa forme d’énergie.', [
        ['dam','Eau retenue en hauteur','Potentielle de pesanteur'],
        ['battery','Énergie stockée dans une pile','Chimique'],
        ['nuclear','Énergie libérée par la fission de l’uranium','Nucléaire'],
      ], 'Une même situation peut mettre en jeu plusieurs formes d’énergie. Ici, on s’intéresse précisément à l’eau en hauteur, à l’énergie stockée dans la pile et à la fission.'),
    ],
  },
  {
    id: 'conversions', zone: 'Formes d’énergie', title: 'Avant et après',
    summary: 'Relie l’énergie reçue à la forme d’énergie obtenue.', cover: 'motor',
    rounds: [

      link('Relie chaque situation à l’énergie utile obtenue.', [
        ['motor','Moteur · il reçoit de l’énergie électrique','Cinétique : rotation de l’axe'],
        ['battery','Pile · elle stocke de l’énergie chimique','Électrique : énergie fournie au circuit'],
        ['fire','Bois · il brûle et chauffe','Thermique : chaleur dégagée'],
      ], 'Convertir, c’est transformer une forme d’énergie en une autre. Le moteur convertit l’énergie électrique en mouvement.'),
      identify('bike','Quand le cycliste pédale, quelle énergie ses muscles utilisent-ils ?', 'L’énergie chimique des aliments',
        ['L’énergie lumineuse du Soleil','L’énergie électrique du vélo'],
        'Les muscles utilisent l’énergie chimique des aliments pour produire un mouvement.'),
    ],
  },
  {
    id: 'chaine-ordre', zone: 'Chaîne d’énergie', title: 'Remonte la chaîne',
    summary: 'Reconstitue les étapes dans le bon ordre.', cover: 'fan_view',
    rounds: [
      ordering('Remets les quatre fonctions de la chaîne d’énergie dans l’ordre.', ['Alimenter', 'Distribuer', 'Convertir', 'Transmettre'], 'La chaîne commence par l’alimentation et se termine par la transmission du mouvement.'),
      ordering('Place les constituants du ventilateur dans l’ordre où l’énergie circule.', ['Piles', 'Interrupteur', 'Moteur', 'Axe'], 'L’énergie va des piles au moteur en passant par l’interrupteur. L’axe entraîne l’hélice.'),
      ordering('Remets en ordre les effets qui suivent la fermeture de l’interrupteur.', ['Le courant circule', 'Le moteur tourne', 'L’axe entraîne l’hélice', 'L’air se met en mouvement'], 'Le courant met le moteur en action. La rotation est ensuite transmise à l’hélice.'),
    ],
  },
  {
    id: 'chaine-pieces', zone: 'Chaîne d’énergie', title: 'À chaque pièce son rôle',
    summary: 'Identifie la pièce qui réalise chaque fonction.', cover: 'switch',
    rounds: [
      connectFan('Place chaque pièce du ventilateur sous la fonction qu’elle assure.', false,
        'Les piles alimentent le circuit. L’interrupteur distribue l’énergie, le moteur la convertit et l’axe transmet la rotation.'),
      connectFan('Cette fois, place la bonne fonction sous le nom de chaque pièce.', true,
        'Chaque constituant assure une fonction précise dans le parcours de l’énergie.'),
    ],
  },
  {
    id: 'chaine-panne', zone: 'Chaîne d’énergie', title: 'Atelier du ventilateur',
    summary: 'Retrouve la pièce qui assure la fonction manquante.', cover: 'battery',
    rounds: [

      repair('Quelle pièce fournit l’énergie électrique au ventilateur et doit être remplacée quand elle est déchargée ?', 0,
        'Les piles assurent la fonction alimenter. Elles fournissent l’énergie électrique au circuit.'),
      repair('Le courant arrive au moteur, mais il ne tourne pas. Quelle pièce doit convertir l’énergie électrique en mouvement ?', 2,
        'Le moteur assure la fonction convertir. Il transforme l’énergie électrique en rotation.'),
      repair('Le moteur tourne. Quelle pièce transmet sa rotation à l’hélice ?', 3,
        'L’axe assure la fonction transmettre. Il entraîne l’hélice, qui met l’air en mouvement.'),
    ],
  },
  {
    id: 'defi-final', zone: 'Chaîne d’énergie', title: 'Défi de révision',
    summary: 'Vérifie les notions du contrôle avec des questions courtes.', cover: 'nuclear',
    rounds: [

      identify('oil_source','Pourquoi le pétrole est-il non renouvelable ?', 'Il s’épuise et se renouvelle trop lentement.',
        ['C’est une source naturelle.','Il provient du sous-sol.'],
        'Le critère est le temps que met la ressource à se renouveler.'),
      identify('dam','Quelle forme d’énergie possède l’eau retenue en hauteur ?', 'Potentielle de pesanteur',
        ['Électrique','Thermique'],
        'L’eau retenue possède cette énergie grâce à sa hauteur.'),
      identify('switch','Dans la chaîne du ventilateur, quelle fonction assure l’interrupteur ?', 'Distribuer',
        ['Alimenter','Convertir','Transmettre'],
        'L’interrupteur autorise ou coupe le passage du courant.'),
      ordering('Remets les fonctions du ventilateur dans l’ordre.',
        ['Alimenter','Distribuer','Convertir','Transmettre'],
        'Les piles alimentent, l’interrupteur distribue, le moteur convertit, l’axe transmet. L’action obtenue est de mettre l’air en mouvement.'),
    ],
  },
];

const fourthGradeRounds = {
  'sources-photo': identify('wind_source', 'Deux installations produisent de l’électricité : une éolienne et un barrage. Quelle est la source de l’éolienne ?', 'Le vent', ['L’électricité', 'La rotation des pales'], 'La source est le vent. La rotation des pales est un mouvement et l’électricité est l’énergie utile obtenue.'),
  'sources-tri': renewable('Classe ces ressources. La façon dont on les exploite change-t-elle leur renouvellement ?', [
    ['fire', 'Le bois d’une forêt qui repousse au rythme des coupes', 0],
    ['oil_source', 'Le pétrole utilisé pour produire de la chaleur', 1],
    ['dam', 'L’eau d’un barrage dont le débit varie', 0],
    ['nuclear', 'L’uranium utilisé pour produire de l’électricité', 1],
  ], 'Le classement dépend du renouvellement de la ressource. Le débit de l’eau peut varier et le pétrole s’épuise quel que soit son usage.'),
  'sources-diagnostic': files('Écarte les deux conclusions qui confondent source et forme.', [
    ['wind_source', 'L’électricité fait partie des sources renouvelables.', false],
    ['sun', 'Le Soleil est une source, sa lumière est une forme d’énergie.', true],
    ['dam', 'La rotation de la turbine est une source naturelle.', false],
    ['oil_source', 'Le pétrole est une source et la chaleur dégagée en brûlant correspond à une forme.', true],
  ], 'Une source indique l’origine. L’électricité, la rotation et la chaleur indiquent des formes sous lesquelles l’énergie se manifeste.'),
  formes: memory([
    ['battery', 'Une batterie chargée, avant utilisation', 'Énergie chimique'],
    ['motor', 'L’axe du moteur tourne', 'Énergie cinétique'],
    ['dam', 'L’eau est immobile en hauteur', 'Énergie potentielle de pesanteur'],
  ], 'Une réserve d’énergie peut exister sans mouvement. La batterie la stocke sous forme chimique et l’eau en hauteur possède de l’énergie potentielle de pesanteur.'),
  'photo-match': link('Dans chaque situation, repère le changement de forme principal.', [
    ['motor', 'Un moteur électrique se met à tourner', 'Électrique → cinétique'],
    ['fire', 'Du bois brûle pour réchauffer une pièce', 'Chimique → thermique'],
    ['dam', 'L’eau retenue en hauteur commence à descendre', 'Potentielle de pesanteur → cinétique'],
  ], 'Il faut repérer la forme de départ et la forme utile obtenue dans la situation décrite.'),
  conversions: identify('motor', 'Le moteur tourne et son boîtier chauffe. Pour faire avancer le vélo, quelle forme d’énergie est utile ?', 'L’énergie cinétique liée à la rotation', ['L’énergie thermique du boîtier', 'L’énergie lumineuse'], 'La rotation est recherchée pour faire avancer le vélo. L’échauffement est une autre manifestation, qui ne sert pas ici à le faire avancer.'),
  'chaine-ordre': ordering('Suis le parcours de l’assistance électrique du vélo.', ['Batterie', 'Contrôleur', 'Moteur au pédalier', 'Chaîne et pignons'], 'La batterie fournit l’énergie électrique. Le contrôleur règle le courant. Le moteur crée la rotation que la chaîne et les pignons transmettent à la roue.'),
  'chaine-pieces': board('Associe chaque constituant du vélo à sa fonction.', fanRoles,
    ['Batterie', 'Contrôleur', 'Moteur au pédalier', 'Chaîne et pignons'].map((label, target) => ({ label, target })),
    'Les quatre fonctions restent les mêmes quand on passe du ventilateur au vélo. Les constituants qui les réalisent changent.', true),
  'chaine-panne': identify('electric-bicycle', 'Sur le vélo, le moteur tourne, mais la chaîne est sortie de son pignon. Quelle fonction est interrompue ?', 'Transmettre', ['Alimenter', 'Distribuer', 'Convertir'], 'La rotation existe déjà. La chaîne sortie de son pignon ne la transmet plus à la roue arrière.'),
  'defi-final': identify('motor', 'Quelle observation permet de dire que le moteur convertit l’énergie ?', 'Il reçoit de l’énergie électrique et produit une rotation.', ['La chaîne transmet une rotation à la roue.', 'La batterie fournit le courant.'], 'Le moteur change la forme de l’énergie. Transmettre une rotation d’une pièce à une autre ne change pas sa forme.'),
};

export const fourthGradeMissions = missions.map(mission => ({
  ...mission, rounds: [...mission.rounds, fourthGradeRounds[mission.id]],
}));
