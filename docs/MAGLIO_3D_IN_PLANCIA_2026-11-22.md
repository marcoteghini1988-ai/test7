# Maglio Ferrogravitazionale — viste davanti/dietro e movimento d'attacco

22 novembre 2026, repository ufficiale `marcoteghini1988-ai/test7`.

Le quattro rarità hanno due render assiali dedicati. Sul lato giocatore si
vede il retro del dispositivo, rivolto verso il fondo della plancia. Sul
lato avversario si vede il fronte, rivolto verso il giocatore. Entrambi gli
alloggiamenti mantengono questo orientamento: rimossi gli specchi orizzontali
che facevano apparire l'arma puntata a destra o a sinistra.

Le immagini partono dalle quattro illustrazioni ufficiali. Conservano
basamento basso rettangolare, supporti angolari, pistone massiccio, cavi e
moduli distintivi. La Rara aggiunge il gruppo posteriore e il condensatore
laterale, coerente fra le due viste; l'Epica ha i tre condotti e rinforzi;
la Leggendaria ha la testa anulare a sei segmenti. I fronti delle carte,
le loro cornici e i simboli rimangono quelli approvati.

## Asset e collegamento al catalogo

| Rarità | ID carta | Danno nominale | Cartella delle due viste |
|---|---|---:|---|
| Comune | `weapon-confirmed-metallic-maglio` | 18 | `public/assets/fleet-weapons/maglio/` |
| Rara | `weapon-confirmed-metallic-maglio-rarity-r` | 46 | `public/assets/fleet-weapons/maglio/rara/` |
| Epica | `weapon-confirmed-metallic-maglio-rarity-e` | 109 | `public/assets/fleet-weapons/maglio/epica/` |
| Leggendaria | `weapon-confirmed-metallic-maglio-rarity-l` | 154 | `public/assets/fleet-weapons/maglio/leggendaria/` |

Ogni cartella contiene `player.webp` e `enemy.webp`. Sono render raster 3D
con alpha reale e lato massimo 768 px, precaricati prima dello sparo.
La vista cambia fisicamente davanti/dietro, mantenendo la prospettiva del
tavolo; il codice anima questi sprite sul piano della plancia. La
conversione PNG → WebP qualità 92 mantiene proporzioni e trasparenza.

Prompt e sorgenti dei render:
[`provenienza-asset.json`](collaudi/maglio/rarita/provenienza-asset.json).
Le carte originali in `public/assets/fleet-weapon-fronts/` non cambiano;
i test confrontano i loro hash con gli originali approvati.

## Affondo verso il bersaglio

`maglioAttackMotion` in `src/maglioBattleVisuals.js` ricava la direzione dalla
posizione della testa e dal bersaglio realmente risolto dal motore. Il
Maglio compie un breve affondo di massimo 14 px nel sistema 450×800 della
plancia, spara, rincula nella direzione opposta e torna alla posizione
iniziale. Per bersagli molto vicini il percorso si riduce per evitare di
oltrepassarli. Vale per madre, supporti e altri bersagli validi del motore,
per entrambi i lati e alloggiamenti.

L'affondo parte fra 640 e 730 ms, conserva la posizione di tiro fino a
980 ms e rientra entro 1.240 ms. La sequenza completa rimane di 2.200 ms,
con 260 ms fra due Magli nello stesso turno. Il timer successivo parte dopo
gli effetti; le Trappole conservano la loro attesa più lunga.

`src/MaglioBattleEffects.jsx` misura le posizioni DOM reali e collega
l'origine dell'impulso alla testa nella posizione avanzata. Dopo l'appoggio
iniziale rimisura l'arma; un eventuale resize durante l'affondo ricostruisce
la posizione a riposo prima di ricalcolare il percorso. Le variabili del
movimento vengono rimosse alla fine della risoluzione.

Solo un evento `weapon-base-shot` riuscito produce affondo, carica, rinculo
e impulso. Un Maglio bloccato compare e resta fermo, senza simulare danni.
La scadenza e gli scarti seguono lo stato effettivo del motore. Il renderer
usa bersaglio e danno già risolti; bilanciamento, durata della carta,
difese, IA e geometria della plancia sono invariati. La preferenza
`prefers-reduced-motion` disattiva affondo e rinculo.

