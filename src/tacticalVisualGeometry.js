// Coordinate degli spari allineate alle vere bocche da fuoco catalogate.
// Le rettangolari sono percentuali del playback 0..100, calcolate dal DOM.
// Non fanno parte della simulazione né modificano danni o durata del colpo.
import {weaponMount} from './mathFleetGeometry.js';
const validBox=b=>b&&[b.left,b.top,b.width,b.height].every(Number.isFinite)&&b.width>0&&b.height>0;
const opposite=x=>x==='A'?'B':'A';
export function tacticalWeaponTrajectory(shot,sideShips,boxes){
 const src=boxes?.[shot?.by],dst=boxes?.[opposite(shot?.by)];
 if(!validBox(src)||!validBox(dst))return null;
 const shipId=sideShips?.[shot.by];
 const mount=weaponMount(shot.by==='A'?'player':'enemy',shipId,shot.weaponId,shot.muzzleIndex??0);
 const point=mount?.point??[.5,.5];
 // Enemy barrier centre is the centre of the actual target hull, not an abstract lane.
 return {
  start:{x:src.left+src.width*point[0],y:src.top+src.height*point[1]},
  end:{x:dst.left+dst.width*.5,y:dst.top+dst.height*.5},
  mounted:!!mount,weaponId:shot.weaponId,shipId
 };
}
