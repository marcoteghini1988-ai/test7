# Eclissi Stellare — bilanciamento delle famiglie di carte, verifica successiva alle madri

Data: 21 novembre 2026.  
Repo ufficiale: `marcoteghini1988-ai/test7` — branch `main`.  
Stato: **primo audit operativo completato**. Nessuna immagine, carta Personaggio, costo Energia o geometria della plancia modificati.

## Obiettivo e base di confronto

La partita ufficiale conserva:
- **deterioramento automatico assente**: zero perdita HP dopo l'esaurimento dei tre componenti;
- **20 secondi strategici per ogni turno proprio** e ultimo componente a 210 secondi strategici;
- **30 secondi reali massimi di preparazione**, senza bonus di danno per chi conferma prima;
- **vittoria per danni reali** alla madre, con ricambio fisico per la mano piena bloccata;
- coefficiente dei danni delle Armi per rarita' Comune **0,60**, Rara **1,00**, Epica **1,70**, Leggendaria **1,85**;
- coefficiente del Generatore della madre Comune/Rara **1,00**, Epica **1,25**, Leggendaria **1,30**.

I coefficienti restano di playtest; non vanno stampati sulle immagini definitive finche' non saranno calibrati tutti gli abbinamenti.

## Perimetro effettivamente verificato

- **21 Difese esclusive** delle dodici madri.
- **10 Trappole esclusive**.
- **1 Trappola generale aggiuntiva**, Interdizione di Fusione.
- **120 Terreni elementali**, ottenuti da 10 elementi x 3 funzioni x 4 rarita'.
- **32 Carte Sistema**, quattro componenti x due effetti (Amplificazione/Sabotaggio) x quattro rarita'.
- Le **235 Carte Arma** restano nel catalogo; e' stato verificato un caso di danno percentuale importante.
- Le Carte **Personaggio** sono escluse intenzionalmente dalla taratura.

I test automatici garantiscono che le Difese usino lo slot Difesa, le Trappole lo slot coperto e nessuna carta di queste categorie venga reinterpretata come Personaggio.

### Difese e Trappole — comportamento reale

Il motore mantiene **un massimo di una Difesa visibile e una Trappola coperta** nello stesso momento; non assegna extra HP alla madre e non aumenta gli attacchi gratuitamente.

Test con **Velo della Corona** (`nx-l01-10`):
- madre Leggendaria protetta contro un attacco reale del Generatore nemico;
- stessa prova senza la carta: **302 HP persi**;
- con la Difesa: **0 HP persi**;
- il beneficio dipende da una carta preparata e consumabile, non dalla velocita'.

Test con **Interdizione di Fusione** (`trap-fusion-denial`):
- occupa esattamente il solo slot Trappola coperta;
- non infligge danni all'atto della posa;
- una seconda Trappola non puo' essere sovrapposta finche' lo slot e' occupato;
- il turno strategico di posa e' consumato.

Questa e' una verifica meccanica reale; **non prova** che tutte le 31 esclusive abbiano gia' lo stesso valore competitivo. Sono effetti contestuali e molte Trappole si attivano solo se l'avversario sceglie l'azione contrastata.

### Terreni — percentuali esistenti mantenute

| Rarita' | Offensivo | Difensivo | Equilibrato (attacco + difesa) |
|---|---:|---:|---:|
| Comune | +10% | +10% | +5% / +5% |
| Rara | +12% | +12% | +6% / +6% |
| Epica | +14% | +14% | +7% / +7% |
| Leggendaria | +16% | +16% | +8% / +8% |

