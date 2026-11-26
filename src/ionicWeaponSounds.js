// Partiture proposte Fulmine; il file video lascia al lettore i controlli audio.
export function ionicSoundPlan(kind,phase,tier=0){
 const loud=1+tier*.035,tones=[],add=(wave,from,to,duration,gain,delay=0)=>tones.push({wave,from,to,duration,gain:gain*loud,delay});
 if(phase==='charge'){add('sine',170,410,.18,.035);return tones;}
 if(phase==='impact'){
  add('noise',kind==='ionic-flash'?9200:6500,900,kind==='ionic-flash'?.055:.10,.11);
  add('triangle',kind==='ionic-dart'?1460:950,230,.08,.05);
  if(kind==='ionic-comb')for(let i=0;i<4;i++)add('noise',3900,1700,.025,.018,.018*i);
  if(kind==='ionic-whip')add('sine',2200,430,.045,.035);
  return tones;
 }
 if(kind==='ionic-comb'){
  for(let i=0;i<5;i++)add('triangle',370+i*100,620+i*95,.10,.011,i*.014);
  add('noise',2900,5400,.55,.022,.12);add('sine',230,540,.50,.022,.06);
 }else if(kind==='ionic-dart'){
  add('sine',610,1870,1.08,.038);add('triangle',910,2180,.97,.014,.05);add('noise',4200,1100,.98,.015,.07);
 }else if(kind==='ionic-whip'){
  add('noise',750,5900,.84,.031);add('sine',330,1390,.80,.019);add('triangle',1200,700,.18,.016,.64);
 }else{add('triangle',620,2100,.14,.035);add('noise',6600,1800,.075,.055,.08);}
 return tones;
}

export function ionicWeaponSoundPlan(type){
 const m=/^(ionic-comb|ionic-dart|ionic-whip|ionic-flash)_(charge|fire|impact|block)_(common|rare|epic|legendary)$/.exec(type);if(!m)return null;
 const [,family,phase,rarity]=m,tier=['common','rare','epic','legendary'].indexOf(rarity);
 const layers=phase==='block'?[{wave:'noise',from:3000,to:800,duration:.075,gain:.06,delay:0}]:ionicSoundPlan(family,phase,tier).map(l=>({...l,gain:l.gain*4}));
 return {family,phase,tier,layers};
}
