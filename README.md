# Eclissi Stellare — Duello dei Motori

Gioco React/Vite esistente, con Home, Shop, assetto/Hangar e campagna. Il combattimento attivo usa `MathDuelBattle.jsx`: i vecchi moduli Poker rimangono nel progetto per compatibilità, ma non sono il regolamento del duello attivo.

## Versione da proseguire

Il passo 1 del piano di lavoro è descritto in [docs/PASSO_1_VERIFICA_E_AVVIO.md](docs/PASSO_1_VERIFICA_E_AVVIO.md).

Il passo 2 integra l'arena metallica verticale ed è descritto in [docs/PASSO_2_ARENA_METALLICA.md](docs/PASSO_2_ARENA_METALLICA.md).

Il passo 3 dispone una, due o tre navi in posti fissi, con scala uniforme per lato e selezione diretta di tutti i motori installati. Verifiche e formazioni miste: [docs/PASSO_3_FORMAZIONI.md](docs/PASSO_3_FORMAZIONI.md).

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

`build` esegue TypeScript e Vite. `test:combat` esegue i 42 test del duello dei motori e della geometria; `verify:logic` include anche i 9 test della precedente logica matematica, per un totale di 51.

Il controllo dei simboli legacy inutilizzati è disponibile separatamente con `npm run check:unused`: al termine del passo 1 segnala ancora 94 elementi. Non sono stati cancellati componenti, hook o funzionalità per eliminare queste segnalazioni. La build continua a verificare i tipi; non usa `noCheck` o `ts-nocheck`.

## Stato reale

Il passo 1 ha verificato build, struttura, test e avvio reale della battaglia con attacco e risposta IA. Sono stati aperti anche Home, Shop, assetto e briefing di campagna.

La plancia corrente usa l'arena metallica in prospettiva nel formato 9:16, con ombre delle navi. Una nave è centrale; due e tre sono affiancate in una sola riga, senza ingrandimenti o ricentramenti al cambio di bersaglio. Sono state verificate le formazioni 1 contro 1, 2 contro 1, 1 contro 3 e 3 contro 3, i 51 test e due attacchi reali a un motore laterale con successivo KO. Il prossimo intervento è il **passo 4: integrazione fisica di navi, motori e armi delle prime cinque navicelle**. Catalogo completo, evoluzioni, carte-navicella persistenti e intro rimangono nei passi successivi.

Il primo collaudo è stato svolto nell'anteprima dell'ambiente di lavoro. Nella verifica successiva il WebContainer della copia salvata di StackBlitz è ripartito: la copia è stata aggiornata, salvata e ricaricata, e la nuova arena con le immagini delle navi è stata verificata anche lì. L'apertura diretta del repository ha invece ancora restituito un errore di clonazione.

## Copia salvata di StackBlitz

Un progetto salvato con URL `/edit/...` è una copia separata: aggiornare GitHub non ne aggiorna automaticamente i file. Dopo ogni fase occorre sincronizzare e salvare anche questa copia, oppure aprire direttamente il repository corrente.

Per le copie con spazio limitato per le immagini, `VITE_ASSET_ROOT` può indicare una cartella pubblica di asset già ospitati. In assenza della variabile il gioco usa `/assets`, come prima. La copia Test7 di StackBlitz usa questa configurazione pubblica in `.env.local`:

```text
VITE_ASSET_ROOT=https://raw.githubusercontent.com/marcoteghini1988-ai/test7/main/public/assets
```

Questa variabile contiene soltanto un URL pubblico. Le immagini restano incluse nel repository per i normali avvii e le build autonome. La copia salvata usa GitHub per le immagini del duello, evitando di aggiungere gli undici nuovi file binari al limite di caricamento del piano StackBlitz. Dopo ogni modifica verificare il salvataggio con un ricaricamento e una prova della scena reale.

La copia di consegna è https://stackblitz.com/edit/github-edu2s6xy?file=README.md. Ogni fase deve aggiornare `main` e sincronizzare esplicitamente la copia salvata, quindi verificarla dopo un ricaricamento.
