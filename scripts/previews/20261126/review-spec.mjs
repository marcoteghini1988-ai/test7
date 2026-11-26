// Candidati isolati: nessuna importazione dal gioco e nessun asset sovrascritto.
export const SOURCE_COMMIT='4d4e10f16a2dbd2dd7cb2a22997f420fdb3bd64c';
export const REVIEW_STATUS='in attesa di conferma visiva di carte ed effetti';
export const FAMILIES=[
 ['weapon-confirmed-metallic-maglio','Maglio Ferrogravitazionale','gravity-maul','maglio',[2,3,5,7]],
 ['weapon-confirmed-metallic-slitta',"Cannone a Slitta d’Acciaio",'steel-rail','slitta',[1,1,1,1]],
 ['weapon-designed-metallic-recuperatore-termobalistico','Artiglieria Termobalistica di Recupero','thermal-reclaimer','termobalistica',[0,0,3,3]],
 ['weapon-designed-metallic-ganasce-magnetiche','Ganascia A · nome di lavoro','magnetic-grapple','ganascia-a',[0,1,1,1]],
 ['weapon-designed-metallic-collassatore-lega','Ganascia B · nome di lavoro','alloy-collision','ganascia-b',[0,0,1,1]],
 ['weapon-designed-metallic-frantumatore-induzione','Frantumatore a Induzione','induction','induzione',[0,0,3,6]],
 ['weapon-designed-metallic-perforatore-cascata','Perforatore a Cascata','cascade-piercer','cascata',[0,0,1,3]],
 ['weapon-designed-metallic-artiglieria-schegge','Artiglieria delle Schegge Erranti','wandering-shrapnel','schegge',[0,3,6,9]],
 ['weapon-base-ionic-01','Cannone a Pettine Ionico di Vega','ionic-comb','pettine',[1,1,1,1]],
 ['weapon-base-ionic-02','Lanciadardi a Spirale di Tesla','ionic-dart','tesla',[1,1,1,1]],
 ['weapon-base-ionic-03','Sferzatore Ionico di Rame Lunare','ionic-whip','sferzatore',[1,1,1,1]],
 ['weapon-base-ionic-04','Cannone del Lampo Bianco','ionic-flash','lampo',[0,1,1,1]]
].map(([id,name,kind,key,counts])=>Object.freeze({id,name,kind,key,counts}));
export const RARITIES=['Comune','Rara','Epica','Leggendaria'];
export const SLUGS=['comune','rara','epica','leggendaria'];
export const familyFor=id=>FAMILIES.find(f=>id===f.id||id.startsWith(f.id+'-rarity-'));
export const OPEN_PARAMETERS=Object.freeze({
 jaws:['nomi definitivi e distribuzione rarità','danno dello strappo al terzo turno','durata autonoma di B','finestra della combo e stato dei ganci dopo lo schianto','danno finale combo'],
 induction:['valore e limite del bonus senza Difese'],
 unresolvedIonic:['nove nomi pronunciati non corrispondono alle sei famiglie Fulmine rimanenti nel catalogo: non assegnare meccaniche inventate']
});
export function reviewOrigin(shot,index=shot.salvoIndex||0){
 let seed=2166136261;for(const c of shot.cardId+':'+(shot.ply||0))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const x=26+((seed+index*163)%398);
 return {x:shot.who==='B'?450-x:x,y:shot.who==='B'?-12:812,edge:shot.who==='B'?'top-opponent':'bottom-player'};
}
