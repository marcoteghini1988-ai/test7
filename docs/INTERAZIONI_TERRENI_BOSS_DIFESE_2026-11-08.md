# Eclissi Stellare — Terreni, Personaggi Boss e difese

**Revisione del 8 novembre 2026 · repository ufficiale:** `marcoteghini1988-ai/test7`, ramo `main`.

## Obiettivo

Chiudere le incongruenze fra Carte Terreno PvP, Carte Speciali di cura, Personaggi Boss e Barra Malus, senza alterare la plancia originale 9:16, le **17 navicelle / 42 armi**, la mano di **7 numeriche su 52** o quella di **5 speciali su 24**. Nessuna ricompensa, carta o valuta gratuita viene aggiunta.

## Regole applicate

Le **quattro Carte Terreno PvP** restano limitate al PvP: detriti, plasma, ionico e risonanza; una sola carta giocata impone il proprio ambiente per due cicli e agisce **in modo identico su A e B**. Se entrambi giocano un terreno nello stesso ciclo, l'interferenza annulla entrambi e non rimane alcun terreno attivo. I 12 boss della campagna conservano le proprie arene uniche e non ricevono Terreni PvP.

Il terreno **Faglia di Plasma** ha `repairFactor = .90`. Il problema scoperto era che quel fattore veniva applicato soltanto alla carta `support-shield-repair`, mentre molte altre carte di guarigione ignoravano lo stesso effetto ambientale. Ora il valore viene calcolato in modo uniforme con `pvpTerrainRepairAmount` prima di applicare l'efficienza del Generatore Scudi, che resta una regola indipendente.

| Riparazione autentica | Senza Plasma | Con Plasma |
| --- | ---: | ---: |
| Supporto: barriera madre | 20 HP | 18 HP |
| Modulo Toro L1: barriera madre | 9 HP | 8 HP |
| Personaggio Idra: rigenerazione scudo programmata | 4 HP | 3 HP |
| Faccia Cura del Dado Quantico | 8 HP | 7 HP |
| Carta Dorata ♥: barriera madre | 8 HP | 7 HP |
| Supporto: scudiera | 15 HP | 13 HP |
| Carta Dorata ♣: scudiera | 8 HP | 7 HP |

I valori sono **nominali**: se la barriera è quasi piena, se una scudiera ha meno HP da ripristinare, oppure se il Generatore è danneggiato, il recupero effettivo può essere inferiore. Il Drenaggio e la Singolarità, attivati mediante le proprie Carte Modulo, continuano a riparare soltanto in proporzione a danni **realmente** inflitti, quindi subiscono anche il Terreno senza diventare cure gratuite. **Non** è stato modificato l'effetto delle quattro Carte Terreno sulle armi o l'intercettazione: resta il bilanciamento già concordato.

L'altro difetto era nella **Barra Malus**: la Carta Modulo **Purificazione** eliminava correttamente il disturbo in `status[key].legacyDebuff`, ma il calcolo dei 25 punti di Sincronia iniziale controllava ancora l'oggetto originale `legacyEffects[key].debuff`. Di conseguenza `boost_jam` sottraeva 10 Sincronia nonostante la Purificazione. Ora la sottrazione avviene soltanto quando la penalità **effettivamente applicata** è ancora attiva. La carica positiva della Barra Malus del difensore non viene azzerata, e l'aggressore consuma la propria carta senza rimborsi automatici.

## File modificati

- `src/pvpTerrainCards.js`: helper numerico unico per i modificatori di riparazione.
- `src/simultaneousDuelEngine.js`: applicazione coerente a cura Supporto scudo/scudiere, rigenerazione Idra, Moduli, Dado/Dorata, e correzione della Purificazione contro `boost_jam`.
- `src/tacticalEquipmentCards.js`: cura dei Moduli soggetta al fattore terreno, preservando il sistema di simultaneità A/B già implementato.
- `src/bossCharacterCards.js`: rigenerazione Idra di una Carta Personaggio reale soggetta al fattore terreno; la funzione `restoreMotherShield` applica poi la penalità del Generatore.
- `src/tacticalLegacyEvents.js`: faccia Cura del Dado e ♥/♣ della Dorata soggette al terreno quando e solo quando è attivo.
- `src/tacticalTerrainSpecialInteractions.test.js` (**nuovo**): dieci test di integrazione su tutte le riparazioni, interazione con Purificazione, interferenza tra due Terreni, conservazione dei mazzi e assenza di carte gratuite.

## Verifica automatica

L'ultimo codice è sul commit `34dfd83f0baa3f616e8eb77759dd21391d9bbc38`: [GitHub Actions 42468917991](https://github.com/marcoteghini1988-ai/test7/actions/runs/42468917991), **730 test superati su 730**, `npm run build` e `npm run preflight` riusciti.

## Verifiche non ancora effettuate

- Test di gioco effettivi su Android 9:16 per verificare leggibilità delle Carte Terreno e dei pannelli HP, e l'animazione delle riparazioni.
- Playtest dei valori numerici 10% Plasma e delle cure delle Carte Modulo e Boss. Sono valori provvisori che potrebbero richiedere bilanciamento.
- PvP online server autorevole con due utenti reali. Il duello locale simultaneo e la suite non dimostrano la correttezza di una rete multiplayer.

**Vincoli da mantenere:** armi fisiche integrate e plancia invariati; abilità/equipaggiamenti attivabili solo tramite Carte Speciali autentiche.
