// Piloti realmente equipaggiati nel duello simultaneo ufficiale.
// Prima conversione: i quattro comandanti comuni, conservando le percentuali
// e il livello 1-5 della carta posseduta. Nessun bonus su formule non valide.
import {commanderAbility} from './commanderAbilities.js';
import {tacticalSignatureMatches} from './tacticalShipSignatures.js';
import {TACTICAL_BOSS_COMMANDERS} from './tacticalBossCommanderBridge.js';

export const TACTICAL_READY_COMMANDERS=Object.freeze([
 'pilot_com_1','pilot_com_2','pilot_com_3','pilot_com_4',
 ...TACTICAL_BOSS_COMMANDERS
]);

export const tacticalCommanderReady=id=>TACTICAL_READY_COMMANDERS.includes(id);

// Il bonus modifica il vero pacchetto delle armi montate sulla barriera,
// NON crea proiettili e NON bypassa scudiere o firme matematiche.
// Il resto centesimale è conservato tra i cicli: 2% di 20 HP non diventa 1 HP
// gratuitamente al primo colpo, né viene perso per arrotondamento.
export function tacticalCommanderVolleyBonus(attacker,defender,order,baseDamage){
 const pilot=attacker?.commander,ability=commanderAbility(pilot?.id);
 const empty={active:false,extra:0,remainder:pilot?.bonusRemainder||0,pilotId:null};
 if(!pilot||!tacticalCommanderReady(pilot.id)||!ability||
  !Number.isSafeInteger(baseDamage)||baseDamage<=0)return empty;
 const indices=order?.numericIndices??[];
 if(![2,3].includes(indices.length)||order.op!==ability.trigger||
  new Set(indices).size!==indices.length)return empty;
 const target=defender?.defense?.parts?.[order.vitalId];
 const cards=indices.map(i=>attacker.numeric?.hand?.[i]);
 if(!target||target.hp<=0||cards.some(card=>!card)||
  !tacticalSignatureMatches(target.signature,order.op,cards))return empty;
 const level=Number.isInteger(pilot.level)?Math.max(1,Math.min(5,pilot.level)):1;
 const percentage=ability.levels[level-1];
 const remainder=Number.isInteger(pilot.bonusRemainder)&&pilot.bonusRemainder>=0&&
  pilot.bonusRemainder<100?pilot.bonusRemainder:0;
 const points=baseDamage*percentage+remainder;
 return {active:true,pilotId:pilot.id,percentage,extra:Math.floor(points/100),
  remainder:points%100};
}
