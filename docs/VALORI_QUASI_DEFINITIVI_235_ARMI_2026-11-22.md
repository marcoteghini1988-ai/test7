# Eclissi Stellare — valori quasi definitivi delle 235 Carte Arma

**22 novembre 2026 — Repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`.**

## Decisione operativa consolidata

Non aspettiamo che siano create tutte le carte Pilota, Difesa e Trappola. La versione numerica **quasi definitiva** delle Armi e' stata applicata direttamente alla battaglia attiva.

- **73 famiglie di Armi originali e 162 evoluzioni = 235 versioni**, tutte mantenute.
- Coefficienti gia' collaudati: **Comune ×0,60**, **Rara ×1,00**, **Epica ×1,70**, **Leggendaria ×1,85**.
- I valori qui indicati sono i **nominali per carta** tratti dal gioco effettivo e verificati rispetto al coefficiente in combattimento, non una nuova taratura teorica.
- Colpi, durate, prerequisiti, costi Energia, relazioni elementali, Terreni, coperture e identificativi non cambiano. Veleno e Rigenerazione rimangono effetti per **secondo reale**.
- I colpi percentuali (per esempio Giudizio Temporale 20% HP massimi) non applicano due volte la rarita'.
- Il motore conserva i dati sorgente per compatibilita' storica; la schermata della battaglia, il Bazar e i mazzi consultano `WEAPON_NEAR_FINAL_BY_ID` con il danno nominale gia' calcolato.
- I danni **effettivi** dipendono da attivazioni, scudi, avversario, Terreno, passive e limiti di danno, quindi possono essere inferiori o superiori ai valori della scheda.
- Si correggeranno solo **singoli casi anomali**, non tutta la curva, quando saranno progettate le altre carte.

**Verifica automatica:** `LOCK_235_WEAPON_VALUES`, 1905/1905 test riusciti in `src/fleetNextWeaponNearFinal.test.js`; build Vite e collaudo mobile riusciti.

## Versioni per rarita'

| Rarita' | Numero |
|---|---:|
| Comune | 32 |
| Rara | 59 |
| Epica | 71 |
| Leggendaria | 73 |
| **Totale** | **235** |

## Catalogo completo delle 235 versioni

La tabella contiene i valori nominali prima degli altri modificatori. Per armi multi-fase, valori separati da `/` indicano le fasi; per le Armi percentuali sono percentuali degli HP massimi. L'esatta condizione di attivazione compare nel testo della carta nel gioco.

| Carta Arma | Rarità | Elemento | Meccanica | Danno nominale | Durata (turni propri) |
|---|---|---|---|---|---:|
| Lancia di Pressione Lamellare | Comune | aerial | base-shot | 11 HP | 1 |
| Lancia di Pressione Lamellare | Rara | aerial | base-shot | 29 HP | 1 |
| Lancia di Pressione Lamellare | Epica | aerial | base-shot | 70 HP | 1 |
| Lancia di Pressione Lamellare | Leggendaria | aerial | base-shot | 98 HP | 1 |
| Cannone Vorticatore a Doppia Turbina | Comune | aerial | base-shot | 15 HP | 1 |
| Cannone Vorticatore a Doppia Turbina | Rara | aerial | base-shot | 38 HP | 1 |
| Cannone Vorticatore a Doppia Turbina | Epica | aerial | base-shot | 90 HP | 1 |
| Cannone Vorticatore a Doppia Turbina | Leggendaria | aerial | base-shot | 128 HP | 1 |
| Arpione di Bora Astrale | Rara | aerial | base-shot | 33 HP | 1 |
| Arpione di Bora Astrale | Epica | aerial | base-shot | 78 HP | 1 |
| Arpione di Bora Astrale | Leggendaria | aerial | base-shot | 111 HP | 1 |
| Cannone Cicloreattore Grandinifero | Epica | aerial | wind-cycloreactor | 14/20/27 HP per fase | 3 |
| Cannone Cicloreattore Grandinifero | Leggendaria | aerial | wind-cycloreactor | 19/30/39 HP per fase | 3 |
| Obice a Frantumazione Polare | Comune | cryogenic | sweep-shot | 7 HP | 1 |
| Obice a Frantumazione Polare | Rara | cryogenic | sweep-shot | 18 HP | 1 |
| Obice a Frantumazione Polare | Epica | cryogenic | sweep-shot | 44 HP | 1 |
| Obice a Frantumazione Polare | Leggendaria | cryogenic | sweep-shot | 61 HP | 1 |
| Torretta a Pistoni Glaciali | Comune | cryogenic | repeat-shot | 11 HP | 2 |
| Torretta a Pistoni Glaciali | Rara | cryogenic | repeat-shot | 28 HP | 2 |
| Torretta a Pistoni Glaciali | Epica | cryogenic | repeat-shot | 66 HP | 2 |
| Torretta a Pistoni Glaciali | Leggendaria | cryogenic | repeat-shot | 93 HP | 2 |
| Batteria a Scarica di Brina | Epica | cryogenic | energy-burst-shot | 41 HP + fino a 2 × 20 HP | 1 |
| Batteria a Scarica di Brina | Leggendaria | cryogenic | energy-burst-shot | 57 HP + fino a 2 × 30 HP | 1 |
| Cannone Acceleratore Boreale | Rara | cryogenic | boreal-binary | 16 HP → 20 HP | 1 |
| Cannone Acceleratore Boreale | Epica | cryogenic | boreal-binary | 37 HP → 48 HP | 1 |
| Cannone Acceleratore Boreale | Leggendaria | cryogenic | boreal-binary | 54 HP → 67 HP | 1 |
| Perforatore dell’Inverno Nero | Comune | cryogenic | ice-needle | supporti 7 HP (con Terreno 9 HP) | 1 |
| Perforatore dell’Inverno Nero | Rara | cryogenic | ice-needle | supporti 18 HP (con Terreno 23 HP) | 1 |
| Perforatore dell’Inverno Nero | Epica | cryogenic | ice-needle | supporti 44 HP (con Terreno 54 HP) | 1 |
| Perforatore dell’Inverno Nero | Leggendaria | cryogenic | ice-needle | supporti 61 HP (con Terreno 78 HP) | 1 |
| Batteria di Dardi Polari | Comune | cryogenic | spread | 3 × 6 HP | 1 |
| Batteria di Dardi Polari | Rara | cryogenic | spread | 3 × 15 HP | 1 |
| Batteria di Dardi Polari | Epica | cryogenic | spread | 3 × 36 HP | 1 |
| Batteria di Dardi Polari | Leggendaria | cryogenic | spread | 3 × 52 HP | 1 |
| Cannone a Condensazione Glaciale | Comune | cryogenic | single | 12 HP | 1 |
| Cannone a Condensazione Glaciale | Rara | cryogenic | single | 31 HP | 1 |
| Cannone a Condensazione Glaciale | Epica | cryogenic | single | 73 HP | 1 |
| Cannone a Condensazione Glaciale | Leggendaria | cryogenic | single | 104 HP | 1 |
| Cannone a Compressione Criogenica d’Impulso | Rara | cryogenic | energy-charge-burst | 18 HP | 1 |
| Cannone a Compressione Criogenica d’Impulso | Epica | cryogenic | energy-charge-burst | 43 HP | 1 |
| Cannone a Compressione Criogenica d’Impulso | Leggendaria | cryogenic | energy-charge-burst | 61 HP | 1 |
| Balestra di Nebbia Gelata | Comune | cryogenic | polarity-shot | 11 HP + combo 10 HP | 1 |
| Balestra di Nebbia Gelata | Rara | cryogenic | polarity-shot | 28 HP + combo 24 HP | 1 |
| Balestra di Nebbia Gelata | Epica | cryogenic | polarity-shot | 66 HP + combo 58 HP | 1 |
| Balestra di Nebbia Gelata | Leggendaria | cryogenic | polarity-shot | 93 HP + combo 81 HP | 1 |
| Dardiera della Brina Inversa | Rara | cryogenic | polarity-shot | 24 HP + combo 16 HP | 1 |
| Dardiera della Brina Inversa | Epica | cryogenic | polarity-shot | 58 HP + combo 37 HP | 1 |
| Dardiera della Brina Inversa | Leggendaria | cryogenic | polarity-shot | 81 HP + combo 54 HP | 1 |
| Martello a Massa Piegata | Comune | gravity | base-shot | 13 HP | 1 |
| Martello a Massa Piegata | Rara | gravity | base-shot | 34 HP | 1 |
| Martello a Massa Piegata | Epica | gravity | base-shot | 80 HP | 1 |
| Martello a Massa Piegata | Leggendaria | gravity | base-shot | 113 HP | 1 |
| Cannone Fusore a Orbite Gemelle | Comune | gravity | base-shot | 16 HP | 1 |
| Cannone Fusore a Orbite Gemelle | Rara | gravity | base-shot | 40 HP | 1 |
| Cannone Fusore a Orbite Gemelle | Epica | gravity | base-shot | 95 HP | 1 |
| Cannone Fusore a Orbite Gemelle | Leggendaria | gravity | base-shot | 133 HP | 1 |
| Emettitore a Catenaria di Distorsione | Comune | gravity | base-shot | 19 HP | 1 |
| Emettitore a Catenaria di Distorsione | Rara | gravity | base-shot | 47 HP | 1 |
| Emettitore a Catenaria di Distorsione | Epica | gravity | base-shot | 112 HP | 1 |
| Emettitore a Catenaria di Distorsione | Leggendaria | gravity | base-shot | 159 HP | 1 |
| Obice a Compressione Assiale | Rara | gravity | base-shot | 38 HP | 1 |
| Obice a Compressione Assiale | Epica | gravity | base-shot | 90 HP | 1 |
| Obice a Compressione Assiale | Leggendaria | gravity | base-shot | 128 HP | 1 |
| Cannone a Pettine Ionico di Vega | Comune | ionic | base-shot | 12 HP | 1 |
| Cannone a Pettine Ionico di Vega | Rara | ionic | base-shot | 31 HP | 1 |
| Cannone a Pettine Ionico di Vega | Epica | ionic | base-shot | 73 HP | 1 |
| Cannone a Pettine Ionico di Vega | Leggendaria | ionic | base-shot | 104 HP | 1 |
| Lanciadardi a Spirale di Tesla | Comune | ionic | base-shot | 14 HP | 1 |
| Lanciadardi a Spirale di Tesla | Rara | ionic | base-shot | 37 HP | 1 |
| Lanciadardi a Spirale di Tesla | Epica | ionic | base-shot | 87 HP | 1 |
| Lanciadardi a Spirale di Tesla | Leggendaria | ionic | base-shot | 124 HP | 1 |
| Sferzatore Ionico di Rame Lunare | Comune | ionic | base-shot | 17 HP | 1 |
| Sferzatore Ionico di Rame Lunare | Rara | ionic | base-shot | 43 HP | 1 |
| Sferzatore Ionico di Rame Lunare | Epica | ionic | base-shot | 102 HP | 1 |
| Sferzatore Ionico di Rame Lunare | Leggendaria | ionic | base-shot | 144 HP | 1 |
| Cannone del Lampo Bianco | Rara | ionic | base-shot | 34 HP | 1 |
| Cannone del Lampo Bianco | Epica | ionic | base-shot | 82 HP | 1 |
| Cannone del Lampo Bianco | Leggendaria | ionic | base-shot | 115 HP | 1 |
| Cannone Condensatore della Tempesta Stellare | Epica | ionic | storm-capacitor | 31 HP + 14 HP/supporto | 3 |
| Cannone Condensatore della Tempesta Stellare | Leggendaria | ionic | storm-capacitor | 43 HP + 19 HP/supporto | 3 |
| Cannone del Giudizio Temporale | Leggendaria | ionic | percent | 20% HP max | 1 |
| Lancia del Comando Ionico | Rara | ionic | command-lance | 24 HP | 1 |
| Lancia del Comando Ionico | Epica | ionic | command-lance | 58 HP | 1 |
| Lancia del Comando Ionico | Leggendaria | ionic | command-lance | 81 HP | 1 |
| Martello del Tuono | Rara | ionic | thunder-hammer | 28 HP + combo 18 HP | 1 |
| Martello del Tuono | Epica | ionic | thunder-hammer | 66 HP + combo 43 HP | 1 |
| Martello del Tuono | Leggendaria | ionic | thunder-hammer | 94 HP + combo 61 HP | 1 |
| Cannone a Nucleo di Folgore Crescente | Rara | ionic | growing-thunder-core | 24/36/54 HP per fase | 3 |
| Cannone a Nucleo di Folgore Crescente | Epica | ionic | growing-thunder-core | 58/85/129 HP per fase | 3 |
| Cannone a Nucleo di Folgore Crescente | Leggendaria | ionic | growing-thunder-core | 81/120/181 HP per fase | 3 |
| Sonda Ionica d’Assalto | Comune | ionic | ion-probe | 8 HP | 1 |
| Sonda Ionica d’Assalto | Rara | ionic | ion-probe | 21 HP | 1 |
| Sonda Ionica d’Assalto | Epica | ionic | ion-probe | 51 HP | 1 |
| Sonda Ionica d’Assalto | Leggendaria | ionic | ion-probe | 72 HP | 1 |
| Cannone Acceleratore Trifase I (nome provvisorio) | Comune | ionic | sequence | solo 6 HP; catena 6 HP | 2 |
| Cannone Acceleratore Trifase I (nome provvisorio) | Rara | ionic | sequence | solo 15 HP; catena 15 HP | 2 |
| Cannone Acceleratore Trifase I (nome provvisorio) | Epica | ionic | sequence | solo 36 HP; catena 36 HP | 2 |
| Cannone Acceleratore Trifase I (nome provvisorio) | Leggendaria | ionic | sequence | solo 52 HP; catena 52 HP | 2 |
| Cannone Acceleratore Trifase II (nome provvisorio) | Rara | ionic | sequence | solo 10 HP; catena 30 HP | 2 |
| Cannone Acceleratore Trifase II (nome provvisorio) | Epica | ionic | sequence | solo 24 HP; catena 71 HP | 2 |
| Cannone Acceleratore Trifase II (nome provvisorio) | Leggendaria | ionic | sequence | solo 33 HP; catena 102 HP | 2 |
| Cannone Acceleratore Trifase III (nome provvisorio) | Epica | ionic | sequence | solo 34 HP; catena 119 HP | 1 |
| Cannone Acceleratore Trifase III (nome provvisorio) | Leggendaria | ionic | sequence | solo 48 HP; catena 168 HP | 1 |
| Maglio Ferrogravitazionale | Comune | metallic | base-shot | 18 HP | 1 |
| Maglio Ferrogravitazionale | Rara | metallic | base-shot | 46 HP | 1 |
| Maglio Ferrogravitazionale | Epica | metallic | base-shot | 109 HP | 1 |
| Maglio Ferrogravitazionale | Leggendaria | metallic | base-shot | 154 HP | 1 |
| Cannone a Slitta d'Acciaio | Comune | metallic | base-shot | 14 HP | 1 |
| Cannone a Slitta d'Acciaio | Rara | metallic | base-shot | 37 HP | 1 |
| Cannone a Slitta d'Acciaio | Epica | metallic | base-shot | 87 HP | 1 |
| Cannone a Slitta d'Acciaio | Leggendaria | metallic | base-shot | 124 HP | 1 |
| Artiglieria delle Schegge Erranti | Rara | metallic | wandering-shrapnel | 20 HP | 2 |
| Artiglieria delle Schegge Erranti | Epica | metallic | wandering-shrapnel | 48 HP | 2 |
| Artiglieria delle Schegge Erranti | Leggendaria | metallic | wandering-shrapnel | 67 HP | 2 |
| Cannone Collassatore di Lega | Epica | metallic | alloy-collision | 41 HP | 1 |
| Cannone Collassatore di Lega | Leggendaria | metallic | alloy-collision | 57 HP | 1 |
| Frantumatore a Induzione | Epica | metallic | induction | 37 HP | 1 |
| Frantumatore a Induzione | Leggendaria | metallic | induction | 54 HP | 1 |
| Arpioni a Ganasce Magnetiche | Rara | metallic | magnetic-grapple | 14 HP | 2 |
| Arpioni a Ganasce Magnetiche | Epica | metallic | magnetic-grapple | 34 HP | 2 |
| Arpioni a Ganasce Magnetiche | Leggendaria | metallic | magnetic-grapple | 46 HP | 2 |
| Impattatore del Comandante d’Acciaio | Rara | metallic | character-health | 26/34/42 HP | 1 |
| Impattatore del Comandante d’Acciaio | Epica | metallic | character-health | 61/82/100 HP | 1 |
| Impattatore del Comandante d’Acciaio | Leggendaria | metallic | character-health | 87/115/141 HP | 1 |
| Obice a Pioggia di Schegge | Comune | metallic | metal-base-shot | 16 HP | 1 |
| Obice a Pioggia di Schegge | Rara | metallic | metal-base-shot | 41 HP | 1 |
| Obice a Pioggia di Schegge | Epica | metallic | metal-base-shot | 99 HP | 1 |
| Obice a Pioggia di Schegge | Leggendaria | metallic | metal-base-shot | 139 HP | 1 |
| Perforatore a Cascata | Epica | metallic | cascade-piercer | 65 HP | 3 |
| Perforatore a Cascata | Leggendaria | metallic | cascade-piercer | 91 HP | 3 |
| Artiglieria Termobalistica di Recupero | Epica | metallic | thermal-reclaimer | 31 HP | 2 |
| Artiglieria Termobalistica di Recupero | Leggendaria | metallic | thermal-reclaimer | 43 HP | 2 |
| Batteria di Rivetti Magnetici | Comune | metallic | spread | 3 × 6 HP | 1 |
| Batteria di Rivetti Magnetici | Rara | metallic | spread | 3 × 15 HP | 1 |
| Batteria di Rivetti Magnetici | Epica | metallic | spread | 3 × 36 HP | 1 |
| Batteria di Rivetti Magnetici | Leggendaria | metallic | spread | 3 × 52 HP | 1 |
| Lanciagruppi di Selce | Comune | mineral | base-shot | 13 HP | 1 |
| Lanciagruppi di Selce | Rara | mineral | base-shot | 32 HP | 1 |
| Lanciagruppi di Selce | Epica | mineral | base-shot | 77 HP | 1 |
| Lanciagruppi di Selce | Leggendaria | mineral | base-shot | 107 HP | 1 |
| Battipalo di Magnetite | Comune | mineral | base-shot | 16 HP | 1 |
| Battipalo di Magnetite | Rara | mineral | base-shot | 40 HP | 1 |
| Battipalo di Magnetite | Epica | mineral | base-shot | 95 HP | 1 |
| Battipalo di Magnetite | Leggendaria | mineral | base-shot | 133 HP | 1 |
| Obice della Crosta Spaccata | Rara | mineral | base-shot | 35 HP | 1 |
| Obice della Crosta Spaccata | Epica | mineral | base-shot | 83 HP | 1 |
| Obice della Crosta Spaccata | Leggendaria | mineral | base-shot | 118 HP | 1 |
| Sputacristalli di Sirio | Comune | mineral | weapon-slot-freeze | 6 HP | 1 |
| Sputacristalli di Sirio | Rara | mineral | weapon-slot-freeze | 15 HP | 1 |
| Sputacristalli di Sirio | Epica | mineral | weapon-slot-freeze | 36 HP | 1 |
| Sputacristalli di Sirio | Leggendaria | mineral | weapon-slot-freeze | 52 HP | 1 |
| Cannone a Nucleo Incandescente | Comune | plasma | base-shot | 17 HP | 1 |
| Cannone a Nucleo Incandescente | Rara | plasma | base-shot | 43 HP | 1 |
| Cannone a Nucleo Incandescente | Epica | plasma | base-shot | 102 HP | 1 |
| Cannone a Nucleo Incandescente | Leggendaria | plasma | base-shot | 144 HP | 1 |
| Cannone Accoppiatore Termofagico | Epica | plasma | thermal-coupler | 34 HP + combo 30 HP | 2 |
| Cannone Accoppiatore Termofagico | Leggendaria | plasma | thermal-coupler | 48 HP + combo 30 HP | 2 |
| Batteria Termica a Tre Ugelli | Rara | plasma | multi | 3 × 14 HP | 1 |
| Batteria Termica a Tre Ugelli | Epica | plasma | multi | 3 × 34 HP | 1 |
| Batteria Termica a Tre Ugelli | Leggendaria | plasma | multi | 3 × 46 HP | 1 |
| Cannone Condensatore Pirobalistico | Rara | plasma | energy-tier | 18/30/42 HP | 1 |
| Cannone Condensatore Pirobalistico | Epica | plasma | energy-tier | 43/71/100 HP | 1 |
| Cannone Condensatore Pirobalistico | Leggendaria | plasma | energy-tier | 61/102/141 HP | 1 |
| Inceneritore a Plasma Rotante | Epica | plasma | incinerator | 37 HP → 27 HP + bruciatura 3/scarto | 2 |
| Inceneritore a Plasma Rotante | Leggendaria | plasma | incinerator | 54 HP → 39 HP + bruciatura 6/scarto | 2 |
| Lanciafiamme a Ventaglio | Comune | plasma | sweep | 7 HP | 1 |
| Lanciafiamme a Ventaglio | Rara | plasma | sweep | 17 HP | 1 |
| Lanciafiamme a Ventaglio | Epica | plasma | sweep | 41 HP | 1 |
| Lanciafiamme a Ventaglio | Leggendaria | plasma | sweep | 57 HP | 1 |
| Mortaio Magmatico | Rara | plasma | magma-mortar | 20 HP + fino a 2 × 8 HP | 3 |
| Mortaio Magmatico | Epica | plasma | magma-mortar | 48 HP + fino a 2 × 19 HP | 3 |
| Mortaio Magmatico | Leggendaria | plasma | magma-mortar | 67 HP + fino a 2 × 28 HP | 3 |
| Obice a Crogiolo Pressurizzato | Rara | plasma | target-dependent | supporto 32 HP; madre 22 HP | 1 |
| Obice a Crogiolo Pressurizzato | Epica | plasma | target-dependent | supporto 77 HP; madre 53 HP | 1 |
| Obice a Crogiolo Pressurizzato | Leggendaria | plasma | target-dependent | supporto 107 HP; madre 74 HP | 1 |
| Cannone Binario a Sovraccarico | Leggendaria | plasma | binary-overload | fasi 8%/costo/16%/costo/20% | 5 |
| Torretta di Puntamento Piroclastico | Rara | plasma | character | 30 HP | 1 |
| Torretta di Puntamento Piroclastico | Epica | plasma | character | 71 HP | 1 |
| Torretta di Puntamento Piroclastico | Leggendaria | plasma | character | 102 HP | 1 |
| Cannone dei Frammenti | Epica | plasma | discard-attacks | 17 HP + 17 HP/scarto (massimo 204 HP) | 1 |
| Cannone dei Frammenti | Leggendaria | plasma | discard-attacks | 24 HP + 24 HP/scarto (massimo 289 HP) | 1 |
| Raggio Tracciante di Eliotropio | Comune | radiant | base-shot | 13 HP | 1 |
| Raggio Tracciante di Eliotropio | Rara | radiant | base-shot | 34 HP | 1 |
| Raggio Tracciante di Eliotropio | Epica | radiant | base-shot | 80 HP | 1 |
| Raggio Tracciante di Eliotropio | Leggendaria | radiant | base-shot | 113 HP | 1 |
| Batteria a Ventaglio di Fotoni Curvi | Comune | radiant | base-shot | 16 HP | 1 |
| Batteria a Ventaglio di Fotoni Curvi | Rara | radiant | base-shot | 41 HP | 1 |
| Batteria a Ventaglio di Fotoni Curvi | Epica | radiant | base-shot | 99 HP | 1 |
| Batteria a Ventaglio di Fotoni Curvi | Leggendaria | radiant | base-shot | 139 HP | 1 |
| Cannone Incisore dell'Alba | Comune | radiant | base-shot | 18 HP | 1 |
| Cannone Incisore dell'Alba | Rara | radiant | base-shot | 46 HP | 1 |
| Cannone Incisore dell'Alba | Epica | radiant | base-shot | 109 HP | 1 |
| Cannone Incisore dell'Alba | Leggendaria | radiant | base-shot | 154 HP | 1 |
| Cannone ad Anello del Sole Spezzato | Rara | radiant | base-shot | 36 HP | 1 |
| Cannone ad Anello del Sole Spezzato | Epica | radiant | base-shot | 85 HP | 1 |
| Cannone ad Anello del Sole Spezzato | Leggendaria | radiant | base-shot | 120 HP | 1 |
| Cannone a Compressione Abissale | Comune | refrigerant | base-shot | 16 HP | 1 |
| Cannone a Compressione Abissale | Rara | refrigerant | base-shot | 40 HP | 1 |
| Cannone a Compressione Abissale | Epica | refrigerant | base-shot | 95 HP | 1 |
| Cannone a Compressione Abissale | Leggendaria | refrigerant | base-shot | 133 HP | 1 |
| Batteria Idrobalistica Gemellata | Rara | refrigerant | double-shot | 2 × 18 HP | 1 |
| Batteria Idrobalistica Gemellata | Epica | refrigerant | double-shot | 2 × 43 HP | 1 |
| Batteria Idrobalistica Gemellata | Leggendaria | refrigerant | double-shot | 2 × 61 HP | 1 |
| Cannone di Alta Marea | Epica | refrigerant | high-tide | 31 HP (massimo 204 HP) | 1 |
| Cannone di Alta Marea | Leggendaria | refrigerant | high-tide | 43 HP (massimo 289 HP) | 1 |
| Ariete delle Fosse Abissali | Rara | refrigerant | energy-tier | 22/36/48 HP | 1 |
| Ariete delle Fosse Abissali | Epica | refrigerant | energy-tier | 53/85/114 HP | 1 |
| Ariete delle Fosse Abissali | Leggendaria | refrigerant | energy-tier | 74/120/161 HP | 1 |
| Cannone di Bassa Marea | Rara | refrigerant | low-tide | 14 HP + 2 HP/scarto | 2 |
| Cannone di Bassa Marea | Epica | refrigerant | low-tide | 34 HP + 5 HP/scarto | 2 |
| Cannone di Bassa Marea | Leggendaria | refrigerant | low-tide | 46 HP + 7 HP/scarto | 2 |
| Diffusore di Marea a Ventaglio | Rara | refrigerant | energy-fan | 24/18/16 HP | 1 |
| Diffusore di Marea a Ventaglio | Epica | refrigerant | energy-fan | 58/43/37 HP | 1 |
| Diffusore di Marea a Ventaglio | Leggendaria | refrigerant | energy-fan | 81/61/54 HP | 1 |
| Idrocannone a Doppia Mandata | Rara | refrigerant | repeat | 21 HP | 1 |
| Idrocannone a Doppia Mandata | Epica | refrigerant | repeat | 49 HP | 1 |
| Idrocannone a Doppia Mandata | Leggendaria | refrigerant | repeat | 70 HP | 1 |
| Torretta Crioguidata | Rara | refrigerant | character-turret | 22 HP + fino a 1 × 14 HP | 1 |
| Torretta Crioguidata | Epica | refrigerant | character-turret | 53 HP + fino a 1 × 34 HP | 1 |
| Torretta Crioguidata | Leggendaria | refrigerant | character-turret | 74 HP + fino a 1 × 46 HP | 1 |
| Perforatore dell'Antiluce | Comune | void | base-shot | 11 HP | 1 |
| Perforatore dell'Antiluce | Rara | void | base-shot | 28 HP | 1 |
| Perforatore dell'Antiluce | Epica | void | base-shot | 66 HP | 1 |
| Perforatore dell'Antiluce | Leggendaria | void | base-shot | 93 HP | 1 |
| Cannone di Cenere Nera | Comune | void | base-shot | 14 HP | 1 |
| Cannone di Cenere Nera | Rara | void | base-shot | 35 HP | 1 |
| Cannone di Cenere Nera | Epica | void | base-shot | 83 HP | 1 |
| Cannone di Cenere Nera | Leggendaria | void | base-shot | 118 HP | 1 |
| Lama d’Eclisse Franta | Comune | void | base-shot | 17 HP | 1 |
| Lama d’Eclisse Franta | Rara | void | base-shot | 44 HP | 1 |
| Lama d’Eclisse Franta | Epica | void | base-shot | 105 HP | 1 |
| Lama d’Eclisse Franta | Leggendaria | void | base-shot | 150 HP | 1 |
| Fucile del Crepuscolo Profondo | Rara | void | base-shot | 37 HP | 1 |
| Fucile del Crepuscolo Profondo | Epica | void | base-shot | 88 HP | 1 |
| Fucile del Crepuscolo Profondo | Leggendaria | void | base-shot | 124 HP | 1 |

## Dove rimangono i dati autorevoli

- `src/fleetNext/strategicNoDrainBalance.js`: coefficienti comuni alla battaglia.
- `src/fleetNext/weaponRarityEvolutions.js`: `WEAPON_NEAR_FINAL_BY_ID`, numeri delle 235 schede, testi nominali e meccaniche.
- `src/fleetNext/weaponBalanceCalibration.js`: trasformazione numerica coerente dei danni.
- `src/fleetNext/newCardEffects.js`: applicazione del danno in battaglia, con bonus, protezioni e penalita'.
- `src/OfficialFleetBattle3D.jsx`, `src/FleetCollectionWorkshop.jsx`: numeri mostrati in arena, Shop e mazzi.
- `src/fleetNextWeaponNearFinal.test.js`: confronto automatico, caso per caso, fra scheda e motore.

**Stato del progetto:** Carte Arma numericamene consolidate; nessun intervento sulle illustrazioni, sui Personaggi/Piloti non ancora definiti o sulle Difese/Trappole da progettare.
