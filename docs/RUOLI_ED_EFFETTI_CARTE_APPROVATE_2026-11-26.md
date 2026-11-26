# Ruoli ed effetti delle carte già realizzate

> **Chiarimenti successivi nella conversazione del 26/11:** questo elenco
> fotografa il codice precedente. La nuova direzione del solo Maglio è
> 2/3/5/7 martelli rotanti lanciati uno dopo l'altro. Per tutte le armi,
> i punti di partenza possono variare lungo tutto il bordo inferiore A e
> superiore B. Direttive e stato effettivo sono nel
> [documento di ripresa](REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md).
> Successivamente l'utente ha scelto per il solo Cannone a Slitta una
> sola palla in tutte le rarità, con dettagli nei colori della rarità
> ufficiale. Anche questa scelta è nel documento di ripresa.
> Per la Termobalistica è stata poi scelta una salva di granate metalliche
> a parabola, con scie termiche ed esplosioni distinte: 3 nel caso base,
> 6 confermati nel caso potenziato, indipendentemente
> dalla rarità. Il riepilogo completo è nel documento di ripresa.
> L'utente ha poi chiesto di raccogliere soltanto le specifiche e creare
> gli effetti tutti insieme al suo successivo comando. Nessuna domanda
> 5/6 è ancora pendente: la risposta esplicita è stata «Sei».
> Queste nuove direttive sono documentate, non ancora implementate.

Fotografia letta dal codice il 26 novembre 2026, base
`c92e07e4d468e1c5eaeff8d6e9c76b8af27a6aaa`. Le ultime carte illustrate e
dotate di effetti specifici sono otto Armi Metallo con 22 varianti di rarità.
Questo elenco descrive ciò che è codificato, non approva nuove revisioni.
Il nuovo ordine è: carta, ruolo reale, indicazione grafica dell'utente,
realizzazione. Nessun effetto di gioco viene modificato con questa ricognizione.

C = Comune; R = Rara; E = Epica; L = Leggendaria. I turni indicati sono
turni propri. Il danno totale dell'azione viene ripartito fra i proiettili
della salva; bersagli, Difese, copertura e costi sono risolti dal motore.

| Carta | Ruolo reale e condizioni | Grafica attualmente codificata |
| --- | --- | --- |
| Maglio Ferrogravitazionale (C/R/E/L) | Danno diretto concentrato su un bersaglio, durata un turno. Soggetto a Difese, copertura e modificatori applicabili. | C: un pistone; R: tre traiettorie orbitali; E: sei colpi in due gruppi; L: nove colpi in tre gruppi e finale pesante. Impatto da compressione, frammenti di corazza e onda sul piano. |
| Cannone a Slitta d'Acciaio (C/R/E/L) | Altra arma di danno diretto su un bersaglio per un turno, con danno base inferiore al Maglio. | C: tre colpi rapidi; R: sei incrociati; E: nove in tre batterie; L: sei rapidi e una lancia finale. Scie sottili, contatti metallici incandescenti e getto direzionale all'impatto. |
| Artiglieria Termobalistica di Recupero (E/L) | Attacca per due turni. Aggiunge al danno base il 60% degli HP realmente persi dalla propria flotta dopo la posa, entro il massimo previsto dalla variante. La perdita osservata si accumula dopo il dispiegamento. | E: tre capsule a parabola; L: sei capsule a spirale. Carica locale presso l'emettitore, esplosioni di plasma, vapori e frammenti; la variante L aggiunge dettagli prismatici. |
| Arpioni a Ganasce Magnetiche (R/E/L) | Nel turno di posa lancia due arpioni su navi differenti quando disponibili. I bersagli realmente colpiti vengono conservati per il Collassatore nel proprio turno successivo. La permanenza di due turni non significa una seconda raffica automatica di arpioni. | Due agganci dai fianchi opposti e catene persistenti. R: chiusura delle ganasce; E: arrivo a frusta e arco magnetico; L: traiettorie orbitali e dettagli prismatici. Morso sullo scafo, scintille e archi. |
| Cannone Collassatore di Lega (E/L) | Combo: richiede le Ganasce nel turno proprio precedente e due bersagli agganciati ancora vivi. Infligge danno a entrambi, con Difese individuali. | Trazione reale dei due scafi, accelerazione fino allo scontro, un solo BOOM, frammenti, fumo e contraccolpo, poi rientro. L aggiunge fratture prismatiche. Nessun proiettile lanciato. |
| Frantumatore a Induzione (E/L) | Attacco di un turno contro un bersaglio. Con almeno una Energia Metallo supera una Difesa; con almeno due rimuove anche una Difesa attiva visibile. Legge le Energie presenti senza consumarle. Resta applicabile la copertura dei supporti. | E: tre lame rotanti; L: sei lame a ciclone. Piani di taglio, fratture e scariche sulla corazza. Contatto sullo scudo se il colpo è bloccato; smontaggio separato quando il motore elimina una Difesa. |
| Perforatore a Cascata (E/L) | Attacca per tre turni. Quando distrugge un supporto con danno eccedente, può trasferire l'eccedenza a un altro bersaglio spendendo una carica Energia Metallo per ogni trasferimento. | E: un nucleo perforante; L: tre nuclei intrecciati per ciascuna tratta reale. Il trasferimento riparte dal supporto colpito dopo l'ultimo contatto; breccia rotante, getto assiale e schegge. Tre nuclei e due trasferimenti possono dare nove proiettili complessivi. |
| Artiglieria delle Schegge Erranti (R/E/L) | Attacca per due turni, un bersaglio per attivazione. Nel secondo cerca un bersaglio diverso dal precedente quando disponibile. | R: tre colpi a ventaglio; E: sei rotanti; L: nove in tre gruppi. Tutti convergono sul bersaglio del turno: scie spezzate, frammenti rotanti e detonazioni irregolari sulla corazza. |

Le partenze variano entro il lato della flotta che spara, con prospettiva
speculare A/B; i trasferimenti previsti ripartono dal vero bersaglio.
Suoni e richieste aptiche accompagnano le fasi della sequenza. Le esplosioni
grafiche non aggiungono danni ad area, Bruciature o immobilizzazioni.

## Fonti e stato della verifica

- Catalogo corrente: `src/fleetNext/rules.js`, `weaponRarityEvolutions.js`.
- Meccaniche: `src/fleetNext/provisionalWeaponEngine.js`, `combat.js`.
- Raffiche e traiettorie: `src/fleetNext/approvedWeaponSalvos.js`, `src/weaponKinematics.js`.
- Contatti e collisioni: `src/weaponHullImpacts.js`, `src/weaponCinematicRenderer.js`, `src/chainWeaponBattleVisuals.js`, `src/collisionExplosion.js`.
- Stato delle prove precedenti: `docs/collaudi/impatti-scafi-2026-11-25.json`.

La grafica è presente nel codice e nelle dimostrazioni offline. L'ultima
revisione non ha ancora un nuovo collaudo in partita su StackBlitz, il cui
workspace nell'ultimo controllo non si avviava. La vibrazione fisica resta
da verificare su telefono compatibile. Questa lettura non è un nuovo collaudo.
