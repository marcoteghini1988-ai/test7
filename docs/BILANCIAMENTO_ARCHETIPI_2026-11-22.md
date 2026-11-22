# Eclissi Stellare — audit incrociato degli archetipi (22 novembre 2026)

Repository ufficiale `marcoteghini1988-ai/test7`, branch `main`.   
Ambito: **bilanciamento strategico senza deterioramento**, nessun asset grafico o
Personaggio modificato. Codice di prova: `src/fleetNextWeaponPacingMatrix.test.js`,
marker `AUDIT_ARCHETYPE_CROSS_20261122`.

## Regole conservate

- Tre timer per giocatore, con ultimo componente a 210 secondi strategici
  (20 secondi fissi per proprio turno risolto; max 30 reali per preparazione).
- Nessuna perdita automatica di HP da scadenza; vittoria per danni reali.
- Armi per rarita': Comune ×0,60, Rara ×1,00, Epica ×1,70,
  Leggendaria ×1,85. Generator: ×1,00 / ×1,00 / ×1,25 / ×1,30.
- Generatore prenotato con almeno 2/4 Energie fisiche; nessuno sparo gratuito.
- Personaggi fuori dal perimetro; no modifiche a plancia 3D, arte o PNG.
- Rigenerazione e Veleno nel combattimento strategico usano una quota fissa,
  non il tempo reale impiegato dall'essere umano o dalla CPU.

## Campione e metodologia

Tre archetipi di mazzi, costruiti con le carte realmente disponibili e
rispettando i limiti copie:

| Archetipo | Armi target | Energie target | Sistemi target | Terreni target |
|---|---:|---:|---:|---:|
| Offensivo | 16 | 8 | 3 | 1 |
| Equilibrato | 11 | 10 | 8 | 2 |
| Controllo | 8 | 8 | 13 | 3 |

Il numero effettivo dipende dalla capienza e dalle carte esclusive automatiche.
Sono usati mazzi di rarita' pari, dodici abbinamenti madre prefissati,
supporti realmente equipaggiabili e motore della partita integrato.
Per ciascuna coppia di archetipi sono stati invertiti A/B, usando 4 rarita',
3 abbinamenti di madri e 2 semi: **144 incontri**.
Sono tutti duelli di bot deterministici con l'IA `autoFleetTurn`; non sono
partite umane ne' un test esaustivo delle combinazioni di supporti e fusioni.

## Risultati per orientamento

| Mazzo A | Mazzo B | Vittorie A | Vittorie B | Durata media |
|---|---|---:|---:|---:|
| Offensivo | Equilibrato | 19 | 5 | 307 s |
| Equilibrato | Offensivo | 11 | 13 | 344 s |
| Offensivo | Controllo | 21 | 3 | 332 s |
| Controllo | Offensivo | 8 | 16 | 374 s |
| Equilibrato | Controllo | 20 | 4 | 407 s |
| Controllo | Equilibrato | 11 | 13 | 402 s |

Per archetipi, correggendo l'orientamento:

| Confronto | Vittorie del primo | Vittorie del secondo |
|---|---:|---:|
| Offensivo vs Equilibrato | 32/48 (66,7%) | 16/48 |
| Offensivo vs Controllo | 37/48 (77,1%) | 11/48 |
| Equilibrato vs Controllo | 33/48 (68,8%) | 15/48 |

**144/144 conclusi per danno reale alla madre**; 0 pareggi,
0 conclusioni per deterioramento e nessuna partita irrisolta.
Le medie dipendono dal tempo ipotizzato nel simulatore, non da una
misura ergonomica dello schermo reale.

## Correzione dell'audit Carte Sistema

Prima versione diagnostica: il conteggio riportava erroneamente 0 attivazioni
perche' il test cercava eventi `system-card-apply` e `system-activate`
mai emessi dal motore. In realta' una Carta Sistema applicata genera un
evento `card` con `cardId` che identifica `systemModifier`.

Correzione **solo del test**, senza cambiare il combattimento:

