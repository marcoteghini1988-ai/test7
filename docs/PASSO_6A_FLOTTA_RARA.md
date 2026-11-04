# Passo 6A — flotta rara

Quattro rare e nove armi del catalogo v0.1 sono disponibili nel selettore delle flotte di prova. Il duello comprende ora nove navi e sedici armi.

| Nave | Armamento | Moltiplicazione |
| --- | --- | --- |
| R01 Falco Binario | W08 Batteria Gemella ♥, W09 Canna Diamante ♦ con soglia 14 | Da L3 |
| R02 Manta Ionica | W10 Arco Ionico ♣, W11 Fulmine Incrociato ♠ con combo ♠ + ♣ | Da L3 |
| R03 Iride | W12 Raggio Vitale ♥, W13 Scheggia di Luce ♦, W14 Scarica delle Ombre ♠ con soglia 13 | Da L3 |
| R04 Squalo del Vuoto | W15 Lancia Minerale ♦, W16 Cannone Abissale ♣ con soglia 15 | Da L1 |

La combo W11 usa le picche come munizioni. La W08 alterna due bocche fisiche. I colpi conservano il bersaglio esatto e il danno del catalogo. Il selettore segnala quando una flotta non può risolvere tutti i tipi di motore installati sull’altra.

Ogni rara ha due viste WebP da 887 × 887 pixel nelle cartelle `public/assets/mathfleet/views/player_to_enemy` e `enemy_to_player`. I file conservano la trasparenza originale. I moduli e le aree di danno usano le coordinate misurate per ogni vista.

## Verifiche

- Build TypeScript/Vite, preflight e 72 test di logica riusciti in locale.
- Tre navi per lato a L1, sei immagini caricate e tre motori sullo Squalo del Vuoto. Il selettore blocca una flotta avversaria priva di × quando l’altra espone questo motore.
- 10 ♣ + A ♠ = 11 sul motore + dello Squalo a L1. L’arma universale ha sparato 11 colpi, Arco Ionico 10 e Fulmine Incrociato 1. Totale 45 danni, da 87 a 42 HP. Cannone Abissale a 10/15 senza scarica.
- K ♥ − 9 ♣ = 4 sul motore − di Iride. Le 13 munizioni di Batteria Gemella si sono alternate fra due bocche. KO del motore scelto e selezione automatica del motore superstite.
