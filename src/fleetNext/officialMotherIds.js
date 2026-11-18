// UNICA lista delle dodici madri approvate e delle loro 120 carte esclusive.
// I 13 supporti sono una collezione distinta, anche quando usano codici tecnici simili.
// Le cinque varianti non approvate sono descritte soltanto in docs/APPUNTO_VARIANTI_ESCLUSE_NON_GIOCABILI_2026-11-18.md.
export const OFFICIAL_MOTHER_IDS=Object.freeze([
 'N00','C01','C02','C03','R01','R02','R04','E01','E02','L01','L03','L04'
]);
export const OFFICIAL_MOTHER_ID_SET=new Set(OFFICIAL_MOTHER_IDS);
export const isOfficialMotherId=id=>OFFICIAL_MOTHER_ID_SET.has(id);
