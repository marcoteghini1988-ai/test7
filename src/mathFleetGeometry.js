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
 if(op==='times'&&['C03','C04','R01','R02','R03','R04'].includes(shipId))return 0;
 const pair=op==='plus'||op==='minus'?['plus','minus']:['times','divide'];
 const [left,right]=pair.map(key=>enginePoint(side,shipId,key)[0]*size);
 const shift=Math.max(0,(hudWidth+6-(right-left))/2);
 return op===pair[0]?-shift:shift;
}
export function engineHudPlacement(side,shipId,op){
 const auxiliary=/^[REL]/.test(shipId)&&(op==='times'||op==='divide');
 return (side==='enemy')!==auxiliary?'above':'below';
}
export const ENGINE_POINTS={
 enemy:{plus:[.32,.30],minus:[.68,.30],times:[.24,.61],divide:[.76,.61]},
 player:{plus:[.32,.70],minus:[.68,.70],times:[.24,.39],divide:[.76,.39]}
};
// Calibrated from the transparent hull sprites.
// Some ships have wider wings or more central engine nacelles; four generic
// percentages would place a target outside the visible hull.
export const SHIP_ENGINE_POINTS={
 N00:{plus:[.35,.43],minus:[.64,.43],times:[.29,.64],divide:[.71,.64]},
 C01:{plus:[.35,.37],minus:[.65,.37],times:[.27,.71],divide:[.73,.71]},
 C02:{plus:[.35,.33],minus:[.64,.33],times:[.30,.66],divide:[.70,.66]},
 C03:{plus:[.35,.37],minus:[.65,.37],times:[.50,.76],divide:[.72,.75]},
 C04:{plus:[.38,.37],minus:[.62,.37],times:[.50,.59],divide:[.75,.57]},
 R01:{plus:[.38,.28],minus:[.63,.28],times:[.50,.32],divide:[.73,.56]},
 R02:{plus:[.39,.29],minus:[.64,.29],times:[.50,.37],divide:[.73,.56]},
 R03:{plus:[.39,.27],minus:[.63,.27],times:[.50,.31],divide:[.73,.56]},
 R04:{plus:[.36,.28],minus:[.65,.28],times:[.50,.36],divide:[.73,.56]},
 E01:{plus:[.375,.275],minus:[.625,.275],times:[.391,.413],divide:[.612,.413]},
 E02:{plus:[.374,.271],minus:[.626,.271],times:[.419,.388],divide:[.589,.388]},
 E03:{plus:[.380,.256],minus:[.644,.255],times:[.422,.361],divide:[.603,.361]},
 E04:{plus:[.360,.241],minus:[.652,.241],times:[.364,.393],divide:[.646,.393]},
 L01:{plus:[.377,.231],minus:[.632,.232],times:[.368,.395],divide:[.639,.395]},
 L02:{plus:[.375,.236],minus:[.627,.236],times:[.382,.397],divide:[.617,.397]},
 L03:{plus:[.372,.221],minus:[.625,.221],times:[.366,.407],divide:[.635,.407]},
 L04:{plus:[.373,.233],minus:[.636,.233],times:[.377,.394],divide:[.637,.394]},
};
// The complete sprites use two different camera views, not a CSS flip.
// Engine centers follow the artwork in each view.
export const SHIP_PLAYER_ENGINE_POINTS={
 N00:{plus:[.35,.59],minus:[.64,.59],times:[.29,.38],divide:[.71,.38]},
 C01:{plus:[.34,.70],minus:[.66,.70],times:[.27,.34],divide:[.73,.34]},
 C02:{plus:[.32,.68],minus:[.68,.68],times:[.32,.34],divide:[.68,.34]},
 C03:{plus:[.31,.64],minus:[.69,.64],times:[.50,.27],divide:[.69,.27]},
 C04:{plus:[.445,.71],minus:[.555,.71],times:[.50,.47],divide:[.73,.49]},
 R01:{plus:[.37,.72],minus:[.63,.72],times:[.50,.49],divide:[.73,.44]},
 R02:{plus:[.39,.70],minus:[.63,.70],times:[.50,.53],divide:[.73,.44]},
 R03:{plus:[.35,.73],minus:[.65,.73],times:[.50,.52],divide:[.73,.44]},
 R04:{plus:[.35,.74],minus:[.66,.74],times:[.50,.51],divide:[.73,.44]},
 E01:{plus:[.356,.722],minus:[.655,.722],times:[.401,.452],divide:[.610,.452]},
 E02:{plus:[.353,.722],minus:[.652,.722],times:[.428,.441],divide:[.582,.441]},
 E03:{plus:[.351,.732],minus:[.652,.732],times:[.426,.435],divide:[.585,.435]},
 E04:{plus:[.337,.731],minus:[.670,.731],times:[.387,.388],divide:[.617,.388]},
 L01:{plus:[.342,.751],minus:[.655,.753],times:[.374,.390],divide:[.627,.390]},
 L02:{plus:[.334,.747],minus:[.672,.747],times:[.405,.431],divide:[.602,.431]},
 L03:{plus:[.335,.795],minus:[.663,.795],times:[.391,.390],divide:[.617,.390]},
 L04:{plus:[.360,.771],minus:[.636,.771],times:[.397,.396],divide:[.608,.396]},
};
export function enginePoint(side,shipId,op){
 if(side==='player'&&SHIP_PLAYER_ENGINE_POINTS[shipId]?.[op])return SHIP_PLAYER_ENGINE_POINTS[shipId][op];
 const point=SHIP_ENGINE_POINTS[shipId]?.[op] || ENGINE_POINTS.enemy[op];
 return side==='player'?[point[0],1-point[1]]:point;
}
export function engineVisualState(engine){
 const ratio=engine.max>0?engine.hp/engine.max:0;
 return engine.hp<=0?'destroyed':ratio<=.3?'critical':ratio<=.65?'damaged':'intact';
}
// Damage follows the painted nacelle and its own exhaust, never a neighboring gun.
export function engineSurface(side,shipId,op){
 const primary=op==='plus'||op==='minus',narrow=shipId==='C04'&&side==='player';
 const radius=!primary?[.045,.045]:narrow?[.033,.045]:shipId.startsWith('R')?[.065,.068]:shipId==='C02'?[.055,.067]:[.067,.075];
 return {point:enginePoint(side,shipId,op),radius,
  exhaustY:primary?(side==='player'?{N00:.91,C01:.91,C02:.91,C03:.88,C04:.93,R01:.94,R02:.94,R03:.94,R04:.94,E01:.93,E02:.97,E03:.97,E04:.96,L01:.97,L02:.99,L03:.97,L04:.99}[shipId]:{E02:.025,E03:.04,E04:.045,L01:.025,L02:.01,L03:.04,L04:.01}[shipId]??.075):null};
}
export const GUN_POINTS={
 enemy:{1:[[.50,.66]],2:[[.35,.62],[.65,.62]],3:[[.33,.72],[.50,.80],[.67,.72]],4:[[.30,.78],[.43,.84],[.57,.84],[.70,.78]]},
 player:{1:[[.50,.34]],2:[[.35,.38],[.65,.38]],3:[[.33,.28],[.50,.20],[.67,.28]],4:[[.30,.22],[.43,.16],[.57,.16],[.70,.22]]}
};
// Physical muzzle locations in each illustration. Ship weapon counts and
// firing rules remain in the fleet catalog; these only anchor the visuals.
export const WEAPON_MOUNTS={
 W01:{shipId:'N00',profile:'adaptive',width:.075,length:.09,enemy:[.495,.81],player:[.495,.125]},
 W02:{shipId:'C01',profile:'laser',width:.07,length:.105,enemy:[.50,.84],player:[.50,.13]},
 W03:{shipId:'C02',profile:'prism',width:.105,length:.14,enemy:[.50,.80],player:[.50,.17]},
 W04:{shipId:'C03',profile:'gatling',width:.11,length:.14,enemy:[.29,.73],player:[.31,.245]},
 W05:{shipId:'C03',profile:'arc',width:.105,length:.14,enemy:[.72,.73],player:[.69,.245]},
 W06:{shipId:'C04',profile:'needles',width:.11,length:.14,enemy:[.27,.67],player:[.30,.28]},
 W07:{shipId:'C04',profile:'drum',width:.11,length:.14,enemy:[.73,.67],player:[.70,.28]},
 W08:{shipId:'R01',profile:'twin',width:.075,length:.12,enemy:[.335,.59],player:[.34,.31],second:{enemy:[.665,.59],player:[.66,.31]}},
 W09:{shipId:'R01',profile:'crystal',width:.085,length:.18,enemy:[.50,.70],player:[.50,.23]},
 W10:{shipId:'R02',profile:'coil',width:.11,length:.14,enemy:[.67,.56],player:[.35,.33]},
 W11:{shipId:'R02',profile:'cross',width:.13,length:.15,enemy:[.33,.58],player:[.68,.34]},
 W12:{shipId:'R03',profile:'photon',width:.085,length:.12,enemy:[.31,.60],player:[.33,.38]},
 W13:{shipId:'R03',profile:'facet',width:.085,length:.16,enemy:[.50,.87],player:[.50,.18]},
 W14:{shipId:'R03',profile:'plasma',width:.12,length:.14,enemy:[.70,.58],player:[.67,.38]},
 W15:{shipId:'R04',profile:'harpoon',width:.095,length:.19,enemy:[.33,.65],player:[.36,.31]},
 W16:{shipId:'R04',profile:'compressor',width:.13,length:.15,enemy:[.68,.53],player:[.69,.38]},
 W17:{shipId:'E01',profile:'drum',width:.080,length:.105,enemy:[.207,.488],player:[.203,.462]},
 W18:{shipId:'E01',profile:'prism',width:.075,length:.125,enemy:[.503,.829],player:[.503,.15]},
 W19:{shipId:'E01',profile:'coil',width:.083,length:.112,enemy:[.798,.487],player:[.804,.462]},
 W20:{shipId:'E02',profile:'arc',width:.076,length:.108,enemy:[.331,.562],player:[.332,.358]},
 W21:{shipId:'E02',profile:'gatling',width:.077,length:.105,enemy:[.674,.562],player:[.675,.358]},
 W22:{shipId:'E02',profile:'laser',width:.062,length:.094,enemy:[.500,.799],player:[.502,.126]},
 W23:{shipId:'E03',profile:'arc',width:.074,length:.121,enemy:[.277,.519],player:[.309,.349]},
 W24:{shipId:'E03',profile:'compressor',width:.071,length:.109,enemy:[.511,.790],player:[.502,.114]},
 W25:{shipId:'E03',profile:'cross',width:.079,length:.124,enemy:[.741,.519],player:[.697,.349]},
 W26:{shipId:'E04',profile:'gatling',width:.068,length:.085,enemy:[.148,.473],player:[.176,.483]},
 W27:{shipId:'E04',profile:'crystal',width:.071,length:.092,enemy:[.273,.543],player:[.289,.512]},
 W28:{shipId:'E04',profile:'needles',width:.067,length:.089,enemy:[.732,.542],player:[.707,.514]},
 W29:{shipId:'E04',profile:'harpoon',width:.064,length:.091,enemy:[.856,.473],player:[.826,.483]},
 W30:{shipId:'L01',profile:'photon',width:.071,length:.097,enemy:[.196,.448],player:[.181,.484]},
 W31:{shipId:'L01',profile:'crystal',width:.075,length:.108,enemy:[.312,.560],player:[.284,.516]},
 W32:{shipId:'L01',profile:'coil',width:.075,length:.105,enemy:[.696,.560],player:[.715,.520]},
 W33:{shipId:'L01',profile:'eclipse-core',width:.080,length:.104,enemy:[.813,.449],player:[.805,.483]},
 W34:{shipId:'L02',profile:'arc',width:.076,length:.112,enemy:[.245,.361],player:[.239,.494]},
 W35:{shipId:'L02',profile:'compressor',width:.083,length:.114,enemy:[.609,.596],player:[.501,.526]},
 W36:{shipId:'L02',profile:'twin',width:.073,length:.110,enemy:[.752,.361],player:[.760,.496]},
 W37:{shipId:'L03',profile:'drum',width:.096,length:.122,enemy:[.309,.645],player:[.340,.170]},
 W38:{shipId:'L03',profile:'plasma',width:.096,length:.122,enemy:[.697,.645],player:[.655,.170]},
 W39:{shipId:'L04',profile:'photon',width:.066,length:.094,enemy:[.162,.476],player:[.184,.486]},
 W40:{shipId:'L04',profile:'facet',width:.068,length:.102,enemy:[.285,.542],player:[.305,.534]},
 W41:{shipId:'L04',profile:'compressor',width:.075,length:.098,enemy:[.727,.540],player:[.692,.534]},
 W42:{shipId:'L04',profile:'void-core',width:.078,length:.106,enemy:[.851,.475],player:[.810,.487]},
};
export function weaponMuzzleCount(weaponId){return WEAPON_MOUNTS[weaponId]?.second?2:1;}
export function weaponMount(side,shipId,weaponId,muzzleIndex=0){
 const mount=WEAPON_MOUNTS[weaponId];
 const point=muzzleIndex===0?mount?.[side]:muzzleIndex===1?mount?.second?.[side]:null;
 return mount?.shipId===shipId&&point?{...mount,point}:null;
}
export const SHIP_GUN_POINTS=Object.fromEntries(Object.keys(SHIP_ENGINE_POINTS).map(id=>[id,
 Object.fromEntries(['enemy','player'].map(side=>[side,Object.values(WEAPON_MOUNTS).filter(m=>m.shipId===id).map(m=>m[side])]))]));
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
