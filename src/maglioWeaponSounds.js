// Heavy piston / rotating gyro / pressure cavity / crystal implosion.
// One scored contact, no succession of fake gunshots as rarity rises.
export function maglioWeaponSoundPlan(type){
 const match=/^maglio_(charge|fire|impact)_(common|rare|epic|legendary)$/.exec(type);
 if(!match)return null;
 const [,phase,rarity]=match,tier=['common','rare','epic','legendary'].indexOf(rarity);
 const layers=[],tone=(wave,from,to,duration,gain,delay=0,extra={})=>
  layers.push({wave,from,to,duration,gain,delay,...extra});
 if(phase==='charge'){
  tone('sine',52,108,.40,.06,0,{attack:.12});
  tone('noise',240,880,.36,.036,.02,{attack:.17,q:1.6});
  if(tier>=1)tone('triangle',195,360,.34,.027,.05,{attack:.10});
  if(tier>=2)tone('sine',560,210,.30,.035,.10);
  if(tier===3)tone('sine',1240,760,.32,.021,.08);
 }else if(phase==='fire'){
  tone('noise',1250,180,.14,.105,0,{q:.9});
  tone('triangle',125,44,.25,.15);tone('sine',83,35,.31,.15);
  if(tier>=1)tone('triangle',440,165,.30,.042,.025);
  if(tier>=2)tone('noise',520,1900,.25,.04,.08,{q:2.2});
  if(tier===3)for(let i=0;i<3;i++)tone('sine',1010+i*370,420+i*130,.33,.021,.045+i*.032);
 }else{
  // A short vacuum crack precedes the heavy body by 32 ms, same contact.
  tone('noise',3900,750,.07,.11,0,{q:.8});
  tone('sine',108,31,.62,.22,.032);
  tone('triangle',148,48,.35,.12,.022);
  tone('noise',970,130,.48,.075,.05,{q:.7,attack:.03});
  if(tier>=1)tone('triangle',410,135,.34,.035,.07);
  if(tier>=2){tone('noise',310,1300,.20,.03,.11,{q:2.7});tone('sine',270,72,.45,.039,.07);}
  if(tier===3)for(let i=0;i<3;i++)tone('sine',1720+i*440,710+i*190,.62,.025,.08+i*.037);
 }
 return {family:'maglio',phase,tier,layers};
}
