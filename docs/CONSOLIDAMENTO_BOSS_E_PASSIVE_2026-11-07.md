**AGGIORNAMENTO SUCCESSIVO — 12 BOSS MIGRATI**: nella plancia 3D ufficiale del duello simultaneo sono ora attivati i settori boss riconosciuti, con mazzo numerico nemico storico, 12 piloti e arene esclusive. Il comportamento prima descritto come “campagna boss ancora legacy” è stato superato. I salvataggi incoerenti e i piloti non convertiti continuano sul motore precedente. Le verifiche visive su smartphone restano da fare. Specifica corrente: `docs/MIGRAZIONE_BOSS_E_ANIMAZIONI_SCUDIERE_07_11_2026.md`.

# Eclissi Stellare — consolidamento boss e mazzi numerici

**STATO CORRENTE (aggiornamento finale del 7 novembre 2026)**: **12/12 poteri esclusivi e 23/23 passive numeriche implementate e testate** nel nuovo duello simultaneo. Tutti i 12 mazzi ora sono equipaggiabili solo con inventario legittimo; Afrodite usa timer reale 13/11/9s, Sentinella/Generatore durate status reali 12/15s, Risonanza usa munizioni autentiche delle scudiere. Il settore boss di campagna resta sul vecchio motore **per scelta di sicurezza**, fino al collaudo grafico e di parità. **La fonte aggiornata è `docs/SCALLETTA_BOSS_23_PASSIVE_COMPLETE_2026-11-07.md`**. I conteggi 9/23, 15/23 e 19/23 sotto sono esclusivamente cronologia delle fasi precedenti.

Stato: 7 novembre 2026 — repository ufficiale marcoteghini1988-ai/test7, ramo main. Nessuna copia del gioco; nessuna modifica agli asset grafici.

## 12/12 poteri ESCLUSIVI nel motore simultaneo
1. Gaia (1) — Corazza tellurica: −20% sul primo danno effettivo alla barriera, una volta.
2. Tharsis (2) — Assalto progressivo: +3/6/9% nativo dopo colpi consecutivi effettivi.
3. Venere (3) — Neurotossina: una precisione dannosa applica −10% alla riparazione nel prossimo ciclo; Pulizia reale può rimuoverla.
4. Saturno (6) — Crono: Controtempo +5% nativo dopo Contromisura efficace, entro due cicli.
5. Urano (7) — Sifone Quantico: trasferisce fino a 8 Sincronia autentica dopo danno reale alla barriera.
6. Nettuno (8) — Pressione degli abissi: +8% nativo a barriera avversaria <=40% *all'inizio del ciclo*, cap +45%.
7. Plutone (9) — Patto di sangue: -4 HP REALI dalla propria barriera prima di riparare/colpire; +8% nativo, cooldown 3 cicli, scudo >12 HP.
8. Europa (11) — Idra Criogenica: rigenera fino a 4 HP dello scudo nel ciclo successivo a un vero impatto, generatore vivo, cooldown 3 cicli; controbilanciata da precisione valida con Cuori contro un vitale esposto.
9. Proxima b (14) — Generatore del Caos: 3 colpi reali caricano il reattore; la scarica del successivo colpo reale vale +10%, cap +45%.
10. Haumea (17) — Cristallo di Risonanza: almeno 2 numeriche realmente scartate dall'avversario nel ciclo precedente e nuovo danno reale alla barriera danno +5 Sincronia, cap100.
11. Io (19) — Nucleo Magmatico: fasi CARICA / ERUZIONE +10% / RAFFREDDAMENTO −10%, fisse per ciclo, comunicate nel registro durante la preparazione.
12. Encelado (20) — Sovrano del Vuoto: seme dominante pubblico ogni 3 cicli (Picche, Cuori, Quadri, Fiori), precisione valida +7%; avversario contrasta il ciclo successivo con precisione dannosa del medesimo seme.

Tutti i poteri esclusivi usano vere risorse/HP/carte/eventi, senza leggere ordini nascosti, senza attacchi gratuiti e senza bypassare firme matematiche o vitali protetti. Moduli principali: src/tacticalExclusiveBosses.js e src/simultaneousDuelEngine.js. Test dedicati: tacticalFinalFiveBosses.test.js, tacticalBloodPactExclusive.test.js, tacticalLeviatanoExclusive.test.js, tacticalIonicSiphonExclusive.test.js, tacticalChronoExclusive.test.js, tacticalVenusExclusive.test.js.

## Passive NUMERICHE dei 12 mazzi boss: 19/23 regole codificate, ma solo 15/23 sbloccabili nel nuovo motore

