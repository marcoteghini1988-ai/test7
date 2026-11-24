import {engineSurface} from './mathFleetGeometry.js';

// Colori dei reattori delle scocche approvate, non colori della squadra.
const COLORS=Object.freeze({N00:'#32cfff',C01:'#ff3154',C02:'#20bfff',C03:'#45f52d',
 R01:'#43d7ff',R02:'#3cf5ce',R04:'#45efc5',E01:'#55efd4',E02:'#46f7c6',
 L01:'#ff4f79',L03:'#ffb327',L04:'#4ef5da',C04:'#d94dff',E03:'#ffc03c',L02:'#b987ff'});
// Le tre scocche esclusive dei supporti non hanno punti nel vecchio catalogo
// dei motori. N00/C01/C02 avversari mostrano l'ugello dietro il centro vitale.
const PORTS=Object.freeze({
 N00:{enemy:[[.37,.275],[.63,.275]]},
 C01:{enemy:[[.35,.30],[.65,.30]]},
 C02:{enemy:[[.35,.275],[.64,.275]]},
 C04:{player:[[.445,.76],[.555,.76]],enemy:[[.38,.34],[.60,.34]]},
 E03:{player:[[.36,.75],[.64,.75]],enemy:[[.39,.24],[.64,.24]]},
 L02:{player:[[.33,.77],[.67,.77]],enemy:[[.38,.23],[.65,.23]]}
});
export function shipFlightProfile(shipId,side){
 const color=COLORS[shipId];if(!color||!['player','enemy'].includes(side))return null;
 const direction=side==='player'?1:-1;
 const ports=['plus','minus'].map((op,index)=>{
  const surface=engineSurface(side,shipId,op);
  const [x,y]=PORTS[shipId]?.[side]?.[index]||[
   surface.point[0],surface.point[1]+direction*surface.radius[1]*.75];
  const end=PORTS[shipId]?.[side]?side==='player'?.95:.075:surface.exhaustY;
  return {x,y,direction,width:shipId==='C04'?.043:.061,
   length:Math.max(.10,Math.min(.29,Math.abs(end-y)))};
 });
 return {shipId,side,color,ports};
}
