// Ganasce: verricello, catena e chiusura. Collassatore: poli, tensione e urto.
// Induzione: tre piastre, scarica compressa e smontaggio reale della Difesa.
export function chainWeaponSoundPlan(type){
 const match=/^(grapple|collision|induction)_(charge|fire|impact|release|defense|block)_(rare|epic|legendary)$/.exec(type);
 if(!match)return null;
 const [,family,phase,rarity]=match,tier={rare:1,epic:2,legendary:3}[rarity];
 const layers=[],tone=(wave,from,to,duration,gain,delay=0)=>
  layers.push({wave,from,to,duration,gain,delay});
 if(family==='grapple'){
  if(phase==='charge'){
   tone('triangle',130,285,.42,.055);
   for(let i=0;i<3+tier;i++)tone('noise',1700+i*130,640,.045,.04,i*.065);
  }else if(phase==='fire'){
   tone('noise',3100,630,.23,.075);tone('triangle',380,130,.18,.09);
   for(let i=0;i<4;i++)tone('sine',780+i*170,420,.045,.032,.1+i*.13);
  }else if(phase==='impact'){
   tone('noise',4200,1300,.13,.10);tone('triangle',690,210,.24,.095);
   tone('sine',130,58,.17,.12);
   if(tier>=2)tone('sine',980,750,.27,.04,.10);
   if(tier===3)for(let i=0;i<3;i++)tone('sine',1470+i*290,1010+i*160,.37,.025,.13+i*.055);
  }else tone('noise',1250,400,.15,.04);
 }else if(family==='collision'){
  if(phase==='charge'||phase==='fire'){
   tone('sine',phase==='charge'?80:110,phase==='charge'?180:440,phase==='charge'?.43:.97,.08);
   tone('triangle',phase==='charge'?170:260,phase==='charge'?260:620,phase==='charge'?.42:.95,.035);
   for(let i=0;i<(phase==='fire'?6:3);i++)tone('noise',1800,450,.055,.035,i*(phase==='fire'?.16:.13));
   // Risucchio finale: la trazione accelera e si interrompe sul BOOM a 1 s.
   if(phase==='fire')tone('noise',700,5100,.32,.075,.65);
   if(tier===3)tone('sine',660,990,phase==='charge'?.42:.95,.025);
  }else if(phase==='impact'){
   // Attacco secco, corpo del BOOM udibile anche dagli altoparlanti del
   // telefono, subgrave e coda di detriti; stesso bus/limiter e singolo urto.
   tone('noise',5900,850,.10,.14);
   tone('triangle',165,48,.44,.19);
   tone('sine',128,34,.78,.27);
   tone('sine',76,29,.95,.12,.035);
   tone('noise',2500,190,.82,.115,.025);
   for(let i=0;i<7;i++)tone('noise',2600+i*370,650,.10,.026,.15+i*.055);
   if(tier===3)for(let i=0;i<4;i++)tone('sine',1260+i*250,650+i*160,.7,.034,.07+i*.055);
  }else if(phase==='release'){
   tone('sine',310,85,.8,.07);tone('noise',900,200,.6,.04);
  }
 }else if(phase==='charge'){
  for(let i=0;i<3;i++)tone('triangle',150+i*65,650+i*170,.57,.032,i*.06);
 }else if(phase==='fire'){
  tone('noise',5200,1900,.14,.09);tone('sine',960,160,.27,.13);
 }else if(phase==='block'){
  tone('sine',680,270,.24,.11);tone('noise',2100,900,.14,.045);
 }else if(phase==='impact'){
  tone('sine',180,42,.28,.17);tone('noise',3800,520,.26,.09);
  for(let i=0;i<3;i++)tone('triangle',930+i*180,330+i*100,.23,.035,i*.04);
  if(tier===3)for(let i=0;i<3;i++)tone('sine',1610+i*340,830+i*180,.51,.024,.07+i*.05);
 }else if(phase==='defense'){
  for(let i=0;i<5;i++)tone('noise',2400+i*460,700,.15,.045,i*.045);
  tone('sine',1210,380,.43,.06);
 }
 // Rarità: risonanze fisiche aggiuntive, senza nuovi proiettili o danni.
 if(tier>=2&&family==='grapple'&&phase!=='impact')tone('sine',1120,740,.25,.022,.1);
 if(tier===3&&phase!=='impact')tone('sine',1870,1240,.4,.019,.16);
 return layers.length?{family,phase,tier,layers}:null;
}