### Otto mazzi COMPLETI (15 passive): disponibili solo con inventario reale e livello ottenuto
- Gaia (1/1): Baluardo terrestre.
- Tharsis (1/1): Pressione marziana.
- Anelli di Crono (1/1): Primo anello.
- Leviatano (2/2): Marea del riciclo; Profondità tattica.
- Ombre (2/2): Potenza disperata; Oscurità terminale.
- Idra (2/2): Precisione criogenica; Teste alternate.
- Nucleo Magmatico (3/3): Risonanza termica sul terzo vero colpo alla barriera; Corrosione ardente con carta Corrosione davvero giocata; Forgia moltiplicatrice su moltiplicazione valida. Gradi L1–L9 originali, con resto percentuale conservato, tetto bonus nativo +45%.
- Sovrano (3/3): Ultimo presidio con tre propri vitali KO, Vuoto difensivo con scudo <=25%, Supremazia nel prossimo attacco efficace dopo KO reale di un vitale nemico. Gradi L1–L9 originali. Bonus difensivi fotografati prima della risoluzione simultanea.

### Quattro mazzi INCOMPLETI: restano bloccati, senza perdita silenziosa delle capacità
- Afrodite (1/2 codificate): Sintesi curativa migliora soltanto una carta Riparazione scudo realmente giocata (+5/8/11%, L4–L6), rispettando generatore e Neurotossina. Resta **Ricambio armonico**: tempo di ricarica 13/11/9 secondi; il nuovo motore non ha attualmente un ricambio ripetibile a timer dentro i 30 s di preparazione. NON sbloccare il mazzo prima di avere un timer e i controlli di ricambio reali.
- Sentinella Ionica (0/1): resta **Isolamento ionico**, riduzione durata status Ionizzazione del 15/25/35%. Il motore simultaneo conserva attualmente uno status per ciclo, senza esposizione temporale in secondi. NON sostituire la durata con una riduzione arbitraria del danno.
- Generatore del Caos (1/2 codificate): **Accumulo energetico** +10/20/30% sulla Sincronia veramente guadagnata al termine di cicli reali, con cap 100. Resta **Schermatura instabile**, durata Ionizzazione e Corrosione −15/25/35%; richiede il sistema di durata status definito e collaudato.
- Cristallo di Risonanza (2/3 codificate): **Armi armoniche** bonus 4/6/8% quando si alternano fuochi nativi con veri focus di arma; **Frequenza multipla** +3/5/7% con precisione davvero valida e due semi distinti. Resta **Sinfonia di flotta**, madre + scudiera che sparano insieme; le scudiere del nuovo motore sono attualmente intercettori difensivi e non dispongono di un pacchetto d'attacco autonomo. NON inventare danni di scorta per sbloccare il mazzo.

Nota di conteggio: 15 passive nei mazzi completi + 4 passive codificate nei mazzi ancora non equipaggiabili = **19/23 logiche scritte**. Le quattro mancanti sono Ricambio armonico, Isolamento ionico, Schermatura instabile e Sinfonia di flotta. L'inventario e officialSimultaneousEligibility devono mantenere i mazzi parziali nel percorso compatibile.

## Verifiche e vincoli
- Test su tutte le 17 navi, carte vere, 7 numeriche, 5 speciali, 24 istanze, firme, 3 gradi per abilità, consumo reale di HP/Sincronia.
- Test esclusivi e numerici in src/tacticalFinalFiveBosses.test.js, tacticalMagmaNumericDeck.test.js, tacticalSovereignNumericDeck.test.js, tacticalPartialNumericBossDecks.test.js, tacticalAfroditePartial.test.js.
- Nessuna modifica al layout ufficiale 9:16, arena titanio, immagini nave, armi, carte o comandi; tutte queste modifiche riguardano solo il motore.
- ATTENZIONE: 12/12 poteri esclusivi pronti nel motore **non significa 12/12 boss ufficiali migrati in campagna**. officialSimultaneousBridge.js conserva ancora il percorso BossBattle3D.jsx nei veri settori boss per evitare la perdita di meccaniche legacy e di poteri non convertiti.
- Non assegnare né attivare i mazzi incompleti (Afrodite, Sentinella, Generatore, Risonanza) senza definire le quattro dipendenze strutturali.

## Ordine dei prossimi interventi
1. Definire senza alterare il genere del duello un **ricambio numerico a timer** che rispetti 13/11/9 secondi di Afrodite e i 30 s di preparazione.
2. Introdurre **durate status in secondi** (Ionizzazione/Corrosione) con scadenze deterministiche e adattamento delle arene ioniche. Solo dopo collegare Isolamento ionico e Schermatura instabile con 3 gradi originali.
3. Definire **fuoco offensivo reale della scudiera** (se previsto per ogni livello), senza duplicare il fuoco della madre, con HP, munizioni e animazioni proprie; poi collegare Sinfonia di flotta.
4. Mettere verdi suite logica, build e preflight, sbloccare solo allora i quattro mazzi interi e verificare equipaggiamenti nei salvataggi.
5. Integrare i 12 boss nel settore 10 della campagna solo dopo verifica parità funzionale con il motore precedente, IA, arene esclusive e ricompense.
6. Poi proseguire con i punti aggiuntivi: Carte Personaggio Boss (12), Terreni PvP, Mutazione della Firma, piloti avanzati, reliquie, arene planetarie e relativa verifica grafica su smartphone.