| Mazzo A | Mazzo B | Tentativi Sistema | Attivazioni efficaci |
|---|---|---:|---:|
| Offensivo | Equilibrato | 193 | 186 |
| Equilibrato | Offensivo | 219 | 206 |
| Offensivo | Controllo | 217 | 209 |
| Controllo | Offensivo | 248 | 235 |
| Equilibrato | Controllo | 281 | 264 |
| Controllo | Equilibrato | 273 | 258 |
| **Totale** | | **1.431** | **1.358** |

I 73 tentativi residui non hanno introdotto un effetto piu' forte
(per esempio, un bonus gia' presente).
Le carte funzionano: la discrepanza era nell'instrumentazione dell'audit.

## Interpretazione e prossimo bilanciamento

- **Segnale di squilibrio da approfondire:** nei duelli simulati i mazzi
  offensivi vincono il 77% dei confronti con il controllo. Il divario e'
  marcato nelle rarita' Epica e Leggendaria.
- **Non ancora conclusivo:** la CPU usa una graduatoria di selezione comune
  alle tre strategie (Energie e Armi hanno priorita' maggiore di Difese e
  Terreni). Questo penalizza la scelta proattiva di un controllo specializzato.
- **Prossima verifica:** testare IA che usa coerentemente Sabotaggi, Difese,
  Trappole e Terreni, confrontandola a parita' di flotta, con supporti invertiti;
  distinguere fallimenti di scelta dall'effettiva forza numerica.
- **Primo confronto passive completato:** formazione `weapon-double` +
  `energy-discount` contro `regeneration` + `last-shield`, risultati sotto.
- **Poi:** verificare le combinazioni di supporti doppi, le Armi multi-colpo,
  gli effetti perforanti e il Generatore; controllare i tempi PvP e boss
  senza deterioramento.
- **Nessuna correzione generalizzata** ai danni delle 235 Armi, ai timer o
  alle 32 Carte Sistema e' giustificata da questi soli duelli.

## Ulteriore confronto di 48 duelli: passive dei supporti

Test: `AUDIT_SUPPORT_PAIR_20261122` sul motore integrato, con lo stesso
mazzo Equilibrato per entrambe le flotte e supporti a parita' di rarita'.
Le formazioni sono state invertite tra A e B:

- **Offensiva:** `weapon-double` (Armi potenziate) +
  `energy-discount` (Sconto Energia).
- **Difensiva:** `regeneration` (Rigenerazione) +
  `last-shield` (Guardia finale).

| Orientamento | Vittorie formazione offensiva | Vittorie difensiva | Durata media |
|---|---:|---:|---:|
| Offensiva schierata A | 15/24 | 9/24 | 353 s |
| Offensiva schierata B | 7/24 | 17/24 | 369 s |
| **Totale** | **22/48** | **26/48** | **361 s** |

Per rarita': **Epica 12–12**, **Leggendaria 10–14**
(offensiva contro difensiva). **48/48** concluse con HP reali,
0 pareggi, 0 deterioramento, 0 ordini invalidi.

**Indicazione:** la passiva `weapon-double` non domina questo confronto:
non si riduce il suo moltiplicatore solo perche' produce grandi singoli
colpi. L'asimmetria tra A e B e la scelta delle madri rendono necessario
verificare ulteriori abbinamenti prima di dichiarare il bilanciamento
competitivo completo. Il test non copre due copie dello stesso supporto
ne' le fusioni.

### CI

Commit di test: `e963de8a3adc13baa50ab9db0f7f4f8a62b8d786`.   
Ultima verifica: **1.901 test superati su 1.901**, preflight e build
Vite riusciti, zero fallimenti.

## Verifica tecnica e commit

- `8e15766b17393ae7fc830c9c0dc0c9987e3bd75a`: aggiunti 144 duelli.
- `8928d7d8929cb0879403c2f47b3bc7ef2bf777bd`: corretto il conteggio Sistemi.
- CI precedente: **1.900 test superati su 1.900**, 0 fallimenti,
  preflight e build Vite riusciti.
- Nessuna modifica a statistiche live, carte Personaggio, immagini o layout.
