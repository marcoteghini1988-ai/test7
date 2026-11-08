# Eclissi Stellare — boss 2–12: budget, rarità, Carte Personaggio e problemi ancora aperti

**8 novembre 2026 — benchmark riproducibile nel codice del repository ufficiale `test7/main`.**

## Cosa è stato verificato

L'audit `src/officialPostTerraBossBudget.test.js` costruisce una collezione **condizionata alla vittoria di tutti i settori precedenti**, usando le stesse soglie di 16 navi, i premi di primo completamento, la capienza vera del portafoglio e gli acquisti di potenziamento con `validateShipUpgradePurchase`. Nessuna vittoria precedente viene simulata in questo test: il presupposto è esplicito. Sono esclusi acquisti alternativi, capsule, personaggi e altre carte, quindi il budget rappresenta uno scenario favorevole **ma coerente con regole reali**, non un inventario universale garantito.

Ogni boss 2–12 viene affrontato con l'ultima madre ottenibile prima del settore, prima a L3 e poi a L5 **soltanto se il costo completo è pagabile**. Entrambi i livelli sono risultati finanziabili nello scenario di risparmio; il livello del boss, il suo modello fisso, mazzo numerico, potere, comandante e arena rimangono quelli ufficiali. Il giocatore ha solo il pilota starter e il mazzo speciale starter da 24: nessuna reliquia/boss deck futura gratuita.

## Risultati (5 seed per configurazione, 110 duelli)

| Boss | Madre reale disponibile | Vittorie L3 | Vittorie L5 |
|---|---|---:|---:|
| Marte | R01 | 1/5 | 4/5 |
| Venere | R03 | 2/5 | 3/5 |
| Saturno | R04 | 1/5 | 1/5 |
| Urano | E01 | 5/5 | 4/5 |
| Nettuno | E02 | 1/5 | 1/5 |
| **Plutone** | **E03** | **0/5** | **0/5** |
| Europa | E04 | 2/5 | 3/5 |
| Proxima b | L01 | 2/5 | 1/5 |
| Haumea | L02 | 3/5 | 3/5 |
| **Io** | **L03** | **0/5** | **1/5** |
| Encelado | L04 | 1/5 | 2/5 |

**Non è una percentuale prevista per utenti reali**. La difficoltà non è monotona in questi seed: Urano è più abbordabile di Saturno/Nettuno; Plutone genera soprattutto pareggi allo scadere dei 20 cicli e Io è molto pericoloso. Aumentare da L3 a L5 non garantisce di vincere più spesso, perché le mosse valide, il mazzo numerico e l'IA contano più della semplice rarità.

## Carte Personaggio realmente vinte: IA aggiornata e controprova

Il motore già richiedeva la **carta fisica speciale** e l'attivazione nel duello, ma `src/tacticalDuelAi.js` non includeva mai i Personaggi Boss nella propria lista di carte attivabili. È stata corretta l'IA: ora controlla **esclusivamente le carte realmente in mano**, già possedute e inserite nel mazzo, e sceglie un Personaggio se il suo effetto ha una condizione utile. Rispetta due cicli di durata e massimo uno attivo; non inventa carte, né bonus passivi. Il test `src/tacticalBossCharacterAi.test.js` riscatta il personaggio a seguito di una vittoria boss valida nella configurazione di prova, lo equipaggia esplicitamente e verifica l'attivazione e la permanenza di **una sola copia reale**.

`src/officialBossCharacterCounterplay.test.js` verifica il contributo di tre Carte Personaggio ottenibili **solo dopo** la vittoria dei boss precedenti. Gli sblocchi passati sono assunti, non simulati; per ottenere i trofei vengono usati i veri handler `claimBossCharacterFromVictory`, e il mazzo 24 viene ricostruito con `equipSpecialDeck`. Nessun boss passato si equipaggia automaticamente.

### Risultati con e senza tre personaggi (10 seed ciascuno)

| Boss | Mazzo speciale | Vittorie | Sconfitte | Pareggi | Attivazioni reali Personaggio |
|---|---|---:|---:|---:|---:|
| Plutone E03 L5 | Starter | 0 | 2 | 8 | 0 |
| Plutone E03 L5 | Gaia + Marte + Nettuno | 0 | 1 | 9 | 6 |
| Io L03 L5 | Starter | 4 | 5 | 1 | 0 |
| Io L03 L5 | Gaia + Marte + Europa | 4 | 4 | 2 | 6 |

**Risultato concreto:** i personaggi non vengono ignorati dall'IA e mitigano in alcuni casi le sconfitte, ma **non bastano a risolvere il blocco di Plutone entro 20 cicli**. Il mazzo e la tattica scelti sono solo una delle combinazioni possibili; non dimostrano che nessuna scelta umana possa sconfiggerlo.

## Prossime decisioni da verificare

1. **Plutone (settore 70):** quantificare vitale per vitale perché si arriva al limite dei 20 cicli con 0 vittorie, separando mancanza di formule, scudo riparato, danni, scelta bersaglio e numero di speciali realmente attivate. Evitare nerf senza diagnosi.
2. **Io (settore 110):** misurare pressione delle salve e impatto della sua abilità magmatica rispetto a L03/L05 e ai mazzi sbloccati; l'IA è diversa da un umano.
3. Confrontare deck speciali derivati da vere estrazioni, mazzi numerici boss acquistati e moduli acquisiti e **realmente equipaggiati**, senza trattarli come bonus gratuiti.
4. Un test Playtest su smartphone Android 9:16 resta da eseguire. Non dichiarare grafica o tempo dei boss verificati su dispositivo.

[Controllo GitHub Actions, 790 test superati](https://github.com/marcoteghini1988-ai/test7/actions/runs/42504668376).
