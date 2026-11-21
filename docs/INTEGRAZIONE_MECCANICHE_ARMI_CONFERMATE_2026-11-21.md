# Armi già confermate: completamento meccanico senza inventare HP

- 21 progetti incompleti censiti in `src/fleetNext/confirmedAdvancedWeaponMechanics.js` con la meccanica approvata e i parametri mancanti. Il registro è collegato alle Carte Arma e alla collezione reale.
- Motore di risoluzione preparato per **Mortaio Magmatico** (3 turni, 1 colpo base + massimo 2 extra Fuoco a turno, solo carte fisiche, consumo selezionabile per carta o carica) e **Ago dell'Inverno Nero** (due supporti, bonus Terreno Ghiaccio e perforante alla madre di valore pari alla somma); questi profili necessitano di danni e di scelte definitive per diventare equipaggiabili.
- I colpi attraversano il normale motore HP, le Difese e i Terreni. Nessuna rarità o valore di danno è stato attribuito al catalogo delle 21 carte ancora sospese.
- Le carte rimangono `playable:false` e non sono acquistabili o regalate. Le 48 nuove Carte Arma già giocabili e le quattro storiche non cambiano stato. Nessuna modifica all'arena e agli asset.
- I test automatici `src/fleetNextConfirmedAdvancedMechanics.test.js` verificano le regole, il blocco delle carte incomplete e i piani di tiro con valori sintetici che NON sono statistiche ufficiali.
