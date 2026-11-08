# Eclissi Stellare — Fase 16B nel duello simultaneo ufficiale

**8 novembre 2026 · ramo unico `marcoteghini1988-ai/test7/main`.**

## Obiettivo e invarianti

Il motore storico `src/newCombat/phase16BCombat.js` contiene i quattro sistemi **Dado Quantico**, **Numero Bomba**, **Barra Malus** e **Carta Dorata**. La migrazione non crea una seconda modalità né sostituisce l'arena spaziale approvata. Mantiene i **30 s di preparazione simultanea**, **8 s di risoluzione**, 7 numeriche vere in mano (52 totali), 5 speciali vere in mano (24 totali), massimo **2 speciali per ciclo**, quattro vitali con firme reali e armi native integrate alle navicelle.

Gli eventi originali non vengono importati come bonus indiscriminati. Sono stati adattati in `src/tacticalLegacyEvents.js` con valori provvisori da playtest, validazione nel `src/simultaneousDuelEngine.js`, interfaccia nella plancia ufficiale `src/OfficialBattle3D.jsx` e scelta autonoma dell'IA locale in `src/tacticalDuelAi.js`. **Nessuna Polvere, Etere spendibile, credito o diamante reale viene accreditato** dal nuovo motore, che non è ancora un sistema di rendicontazione online auditato.

## Dado Quantico — abilità ricaricabile, NON una carta extra

- Richiede **3 formule valide di categoria differente** tra +, −, ×, ÷, Coppia e Tris (ripetere 3 volte lo stesso operatore non carica il dado). Le formule usano carte numeriche autentiche; la carica persiste fino al lancio.
- Nel ciclo successivo con carica pronta il proprietario può scegliere il lancio durante la preparazione, nella sezione **ARMI**. L'ordine è segreto, il risultato si applica all'apertura della fase risolutiva, **una volta** e la carica si azzera.
- Sei facce storiche conservate, effetto tattico nel nuovo motore:

| Faccia | Effetto attuale |
| --- | --- |
| Modulo | +10 Sincronia alla propria flotta, entro il limite 100 |
| Malus | Riduce di 1 la carica Malus dell'avversario, non disattiva retroattivamente ordini già sigillati |
| Cura | Ripara fino a 8 HP della propria barriera **se il generatore funziona** |
| Polvere | Solo messaggio grafico; **nessun credito o Polvere persistente** |
| Etere | +8 Sincronia tattica; **nessuna risorsa persistente** |
| Danno | −6 HP alla barriera nemica effettiva, senza colpire direttamente vitali protetti |

Il lancio è deterministico nel motore sulla base del seed della partita, ciclo e lato; non legge la mano o gli ordini avversari. Le due flotte seguono la stessa regola.

## Numero Bomba — una delle 24 carte speciali

- ID `tactic-bomb`, nome **Numero Bomba**. Si ottiene solo tramite copia del normale pacchetto speciale, non viene inclusa nello starter o regalata; usa una delle massimo 2 speciali per ciclo.
- Durante la preparazione il giocatore indica **lo slot numerico 1–7 dell'avversario**, non vede il suo contenuto. Quando termina il combattimento e il nemico ha ripescato, la bomba **marca la carta realmente contenuta in quello slot** (stesso ID e seme, nessuna numerica creata).
- Il contrassegno è visibile nella mano nemica durante il ciclo successivo e dura **due cicli pieni**, con il limite di **una bomba attiva per bersaglio**; una nuova bomba sostituisce la vecchia.
- **Disinnesco:** scartare quella carta con un ricambio reale oppure giocarla in una combinazione matematica effettivamente valida. Se si tenta una formula errata, si usa il contrassegno come munizione della scudiera oppure scade senza disinnesco, la vittima subisce **fino a 8 HP reali alla sola barriera**. La bomba non aggira firme dei vitali e non distrugge HP oltre il valore rimanente.

Questa è una **conversione specifica per il duello di 7 carte**, non la vecchia bomba del banco comune a 5 slot: le due dinamiche rimangono separate per evitare comportamenti incompatibili.

## Barra Malus — carica + Carta Malus

