# Eclissi Stellare — Duello dei Motori

Gioco React/Vite esistente, con Home, Shop, assetto/Hangar e campagna. Il combattimento attivo usa `MathDuelBattle.jsx`: i vecchi moduli Poker rimangono nel progetto per compatibilità, ma non sono il regolamento del duello attivo.

## Versione da proseguire

Il passo 1 del piano di lavoro è descritto in [docs/PASSO_1_VERIFICA_E_AVVIO.md](docs/PASSO_1_VERIFICA_E_AVVIO.md).

Il passo 2 integra l'arena metallica verticale ed è descritto in [docs/PASSO_2_ARENA_METALLICA.md](docs/PASSO_2_ARENA_METALLICA.md).

La base attuale contiene le prime **5 navicelle e 7 armi** della Fase 1I. Il catalogo concordato di 17 navi e 42 armi è da completare progressivamente. Le copie salvate su StackBlitz devono essere confrontate con il ramo GitHub prima di modificarle.

## Regole del combattimento attivo

- Mazzo standard da 52 carte, sette carte in mano; A=1, J=11, Q=12, K=13.
- Turno da 60 secondi; un attacco valido conclude il turno.
- Si sceglie un motore nemico e si risolve il suo bersaglio con due carte. Sottrazione e divisione verificano gli ordini ammessi; la divisione deve essere esatta.
- Il risultato matematico abilita lo sparo. I valori delle carte forniscono munizioni e i semi attivano le armi; il risultato non è il danno.
- Ogni arma compatibile di ciascuna nave riceve le munizioni previste. Accumulo e danni per proiettile dipendono dal catalogo.
- Ogni motore ha HP propri. Dopo un KO si può selezionare un motore superstite o una nave nemica ancora attiva.
- Aurora-0 è l'universale iniziale con due motori, + e −. Le flotte di prova arrivano a tre navi; non equivalgono a proprietà e acquisti permanenti.

## Avvio e verifiche

```sh
npm ci
npm run dev
npm run build
npm run test:combat
npm run verify:logic
npm run preflight
```

`build` esegue TypeScript e Vite. `test:combat` esegue i 40 test del duello dei motori e della geometria; `verify:logic` include anche i 9 test della precedente logica matematica.

Il controllo dei simboli legacy inutilizzati è disponibile separatamente con `npm run check:unused`: al termine del passo 1 segnala ancora 94 elementi. Non sono stati cancellati componenti, hook o funzionalità per eliminare queste segnalazioni. La build continua a verificare i tipi; non usa `noCheck` o `ts-nocheck`.

## Stato reale

Il passo 1 ha verificato build, struttura, test e avvio reale della battaglia con attacco e risposta IA. Sono stati aperti anche Home, Shop, assetto e briefing di campagna.

La plancia corrente usa l'arena metallica in prospettiva nel formato 9:16, con ombre delle navi, senza la precedente griglia azzurra. La build, i 49 test e un attacco reale sul nuovo sfondo sono stati verificati nell'anteprima di lavoro. Il prossimo intervento è il **passo 3: formazioni affiancate di 1, 2 o 3 navi**. Catalogo completo, evoluzioni, carte-navicella persistenti e intro rimangono nei passi successivi.

Il collaudo del passo 1 usa l'anteprima dell'ambiente di lavoro. In questa sessione StackBlitz è autenticato ma il suo WebContainer non parte; non dichiarare che il collaudo StackBlitz sia stato completato.
