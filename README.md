# Eclissi Stellare — Duello dei Motori

Gioco React/Vite esistente, con Home, Shop, assetto/Hangar e campagna. Il combattimento attivo usa `MathDuelBattle.jsx`: i vecchi moduli Poker rimangono nel progetto per compatibilità, ma non sono il regolamento del duello attivo.

## Versione da proseguire

Il passo 1 del piano di lavoro è descritto in [docs/PASSO_1_VERIFICA_E_AVVIO.md](docs/PASSO_1_VERIFICA_E_AVVIO.md).

Il passo 2 integra l'arena metallica verticale ed è descritto in [docs/PASSO_2_ARENA_METALLICA.md](docs/PASSO_2_ARENA_METALLICA.md).

Il passo 3 dispone una, due o tre navi in posti fissi, con scala uniforme per lato e selezione diretta di tutti i motori installati. Verifiche e formazioni miste: [docs/PASSO_3_FORMAZIONI.md](docs/PASSO_3_FORMAZIONI.md).

Il passo 4 integra le sette armi nelle prime cinque navi e localizza il danno sulle gondole dei motori: [docs/PASSO_4_MONTAGGI_FISICI.md](docs/PASSO_4_MONTAGGI_FISICI.md).

Il passo 5 distingue proiettili, raffiche, traiettorie, suoni e impatti delle prime sette armi, sincronizzati con le munizioni effettive: [docs/PASSO_5_FIRME_DELLE_ARMI.md](docs/PASSO_5_FIRME_DELLE_ARMI.md).

Il passo 6A aggiunge quattro navicelle rare e nove armi. Dati e prove sono in [docs/PASSO_6A_FLOTTA_RARA.md](docs/PASSO_6A_FLOTTA_RARA.md).

Il passo 6B aggiunge quattro navicelle epiche e tredici armi. Le epiche sbloccano la Divisione al livello 4. Il rapporto è in [docs/PASSO_6B_FLOTTA_EPICA.md](docs/PASSO_6B_FLOTTA_EPICA.md).

Il passo 6C completa le **17 navicelle e 42 armi** del catalogo nel duello di prova. Le leggendarie hanno quattro motori dal livello 1. La memoria delle combo è visibile in arena. Il rapporto è in [docs/PASSO_6C_FLOTTA_LEGGENDARIA.md](docs/PASSO_6C_FLOTTA_LEGGENDARIA.md).

## Regole del combattimento attivo

- Mazzo standard da 52 carte, sette carte in mano; A=1, J=11, Q=12, K=13.
- Turno da 60 secondi; un attacco valido conclude il turno.
- Si sceglie un motore nemico e si risolve il suo bersaglio con due carte. Sottrazione e divisione verificano gli ordini ammessi; la divisione deve essere esatta.
- Il risultato matematico abilita lo sparo. I valori delle carte forniscono munizioni e i semi attivano le armi; il risultato non è il danno.
- Ogni arma compatibile di ciascuna nave riceve le munizioni previste. Accumulo e danni per proiettile dipendono dal catalogo.
- Le combo a memoria raccolgono i semi degli ultimi tre o quattro calcoli validi. Quando si completano, sparano tutte le munizioni del seme primario presenti nella finestra e la memoria dell’arma si svuota. Un calcolo errato azzera la serie.
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

`build` esegue TypeScript e Vite. `test:combat` esegue i 79 test del duello, del catalogo, della geometria e degli effetti delle armi. `verify:logic` include anche i 9 test della precedente logica matematica, per un totale di 88.

Il controllo dei simboli legacy inutilizzati è disponibile separatamente con `npm run check:unused`: al termine del passo 1 segnala ancora 94 elementi. Non sono stati cancellati componenti, hook o funzionalità per eliminare queste segnalazioni. La build continua a verificare i tipi; non usa `noCheck` o `ts-nocheck`.

## Stato reale

Il passo 1 ha verificato build, struttura, test e avvio reale della battaglia con attacco e risposta IA. Sono stati aperti anche Home, Shop, assetto e briefing di campagna.

La plancia corrente usa l'arena metallica in prospettiva nel formato 9:16, con flotte affiancate in posti fissi. Ogni colpo parte dalla propria bocca e arriva sul motore selezionato. Impatti e applicazione degli HP seguono la stessa sequenza temporale. Le armi ad accumulo sparano al raggiungimento della soglia e il danno fisico rimane localizzato sulla gondola colpita. Il passo 7 è dedicato alle evoluzioni visive dei livelli e alle carte-navicella.

Il primo collaudo è stato svolto nell'anteprima dell'ambiente di lavoro. Nella verifica successiva il WebContainer della copia salvata di StackBlitz è ripartito: la copia è stata aggiornata, salvata e ricaricata, e la nuova arena con le immagini delle navi è stata verificata anche lì. L'apertura diretta del repository ha invece ancora restituito un errore di clonazione.

## Copia salvata di StackBlitz

Un progetto salvato con URL `/edit/...` è una copia separata: aggiornare GitHub non ne aggiorna automaticamente i file. Dopo ogni fase occorre sincronizzare e salvare anche questa copia, oppure aprire direttamente il repository corrente.

Per le copie con spazio limitato per le immagini, `VITE_ASSET_ROOT` può indicare una cartella pubblica di asset già ospitati. In assenza della variabile il gioco usa `/assets`, come prima. La copia Test7 di StackBlitz usa questa configurazione pubblica in `.env.local`:

```text
VITE_ASSET_ROOT=https://raw.githubusercontent.com/marcoteghini1988-ai/test7/main/public/assets
```

Questa variabile contiene soltanto un URL pubblico. Le immagini restano incluse nel repository per i normali avvii e le build autonome. La copia salvata usa GitHub per le immagini del duello, incluse le due viste WebP di ciascuna nave rara, epica e leggendaria. Dopo ogni modifica verificare il salvataggio con un ricaricamento e una prova della scena reale.

La copia di consegna è https://stackblitz.com/edit/github-edu2s6xy?file=README.md. Ogni fase deve aggiornare `main` e sincronizzare esplicitamente la copia salvata, quindi verificarla dopo un ricaricamento.
