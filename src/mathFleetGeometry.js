// Coordinate normalized to each ship's sprite. The playable board is 450 × 800.
// No fixed screen pixels: this also supports dynamically resized mobile displays.
export const BOARD_SIZE={width:450,height:800};
// Each side keeps fixed slots. Selecting a vessel never changes its size or row.
export function fleetFormation(count,side){
 if(!Number.isInteger(count)||count<1||count>3)throw new RangeError('Fleet must contain 1–3 vessels');
 const size=[0,218,184,124][count],gap=count===2?24:18;
 const span=count*size+(count-1)*gap,start=(BOARD_SIZE.width-span)/2;
 return {size,top:(side==='player'?117:103)-size/2,
  centers:Array.from({length:count},(_,i)=>start+size/2+i*(size+gap)),
  hudWidth:[0,54,44,32][count],engineSize:[0,40,34,24][count]};
}
// Separate close readouts with the smallest symmetric offset from their motors.
export function engineHudShift(side,shipId,op,size,hudWidth){
 const pair=op==='plus'||op==='minus'?['plus','minus']:['times','divide'];
 const [left,right]=pair.map(key=>enginePoint(side,shipId,key)[0]*size);
 const shift=Math.max(0,(hudWidth+6-(right-left))/2);
 return op===pair[0]?-shift:shift;
}
export const ENGINE_POINTS={
 enemy:{plus:[.32,.30],minus:[.68,.30],times:[.24,.61],divide:[.76,.61]},
 player:{plus:[.32,.70],minus:[.68,.70],times:[.24,.39],divide:[.76,.39]}
};
// Calibrated from each of the five transparent 2D ship illustrations.
// Some ships have wider wings or more central engine nacelles; four generic
// percentages would place a target outside the visible hull.
export const SHIP_ENGINE_POINTS={
 N00:{plus:[.35,.43],minus:[.64,.43],times:[.29,.64],divide:[.71,.64]},
 C01:{plus:[.35,.37],minus:[.65,.37],times:[.27,.71],divide:[.73,.71]},
 C02:{plus:[.35,.33],minus:[.64,.33],times:[.30,.66],divide:[.70,.66]},
 C03:{plus:[.35,.37],minus:[.65,.37],times:[.28,.75],divide:[.72,.75]},
 C04:{plus:[.38,.37],minus:[.62,.37],times:[.25,.57],divide:[.75,.57]},
};
// The complete sprites use two different camera views, not a CSS flip.
// Engine centers therefore follow each PNG rather than mirroring a rectangle.
export const SHIP_PLAYER_ENGINE_POINTS={
 N00:{plus:[.35,.59],minus:[.64,.59],times:[.29,.38],divide:[.71,.38]},
 C01:{plus:[.34,.70],minus:[.66,.70],times:[.27,.34],divide:[.73,.34]},
 C02:{plus:[.32,.68],minus:[.68,.68],times:[.32,.34],divide:[.68,.34]},
 C03:{plus:[.31,.64],minus:[.69,.64],times:[.31,.27],divide:[.69,.27]},
 C04:{plus:[.445,.71],minus:[.555,.71],times:[.27,.49],divide:[.73,.49]},
};
export function enginePoint(side,shipId,op){
 if(side==='player'&&SHIP_PLAYER_ENGINE_POINTS[shipId]?.[op])return SHIP_PLAYER_ENGINE_POINTS[shipId][op];
 const point=SHIP_ENGINE_POINTS[shipId]?.[op] || ENGINE_POINTS.enemy[op];
 return side==='player'?[point[0],1-point[1]]:point;
}
export const GUN_POINTS={
 enemy:{1:[[.50,.66]],2:[[.35,.62],[.65,.62]],3:[[.33,.72],[.50,.80],[.67,.72]],4:[[.30,.78],[.43,.84],[.57,.84],[.70,.78]]},
 player:{1:[[.50,.34]],2:[[.35,.38],[.65,.38]],3:[[.33,.28],[.50,.20],[.67,.28]],4:[[.30,.22],[.43,.16],[.57,.16],[.70,.22]]}
};
// Physical muzzle locations in each illustration. Ship weapon counts and
// firing rules remain in the fleet catalog; these only anchor the visuals.
export const SHIP_GUN_POINTS={
 N00:{enemy:[[.495,.81]],player:[[.495,.125]]},
 C01:{enemy:[[.495,.87]],player:[[.495,.10]]},
 C02:{enemy:[[.495,.87]],player:[[.495,.10]]},
 C03:{enemy:[[.28,.73],[.72,.73]],player:[[.30,.24],[.70,.24]]},
 C04:{enemy:[[.24,.65],[.75,.65]],player:[[.27,.27],[.73,.27]]},
};
export function gunPoint(side,count,index,shipId){
 const mounts=SHIP_GUN_POINTS[shipId]?.[side];
 if(mounts?.length===count&&mounts[index])return mounts[index];
 return (GUN_POINTS[side]?.[count]||GUN_POINTS[side]?.[4]||[])[index]||[.5,.5];
}
export function boardPoint(rootBox,objectBox){
 if(!rootBox||!objectBox||rootBox.width<=0||rootBox.height<=0)return null;
 const scaleX=rootBox.width/BOARD_SIZE.width,scaleY=rootBox.height/BOARD_SIZE.height;
 return [(objectBox.left-rootBox.left+objectBox.width/2)/scaleX,
  (objectBox.top-rootBox.top+objectBox.height/2)/scaleY];
}
export function sourceToTarget(rootBox,sourceBox,targetBox){
 const start=boardPoint(rootBox,sourceBox),end=boardPoint(rootBox,targetBox);
 if(!start||!end)return null;
 return {x:start[0],y:start[1],dx:end[0]-start[0],dy:end[1]-start[1],angle:Math.atan2(end[1]-start[1],end[0]-start[0])*180/Math.PI};
}

// The final bullet must reach the real motor before its impact animation begins.
// CSS bulletTravel duration: 640ms; per-weapon stagger: 60ms; the last
// round in a multi-projectile volley leaves 250ms after the first.
export function volleyTimeline(volleys){
 const shots=(volleys||[]).filter(s=>Number(s?.bullets)>0);
 if(!shots.length)return {arrivalMs:0,settleMs:550};
 const arrivals=shots.map((shot,i)=>640+i*60+(Number(shot.bullets)>1?250:0));
 const arrivalMs=Math.ceil(Math.max(...arrivals));
 return {arrivalMs,settleMs:arrivalMs+650};
}
