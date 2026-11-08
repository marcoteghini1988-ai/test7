# Eclissi Stellare — Collaudo integrato dei 12 boss e dei mazzi speciali acquisibili

**9 novembre 2026.** Repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`. Nessuna modifica a plancia, armi, modelli, valori del combattimento, salvataggi o ricompense.

## 1. Collaudo end-to-end: dodici boss, due modalità, 72 duelli

Nuovo test: `src/officialTwelveBossEndToEnd.test.js`. Confronta 12 boss × due modalità (`campaign`, `adventure`) × seed 17/171/2026 = **72 combattimenti risolti fino alla fine**, usando sempre l'ultima nave *teoricamente ottenibile* prima del relativo settore e un mazzo starter di 24 speciali, con pilota iniziale sbloccato. Il livello L5 è una **configurazione di prova**, non viene assegnato automaticamente al giocatore.

Sono verificati a ogni ciclo: boss, madre fissa, arena esclusiva, mazzo numerico e grado boss, 52 carte numeriche distinte, 24 speciali distinte, mani 7/5, HP/barriera/scudiere entro i limiti, 30 s + 8 s, chiusura entro 20 cicli, vittoria solo dopo quattro vitali KO, premi e reliquie esclusivamente dopo vittoria. I dodici ID storici non vengono confusi con i 120 settori.

**Esiti sintetici** (sei duelli per boss: tre seed ripetuti nelle due modalità; **non sono sei prove statisticamente indipendenti**):

| Boss | Madre pre-boss | Vittorie | Sconfitte | Pareggi | Cicli medi |
|---|---|---:|---:|---:|---:|
| Terra 10 | C03 | 4 | 2 | 0 | 16,3 |
| Marte 20 | R01 | 4 | 2 | 0 | 12,0 |
| Venere 30 | R03 | 4 | 0 | 2 | 10,3 |
| Saturno 40 | R04 | 4 | 2 | 0 | 14,3 |
| Urano 50 | E01 | 4 | 2 | 0 | 11,7 |
| Nettuno 60 | E02 | 0 | 6 | 0 | 9,3 |
| Plutone 70 | E03 | 0 | 4 | 2 | 18,7 |
| Europa 80 | E04 | 4 | 2 | 0 | 14,3 |
| Proxima b 90 | L01 | 0 | 4 | 2 | 15,0 |
| Haumea 100 | L02 | 2 | 2 | 2 | 12,3 |
| Io 110 | L03 | 0 | 6 | 0 | 11,3 |
| Encelado 120 | L04 | 2 | 4 | 0 | 15,0 |

Risultato: **28 vittorie, 36 sconfitte, 8 pareggi**. Non corrispondono alla percentuale di vittoria del giocatore. Il motore funziona ma emergono quattro boss critici nel campione con mazzo starter.

**Verifica GitHub Actions:** [42533512881](https://github.com/marcoteghini1988-ai/test7/actions/runs/42533512881), 813 test superati, build e preflight riusciti.

## 2. Confronto con pacchetti realmente ottenibili: quattro boss critici

Ampliato `src/officialBossEarnedPacks.test.js`: Nettuno, Plutone, Proxima b, Io, per un totale di **100 simulazioni** (4 boss × 5 varianti di mazzo × 5 seed). Il codice parte dai crediti pacchetto del primo completamento dei settori precedenti **ipotizzati vinti**, poi esegue `openSpecialPack` con quattro semi di estrazione, e sceglie/valida un mazzo di 24 carte soltanto fra le copie possedute. Non regala piloti, moduli, Epici o reliquie; L5 è presunto acquistato.

Ogni riga riporta le vittorie **su cinque combattimenti per variante**; il dato "pacchetti" è la **media delle quattro estrazioni**, non una previsione probabilistica.

| Boss | Starter V/S/P | Pacchetti V/S/P (media) | Pacchetti già guadagnabili |
|---|---|---|---:|
| Nettuno | 1/3/1 | 3/1,5/0,5 | 59 |
| Plutone | 1/2/2 | 3/0,25/1,75 | 69 |
| Proxima b | 2/2/1 | 3/1/1 | 89 |
| Io | 0/5/0 | 1/2/2 | 109 |

Le carte speciali venivano realmente scelte e consumate: l'IA ha giocato Scansioni, Ricambi Numerici e Riparazioni Scudo, senza inventare effetti. Una configurazione evoluta richiede **apertura ed equipaggiamento volontario** dei pacchetti; non nasce direttamente dal numero di crediti.

**Verifica GitHub Actions:** [42533669443](https://github.com/marcoteghini1988-ai/test7/actions/runs/42533669443), 813 test superati, build e preflight riusciti.

## 3. Conseguenze e prossimo punto della scaletta

- **Nettuno:** il mazzo speciali acquisibile migliora molto il benchmark. Non servono nerf preventivi.
- **Plutone:** il collo di bottiglia è coerente con il reperimento delle formule per il quarto KO; Scansione e Ricambio migliorano il risultato. Restano alcuni pareggi al limite dei 20 cicli.
- **Proxima b:** i mazzi evoluti aiutano; verificare i KO dei vitali contro Reattore e protezioni.
- **Io:** rimane la maggiore criticità. Con lo starter le partite durano poco e finiscono prevalentemente in sconfitta; i pacchetti fanno crescere la resistenza ma non garantiscono una vittoria. Analizzare l'impatto dell'eruzione e la finestra di Contromisura sulla barriera, senza alterare i tre cicli originari.

**Non ancora certificati:** accessibilità reale dei potenziamenti per tutti i profili, sblocco effettivo di ogni settore precedente, tattiche umane, durata percepita, animazioni/scudiere e interfaccia Android 9:16. Non è stato eseguito un playtest fisico.

**Prossima attività:** riprodurre Io con telemetria per ciclo (danno eruzione/carica/raffreddamento, riduzioni autentiche, carte giocabili e vitali), cercare eventuali errori logici concreti e modificare solo quelli; lasciare invariata la grafica ufficiale.
