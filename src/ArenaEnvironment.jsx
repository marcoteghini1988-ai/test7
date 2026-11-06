// Effetti atmosferici puramente decorativi; nessuna collisione o interazione.
import React from 'react';
import {arenaEnvironment} from './battleArenas.js';
import './ArenaEnvironment.css';

export default function ArenaEnvironment({arenaId,round}){
 const env=arenaEnvironment(arenaId,round);
 if(env.neutral)return null;
 return <div className={'arena-atmosphere arena-stage-'+env.stage+(env.boss?' arena-is-boss':'')}
   data-arena={env.arenaId} data-stage={env.stage} data-cycle={env.cycle}
   style={{'--arena-accent':env.accent}} aria-hidden="true">
   {env.families.map(family=><span className={'arena-weather arena-weather-'+family} key={family}/>)}
   {env.boss&&<span className="arena-weather arena-boss-corona"/>}
  </div>;
}
