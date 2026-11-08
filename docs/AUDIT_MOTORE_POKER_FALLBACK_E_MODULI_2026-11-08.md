# Eclissi Stellare — Audit dell'accesso ai motori e delle Carte Abilità

**Data:** 8 novembre 2026 · **repository:** `marcoteghini1988-ai/test7` · **ramo:** `main`.

## 1. Quale motore viene realmente eseguito?

L'ingresso alla battaglia nell'app è `src/App.tsx` e l'instradamento è:
- `MATH_DUEL_REPLACES_POKER_BATTLES = true`: la schermata `step === 'game'` passa a **`MathDuelBattle.jsx`**.
- `MathDuelBattle.jsx` chiama `officialSimultaneousEligibility`: casi compatibili al motore **`OfficialBattle3D.jsx`** (preparazione 30 s / replay 8 s). Alcuni vecchi salvataggi, piloti o settori non riconosciuti passano al **`BossBattle3D.jsx`**.
- Le tre vecchie finestre `LegacyPokerBattle.jsx` (campagna, sfida giornaliera, PvP simulato) compaiono nel codice di `App.tsx` **solo sotto `!MATH_DUEL_REPLACES_POKER_BATTLES`**. Sono mantenute per continuità del vecchio sorgente, **non sono un percorso attivo dall'ingresso principale**.
- `BossBattle3D.jsx`, invece, **è un fallback attivo**. Ha già una mano da 5 speciali e usa `playSpecialCard`, ma sa eseguire solo quattro famiglie storiche; non può consumare davvero una Carta Dado, Modulo, Faglia, Epica o Personaggio Boss.

Questa differenza è fondamentale: non basta cercare un vecchio pulsante nel sorgente per concludere che esso è attivo nella campagna ufficiale. Viceversa, l'esistenza di un filtro non implica che il fallback sappia eseguire tutte le nuove speciali.

## 2. Problema di sicurezza e coerenza risolto

Prima di questo intervento, l'inizializzazione del fallback leggeva il mazzo in `BossBattle3D.jsx` con `try/catch` vuoto e, in caso di errore, passava `specialDeckTypes=null` al motore. Il generatore usava allora la propria lista predefinita: il giocatore poteva entrare in battaglia **con speciali non verificate rispetto al salvataggio reale**.

La correzione inserisce `src/legacySpecialCompatibility.js`:
1. Legge con `readSpecialCollection`, senza scrivere nulla.
2. Convalida il mazzo reale da 24, le copie possedute e i limiti per tipo.
3. Produce un mazzo di compatibilità da 24 istanze **solo attingendo alle copie già possedute**; il riempimento non modifica il mazzo persistente.
4. Se manca una configurazione valida, **blocca soltanto l'avvio dello scontro**, senza generare carte sostitutive o ricompense. Mostra un avviso e consente di aprire l'editor dell'Hangar o tornare al menu; non sovrascrive il salvataggio.
5. Anche il cambio flotta precedente al primo turno verifica le speciali **prima** di aggiornare la collezione navicelle.

## 3. Famiglie supportate nel fallback 3D

La definizione è ora unica in `src/pvpTerrainLoadout.js`: `legacySupportedSpecialType(type)`, basata sulla famiglia della definizione e non su una lista parziale di ID.

| Famiglia | Fallback `BossBattle3D` | Nuovo simultaneo |
| --- | --- | --- |
| Fusioni, Difese, Volée, Supporti | Supportate e consumate come speciali | Supportate |
| Dado Quantico, Numero Bomba, Barra Malus, Dorata | Filtrate temporaneamente | Carte attive del mazzo vero |
| 35 Carte Modulo | Filtrate temporaneamente | Attive solo da proprietà reale `eclissi_abilities` |
| Faglia di Vulnerabilità | Filtrata temporaneamente | Attiva con formula reale e bypass limitato |
| Mutazione della Firma | Filtrata temporaneamente | Attiva |
| Carte Personaggio dei 12 Boss | Filtrate temporaneamente (prima potevano risultare inattivabili) | Attive dopo vittoria autentica sul boss |
| Sei Oggetti Epici | Filtrati temporaneamente | Attivi con reliquie/varco e slot reali |
| Quattro Carte Terreno | Filtrate fuori dal PvP | Attive soltanto in PvP |

