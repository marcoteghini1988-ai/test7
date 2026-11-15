// I dodici trofei già esistenti usano le stesse regole semplici delle altre carte.
// Identità e vittorie di sblocco restano quelle della campagna ufficiale.
import {BOSS_CHARACTER_CATALOG} from '../bossCharacterCards.js';
import {describeEffect,validateEffectSpec} from './simpleEffects.js';

const effects={
 1:{type:'protect',target:'selected',amount:1,turns:1},
 2:{type:'power',amount:2},
 3:{type:'weaken',amount:2},
 6:{type:'counter',amount:1,turns:1},
 7:{type:'cleanse'},
 8:{type:'protect',target:'escort',amount:1,turns:1},
 9:{type:'pierce',amount:1},
 11:{type:'regenerate',trigger:'hurt',amount:1,turns:1},
 14:{type:'exchange',amount:1},
 17:{type:'repair',target:'escort',amount:1},
 19:{type:'power',amount:2},
 20:{type:'multishot',targets:2}
};

export const BOSS_CARDS=Object.freeze(Object.fromEntries(Object.values(BOSS_CHARACTER_CATALOG).map(legacy=>{
 const effectSpec=Object.freeze(effects[legacy.planetId]);
 const invalid=validateEffectSpec(effectSpec);
 if(invalid)throw new Error(legacy.id+': '+invalid);
 const def={id:legacy.id,nome:legacy.name,name:legacy.name,planetId:legacy.planetId,
  categoria:'Strategia',sottotipo:'Personaggio',kind:'character',rarita:'Boss',
  famiglia:'personaggio',pool:'boss',maxCopies:1,acquisition:'boss_victory',
  effectSpec,previousEffect:legacy.description};
 return [def.id,Object.freeze({...def,effetto:describeEffect(def)})];
})));
if(Object.keys(BOSS_CARDS).length!==12)throw new Error('Devono esistere dodici Personaggi Boss');

export const bossCard=id=>BOSS_CARDS[id]||null;