## Collaudo riproducibile

```
node scripts/review-maglio.mjs
npm run dev
```

Aprire `/.maglio-review.html`. La pagina monta lo stesso
`OfficialFleetBattle3D` ufficiale e usa `createFleetNextBattle`,
`resolvePreparedFleetTurn` e `autoFleetTurn`. Non legge né assegna inventario,
ricompense o salvataggi. I file HTML/JSX generati sono ignorati da Git.

I controlli scelgono rarità, supporti, alloggiamento, arma bloccata,
supporto con 1 HP e confronto con la carta originale. La pila Energia
vuota isola il Maglio dal colpo del Generatore.

## Risultati su StackBlitz

Runtime collaudato sul candidato `bffb006d82afdfc69bed48b30e546a18d8fc0d74`.
La sessione conteneva dipendenze locali meno recenti: prima di allinearle
è stato conservato un backup; le dipendenze della partita sono state poi
sincronizzate dal candidato ufficiale e la pagina ricaricata.

| Rarità | Supporto del giocatore prima → dopo risposta IA | Supporto avversario prima → dopo attacco | HP madri |
|---|---:|---:|---|
| Comune | 66 → 53 | 66 → 53 | invariati |
| Rara | 96 → 62 | 96 → 62 | invariati |
| Epica | 125 → 44 | 125 → 44 | invariati |
| Leggendaria, prova letale | 1 → 0 | 1 → 0 | invariati |

Il danno effettivo include le difese del motore e gli HP rimasti sul
bersaglio. Nella prova letale entrambi i Corvo Esploratore risultano
realmente distrutti; il dato di 1 HP è una condizione della fixture.

Le registrazioni includono giocatore e vera IA, entrambi gli alloggiamenti
e affondi verso sinistra e verso destra. Le misure verificano che il
movimento sia collineare al bersaglio e che la posizione torni a zero prima
della fine della sequenza. Durante il tiro l'origine dell'impulso coincide
con la testa avanzata; lo scarto massimo misurato nei fotogrammi scelti è
inferiore a 0,03 px logici. Le otto immagini sono caricate. Dopo gli effetti
non restano proiettili e il Maglio scaduto del giocatore lascia il campo.

Prove aggiuntive nella stessa sessione:

- Contro la madre: Lince Solare 339 → 321, Aurora-0 435 → 418 dopo la
  risposta IA; affondo diretto verso la rispettiva nave colpita.
- Arma bloccata: movimento massimo del giocatore 0 px, zero impulsi e HP
  avversari invariati; la successiva risposta IA avviene normalmente.

Verifica completa: **1.976/1.976 test**, build di produzione e preflight
superati. **81/81 test passati anche su StackBlitz**:

```
node --test src/maglioBattleVisuals.test.js src/maglioRaritiesSupport.test.js src/fleetNextOfficialMaglioArt.test.js src/fleetNextProgressionUi.test.js
```

La copertura comprende quattro rarità, entrambi i proprietari e
alloggiamenti, madre e due supporti, colpi normali e letali, vera IA,
bonus passivi, blocco, scadenza, scarti e geometria dell'affondo.

## Prove visive aggiornate

- [Comune dal retro e dal fronte](collaudi/maglio/rarita/confronto-comune.jpg)
- [Rara dal retro e dal fronte](collaudi/maglio/rarita/confronto-rara.jpg)
- [Epica dal retro e dal fronte](collaudi/maglio/rarita/confronto-epica.jpg)
- [Leggendaria dal retro e dal fronte](collaudi/maglio/rarita/confronto-leggendaria.jpg)
- [Video delle quattro rarità in partita](collaudi/maglio/rarita/maglio-quattro-rarita.mp4)
- [Comune: affondo, colpo e rientro, GIF](collaudi/maglio/maglio-in-partita.gif)
- [Test su StackBlitz](collaudi/maglio/rarita/stackblitz-test.jpg)
- [Misure e verifiche](collaudi/maglio/verifica.json)

GIF, video e schermate derivano dalla partita effettivamente eseguita;
conservano la cadenza delle catture native. Sostituiscono le prove delle
precedenti viste diagonali.