Una nuova famiglia futura **non diventa automaticamente una carta morta nel fallback**, perché è esclusa finché non esiste il suo esecutore. Il filtro **non elimina** alcuna carta dall'Hangar e non cambia le ricompense. Per la Campagna simultanea e il PvP, tutte le famiglie restano nelle rispettive modalità consentite.

## 4. Due correzioni strategiche nel nuovo duello

**Sifoni di Sincronia A/B:** `src/tacticalEquipmentCards.js` aveva un'operazione che trasferiva Sincronia in modo sequenziale. Quando entrambi giocavano lo stesso Modulo Sifone, il risultato poteva dipendere dal fatto che A venisse risolto prima di B. Ora i trasferimenti sono calcolati sul **medesimo snapshot iniziale** di Sincronia, sommando i delta alle due flotte. Test anche con valore vicino al massimo 100, per evitare risultati diversi invertendo i lati.

**Carta Purificazione:** il Modulo `planet_char_14` eliminava erroneamente la `malusCharge` **positiva** del proprietario, cioè i progressi verso la propria Barra Malus. Ora neutralizza il sabotaggio ricevuto nel ciclo, ma **non azzera la carica ottenuta** con veri colpi precedenti. Rimane necessaria la vera Carta Modulo, non esiste pulsante gratuito.

Le altre abilità numeriche passive storiche dei mazzi Boss e le caratteristiche intrinseche delle navicelle non sono state ridefinite come equipaggiamenti per non rompere campagne e collezioni: servono test specifici quando si migrano le modalità residue.

## 5. Test automatici ed elementi ancora aperti

Aggiunto `src/legacySpecialCompatibility.test.js`, con verifiche di:
- 24 copie autentiche, inventario originale invariato e salvataggio JSON illeggibile non sovrascritto;
- esclusione di tutte le famiglie senza esecutore legacy, incluse le Carte Personaggio Boss;
- nessun mazzo starter regalato quando le copie disponibili non sono sufficienti;
- nessuna restrizione delle nuove carte nel duello simultaneo Campagna/PvP;
- blocco delle carte sconosciute e supporto esclusivo delle quattro famiglie effettive.

Esteso `src/tacticalEquipmentCards.test.js`: doppio Sifone simmetrico e Purificazione che preserva tre tacche Malus.

**Verifica CI:** commit `eaeea09362c0538b92f29d637c97c2a7bb66b602`, [GitHub Actions 42466927187](https://github.com/marcoteghini1988-ai/test7/actions/runs/42466927187), **712/712 test**, build Vite e preflight superati. Le ulteriori modifiche alla documentazione sono da ricontrollare con CI aggiornata.

## 6. Prossimi passaggi senza regressioni

- **Non riattivare `LegacyPokerBattle`** attraverso una modifica della flag senza introdurre una vera mano speciale e migrare gli eventi dei suoi vecchi pulsanti. Le funzioni storiche sono conservate come sorgente inattivo: non vanno confuse con poteri attivabili della nuova modalità.
- Per i salvataggi che richiedono `BossBattle3D`, completare progressivamente la compatibilità o passare in modo sicuro al simultaneo quando tutti i requisiti sono riconosciuti, senza inventare copie o cambiare arena.
- Playtest grafico/visivo in 9:16 e bilanciamento di moduli, malus, mutazioni e Faglia. L'IA PvP locale non è un avversario umano online.
- **Regola permanente:** ogni equipaggiamento/abilità attivabile del giocatore richiede una Carta Speciale realmente posseduta, pescata e consumata; nessuna carica, timer o inventario concede un'attivazione gratuita.
