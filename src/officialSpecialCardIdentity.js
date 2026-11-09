// Identita' visiva delle carte pescate dal mazzo ufficiale: SOLO testo/icone.
// Il profilo non crea carte, non modifica costi, effetti, turni o inventario.
const FAMILY_LABELS=Object.freeze({
 offense:'ATTACCO',defense:'DIFESA',support:'SUPPORTO',fusion:'FUSIONE',
 reaction:'REAZIONE',intel:'SCANSIONE',control:'CONTROLLO',
 quantum:'DADO',sabotage:'MALUS',transmute:'DORATA',
 rift:'FAGLIA',mutation:'MUTAZIONE',volley:'RAFFICA',
 equipment:'MODULO',epic:'EPICO','boss-character':'PERSONAGGIO',
 terrain:'TERRENO'
});
const FAMILY_SYMBOLS=Object.freeze({
 offense:'⚡',defense:'⬡',support:'✚',fusion:'✧',
 reaction:'⛨',intel:'◎',control:'⌁',
 quantum:'⚄',sabotage:'✹',transmute:'★',
 rift:'◇',mutation:'⌘',volley:'➤',
 equipment:'⚙',epic:'◆','boss-character':'♛',
 terrain:'◈'
});
// Sintesi fedele delle carte ufficiali di base, visibile nel fronte della carta.
// Il testo completo resta quello del motore TACTICAL_SPECIALS[type].help.
const CARD_ICONS=Object.freeze({
 'tactic-power-shift':['⚡','+6 BARRIERA'],
 'tactic-scan':['◎','2 FIRME'],
 'tactic-suppress':['⊘','STOP SCORTA'],
 'fusion-barrier':['⛨','SCUDO SCORTA'],
 'tactic-counter':['⛉','BLOCCA VITALE'],
 'tactic-reactive':['▣','ASSORBE 9 HP'],
 'tactic-kinetic':['✦','+6 BARRIERA'],
 'tactic-impact':['⬡','RIDUCE 20%'],
 'support-shield-repair':['✚','RIPARA 20 HP'],
 'shot-piercing':['➶','PERFORA 20%'],
 'shot-ion':['ϟ','INTERCETT. ↓'],
 'tactic-numeric-recycle':['↻','RICAMBIA 2'],
 'tactic-quantum-dice':['⚄','3 FORMULE'],
 'tactic-bomb':['✹','BOMBA SLOT'],
 'tactic-malus':['⌁','3 COLPI'],
 'tactic-golden':['★','BONUS SEME'],
 'tactic-vulnerability-rift':['◇','VITALE DIRETTO'],
 'tactic-signature-mutation':['⌘','CAMBIA FIRMA'],
 'fusion-strike':['⚔','ATTACCO +25%'],
 'fusion-twin':['◈','SCORTE 55%'],
 'fusion-triad':['✺','SCORTE +35%'],
 'tactical-cover':['⛨','COPERTURA 75%'],
 'shot-corrosion':['☣','PROSSIMO +25%'],
 'support-status-purge':['✚','RIMUOVE STATI'],
 'support-escort-repair':['✚','CURA SCORTA']
});

export function officialSpecialCardIdentity(type,definition){
 if(!type||!definition){
  return Object.freeze({category:'VUOTA',symbol:'✧',effect:'',name:'SLOT VUOTO'});
 }
 const kind=definition.kind||'special';
 const known=CARD_ICONS[type];
 const name=String(definition.name||'CARTA SPECIALE');
 const full=String(definition.help||'');
 const derived=full.split(/[.;]/,1)[0].trim().slice(0,21).toUpperCase();
 return Object.freeze({
  category:FAMILY_LABELS[kind]||'SPECIALE',
  symbol:known?.[0]||FAMILY_SYMBOLS[kind]||'✦',
  effect:known?.[1]||derived||'CARTA SPECIALE',
  name
 });
}
