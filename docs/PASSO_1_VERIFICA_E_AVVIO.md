# Passo 1 — versione di partenza e avvio

Verifica del 3 novembre 2026. Ramo di lavoro: `work/arena-fleet-layout-2026-11-03`. Base: `68aa850be5593ea6cdc73504776495ef7dd22ab8`.

## Versioni confrontate

Sono stati confrontati il repository GitHub, la baseline ZIP Fase 1I e la copia salvata Test7 di StackBlitz. Quest'ultima coincide con GitHub su 195 file e differisce in cinque sorgenti: MathDuelBattle.jsx/.css, mathFleetGeometry.js, il relativo test e PersonalLoadoutModal.jsx. Nessun file esiste soltanto nella copia StackBlitz.

I cinque diff mostrano che GitHub contiene le correzioni più recenti: sprite completi di tutti i cinque modelli, coordinate dedicate per le due viste, bocche di fuoco calibrate, indicatori di Dardo separati e tooltip dell'assetto corretto. Si prosegue quindi da GitHub. I backup esistenti restano alla base indicata; la copia StackBlitz non è stata sovrascritta.

## Correzioni di questo passo

- `vite.config.ts`: ammesso il solo host di sviluppo `terminal.local`, necessario all'anteprima dell'ambiente. Nessun wildcard per gli host.
- `tsconfig.app.json` e `tsconfig.node.json`: rimossa l'opzione `erasableSyntaxOnly`, non supportata dalla versione TypeScript bloccata nel progetto.
- `App.tsx`: precisati tipi numerici, mappe, parametri opzionali, callback/ref e metadati dei risultati. Inizializzato a zero il contatore di riarmo già previsto dal codice. La ricompensa crediti del vecchio riepilogo campagna rimane zero, coerente con il precedente fallback e con lo schema attuale delle ricompense.
- `package.json`: il controllo dei simboli inutilizzati rimane accessibile tramite `check:unused`, separato dalla build. Rimangono 94 segnalazioni di questo tipo; non sono state nascoste con `ts-nocheck` né eliminate parti del gioco per farle sparire. `build` continua a eseguire TypeScript prima di Vite.
- `test:combat` ora indica i due file realmente esistenti del duello e della geometria, invece di un percorso privo di test.
- `README.md`: allineato al combattimento effettivamente attivo e allo stato delle verifiche.

La build iniziale falliva con 157 diagnostiche: 94 per codice inutilizzato, 2 per opzioni incompatibili e 61 di tipo. Dopo le correzioni la build completa riesce; il controllo separato degli inutilizzati continua a riportare le 94 segnalazioni.

## Verifiche effettuate

| Controllo | Esito |
| --- | --- |
| `npm ci` | Installazione completata dal lockfile. |
| `npm run build` | TypeScript e bundle Vite completati. |
| `npm run verify:logic` | 49 test superati. |
| `npm run test:combat` | 40 test superati, sottoinsieme dei 49 precedenti. |
| `npm run preflight` | Struttura e import locali validi. |
| `npm run check:unused` | 94 segnalazioni note di codice inutilizzato; nessun altro errore di tipo. |
| Avvio reale dal primo ingresso | Battaglia aperta con sette carte e timer da 60 secondi. |
| Attacco e risposta | Giocate 10 cuori e 8 fiori su +18: motore nemico da 55 a 37 HP, due carte consumate, mano reintegrata a sette; risposta IA e passaggio al turno 2 osservati. |
| Navigazione | Ritorno alla campagna, Home, apertura/chiusura Shop e assetto/Hangar verificati. |
| Avvio da campagna | Briefing del settore 1 aperto e lancio della battaglia riuscito. |

## Limiti ancora presenti

- StackBlitz ha una sessione autenticata ma l'apertura diretta del repository fallisce. L'editor del progetto salvato è accessibile; la console segnala che `window.WebContainer` non è un costruttore. Non è una prova di credenziali errate. L'esecuzione verificata sopra è nell'anteprima dell'ambiente, non nel runtime StackBlitz.
- La plancia ha ancora la precedente griglia azzurra. I passi grafici non sono iniziati.
- Il bundle JavaScript è circa 1,09 MB minificato e Vite segnala dimensioni elevate; ottimizzazione e collaudo su telefono restano aperti.
- Esistono testi legacy con caratteri corrotti e descrizioni del briefing/Shop da riallineare al duello dei motori. L'apertura dei menu non costituisce un collaudo degli acquisti, delle ricompense o dell'intera progressione.
- Non è stata giocata una campagna completa e non è stato verificato un dispositivo fisico.

## Punto raggiunto

**Passo 1 concluso nel codice e nell'anteprima di lavoro, con il limite StackBlitz esplicitamente registrato. Prossimo passo: 2 — plancia metallica 3D verticale 9:16.**

Il prossimo intervento deve partire dal ramo di lavoro aggiornato, conservare la logica verificata e usare il riferimento artistico del pacchetto di trasferimento. Non ricominciare dalla vecchia copia StackBlitz o dallo ZIP Fase 1I.
