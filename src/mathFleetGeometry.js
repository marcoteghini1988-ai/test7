// Coordinate normalized to each ship's sprite. The playable board is 450 × 800.
// No fixed screen pixels: this also supports dynamically resized mobile displays.
export const BOARD_SIZE={width:450,height:800};
export const ENGINE_POINTS={
 enemy:{plus:[.32,.30],minus:[.68,.30],times:[.24,.61],divide:[.76,.61]},
 player:{plus:[.32,.70],minus:[.68,.70],times:[.24,.39],divide:[.76,.39]}
};
// Calibrated from each of the five transparent 2D ship illustrations.
// Some ships have wider wings or more central engine nacelles; four generic
// percentages would place a target outside the visible hull.
export const SHIP_ENGINE_POINTS={
 N00:{plus:[.37,.33],minus:[.63,.33],times:[.29,.58],divide:[.71,.58]},
 C01:{plus:[.35,.36],minus:[.65,.36],times:[.27,.61],divide:[.73,.61]},
 C02:{plus:[.36,.34],minus:[.64,.34],times:[.27,.60],divide:[.73,.60]},
 C03:{plus:[.35,.35],minus:[.65,.35],times:[.28,.59],divide:[.72,.59]},
 C04:{plus:[.36,.35],minus:[.64,.35],times:[.29,.59],divide:[.71,.59]},
};
export function enginePoint(side,shipId,op){
 const point=SHIP_ENGINE_POINTS[shipId]?.[op] || ENGINE_POINTS.enemy[op];
 return side==='player'?[point[0],1-point[1]]:point;
}
export const GUN_POINTS={
 enemy:{1:[[.50,.66]],2:[[.35,.62],[.65,.62]],3:[[.33,.72],[.50,.80],[.67,.72]],4:[[.30,.78],[.43,.84],[.57,.84],[.70,.78]]},
 player:{1:[[.50,.34]],2:[[.35,.38],[.65,.38]],3:[[.33,.28],[.50,.20],[.67,.28]],4:[[.30,.22],[.43,.16],[.57,.16],[.70,.22]]}
};
export function gunPoint(side,count,index){return (GUN_POINTS[side]?.[count]||GUN_POINTS[side]?.[4]||[])[index]||[.5,.5];}
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
