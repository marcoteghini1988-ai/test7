# Decisione del 26 novembre 2026 — ARMA / STRATEGIA

- ARMA: rosso #FF594C.
- STRATEGIA: arancione #FFB24D, nuova denominazione delle carte ATTACCO.
- L'intervento raster riguarda il **fondo del pannello delle caratteristiche**, non i testi, le illustrazioni, la cornice di rarità o i simboli.
- Le chiavi tecniche, gli identificativi, i costi, gli effetti e gli slot logici restano invariati. Lo studio degli slot misti sarà separato.
- Le basi sorgente arancioni originali sono utilizzabili per STRATEGIA. Le basi rosse per ARMA vengono derivate senza alterare la geometria.
- I 22 fronti PNG approvati già attivi hanno sorgenti immutate e varianti rosse in `public/assets/fleet-weapon-fronts-red/`; il registro `src/fleetNext/redWeaponFronts.json` si popola soltanto al termine della trasformazione e delle verifiche. Se vuoto, l'app continua a usare l'originale.
- Il workflow `recolor-card-categories.yml` produce il confronto visivo e la verifica dei pixel. Non promuove le anteprime di altre carte ancora in attesa di approvazione. La conferma visiva manuale su StackBlitz resta distinta dalle verifiche numeriche.
