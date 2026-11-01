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
 N00:{plus:[.36,.37],minus:[.64,.37],times:[.28,.61],divide:[.72,.61]},
 C01:{plus:[.35,.41],minus:[.65,.41],times:[.26,.65],divide:[.74,.65]},
 C02:{plus:[.35,.38],minus:[.65,.38],times:[.26,.65],divide:[.74,.65]},
 C03:{plus:[.35,.40],minus:[.65,.40],times:[.26,.66],divide:[.74,.66]},
 C04:{plus:[.36,.42],minus:[.64,.42],times:[.27,.62],divide:[.73,.62]},
};
export function enginePoint(side,shipId,op){
 const point=SHIP_ENGINE_POINTS[shipId]?.[op] || ENGINE_POINTS.enemy[op];
 return side==='player'?[point[0],1-point[1]]:point;
}
export const GUN_POINTS={
 enemy:{1:[[.50,.77]],2:[[.30,.72],[.70,.72]],3:[[.32,.82],[.50,.89],[.68,.82]],4:[[.28,.86],[.43,.91],[.57,.91],[.72,.86]]},
 player:{1:[[.50,.23]],2:[[.30,.28],[.70,.28]],3:[[.32,.18],[.50,.11],[.68,.18]],4:[[.28,.14],[.43,.09],[.57,.09],[.72,.14]]}
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
