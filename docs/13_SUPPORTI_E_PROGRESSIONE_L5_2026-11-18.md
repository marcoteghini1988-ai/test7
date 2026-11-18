# Eclissi Stellare — 13 modelli di supporto e miglioramento L1–L5
**18 novembre 2026** · Sorgente ufficiale: `test7/main`

## Distinzione fra madri e supporti
- Il catalogo ufficiale contiene **12 madri**, **120 carte esclusive** e, separatamente, **13 carte-navicella di supporto**. Le cinque varianti materne escluse sono archiviate in un appunto e non fanno parte delle madri giocabili.
- I supporti sono autonomi rispetto alle madri. Gli ID tecnici `C04`, `E03` e `L02` sono usati solo come **identità di supporti nuovi**, con nomi, effetti, elementi e scocche provvisorie propri: non ripristinano le madri escluse o le loro 50 carte. `R04` ed `E02` restano due madri ufficiali, senza supporto omonimo.
- I 13 nomi dei supporti sono **denominazioni funzionali di progettazione**; i nuovi render verranno creati con Flow. Fino ad allora si usano gli SVG originari come segnaposto, senza cambiare la plancia 3D.

## I tredici supporti e le tredici passive indipendenti

| ID sorgente | Carta-navicella di supporto | Rarità sorgente | Passiva | Identità tattica |
|---|---|---|---|---|
| N00 | Velo Aurora | Comune | Rigenerazione continua | Cura HP madre nel turno nemico |
| C01 | Bastione Solare | Comune | Super-scudiera | Grande riserva HP e cura alla distruzione |
| C02 | Prisma Silente | Comune | Soppressione Trappole | Le trappole nemiche non si attivano |
| C03 | Corvo Esploratore | Comune | Pescata aggiuntiva | Una carta in più, sempre massimo tre giocate |
| C04 | Falce del Vento | Comune | Terreni dimezzati | Abbrevia la durata del terreno avversario |
| R01 | Armeria Binaria | Rara | Carte Arma potenziate | Raddoppia il bonus delle carte Arma |
| R02 | Relè Ionico | Rara | Sconto Carte Energia | Riduce il costo di Attacco Speciale |
| E01 | Scudo Nebuloso | Epica | Protezione ambientale | Immunità agli effetti negativi del terreno |
| E03 | Fenice Energetica | Epica | Conversione Energetica | Alla distruzione ricarica la madre |
| L01 | Eclisse Sacrificale | Leggendaria | Sacrificio volontario | Sacrificio volontario sopra soglia HP |
| L02 | Spina Gravitazionale | Leggendaria | Veleno reattivo | Avvelena quando viene colpita |
| L03 | Titano della Tempesta | Leggendaria | Tempesta alla distruzione | Rimuove Personaggio/Attacchi nemici alla distruzione |
| L04 | Arca Condensatrice | Leggendaria | Accumulo di fulmini | Rilascia scariche dopo aver accumulato cariche |

Le altre **due passive numeriche** del registro storico (`normal-boost`, `special-boost`) restano nel sistema tecnico delle dodici madri, senza diventare nuovi modelli di supporto. Così le 15 meccaniche non sono cancellate, mentre il catalogo nuovo ne assegna esattamente 13 a 13 modelli. Non si sommano due passive a un supporto normale: la seconda arriva **solo con una Fusione**.

## Cinque livelli, indipendenti dalla madre
- Ogni **copia posseduta** parte da **L1**. Ogni upgrade agisce soltanto su quella copia e porta sequenzialmente fino a **L5**.
- `supportProgression.js` centralizza `SUPPORT_MAX_LEVEL=5`, il grado di abilità e una scala del potenziale L1=0%, L2=25%, L3=50%, L4=75%, L5=100%. Non cambia la progressione separata L1–L20 delle madri.
- `supportCollection.js` salva ogni livello nel consueto schema, limita automaticamente a 5 gli eventuali valori fuori range ed espone `advanceSupportLevel(collection,instanceId)`. Questa funzione **non crea crediti, XP o premi**: il pagamento/sblocco del miglioramento sarà collegato alla futura economia. Nessun pulsante gratuito di upgrade viene aggiunto.
- `supportDeployment.js` usa il livello effettivo della **copia equipaggiata** e aumenta la barra massima HP con una **scala tecnica provvisoria**. L'abilità mantiene la sua funzione attuale e `grade=livello`; taratura di danni, cure, tempi ed effetti verrà fatta solo dopo il catalogo.
- Gli slot si sbloccano con le vittorie di campagna (soglie provvisorie **settore 20/60**), non con il livello supporto o della madre.

## Fusioni
- **13 Carte Navicella Fusione, tutte Leggendarie**, ciascuna rappresenta il proprio modello di supporto già a **L5** e può andare nel mazzo da 40 **se posseduta**.
- Si può giocare solo su un supporto **schierato, attivo, non fuso, a L5**. Il controllo viene eseguito dal motore, non soltanto dall'interfaccia.
- Tutte le madri possono fare fino a **due fusioni** per battaglia, una per slot. In una fusione il supporto mantiene **gli HP correnti e massimi e tutte le ferite**, unendo i due elementi e le due passive.
- Nessuna illustrazione finale o combinazione 3D è stata creata: l'aspetto verrà progettato con **Flow**.

## Cosa rimane fuori da questa fase
- Acquisizione delle 13 Carte Navicella Fusione e dei supporti non iniziali, prezzo e consumo delle risorse per gli upgrade, valori finali HP/abilità/danni, Shop, immagini e VFX.
- Controllo completo della CI e successiva migrazione delle tre vecchie esclusive Fusione delle madri: dati storici preservati per compatibilità, ma il mazzo indipendente usa le nuove Carte Fusione.