Regole valide: un solo Terreno attivo, influisce su entrambi i giocatori quando hanno l'elemento compatibile, non si somma automaticamente con un secondo Terreno identico. In un impatto neutro da 1.000 HP prima degli altri riduttori, il Terreno Leggendario ATT da' 1.160 HP, DEF 840 HP e EQ 993 HP (per l'arrotondamento del calcolo combinato).

### 192 simulazioni speculari dei Terreni

Impostazione diagnostica: stessa madre e rarita' per i due lati, stessi mazzi e semi nelle quattro varianti; il Terreno iniziale e' impostato artificialmente per isolare il suo effetto e puo' essere sostituito in partita. **48 PvP per scenario**.

| Terreno iniziale | Media | Mediana | Vittorie per HP reali | Pareggi | Trappole piazzate | Trappole attivate |
|---|---:|---:|---:|---:|---:|---:|
| Neutro | 372 s | 357 s | 48/48 | 0 | 46 | 12 |
| Offensivo | 367 s | 357 s | 48/48 | 0 | 46 | 12 |
| Difensivo | 389 s | 374 s | 48/48 | 0 | 51 | 12 |
| Equilibrato | 380 s | 374 s | 48/48 | 0 | 48 | 12 |

**Conclusione Terreni:** non ci sono evidenze sufficienti per cambiare i valori percentuali esistenti. I Terreni difensivi aumentano la media di 17 secondi nella prova speculare rispetto al neutro, senza generare stalli. Confermo le percentuali esistenti come candidato operativo; serviranno altre prove con i mazzi volutamente difensivi.

### Carte Sistema

Sono state censite le 32 schede realmente giocabili: quattro componenti (Arsenale, Centralina, Generatore, Plancia), effetto Sabotaggio o Amplificazione, quattro rarita'. Il nuovo combattimento conserva il loro valore tattico e la loro durata; questo audit non riscrive numeri o effetti delle schede approvate.

## Correzione numerica applicata alle Armi

**Problema individuato:** nel nuovo combattimento `arsenalBonus` applicava il coefficiente di rarita' anche a colpi il cui valore di partenza e' gia' una **percentuale degli HP massimi del bersaglio**. L'aumento avveniva in modo invisibile rispetto al testo della carta.

**Correzione effettuata** in `src/fleetNext/newCardEffects.js`:
- per il pattern `percent` (es. **Cannone del Giudizio Temporale**) e per le fasi percentuali `binary-overload`, il danno base percentuale **non riceve un secondo ×1,85 Leggendario**;
- il Giudizio conserva quindi **20% HP massimi come base** (su 1.000 HP: **200 HP nominali**, non 370);
- una normale Arma Leggendaria con colpo base da 200 HP continua correttamente a produrre 370 HP nominali col coefficiente ×1,85;
- restano validi Arsenale esaurito (-30%), Difese, passive, elementi, Terreni e limite per impatto della madre;
- non e' stata modificata la percentuale stampata ne' il comportamento delle vecchie partite.

Il test `CARD_FAMILY_PERCENT_DAMAGE_AUDIT` ha verificato `{percent:200,binary-overload:200,single:370}`.

## Verifiche e tracciabilita'

Commit principale: `3572d90f4c5db76841054722584758e85c6b8e68` (correzione percentuali).  
Audit cataloghi: `src/fleetNextCardFamilyAudit.test.js`.  
Simulazione Terreni: `src/fleetNextWeaponPacingMatrix.test.js` (marker `AUDIT_TERRAIN_MIRROR_20261121`).

**GitHub Actions:** **1.899 test superati su 1.899**, 0 fallimenti, build Vite riuscita. La correzione delle percentuali ha superato anche il collaudo mobile automatico senza modificare la grafica.

## Stato onesto del bilanciamento

**Completata** la revisione di ruolo, slot, limiti e percentuali dei Terreni; collaudata l'effettiva capacità delle Difese e Trappole di contrastare attacchi; corretto il danno doppio non dichiarato delle Armi percentuali.

**Non ancora certificato** un bilanciamento competitivo carta-per-carta su tutte le 235 Armi, 31 difese/trappole esclusive, 32 sistemi e le interazioni con le due scudiere, fusioni, terreno e boss. Per quella fase servono confronti con mazzi volutamente aggressivi, difensivi e di controllo. Nessun nuovo moltiplicatore generalizzato viene introdotto senza verificare questi scenari.

La priorita' resta **strategia superiore alla velocita'**; nessun timer produce danni automatici alla madre.
