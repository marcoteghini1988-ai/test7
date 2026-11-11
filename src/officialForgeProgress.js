// Cantiere ufficiale: protezioni di consistenza del salvataggio.
// Non cambia tempi, prezzi, materiali o numero degli slot esistenti.
const FORGE_KINDS=new Set(['deck','ability','terrain','epic']);

export function isOfficialForgeJob(job){
 return !!job&&typeof job==='object'&&!Array.isArray(job)&&
  FORGE_KINDS.has(job.type)&&typeof job.id==='string'&&job.id.length>0&&
  Number.isSafeInteger(job.targetLevel)&&
  job.targetLevel>=1&&job.targetLevel<=9&&
  Number.isFinite(job.finishTime)&&job.finishTime>=0;
}

export function normalizeOfficialForgeQueue(raw){
 return Array.isArray(raw)?raw.filter(isOfficialForgeJob):[];
}

// Non effettuare un secondo upgrade e soprattutto non tornare
// a un livello inferiore quando una vecchia lavorazione si completa.
export function applyOfficialForgeCompletion(inventory,job){
 if(!isOfficialForgeJob(job))return inventory;
 const state=inventory&&typeof inventory==='object'&&!Array.isArray(inventory)?
  inventory:{};
 const previous=state[job.id]&&typeof state[job.id]==='object'?
  state[job.id]:{};
 const previousLevel=Number.isSafeInteger(previous.level)&&previous.level>=1?
  previous.level:0;
 if(previousLevel>=job.targetLevel&&previous.unlocked===true)return inventory;
 return {...state,[job.id]:{...previous,unlocked:true,
  level:Math.max(previousLevel,job.targetLevel)}};
}

// Controllo di identita' anche per i click di accelerazione: un vecchio
// bottone non deve spendere Etere per un oggetto gia' rimosso dalla coda.
export function isOfficialForgeJobInQueue(queue,job){
 return isOfficialForgeJob(job)&&Array.isArray(queue)&&
  queue.some(q=>isOfficialForgeJob(q)&&q.type===job.type&&
    q.id===job.id&&q.targetLevel===job.targetLevel&&
    q.finishTime===job.finishTime);
}
