# Maglio Ferrogravitazionale — quattro rarità sulla plancia

22 novembre 2026, repository ufficiale `marcoteghini1988-ai/test7`.

Sostituiti i due precedenti render della Comune, che reinterpretavano il
modello della carta. Le otto nuove viste partono dalle illustrazioni delle
quattro carte ufficiali: basamento rettangolare basso, supporti angolari,
pistone corto e massiccio, cavi e testa corazzata. La Rara conserva il gruppo
posteriore aggiuntivo, l'Epica i condotti paralleli e i rinforzi, la Leggendaria
la testa anulare segmentata. Non sono semplici ricolorazioni della Comune.

## Riferimenti e asset

I fronti originali in `public/assets/fleet-weapon-fronts/` restano invariati.
I confronti mostrano la carta effettiva a sinistra e le due viste a destra.

| Rarità | ID carta | Danno nominale | Cartella delle due viste |
|---|---|---:|---|
| Comune | `weapon-confirmed-metallic-maglio` | 18 | `public/assets/fleet-weapons/maglio/` |
| Rara | `weapon-confirmed-metallic-maglio-rarity-r` | 46 | `public/assets/fleet-weapons/maglio/rara/` |
| Epica | `weapon-confirmed-metallic-maglio-rarity-e` | 109 | `public/assets/fleet-weapons/maglio/epica/` |
| Leggendaria | `weapon-confirmed-metallic-maglio-rarity-l` | 154 | `public/assets/fleet-weapons/maglio/leggendaria/` |

Ogni cartella contiene `player.webp` e `enemy.webp`. Sono render raster 3D
con trasparenza reale, precaricati, non mesh ruotabili. Il lato avversario
ha una vista dedicata del dispositivo girato sul tavolo; il secondo
alloggiamento usa l'orientamento orizzontale verso il centro della plancia.
I WebP hanno lato massimo 768 px, qualità 92; le otto viste occupano circa
1,2 MiB complessivi. La conversione non ridisegna l'illustrazione.

Prompt e riferimenti di generazione sono conservati in
[`provenienza-asset.json`](collaudi/maglio/rarita/provenienza-asset.json).

## Collegamento al combattimento

`src/maglioBattleVisuals.js` riconosce esattamente i quattro ID e seleziona
l'asset corretto. Proprietario, alloggiamento, bersaglio, blocco e danno
provengono dagli eventi autentici `weapon-base-shot` del motore.

`src/MaglioBattleEffects.jsx` misura l'origine sulla testa del dispositivo
e la destinazione sul pezzo realmente colpito. Ricalcola l'origine dopo
l'animazione di appoggio: durante lo sparo non resta la posizione transitoria
della comparsa. Madre, supporti, moduli e macchine mantengono la propria
identità. La carica, il rinculo, l'impulso e l'impatto partono solo se lo
sparo è riuscito; un'arma bloccata compare senza simulare un colpo.

La sequenza dura 2.200 ms, con 260 ms fra due Magli nello stesso turno.
Dopo gli effetti riparte il timer del turno; le Trappole conservano la
propria attesa più lunga. Alla scadenza la carta passa davvero negli scarti
e il dispositivo viene rimosso. Danni, difese, durata, IA e bilanciamento
restano quelli del motore. Nessuna modifica alla geometria della plancia.

## Collaudo riproducibile

```
node scripts/review-maglio.mjs
npm run dev
```

Aprire `/.maglio-review.html`. La prova monta lo stesso
`OfficialFleetBattle3D` ufficiale e usa `createFleetNextBattle`,
`resolvePreparedFleetTurn` e `autoFleetTurn`. Non legge né assegna inventario,
ricompense o salvataggi del giocatore. I due file HTML/JSX generati sono
ignorati da Git; l'app distribuita conserva il proprio ingresso normale.

I controlli consentono di scegliere rarità, supporti, alloggiamento,
arma bloccata, supporto con 1 HP e confronto con la carta originale.
La pila Energia vuota isola il Maglio dal colpo del Generatore.

## Risultati osservati su StackBlitz

Runtime verificato sul candidato `d8a75472f57236df710b0ef8db059721b91e01ab`,
con successiva rifinitura del solo titolo della pagina di confronto.
Prima della sincronizzazione è stato salvato un backup del lavoro locale.

| Rarità | Supporto del giocatore prima → dopo risposta IA | Supporto avversario prima → dopo colpo del giocatore | HP delle madri |
|---|---:|---:|---|
| Comune | 66 → 53 | 66 → 53 | invariati |
| Rara | 96 → 62 | 96 → 62 | invariati |
| Epica | 125 → 44 | 125 → 44 | invariati |
| Leggendaria | 174 → 59 | 174 → 59 | invariati |

I valori effettivi includono le difese già previste dal motore. Nelle
registrazioni si alternano entrambi gli alloggiamenti e i due bersagli
supporto. Sono presenti sia l'attacco del giocatore sia quello della vera IA.
Le otto immagini risultano caricate; dopo la sequenza non restano proiettili
e il Maglio scaduto del giocatore non resta in campo.

Ulteriori verifiche visive:

- Supporti con 1 HP: entrambi i Corvo Esploratore passano a 0, con stato
  distrutto; le due madri conservano gli HP iniziali.
- Leggendaria bloccata: nessuna carica o impulso del giocatore; tutti gli HP
  avversari invariati. La successiva risposta IA avviene normalmente.
- Tutte e quattro le rarità contro le madri: bersaglio e danno corrispondono
  agli eventi reali di entrambi i lati, senza passare a un supporto assente.

Il controllo della console non mostra errori dell'app nella finestra
osservata; sono presenti messaggi dell'estensione del browser, estranei al
renderer del gioco.

Verifica completa: **1.969/1.969 test**, build di produzione e preflight
superati. **74/74 test eseguiti anche su StackBlitz**:

```
node --test src/maglioBattleVisuals.test.js src/maglioRaritiesSupport.test.js src/fleetNextOfficialMaglioArt.test.js src/fleetNextProgressionUi.test.js
```

I 56 nuovi casi coprono rarità, proprietario, due alloggiamenti, due supporti,
colpi normali e letali, scelta della vera IA, bonus passivo alle Carte Arma,
blocco, scadenza e scarti. Le immagini dei fronti ufficiali sono verificate
contro gli hash approvati.

## Prove visive

- [Confronto Comune](collaudi/maglio/rarita/confronto-comune.jpg)
- [Confronto Rara](collaudi/maglio/rarita/confronto-rara.jpg)
- [Confronto Epica](collaudi/maglio/rarita/confronto-epica.jpg)
- [Confronto Leggendaria](collaudi/maglio/rarita/confronto-leggendaria.jpg)
- [Registrazione delle quattro rarità](collaudi/maglio/rarita/maglio-quattro-rarita.mp4)
- [Comune in partita, GIF](collaudi/maglio/maglio-in-partita.gif)
- [Supporti distrutti](collaudi/maglio/rarita/supporti-distrutti.jpg)
- [Test su StackBlitz](collaudi/maglio/rarita/stackblitz-test.jpg)
- [Misure e verifiche](collaudi/maglio/verifica.json)

GIF e video derivano da screenshot nativi della partita realmente eseguita,
con i tempi delle catture conservati. Le prove precedenti che mostravano il
vecchio modello Comune sono state sostituite.
