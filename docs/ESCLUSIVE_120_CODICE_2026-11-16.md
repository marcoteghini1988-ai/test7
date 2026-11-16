# Eclissi Stellare — avanzamento delle 120 carte esclusive (16 novembre 2026)

## Catalogo
Le 120 esclusive sono collegate in `src/fleetNext/exclusive120.js`: **10 diverse per ciascuna delle 12 madri principali**, con sei definizioni al livello 1 e una a ciascun livello dal 2 al 5. I cinque modelli variante mantengono i loro Personaggi precedenti. Il catalogo globale contiene 155 definizioni fra esclusive, Personaggi, Boss e carte tecniche.

## Aurora-0: primo pacchetto eseguibile completo (10/120)
L'implementazione del motore riguarda nove azioni nuove più il Personaggio **Cartografo Aurora** con effetto aggiornato. Gli ID dei Personaggi restano invariati, così non compaiono copie doppie.

- **Ottica di ricognizione (L1):** modulo utilità da 2 integrità, permette di vedere e ordinare le prime due carte dopo il primo montaggio del turno.
- **Raffica di prova (L1):** due colpi leggeri separati sulla medesima macchina o supporto, senza un tiro base aggiuntivo.
- **Tiro di smontaggio (L1):** colpo normale con due danni contro un modulo montato raggiungibile.
- **Velo di salvataggio (L1):** Difesa associata a un vitale e a un modulo; al prossimo colpo il modulo viene sacrificato.
- **Adattamento immediato (L1):** mette sotto il mazzo una esclusiva dalla mano, poi permette di scegliere tra le prime tre carte.
- **Cartografo Aurora (L1):** guarda quattro carte, prende un modulo tra esse e sposta le altre sotto il mazzo; effetto di ingresso una sola volta.
- **Canna perforante (L2):** modulo d'arma che oltrepassa una protezione della Difesa per turno, senza aggirare i guardiani.
- **Corazza modulare (L3):** modulo utilità da 2 integrità; assorbe il primo colpo sul vitale assegnato e viene distrutta.
- **Cannone biforcato (L4):** modulo d'arma che permette di sostituire un tiro normale con due colpi leggeri verso bersagli differenti scelti.
- **Riconfigurazione Aurora (L5):** sostituisce un modulo montato con uno diverso del medesimo alloggiamento presente nel mazzo, rimescolando.

I moduli hanno due alloggiamenti indipendenti (arma e utilità), sono attaccabili se la madre è raggiungibile, e non aumentano il numero di vitali. Le carte modulo restano in campo fino a sostituzione o distruzione; non vengono scartate subito. Il gioco consente ancora fino a tre carte per turno e due macchine autonome.

## Disponibilità reale
- **10/120 esclusive Aurora**: `playable:true`, assegnate esclusivamente ad Aurora e sbloccate al livello corrispondente.
- **11 Personaggi delle altre madri**: restano utilizzabili con i loro **vecchi effetti**, in attesa della riprogettazione.
- **99 nuove azioni delle altre madri**: schede registrate ma `playable:false`, non pescabili e non attivabili.
- **Boss e altri Personaggi**: conservati.
- **Immagini delle nuove carte**: non create. Le carte Aurora con effetti modificati vengono mostrate in forma testuale per non attribuire al nuovo effetto il vecchio fronte illustrato.

## Verifiche
In `src/fleetNextAuroraEffects.test.js` sono stati aggiunti 15 test mirati (moduli, attacchi, protezioni, Cartografo, Adattamento, Riconfigurazione, Cannone biforcato, esclusività). Nella sessione sono state inoltre eseguite **9 verifiche dinamiche del motore reale con dipendenze simulate**, tutte superate: montaggio, Ottica, raffica, tiro di smontaggio, corazza, Velo, Cartografo, riconfigurazione e biforcazione.

**Non equivalgono a una build completa:** `npm run preflight`, `npm run verify:logic`, `npm run build` e il test visivo su telefono/browser restano da eseguire.

## Punto di ripresa
Implementare la seconda navicella, **Lince Solare (C01)**, con nove azioni nuove e il Personaggio Pilota Helios riprogettato, rispettandone l'identità. In seguito procedere con Vespa, Corvo e le restanti flotte. Non cambiare la grafica 3D approvata. La condizione di vittoria legata ai vitali della madre non è stata modificata in questo passaggio; la futura revisione dell'obiettivo verso le macchine va implementata separatamente.
