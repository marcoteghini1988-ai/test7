// Partiture sincronizzate: tre anelli / indicizzazione del singolo carrello.
export function precisionWeaponSoundPlan(type){
 const match=/^(cascade|shard)_(charge|fire|impact|transfer)_(rare|epic|legendary)$/.exec(type);
 if(!match)return null;
 const [,family,phase,rarity]=match,tier={rare:1,epic:2,legendary:3}[rarity];
 if(family==='cascade'&&tier<2||family==='shard'&&phase==='transfer')return null;
 const layers=[],tone=(wave,from,to,duration,gain,delay=0)=>layers.push({wave,from,to,duration,gain,delay});
 if(family==='cascade'){
  if(phase==='charge'){
   for(let i=0;i<3;i++)tone('triangle',160+i*71,740+i*180,.52,.029,i*.045);
   tone('noise',900,3200,.47,.028,.08);
  }else if(phase==='fire'){
   tone('triangle',820,115,.23,.12);tone('noise',5300,960,.18,.09);
   tone('sine',210,61,.31,.16);
  }else if(phase==='transfer'){
   tone('sine',360,1320,.13,.07);tone('noise',2300,5900,.10,.05);
   tone('triangle',950,340,.12,.05,.06);
  }else{
   tone('noise',5600,720,.23,.095);tone('sine',195,47,.32,.18);
   for(let i=0;i<3;i++)tone('triangle',1250+i*210,390+i*90,.27,.025,.025+i*.035);
  }
 }else if(phase==='charge'){
  // Un selettore e un carrello, non una raffica di cinque cassette.
  tone('noise',2800,1100,.045,.055);tone('triangle',180,330,.32,.048,.06);
  tone('noise',1400,600,.06,.025,.30);
  if(tier>=2)tone('sine',720,1090,.30,.025,.09);
 }else if(phase==='fire'){
  tone('noise',4900,720,.13,.095);tone('triangle',440,95,.21,.13);
  tone('sine',155,58,.24,.12);
  if(tier>=2)tone('triangle',1220,410,.19,.028,.045);
 }else{
  tone('noise',4300,950,.17,.095);tone('triangle',630,185,.26,.075);
  tone('sine',135,42,.29,.17);
  if(tier>=2)for(let i=0;i<2;i++)tone('sine',1160+i*350,490+i*180,.33,.023,.055+i*.04);
 }
 if(tier===3)for(let i=0;i<3;i++)tone('sine',1680+i*310,980+i*180,
  phase==='impact'?.52:.32,.018,.08+i*.045);
 return {family,phase,tier,layers};
}
