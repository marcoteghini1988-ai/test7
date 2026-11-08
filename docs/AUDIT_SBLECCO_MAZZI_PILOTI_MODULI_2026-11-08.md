# Eclissi Stellare — controllo sblocchi reali: mazzi numerici boss, piloti, Moduli

**8 novembre 2026 — codice inserito nel repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`.**

## Incoerenze emerse dall'audit sul vero ingresso da App

La precedente analisi basata su `officialBattleSetup` mostrava la corretta validazione degli inventari, ma `src/App.tsx`, prima di creare la battaglia, **assegnava ricompense nel momento sbagliato**:

1. Premendo **Terra settore 9**, `launchSectorBattle` sbloccava immediatamente un Modulo fra `aries`, `taurus`, `gemini`, `cancer` a seconda del pilota scelto; questo avveniva perfino **prima del controllo dei crediti d'ingresso** e prima di aver vinto lo scontro. Inoltre il vecchio stato `selectedAbility` lo considerava equipaggiato nel sistema storico.
2. Premendo **Terra settore 10**, l'App concedeva/equipaggiava senza vittoria un mazzo numerico storico `aries` (o equivalente per gli altri starter). **`aries` non è uno degli ID `planet_char_...` dei dodici mazzi numerici boss convertiti nel nuovo duello**: `officialSimultaneousEligibility` lo considera non pronto e devia legittimamente al duello 3D storico per non inventare una passiva. La concessione anticipata rendeva però inaffidabile il test dell'ingresso ufficiale nuovo.
3. Se mancava `eclissi_pilot_inventory`, l'App generava un inventario gratuito di **qualunque ID contenuto in `eclissi_selected_pilot`**, anche un boss o una leggendaria precedentemente selezionati. Una semplice scelta salvata **non è prova del possesso**.

## Correzioni già applicate

- `src/officialLoadoutMilestones.js`: regola pura per scegliere il pilota senza inventare proprietà e per assegnare il Modulo Terra S9 **soltanto a vittoria certificata nel flusso Avventura**. Conserva la migrazione `pilot_starter_1` → `pilot_com_1` in un vero inventario storico.
- `src/App.tsx`: nessuno sblocco si verifica in `launchSectorBattle` al solo click. **Solo dopo una vittoria del settore 9** si aggiunge il Modulo L1 alla proprietà delle abilità, se ancora nessun modulo è sbloccato. Il modulo **NON è equipaggiato automaticamente**: nel duello simultaneo deve essere inserito fra le **24 carte speciali** e pescato nelle cinque carte in mano per attivarsi.
- Eliminata la concessione/auto-selezione anticipata del vecchio mazzo `aries` al settore 10. Rimangono i normali requisiti di **sconfitta del boss e acquisto del mazzo numerico** attraverso l'arsenale. Non vengono cancellati gli inventari storici: i salvataggi che possiedono effettivamente `aries` conservano il percorso di compatibilità.
- In assenza di un inventario piloti salvato si parte con il solo `pilot_com_1` L1, non con l'ultimo ID selezionato. Se esiste un inventario valido, è rispettato il pilota realmente sbloccato; la registrazione originale continua a concedere uno dei quattro starter scelti.

## Test di integrazione sui sistemi reali

`src/officialLoadoutMilestones.test.js` verifica che il modulo del settore 9 non possa essere ottenuto entrando nel livello, perdendo, pareggiando, giocando PvP o affrontando un altro settore. Verifica la migrazione della licenza starter, la mancata concessione di un pilota boss senza inventario e l'inserimento **manuale** del modulo nel mazzo speciale: non è presente automaticamente nel `loadout`.

`src/officialLoadoutEntitlements.test.js` verifica:
- **12 mazzi numerici boss:** senza proprietà sbloccata sono rifiutati; con proprietà `unlocked` e livello reale rispettano i massimi **3/6/9** e sbloccano solamente **1/2/3 passive**. Non trasmettono i poteri esclusivi di un boss né aggiungono carte al giocatore.
- **33 piloti storici catalogati:** nessun pilota non sbloccato applica una passiva. **16** sono realmente supportati nella 3D simultanea; per i **17 restanti** il gioco conserva il percorso storico, senza prometterne la conversione. Il loro upgrade non è una Carta Speciale automatica.
- **35 Moduli Equipaggiamento:** sono tutte Carte Speciali fisiche del nuovo mazzo. L'archivio legacy `eclissi_abilities` deve indicare un acquisto/sblocco valido, livello 1–9. `readSpecialCollection` ne riconosce la proprietà, ma non le equipaggia; `createOfficialSimultaneousDuel` legge l'archivio vero e non concede effetti senza la carta giocata. Nessuna scrittura distruttiva all'archivio originale.

**Verifica automatica:** [GitHub Actions 42516035798](https://github.com/marcoteghini1988-ai/test7/actions/runs/42516035798): **806 test su 806 superati**, build Vite e preflight della plancia 3D completati. Non è stato eseguito un collaudo su dispositivo Android né un gameplay umano.

## Punti ancora da sviluppare

1. **17 piloti non convertiti:** adattare le loro condizioni, se coerenti con le regole del duello simultaneo 52/7, senza inventare abilità o bypassare inventario. Non alterare il legacy finché la migrazione non è verificata.
2. **Mazzi numerici boss acquistabili:** verificare l'accessibilità del percorso nell'UI di negozio e Hangar dopo la vittoria di ogni boss, con pagamento reale e persistenza; `officialBattleSetup` già controlla la proprietà ma il click nell'App richiede playtest.
3. **Carta Modulo S9:** comunicare chiaramente nell'interfaccia di collezione che deve essere inserita nel mazzo speciale. Il popup di vittoria è stato già aggiornato.
4. **Progressione della campagna:** bilanciare la disponibilità delle carte ottenute tramite acquisti e premi reali; conservare le 42 armi integrate, 17 navi, quattro vitali, 12 boss con madri fisse, arene e la plancia 9:16 esistente.

Il nuovo test non assegna sblocchi persistenti a salvataggi reali: usa archivi fittizi in memoria. Le modifiche alla App sono circoscritte al momento in cui le ricompense vengono applicate.
