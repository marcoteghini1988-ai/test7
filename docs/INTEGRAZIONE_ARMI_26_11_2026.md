# Integrazione del registro 26/11 — fase 1

Valori nominali fissati per tutte le 22 famiglie (57 varianti). **20 famiglie (53 varianti) collegate a catalogo, collezione, acquisto, evoluzione, selezione e motore HP. Due famiglie (4 varianti) restano non giocabili**: entrambe le olografiche. Eclissi Quantistica dispone ora di scelte segrete nella partita locale. Nessuna grafica viene approvata o sostituita. Le armi nuove non usano il moltiplicatore storico per rarità una seconda volta. La taratura non è dichiarata verificata finché non sono completate le prove di combattimento.

## Valori nominali

| Famiglia | Rarità | Valori (HP o parametri espliciti) | Stato |
| --- | --- | --- | --- |
| Condotto di Marea Laterale | Rara/Epica/Leggendaria | baseDamage=38, commandRate=0 / baseDamage=68, commandRate=1 / baseDamage=100, commandRate=2 | Motore collegato |
| Disgregatore di Pressione Isobarica | Rara/Epica/Leggendaria | baseDamage=30 / baseDamage=52 / baseDamage=78 | Motore collegato |
| Generatore Sismico Tettonico | Rara/Epica/Leggendaria | baseDamage=30, secondDamage=15 / baseDamage=52, secondDamage=26 / baseDamage=72, secondDamage=36 | Motore collegato |
| Generatore di Tempeste Silicee | Rara/Epica/Leggendaria | baseDamage=16 / baseDamage=26 / baseDamage=34 | Motore collegato |
| Lanciatore di Macigni Tettonici | Rara/Epica/Leggendaria | baseDamage=38, recoilDamage=18 / baseDamage=65, recoilDamage=30 / baseDamage=95, recoilDamage=44 | Motore collegato |
| Collettore di Frammenti Minerali | Rara/Epica/Leggendaria | baseDamage=27 / baseDamage=46 / baseDamage=68 | Motore collegato |
| Generatore di Vortici Ciclonici | Epica/Leggendaria | damagePerDiscard=3, energyCost=3 / damagePerDiscard=4, energyCost=4 | Motore collegato |
| Turbina a Spinta Eolica | Rara/Epica/Leggendaria | baseDamage=12, energyCost=1 / baseDamage=20, energyCost=1 / baseDamage=30, energyCost=1 | Motore collegato |
| Boato Cosmico | Rara/Epica/Leggendaria | baseDamage=55 / baseDamage=85 / baseDamage=120 | Motore collegato |
| Convertitore di Energia Cinetica | Rara/Epica/Leggendaria | conversionPercent=100 / conversionPercent=100 / conversionPercent=100 | Motore collegato |
| Cannone a Concentrazione Solare | Epica/Leggendaria | damages=[60,92,130] / damages=[95,145,200] | Motore collegato |
| Emettitore di Fotoni Riflessi | Rara/Epica/Leggendaria | baseDamage=38, energyGain=1 / baseDamage=64, energyGain=2 / baseDamage=95, energyGain=2 | Motore collegato |
| Replicatore Olografico | Epica/Leggendaria | soloMultiplier=0.7, comboMultiplier=1 / soloMultiplier=0.7, comboMultiplier=1 | Bloccata |
| Proiettore Olografico | Epica/Leggendaria | soloMultiplier=0.7, comboMultiplier=1 / soloMultiplier=0.7, comboMultiplier=1 | Bloccata |
| Lanciatore a Eclissi Quantistica | Rara/Epica/Leggendaria | baseDamage=38, bonusDamage=28 / baseDamage=64, bonusDamage=46 / baseDamage=95, bonusDamage=70 | Motore e scelta locale collegati |
| Disgregatore a Inversione Vitale | Rara/Epica/Leggendaria | baseDamage=28, maxExtraDamage=40, gapPercent=20 / baseDamage=50, maxExtraDamage=65, gapPercent=20 / baseDamage=70, maxExtraDamage=90, gapPercent=20 | Motore collegato |
| Drone Parassita | Rara/Epica/Leggendaria | baseDamage=24 / baseDamage=40 / baseDamage=58 | Motore collegato |
| Estrattore di Materia Oscura | Rara/Epica/Leggendaria | baseDamage=35 / baseDamage=58 / baseDamage=88 | Motore collegato |
| Generatore di Massa Inerziale | Epica/Leggendaria | perCardDamage=19 / perCardDamage=29 | Motore collegato |
| Implosore a Singolarità | Epica/Leggendaria | boostPercent=20 / boostPercent=30 | Motore collegato |
| Generatore di Oscurità Gravitazionale | Epica/Leggendaria | baseDamage=3 / baseDamage=4 | Motore collegato |
| Tenebre Infinite | Leggendaria | discardMultiplier=1 | Motore collegato |

## Decisioni di implementazione e verifiche residue

- Rarità non specificate: Rara per Turbina, Emettitore, Disgregatore Ombra e coppia Parassita. Turbina: 1 carica Vento, durata di un turno; spinta se almeno un supporto subisce danni. Effetto sui successivi attacchi a bersaglio singolo; l'area mantiene i propri bersagli.
- Sismico e Silice: gli impatti su tutte le navi includono la madre; la sospensione della protezione vale nel turno di attivazione della tempesta. Le energie sono cariche consumate tramite la pila esistente.
- Isobarica: base attiva, Personaggio non ancora collegato (scheda compatibile da progettare). In assenza del bersaglio originale usa un bersaglio valido a potenza D.
- Collettore: due turni, pari rarità; frammenti intercettati prima del proprio colpo. Il danno ripartito usa arrotondamento conservativo. Boato: contraccolpo nominale del 25% per nave, limitato ai suoi HP reali; Convertitore solo stessa rarità, anche stesso turno.
- Emettitore: cariche virtuali Luce, non nuove carte fisiche. Cura Estrattore sulla nave viva con percentuale di HP più bassa, non oltre max HP.
- Massa: risoluzione a fine turno nemico, ogni carta effettivamente giocata; bersaglio agganciato. Singolarità assorbe potenze delle altre Armi prima della difesa/affinità del bersaglio, poi applica il bonus e la pipeline una sola volta; non assorbe la Speciale della madre. Verificare percorsi speciali e combo.
- Tenebre: B giocabile al terzo turno A, anche A Epica; costo di equilibrio costituito da uno slot e una giocata. L'ombra conta le carte fisiche persistenti, non le duplicazioni grafiche degli scarti; la geometria delle fasce è una scelta tecnica da collegare all'effetto visivo. Nessuna carta contata viene consumata. Il moltiplicatore è applicato a tutte le carte contate senza tagliare il numero degli scarti.
- Marea: 15 secondi effettivi del turno del giocatore colpito, solo sulla Centralina; il malus non introduce deterioramento HP. Controllare tutte le modalità di cronometro.
- Ologrammi rimangono bloccati. Eclissi Quantistica: previsione bloccata al primo turno avversario; tempo esaurito/IA senza scelta esplicita generano una scelta pseudo-casuale indipendente; bersaglio selezionato al rilascio. UI locale non pubblica le scelte prima della comparsa. Il futuro PvP di rete dovrà conservare le scelte sul server.
- Test mirati e simulazione PvP/boss richiesti. Grafica PNG ufficiale, VFX/SFX/aptica e collaudo visivo ancora da creare/approvare. Non dichiarare tutti gli effetti conclusi.
