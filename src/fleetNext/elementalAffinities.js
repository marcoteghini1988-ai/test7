// Identità degli elementi delle 17 flotte. Recupera il ciclo del motore
// storico fleetCardEngine.js; la nuova modalità HP non applica ancora bonus.
// Le doppie affinità sono proposte di bilanciamento: mai più di due per madre.
export const FLEET_ELEMENTS=Object.freeze({
 refrigerant:Object.freeze({name:'Acqua / Ghiaccio',symbol:'❄',beats:'plasma'}),
 plasma:Object.freeze({name:'Fuoco / Plasma',symbol:'✹',beats:'mineral'}),
 mineral:Object.freeze({name:'Terra / Minerale',symbol:'⬡',beats:'ionic'}),
 ionic:Object.freeze({name:'Elettricità / Ionico',symbol:'ϟ',beats:'refrigerant'})
});
export const FLEET_ELEMENT_IDENTITIES=Object.freeze({
 N00:Object.freeze(['ionic']),C01:Object.freeze(['plasma']),
 C02:Object.freeze(['refrigerant']),C03:Object.freeze(['ionic','mineral']),
 C04:Object.freeze(['plasma','ionic']),R01:Object.freeze(['plasma']),
 R02:Object.freeze(['ionic','refrigerant']),R03:Object.freeze(['refrigerant','mineral']),
 R04:Object.freeze(['mineral']),E01:Object.freeze(['refrigerant','ionic']),
 E02:Object.freeze(['ionic','plasma']),E03:Object.freeze(['plasma','refrigerant']),
 E04:Object.freeze(['mineral','refrigerant']),L01:Object.freeze(['plasma','mineral']),
 L02:Object.freeze(['ionic','plasma']),L03:Object.freeze(['mineral','plasma']),
 L04:Object.freeze(['refrigerant','ionic'])
});
export const fleetElements=shipId=>FLEET_ELEMENT_IDENTITIES[shipId]||Object.freeze([]);
export function fleetElementNames(shipId){
 return fleetElements(shipId).map(id=>FLEET_ELEMENTS[id].name);
}
const beats=(a,b)=>FLEET_ELEMENTS[a]?.beats===b;
const compare=(a,b)=>beats(a,b)?1:beats(b,a)?-1:0;
// Score di analisi progettuale NON collegato ai danni HP.
// Elemento primario peso 2, il secondario pesa 1 e mitiga un contromatch.
// In questo modo il doppio elemento offre elasticità senza sommare due bonus pieni.
export function projectedElementalMatchup(attackerShipId,defenderShipId){
 const a=fleetElements(attackerShipId),b=fleetElements(defenderShipId);
 if(!a.length||!b.length)return Object.freeze({score:0,status:'unknown'});
 const score=2*compare(a[0],b[0])+
  (a[1]?compare(a[1],b[0]):0)-
  (b[1]?compare(b[1],a[0]):0);
 return Object.freeze({score:score>=2?1:score<=-2?-1:0,
  status:score>=2?'favorevole':score<=-2?'sfavorevole':'neutrale'});
}
if(Object.keys(FLEET_ELEMENT_IDENTITIES).length!==17||
 Object.values(FLEET_ELEMENT_IDENTITIES).some(a=>a.length<1||a.length>2||
  new Set(a).size!==a.length||a.some(e=>!FLEET_ELEMENTS[e])))
 throw Error('Affinità elementali delle 17 navicelle incomplete');
