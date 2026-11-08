# Eclissi Stellare — matrice difficoltà dei 12 boss (8 novembre 2026)

## Stato verificato in `test7/main`
A seguito del bilanciamento **precisione 6/8 HP**, della **mira di esposizione a soglia barriera** e del **ricambio numerico ruotato** già implementati, sono state eseguite simulazioni riproducibili con **12 boss × 3 navi × 3 seed = 108 duelli completi**, con IA locale sui due lati e fino a 20 cicli 30+8. Le navi sono istanziate come *carte possedute* con livelli verificati e il mazzo speciale del giocatore è lo **starter di 24 carte**. Il test non finge sblocchi boss, abilità o personaggi posseduti. Ogni vittoria è l'unico esito premiabile.

Codice: `src/officialBossEncounter.test.js`, caso `Matrice multi-seed dei 12 boss`. Semi **17, 171, 2026**. Con l'ultima miglioria IA (`src/tacticalDuelAi.js`), l'IA sceglie una formula valida a 3 numeriche **soltanto se** può chiudere un vitale con 7–8 HP, conservando le 2 carte quando bastano 6 HP o quando il vitale è ancora integro. Nessuna lettura di firme segrete o carte avversarie. Test `src/tacticalDuelAi.test.js`.

## Risultati aggregati
| Nave giocatore | Livello | Vittorie | Sconfitte | Pareggi | Campione |
|---|---:|---:|---:|---:|---:|
| C01 Lince Solare (comune) | 1 | **0** | 35 | 1 | 36 |
| R04 Squalo del Vuoto (rara) | 3 | **5** | 22 | 9 | 36 |
| L04 (leggendaria) | 5 | **8** | 14 | 14 | 36 |
| **Totale** | | **13** | **71** | **24** | **108** |

Questo è un **benchmark IA contro IA**, non una probabilità di successo per giocatori umani. Il fatto che C01 L1 perda o pareggi 36 volte, anche sul primo boss, è un segnale che la progressione iniziale va collaudata con attenzione. Un L04 L5 con lo stesso mazzo starter ottiene vittorie, ma non domina; questo indica che gli upgrade della nave aiutano senza cancellare la necessità di scelte tattiche e collezioni.

**Osservazioni di settore:** Marte permette vittorie già con R04 L3 e L04 L5, mentre Europa, Proxima b ed Encelado non mostrano vittorie in nessuna delle nove configurazioni del campione. Il fatto che un boss avanzato sia molto difficile può essere corretto, ma non va confuso con l'impossibilità tecnica: serve verificare con le **reali** carte, i piloti e i mazzi boss che il giocatore può avere ottenuto prima di quel settore.

## Prossimo controllo vincolante
1. Ricostruire l'equipaggiamento ottenibile prima di ciascun boss da progressione reale: navicelle sbloccate, Polvere Stellare, mazzi numerici boss posseduti, livelli passivi, 33 personaggi/piloti, moduli ed Epici **solo se legittimamente ottenuti**. Non assegnare a un giocatore carte inesistenti per dimostrare che il boss è vincibile.
2. Ampliare i seed e verificare la disponibilità delle firme 2/3 numeriche, le soglie di avaria, l'effetto della centralina, i turni di gioco e l'IA del boss prima di toccare i numeri di attacco/difesa.
3. Verificare il **primo boss Terra settore 10** con una nave e un mazzo realisticamente ottenibili senza acquisti, anche con scelte manuali diverse dall'IA. La sola C01 L1 con starter non è un profilo sufficiente per dichiarare il boss impossibile.
4. Non alterare l'ambientazione boss, le 42 armi integrate, i modelli 3D, la durata 30+8, i due mazzi distinti e la regola di vittoria solo con tutti e quattro i vitali KO.
5. Le 12 passive numeriche boss, le 12 esclusive boss, le Carte Personaggio Boss e le carte equipaggiamento sono sistemi distinti. Non fonderli in un buff gratuito.

## Verifica automatica
[GitHub Actions 42493597908](https://github.com/marcoteghini1988-ai/test7/actions/runs/42493597908): **772 test superati, 0 falliti**, build Vite e preflight grafico riusciti. I dati aggregati provengono direttamente dal log `ECLISSI_BOSS_MATRIX` dell'azione. Nessun collaudo tattile Android o test PvP umano è stato eseguito.
