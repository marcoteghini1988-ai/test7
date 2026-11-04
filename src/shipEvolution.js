// Coordinates on the existing 1000 × 1000 hull renders. The two views have
// their own attachment points. No plating changes an engine or weapon anchor.
const COMMON_HULLS={
 N00:{
  color:'#73ddff',plate:'M-30-9-9-31 34-20 42 4 18 23-32 13Z',
  wing:'M24-28-17-35-88-63-106-45-54-14-23 26 24 17Z',
  fin:'M18-18-29-28-113-78-139-68-110-38-46-1-7 19Z',
  player:{plate:[258,742,465],wing:[185,815,507]},
  enemy:{plate:[263,737,535],wing:[175,825,546]},
 },
 C01:{
  color:'#ff6370',plate:'M-37 7-25-21 9-32 39-19 26 15-7 25Z',
  wing:'M27-21-6-38-54-44-102-28-117 15-89 40-86 9-45-7-17 24 22 10Z',
  fin:'M14-22-29-43-95-43-132-16-137 23-122 52-118 20-96-6-58-12-10 6Z',
  player:{plate:[258,742,515],wing:[190,810,540]},
  enemy:{plate:[250,750,555],wing:[178,822,565]},
 },
 C02:{
  color:'#8deeff',plate:'M-37-7 4-34 39-9 20 27-17 24Z',
  wing:'M20-36-33-36-73-69-103-32-104 14-67 45-16 28 24 10Z',
  fin:'M18-21-36-27-91-79-126-43-126 12-91 43-86 10-28 1Z',
  player:{plate:[224,776,522],wing:[168,832,574]},
  enemy:{plate:[220,780,497],wing:[169,831,520]},
 },
 C03:{
  color:'#79ff9e',plate:'M-39-22 24-25 40-9 35 20-37 26-44 7Z',
  wing:'M28-31-65-31-105-4-105 39-83 54-18 45 29 19Z',
  fin:'M18-25-66-25-122-4-127 47-110 58-78 42-74 16-17 11Z',
  player:{plate:[235,765,426],wing:[158,842,429]},
  enemy:{plate:[233,767,594],wing:[160,840,630]},
 },
 C04:{
  color:'#dfa0ff',plate:'M-39 12-20-14 15-31 39-18 27 12-14 27Z',
  wing:'M21-36-18-29-87 4-119 47-78 30-62 49-29 21 26 12Z',
  fin:'M21-24-34-9-99 17-132 63-114 35-87 29-67 63-48 23 9 5Z',
  player:{plate:[262,738,507],wing:[192,808,538]},
  enemy:{plate:[261,739,505],wing:[188,812,551]},
 },
};

export function shipEvolution(shipId,level){
 return level>1?COMMON_HULLS[shipId]??null:null;
}
