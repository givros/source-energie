const endpoint = 'https://yswswuxtdjpewrqzrrnu.supabase.co/functions/v1/energy-exam-results';
const collator = new Intl.Collator('fr-FR',{sensitivity:'base',numeric:true});
const formatGrade = new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2});
const $ = id => document.getElementById(id);
let code = '';
let classes = new Map();
let loadId = 0;

function classKey(value) {
  return value.trim().toLocaleUpperCase('fr-FR').replace(/\s+/g,'');
}

function group(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = classKey(row.class_name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const rows of groups.values()) {
    rows.sort((a,b) => collator.compare(a.last_name,b.last_name) || collator.compare(a.first_name,b.first_name));
  }
  return new Map([...groups].sort(([a],[b]) => collator.compare(a,b)));
}

function render() {
  const selected = $('class-filter').value;
  const visible = selected ? [[selected,classes.get(selected)]] : [...classes];
  $('class-list').replaceChildren();
  if (!classes.size) {
    $('status').textContent = 'Aucune copie n’a encore été remise.';
    return;
  }
  const total = visible.reduce((count,[,rows]) => count + rows.length,0);
  $('status').textContent = total === 1 ? '1 copie remise' : `${total} copies remises`;
  for (const [name,rows] of visible) {
    const table = document.createElement('table');
    const caption = table.createCaption();
    caption.textContent = `Classe ${name}`;
    const header = table.createTHead().insertRow();
    for (const label of ['Nom','Prénom','Note /20']) {
      const th=document.createElement('th');
      th.scope='col';
      th.textContent=label;
      header.append(th);
    }
    const body=table.createTBody();
    for (const row of rows) {
      const tr=body.insertRow();
      for (const value of [row.last_name,row.first_name,formatGrade.format(row.grade)]) tr.insertCell().textContent=value;
    }
    $('class-list').append(table);
  }
}

async function load() {
  const current=++loadId;
  $('status').textContent='Chargement des notes…';
  $('refresh').disabled=true;
  $('access').querySelector('button').disabled=true;
  try {
    const all=[];
    let offset=0;
    do {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code,offset}),signal:AbortSignal.timeout(10000)});
      const data=await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Impossible de récupérer les notes.');
      all.push(...data.rows);
      offset=data.next;
    } while (offset !== null && current === loadId);
    if (current !== loadId) return;
    classes=group(all);
    const select=$('class-filter');
    const previous=select.value;
    select.replaceChildren(new Option('Toutes les classes',''),...[...classes.keys()].map(key=>new Option(key,key)));
    select.value=classes.has(previous) ? previous : '';
    $('access').hidden=true;
    $('code').value='';
    $('results').hidden=false;
    render();
  } catch(error) {
    if (current === loadId) $('status').textContent=error.message;
    if (!$('access').hidden) code='';
  } finally {
    if (current === loadId) {
      $('refresh').disabled=false;
      $('access').querySelector('button').disabled=false;
    }
  }
}

$('access').addEventListener('submit',event=>{
  event.preventDefault();
  code=$('code').value.trim();
  void load();
});
$('class-filter').addEventListener('change',render);
$('refresh').addEventListener('click',()=>void load());
$('lock').addEventListener('click',()=>{
  loadId++;
  code='';
  classes.clear();
  $('class-list').replaceChildren();
  $('class-filter').replaceChildren();
  $('status').textContent='';
  $('results').hidden=true;
  $('access').hidden=false;
  $('access').querySelector('button').disabled=false;
  $('code').focus();
});
