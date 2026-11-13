// Passiva della sola nave madre + sinergie con le due sue evoluzioni.
// La madre e' l'unica ad avere il fuoco delle 42 armi del catalogo ufficiale.
import {activeFleetSupportLinks,applyFleetEscortPassives,motherAlive} from './fleetEscortSupports.js';

export const FLEET_SHIP_PASSIVES=Object.freeze({
 N00:{name:'Analisi Aurora',kind:'analysis',parts:['engine','command'],interval:3},
 C01:{name:'Spinta solare',kind:'assault',parts:['weapons','engine'],interval:2},
 C02:{name:'Fenditura cristallina',kind:'precision',parts:['weapons','engine'],interval:3},
 C03:{name:'Doppio impulso',kind:'ion',parts:['weapons','generator'],interval:3},
 C04:{name:'Volo cremisi',kind:'assault',parts:['weapons','engine'],interval:3},
 R01:{name:'Cannone binario',kind:'artillery',parts:['weapons','engine'],interval:2},
 R02:{name:'Risonanza Manta',kind:'ion',parts:['weapons','generator'],interval:2},
 R03:{name:'Spettro Iride',kind:'analysis',parts:['command','weapons'],interval:3},
 R04:{name:'Morso del Vuoto',kind:'artillery',parts:['weapons','engine'],interval:2},
 E01:{name:'Nebbia polare',kind:'freeze',parts:['generator','weapons'],interval:3},
 E02:{name:'Scarica Tempesta',kind:'precision',parts:['engine','weapons'],interval:2},
 E03:{name:'Artiglio Fenice',kind:'artillery',parts:['weapons','generator'],interval:2},
 E04:{name:'Orizzonte infinito',kind:'analysis',parts:['command','weapons'],interval:3},
 L01:{name:'Furia dell Eclisse',kind:'assault',parts:['weapons','engine'],interval:2},
 L02:{name:'Singolarita ionica',kind:'ion',parts:['generator','weapons'],interval:2},
 L03:{name:'Giudizio del Titano',kind:'artillery',parts:['weapons','engine'],interval:2},
 L04:{name:'Arca risonante',kind:'precision',parts:['command','weapons'],interval:3}
});
export function fleetShipPassive(id){
 const def=FLEET_SHIP_PASSIVES[id];
 return def?{...def,description:'Richiede '+def.parts.join(' + ')+
  '; si attiva ogni '+def.interval+' round.'}:null;
}
export const FLEET_SHIP_SYNERGIES=Object.freeze([
 {name:'Formazione triplice',effect:'formation',required:['command','generator']}
]);
const working=(ship,ids)=>ids.every(id=>ship?.parts?.some(p=>p.id===id&&p.damage<2));
export function activeFleetSynergies(side){
 const links=activeFleetSupportLinks(side);
 const mother=side?.ships?.[0];
 if(links.length===2&&working(mother,['command','generator']))
  links.push({name:'Formazione triplice',ships:[mother.name,...side.escorts.map(e=>e.name)],
   description:'Le due evoluzioni restano collegate alla madre'});
 return links;
}
export function applyFleetShipPassives(side,enemy,ownOrder,enemyOrder,round,effects){
 const notes=[];
 const mother=side?.ships?.[0];
 if(!motherAlive(mother))return notes;
 const passive=FLEET_SHIP_PASSIVES[mother.id];
 if(passive&&round%passive.interval===0&&working(mother,passive.parts)){
  const label=mother.name+' · '+passive.name;
  let triggered=false;
  switch(passive.kind){
   case 'analysis':case 'assault':effects.power++;triggered=true;break;
   case 'artillery':
    if(['weapons','generator','command'].includes(ownOrder.partId)){
     effects.power++;triggered=true;
    }
    break;
   case 'precision':effects.pierce=true;effects.power++;triggered=true;break;
   case 'ion':effects.ion=true;effects.power++;triggered=true;break;
   case 'freeze':effects.jam=true;triggered=true;break;
  }
  if(triggered)notes.push(label);
 }
 notes.push(...applyFleetEscortPassives(side,enemy,ownOrder,enemyOrder,round,effects));
 if(round%3===0&&activeFleetSupportLinks(side).length===2&&
   working(mother,['command','generator'])){
  effects.power++;notes.push('Formazione triplice: madre e due scudiere sincronizzate');
 }
 return notes;
}
