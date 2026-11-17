// Eclissi Stellare — registro tecnico del NUOVO catalogo comune.
// 32 carte sistemi + Buco Nero. Eseguibili SOLO nel ruleset hp-sync-v2;
// la modalità storica resta inalterata. Asset grafici non ancora realizzati.
// Tutte le 33 carte occupano una giocata Attacco nel proprio turno;
// gli effetti temporanei persistono come stati e non bloccano lo slot nei turni seguenti.
import design from '../../docs/CATALOGO_32_CARTE_SISTEMI_2026-11-17.json' with {type:'json'};

const RARITIES=Object.freeze(['Comune','Rara','Epica','Leggendaria']);
const COMPONENTS=Object.freeze(['command','weapons','generator','bridge']);
const TYPES=Object.freeze(['Sabotaggio','Amplificazione']);

const freezeCard=card=>Object.freeze({...card,effectSpec:Object.freeze(card.effectSpec)});

const systemCards=design.cards.map(c=>{
 const id='sys-'+c.systemId+'-'+(c.type==='Sabotaggio'?'minus':'plus')+'-'+
  ({Comune:'c',Rara:'r',Epica:'e',Leggendaria:'l'}[c.rarity]||'invalid');
 if(!COMPONENTS.includes(c.systemId)||!TYPES.includes(c.type)||
    !RARITIES.includes(c.rarity)||!Number.isInteger(c.durationTurns)||
    c.durationTurns<1||!c.effect||!c.stage?.includes('APPROVATO'))
  throw new Error('Carta sistemi non valida o non approvata: '+c.designId);
 return freezeCard({
  id,designId:c.designId,name:c.name,nome:c.name,
  category:'Sistema',sottotipo:c.type,rarita:c.rarity,kind:'attack',
  systemId:c.systemId,playable:true,nativeFace:true,
  effectProposed:c.effect,
  effectSpec:{type:'systemModifier',system:c.systemId,
   operation:c.type==='Sabotaggio'?'disable':'amplify',
   tier:c.tier,turns:c.durationTurns,magnitude:c.magnitude,
   designText:c.effect}
 });
});

const blackHole=freezeCard({
 id:'sys-black-hole',name:'Buco Nero',nome:'Buco Nero',category:'Controllo',
 sottotipo:'Controllo campo',rarita:'Leggendaria',kind:'attack',
 playable:true,nativeFace:true,maxCopiesPerDeck:3,
 effectProposed:'Risucchia tutte le carte attive sul campo di entrambi i giocatori, comprese le due Armi temporanee e il Terreno. Le navi e i loro HP restano invariati.',
 effectSpec:{type:'fieldReset',scope:'both',discardFieldCards:true,
  includes:['attacks','defenses','traps','characters','terrain','temporaryWeapons'],
  excludes:['mother','escorts','hp','hand','deck','unlockedSystems']}
});

export const NEXT_COMMON_CARDS=Object.freeze([...systemCards,blackHole]);
export const NEXT_COMMON_CARD_BY_ID=Object.freeze(Object.fromEntries(
 NEXT_COMMON_CARDS.map(c=>[c.id,c])
));
export const NEXT_COMMON_CARD_COUNT=NEXT_COMMON_CARDS.length;
export const nextCommonCard=id=>NEXT_COMMON_CARD_BY_ID[id]||null;

if(systemCards.length!==32||NEXT_COMMON_CARD_COUNT!==33||
 new Set(NEXT_COMMON_CARDS.map(c=>c.id)).size!==33||
 COMPONENTS.some(sys=>systemCards.filter(c=>c.systemId===sys).length!==8))
 throw new Error('Il nuovo registro deve contenere 32 carte sistemi + Buco Nero');
