# Regola dei colpi e degli effetti delle carte — 24 novembre 2026

## Direzione della battaglia

Nella plancia verticale il giocatore A spara dal centro del bordo inferiore,
allineato alla porta USB del proprio telefono, verso il bersaglio avversario.
L'avversario B spara dal centro del bordo superiore, come se il colpo uscisse
dal suo dispositivo e arrivasse alle navi del giocatore. I due lati sono
speculari: nessun colpo nasce casualmente ai lati dell'arena, dalla carta o
da un punto estraneo alla prospettiva della partita.

## Contratto fra carta, motore e animazione

1. Ogni Carta Arma approvata ha un profilo visivo e sonoro esplicito per il
   proprio ID e per ciascuna rarità esistente. L'illustrazione, il suono e
   l'effetto di battaglia devono descrivere
   lo stesso apparecchio: un Maglio gravitazionale non lancia martelli a mano,
   una scarica Fulmine non diventa una palla di fuoco.
2. L'evento del motore stabilisce **se** parte un colpo, **quanti** impatti
   avvengono e **quali** bersagli e danni sono reali. Un colpo bloccato o non
   alimentato non produce un proiettile che colpisce. Un pluricolpo mostra
   gli impatti realmente calcolati, con i loro bersagli; non aggiungere danni
   o proiettili per rendere più spettacolare la rarità.
3. Comune → Rara → Epica → Leggendaria evolve la finitura dell'effetto:
   struttura del nucleo, scia, compressione, riflessi e onde d'impatto sempre
   più riconoscibili. Il **numero di colpi effettivi** cambia soltanto quando
   la meccanica della variante nel catalogo lo prevede. Per il Maglio sono
   sempre **un colpo e un bersaglio**, con danni nominali 18/46/109/154 HP;
   crescono da uno a quattro le rifiniture della scia e le onde dell'impatto.
4. Effetti con Energia usano il costo reale **per attacco**, quando previsto
   dalla carta. Energia presente per un bonus e Energia consumata sono
   visualmente distinguibili. La grafica non anticipa uno sparo che il
   motore non autorizza.
5. Il bersaglio si misura sul vero elemento della nave, supporto o modulo
   colpito nella plancia. La stessa regola vale per A e B, per gli slot Arma
   1 e 2, per il ritorno del colpo e per i colpi successivi.

## Applicazione alle categorie

Le **Armi** e le carte **Attacco** che producono danno leggono l'evento reale
e usano la traiettoria dal bordo del rispettivo giocatore. Un attacco ad area
ha un impatto per ogni bersaglio effettivamente colpito. **Difesa** e
**Trappola** reagiscono nel punto del blocco o della rivelazione; **Energia**
si carica nello slot; **Terreno** modifica il campo; **Personaggio** mostra
la propria attivazione. Queste carte non inventano un proiettile offensivo.

Il rendering legge i colpi base, criogenici, pluricolpo, progettati e
provvisori, oltre all'impatto unico delle Armi che nel motore sommano la loro
potenza. **L'elemento da solo non definisce l'effetto di una carta**: le altre
Armi mantengono la visualizzazione provvisoria precedente, senza un profilo
univoco approvato. Le prove con dieci simboli/forme elementali non erano
effetti definitivi delle singole Armi e sono state ritirate.

## Ogni nuova carta approvata

Insieme al fronte completo, definire per ciascuna rarità esistente l'aspetto
dello sparo, la scia, l'impatto e il suono coerenti con il dispositivo della
carta. Collegare i profili agli ID esatti, agli eventi reali del motore e alle
due direzioni della plancia. Salvare carte, codice e suoni in `test7/main`,
quindi aprire la versione GitHub in StackBlitz e verificare visivamente in
partita card, slot, bersaglio, sequenza video e audio sincronizzato. Solo dopo
questo collaudo il fronte e il suo effetto si considerano integrati.

I quattro fronti del Maglio sono PNG 3072×4608. Comune, Rara, Epica e
Leggendaria mantengono un unico colpo reale, con scia, impatto e suono distinti.
