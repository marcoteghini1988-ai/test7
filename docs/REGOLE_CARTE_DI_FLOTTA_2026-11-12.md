# Eclissi Stellare — Regolamento ufficiale Carte di Flotta v1

Data: 12 novembre 2026. Repository ufficiale: `marcoteghini1988-ai/test7`, ramo `main`.

Questo documento descrive il **nuovo combattimento realmente instradato** da
`src/MathDuelBattle.jsx` a `src/FleetCardBattle.jsx`.
Il vecchio duello numerico resta temporaneamente nei sorgenti per migrazione e verifica
delle risorse grafiche: non è più l'ingresso della campagna.

## Pilastri

- **Carte navicella**: schierate prima della partita, prese solo dall'inventario reale.
  Da 1 a 3 unità, senza riserve o sostituzioni. Slot 2 dal settore 11, slot 3 dal settore 31.
- **Unico mazzo speciale** da 24 carte. Mano iniziale 5, massimo 2 speciali per round.
  A fine round una nuova carta, fino al massimo di 5 in mano.
- **Nessuna numerica**, nessun Poker, nessuna formula matematica e nessuna energia/mana.
  La flotta può sempre attaccare, anche senza carte giocate.
- **Un attacco di flotta per round**, scegliendo UNA navicella nemica e UNO dei
  suoi quattro componenti. Le azioni del giocatore e dell'avversario simulato
  sono risolte nello stesso istante. Campagna senza timer rigido.
- **IA PvP simulata**, fino all'introduzione del multiplayer reale.

## Quattro componenti, quattro conseguenze

Ogni componente attraversa gli stati **integro (0)** → **fratturato (1)**
→ **distrutto (2)**.

| Componente | Cambiamento permanente durante la battaglia |
| --- | --- |
| Motori | La nave non può più opporre la resistenza elementale dovuta alla mobilità |
| Armi | La nave non contribuisce più al fuoco della flotta |
| Generatore | Gli scudi vanno a zero e non possono essere riparati |
| Centralina | Si perde il bonus di sincronia degli attacchi collettivi |

Una navicella viene eliminata dopo la distruzione di **due componenti**.
Quando tutte le carte navicella di una parte sono eliminate, l'altra vince.
Se entrambe le flotte vengono eliminate nello stesso round è pareggio.

## Elementi e fratture

Quattro elementi in una relazione circolare:

**Refrigerante → Plasma → Minerale → Ionico → Refrigerante**.

La freccia indica l'efficacia contro il prossimo elemento. I colori e i nomi
sono visibili sulle carte navicella. Ogni nave ha un elemento fisso;
una carta può imporre per il round una variante di risonanza.

- Attacco normale: due fratture efficaci distruggono un componente.
- Vantaggio elementale o combo riuscita: la frattura può diventare immediatamente decisiva.
- La protezione assorbe i colpi finché è attiva; **Faglia** e **Colpo Perforante**
  permettono di saltare questa fase, al prezzo di una carta.
- Il danno alla protezione e ai componenti è determinato dal motore, non dall'animazione.

## Carte convertite

Le carte autentiche della precedente collezione mantengono ID, numero di copie
ed economia. Gli effetti del duello a carte sono risolti in
`fleetCardEffect()` / `resolveFleetCardRound()`:

- Fusione Assalto, Carica Cinetica e Carta Dorata aiutano le combo offensive;
- Impulso Ionico modifica la risonanza elementale;
- Copertura Tattica e Contromisura proteggono durante la risoluzione;
- Bomba, Soppressione e Malus disturbano il fuoco avversario;
- Riparazioni recuperano scudo o una frattura ancora riparabile;
- Ricambio Numerico è stato convertito in **ricambio tattico di carte**;
- Terreni PvP modificano il campo per due round; arena boss bloccata;
- Personaggi e moduli producono un bonus limitato a due round.

Le 12 passive dei boss sono ora operative nel sistema a carte, conservando
nome, pianeta e identità: corazza, assalto crescente, veleno, controtempo,
sifone, pressione, patto di sangue, rigenerazione, reattore, memoria degli
scarti, eruzione e dominio elementale. Ognuna ha un terreno boss permanente
e uno stato leggibile in battaglia. La conversione viene gestita da
`src/fleetBossPassives.js` e verificata da `src/fleetBossPassives.test.js`.

I livelli delle navicelle da 1 a 5 aumentano gli scudi e la forza delle armi
integrate: i valori derivano dal catalogo ufficiale delle 42 armi, non da
equipaggiamenti inventati. La madre è visualizzata al centro, le altre
due navicelle equipaggiate ai lati.

Sono stati convertiti gli effetti nel NUOVO duello anche per tutti i **35 Moduli**,
i **12 Personaggi Boss** e i **6 Oggetti Epici**, senza rinominare gli ID
salvati e senza regalare carte. Le abilita distinte sono dichiarate in
`src/fleetSpecialProfiles.js`; i test di ciascuna famiglia sono in
`src/fleetSpecialProfiles.test.js`. Si puo attivare un solo Personaggio
per volta; dura due round. Le reliquie mantengono le durate 1-2 round.
Alcuni miglioramenti dei Moduli hanno efficacia aumentata ai livelli
7-9, leggendo i livelli realmente acquistati.

Le descrizioni della nuova battaglia e dell'editor Mazzo Speciale e le
descrizioni Carte Modulo dello Shop riflettono le nuove regole. Nello Shop
la vecchia vendita dei mazzi numerici e stata sostituita dall'editor
del mazzo speciale; l'inventario dei vecchi acquisti rimane conservato.

**Ancora da fare:** aggiornare i PNG che citano numeri o formule,
rifinire le animazioni di tutte le armi e fare una prova visiva della
plancia su smartphone. Il codice storico e le descrizioni legacy restano
conservati per la migrazione, ma non sono la regola del duello attivo.

## Componenti del codice

- `src/fleetCardEngine.js`: regole pure, prova deterministica, IA nemica.
- `src/fleetBossPassives.js`: passive e terreni dei dodici boss.
- `src/fleetSpecialProfiles.js`: effetti distinti per 35 moduli, 12 personaggi e 6 epici.
- `src/FleetCardBattle.jsx`: plancia e controllo inventari/ricompense.
- `src/FleetCardBattle.css`: grafica usando le immagini 3D ufficiali.
- `src/fleetCardEngine.test.js`: regressioni su mazzi, elementi, fratture,
  distruzione, IA e risultato simultaneo.
- `src/MathDuelBattle.jsx`: ingresso della campagna e PvP simulato.

I test preesistenti dei vecchi sistemi rimangono nell'archivio per permettere
la migrazione completa senza cancellare accidentalmente ricompense o asset.

## Da verificare prima di dichiarare una versione definitiva

1. Compilazione del progetto e test automatici su GitHub Actions.
2. Prova visiva effettiva su smartphone 9:16 e in StackBlitz.
3. Bilanciamento su più seed IA e livelli nave 1–5.
4. Sostituzione dei PNG storici che riportano numeri/formule senza alterare gli ID delle carte.
5. Collaudo manuale di Shop, boss, animazioni HD e progressione su smartphone.