- Un colpo che danneggia realmente un **vitale esposto** aggiunge una tacca, fino a **3**. L'uso di armi native senza colpo vitale non carica il Malus. Il sistema non consente di saltare completamente la preparazione, per non bloccare il duello simultaneo.
- La carica da sola non attribuisce un potere. Serve avere e giocare una copia autentica della speciale `tactic-malus` (mai nello starter), selezionando uno fra tre disturbi limitati **al ciclo corrente**:

| Disturbo | Effetto |
| --- | --- |
| Disturbo armamenti | −15% al pacchetto nativo nemico del ciclo |
| Scudi compromessi | +10% al pacchetto nativo ricevuto dalla barriera nemica |
| Interferenza energetica | −10 Sincronia guadagnata dall'avversario nel ciclo |

L'uso consuma la speciale e la carica di tre tacche, non cancella né modifica mazzi numerici o tempi di preparazione. Il motore applica le scelte solo **dopo che entrambi hanno sigillato gli ordini**, senza priorità di A su B.

## Carta Dorata — trasformazione di una numerica reale

- ID `tactic-golden`, speciale normale ottenibile nei pacchetti, **zero copie nello starter**. Durante la preparazione scegli **una delle 7 numeriche già in mano**, che conserva identità, valore e seme. La trasformazione dura il ciclo di attivazione e **quello successivo**.
- Il bonus viene consumato solo se la stessa numerica partecipa a una **formula valida**; il semplice possesso, una formula errata o un ricambio non genera niente. Una Dorata già attiva impedisce una seconda trasformazione finché non scade.
- Bonus in base al seme originale:

| Seme della carta trasformata | Bonus da formula valida |
| --- | --- |
| ♥ Cuori | Fino a +8 HP scudo autentico, generatore funzionante |
| ♦ Quadri | +8 Sincronia fino a 100 |
| ♣ Fiori | Fino a +8 HP a una scudiera ancora viva e con centralina funzionante |
| ♠ Picche | Fino a −6 HP alla barriera avversaria, mai ai vitali coperti |

Il vecchio bonus economico di ♦/♣ non viene duplicato: nel nuovo motore è un effetto tattico sostitutivo, non valuta spendibile. Non sono generati Jolly o nuove carte.

## Salvataggi, pacchetti e motore storico

- `src/specialCards.js` e `src/specialDeckBuilder.js`: tre tipologie con **zero copie iniziali**, migrabili senza cambiare versione della collezione; le copie successive possono essere ottenute nei pacchetti **normali** secondo le regole provvisorie già esistenti. **Il Dado non è una quarta speciale**: ha una carica tattica indipendente.
- `src/pvpTerrainLoadout.js` e `src/BossBattle3D.jsx`: nei combattimenti legacy queste speciali non convertite vengono filtrate **solo per il singolo combattimento** e rimpiazzate soltanto da copie già possedute. Nessuna modifica all'inventario, ai salvataggi, alle ricompense boss e ai Varchi Epici.
- `src/OfficialBattle3D.jsx`, `.css`, `src/tacticalCombatTimeline.js`: pulsanti nella **modale ARMI già esistente**, contrassegni grafici dentro le **stesse 7 carte**, messaggi e replay della risoluzione. **Nessun spostamento di madre, scudiere, fondale, mazzi o mano.**

## Test e limiti

I test `src/tacticalLegacyEvents.test.js` coprono: sei facce, carica 3 categorie, soglie Malus, Bomba sul card-ID autentico, disinnesco/ricambio, scadenza, Dorata e durata, vincoli 52/24, acquisto non regalato e compatibilità legacy. La suite generale mantiene inoltre i test dei boss, degli Epici e delle Carte Terreno.

Verifica di integrazione [GitHub Actions](https://github.com/marcoteghini1988-ai/test7/actions/runs/42458636847): **674 test superati**, `npm run build` e `npm run preflight` superati sul commit `01d8b1e9667712f4a12005cd3126ee4aeac95e06`. Nuovi test o aggiornamenti della presentazione dopo questo commit richiedono ulteriore CI.

**Non verificato:** prova umana completa da smartphone Android in 9:16, chiarezza dei simboli Bomba/Oro a scala effettiva, durate reali dei match, bilanciamento delle percentuali, qualità delle animazioni, regole economiche definitive e validazione server in PvP online. La grafica finale PNG dei personaggi boss e delle nuove speciali rimane una voce distinta.
