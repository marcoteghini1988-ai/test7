// Passive di navicella e sinergie tra navi - duello Carte di Flotta.
// Ogni effetto usa i sistemi reali (0 integro, 1 fratturato, 2 distrutto).
// Nessuna carta, nave, statistica inventariale o risorsa aggiuntiva.
export const FLEET_SHIP_PASSIVES=Object.freeze({
 N00:{name:'Analisi tattica',kind:'analysis',description:'Ogni 3 round, sistemi Motori e Centralina operativi migliorano il colpo.'},
 C01:{name:'Spinta solare',kind:'assault',description:'Ogni 2 round, Motori e Armi operativi potenziano il fuoco.'},
 C02:{name:'Campo criogenico',kind:'freeze',description:'Ogni 3 round, Generatore e Armi operativi disturbano il fuoco nemico.'},
 C03:{name:'Arco ionico',kind:'ion',description:'Ogni 3 round, Generatore e Armi generano un impulso ionico.'},
 C04:{name:'Scorta reattiva',kind:'guardian',description:'Da scorta, Generatore e Motori intercettano il danno extra contro la madre, rinunciando al tiro.'},
 R01:{name:'Dardi corrosivi',kind:'venom',description:'Ogni 3 round, Armi e Generatore applicano corrosione al colpo.'},
 R02:{name:'Disturbo a impulsi',kind:'ion',description:'Ogni 3 round, Armi e Generatore intensificano la risonanza ionica.'},
 R03:{name:'Riparazione orbitale',kind:'repair',description:'Ogni 2 round, Generatore e Centralina riparano una frattura alleata.'},
 R04:{name:'Baluardo minerale',kind:'guardian',description:'Da scorta, Generatore e Motori intercettano il danno extra contro la madre, rinunciando al tiro.'},
 E01:{name:'Stasi polare',kind:'freeze',description:'Ogni 3 round, Generatore e Armi disturbano l attacco avversario.'},
 E02:{name:'Puntamento gemello',kind:'precision',description:'Ogni 3 round, Motori e Armi consentono un colpo perforante.'},
 E03:{name:'Bombardamento mirato',kind:'artillery',description:'Ogni 2 round, Motori e Armi potenziano i colpi su Armi e Generatore.'},
 E04:{name:'Droni ricostruttori',kind:'repair',description:'Ogni 2 round, Generatore e Centralina riparano una frattura alleata.'},
 L01:{name:'Furia stellare',kind:'assault',description:'Ogni 2 round, Motori e Armi potenziano il fuoco.'},
 L02:{name:'Singolarita ionica',kind:'ion',description:'Ogni 3 round, Generatore e Armi aumentano la risonanza ionica.'},
 L03:{name:'Cannone d assedio',kind:'artillery',description:'Ogni 2 round, Motori e Armi potenziano i colpi su Armi e Generatore.'},
 L04:{name:'Arca rigenerante',kind:'repair',description:'Ogni 2 round, Generatore e Centralina riparano una frattura alleata.'}
});
export const FLEET_SHIP_SYNERGIES=Object.freeze([
 {name:'Baluardo rigenerante',first:'guardian',second:'repair',
  firstParts:['generator','engine'],secondParts:['generator','command'],interval:2,effect:'heal'},
 {name:'Shock termico',first:'freeze',second:'assault',
  firstParts:['generator'],secondParts:['weapons','engine'],interval:3,effect:'shock'},
 {name:'Neurotempesta',first:'venom',second:'ion',
  firstParts:['weapons'],secondParts:['generator'],interval:3,effect:'neuro'},
 {name:'Tiro chirurgico',first:'precision',second:'artillery',
  firstParts:['engine'],secondParts:['weapons'],interval:3,effect:'precision'},
 {name:'Diagnosi di scorta',first:'analysis',second:'guardian',
  firstParts:['command'],secondParts:['engine'],interval:2,effect:'focus'},
 {name:'Ricarica ionica',first:'ion',second:'repair',
  firstParts:['generator'],secondParts:['generator'],interval:2,effect:'heal'}
]);
export function fleetShipPassive(id){return FLEET_SHIP_PASSIVES[id]||null;}
const operational=(ship,id)=>ship?.parts?.some(p=>p.id===id&&p.damage<2);
const alive=ship=>ship?.parts?.filter(p=>p.damage>=2).length<2;
const working=(ship,ids)=>ids.every(id=>operational(ship,id));
function repairFracture(side){
 // Prima la madre, poi le scorte. Una parte distrutta non si ripristina.
 for(const ship of side.ships){
  if(!alive(ship)||!operational(ship,'generator'))continue;
  const wound=ship.parts.find(p=>p.damage===1);
  if(wound){wound.damage=0;wound.destroyed=false;return ship.name+' · '+wound.id;}
 }
 return null;
}
export function activeFleetSynergies(side){
 const ships=(side?.ships||[]).filter(alive);
 const combos=[];
 for(const combo of FLEET_SHIP_SYNERGIES){
  const first=ships.find(s=>fleetShipPassive(s.id)?.kind===combo.first&&working(s,combo.firstParts));
  const second=ships.find(s=>s!==first&&fleetShipPassive(s.id)?.kind===combo.second&&working(s,combo.secondParts));
  if(first&&second)combos.push({...combo,ships:[first.name,second.name]});
 }
 return combos;
}
export function applyFleetShipPassives(side,enemy,ownOrder,enemyOrder,round,effects){
 const notes=[];
 for(const [i,ship] of side.ships.entries()){
  if(!alive(ship))continue;
  const passive=fleetShipPassive(ship.id);
  if(!passive)continue;
  const label=ship.name+' · '+passive.name;
  switch(passive.kind){
   case 'guardian':
    if(i>0&&enemyOrder.shipIndex===0&&alive(side.ships[0])&&
      working(ship,['generator','engine'])&&
      !(effects.coverEscortIds||[]).length){
     effects.coverEscortIds=[ship.id];effects.coverMother=true;
     notes.push(label+': intercetta il danno aggiuntivo sulla nave madre');
    }
    break;
   case 'repair':
    if(round%2===0&&working(ship,['generator','command'])){
     const healed=repairFracture(side);
     if(healed)notes.push(label+': riparata '+healed);
    }
    break;
   case 'assault':
    if(round%2===0&&working(ship,['weapons','engine'])){
     effects.power++;notes.push(label+': potenza +1');
    }
    break;
   case 'freeze':
    if(round%3===0&&working(ship,['generator','weapons'])){
     effects.jam=true;notes.push(label+': disturbo criogenico al tiro avversario');
    }
    break;
   case 'ion':
    if(round%3===0&&working(ship,['generator','weapons'])){
     effects.ion=true;notes.push(label+': impulso ionico');
    }
    break;
   case 'venom':
    if(round%3===0&&working(ship,['weapons','generator'])){
     effects.corrosion=true;notes.push(label+': munizione corrosiva');
    }
    break;
   case 'precision':
    if(round%3===0&&working(ship,['engine','weapons'])){
     effects.pierce=true;notes.push(label+': puntamento perforante');
    }
    break;
   case 'artillery':
    if(round%2===0&&working(ship,['engine','weapons'])&&
      ['weapons','generator'].includes(ownOrder.partId)){
     effects.power++;notes.push(label+': bombardamento del componente');
    }
    break;
   case 'analysis':
    if(round%3===0&&working(ship,['engine','command'])){
     effects.power++;notes.push(label+': calcolo del bersaglio');
    }
    break;
  }
 }
 // Una sola sinergia di coppia per round. Le altre restano disponibili:
 // variare composizione o disabilitare un componente cambia le combinazioni.
 for(const combo of activeFleetSynergies(side)){
  if(round%combo.interval!==0)continue;
  const label=combo.name+' ('+combo.ships.join(' + ')+')';
  switch(combo.effect){
   case 'heal':{
    const healed=repairFracture(side);
    if(!healed)continue;
    notes.push(label+': riparata '+healed);break;
   }
   case 'shock':effects.power++;effects.ion=true;notes.push(label+': attacco termico-ionico');break;
   case 'neuro':effects.corrosion=true;effects.ion=true;notes.push(label+': attacco neuroionico');break;
   case 'precision':effects.power++;effects.pierce=true;notes.push(label+': perforazione coordinata');break;
   case 'focus':effects.power++;notes.push(label+': priorita di tiro condivisa');break;
   default:continue;
  }
  break;
 }
 return notes;
}
