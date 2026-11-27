# Stellar Storm Capacitor Cannon — due fronti approvati

L'utente ha approvato la direzione proposta con «procediamo»: richiamo della
Carta Energia realmente coinvolta, impulso sui supporti vivi contribuenti,
nube elettrica compatta e volumetrica dal proprio bordo, compressione sul
vero bersaglio, boato e contraccolpo sincronizzati con l'aptica. Epica e
Leggendaria mantengono un colpo; la Leggendaria intreccia tre correnti
all'interno della stessa nube. Nessun attacco autonomo dei supporti.

## Inserimento autorizzato — 27 novembre 2026

«Confermo» approva i due fronti mostrati e il loro inserimento nel solo
`test7/main`, con l'effetto già approvato e il collaudo in partita. Gli
stessi quattro PNG (due fronti EN e due basi senza testo) sono promossi
senza rigenerazione; gli SHA-256 originali sono nel manifest. Registro
aggiornato a 52 varianti: 22 Metallo e 30 Fulmine. Livelli EN/IT separati.

Il renderer, il contatto sul vero scafo, il contraccolpo e le partiture
PCM/aptiche riusano i moduli dello studio. La carta Energia realmente
spesa pulsa prima dei supporti vivi; un supporto non lancia un attacco.
Le sequenze delle due Armi attendono contatto e rilascio precedenti.
Suoni e vibrazione sono cancellati se la pagina diventa nascosta.

È risolta la differenza di arrotondamento dei vecchi profili: la famiglia
Tempesta arrotonda base e bonus separatamente come i fronti approvati,
poi applica Arsenale, Difesa, affinità e Terreno. I nominali finali non
ricevono di nuovo il fattore strategico. Gli altri profili rimangono
invariati. I numeri legacy e i rapporti dello studio sotto restano storia
della preparazione. Il collaudo StackBlitz dell'inserimento è completato sulla revisione
`5295fbe23800fb064be42b0b92aee2aab042bcd1`, dopo la pubblicazione del codice
`748279560996cc9f9ef1e0f8e1232792060d3ade` e la materializzazione esatta dei
quattro PNG. Verificati salvataggio e reload della copia esistente, 790
sorgenti e 52 varianti. Le due basi caricano a 3072×4608 e il cambio EN/IT
sostituisce i 18 campi conservando lo stesso PNG.

Dodici prove registrate: Epica e Leggendaria A/B, madre e supporti, slot 1
e 2; richiamo di entrambi i veri supporti; Difesa con contatto sullo scudo,
zero danno e zero contraccolpo; nessuna Energia; sola riserva vecchia;
Arma disabilitata con spesa reale e nessun lancio; salto del secondo
pagamento, ripresa nel terzo turno e slot svuotati dopo la scadenza.
Ripristino finale: zero segnalazioni risorsa, zero copie transitorie e
zero pose residue. `verifica-partita-stackblitz.json` conserva i dati DOM.

Suite completa 2485/2485, build e preflight passati. Il video è una
registrazione della plancia ufficiale con audio della scheda, 900×1600,
non un rendering offline. Gli estratti eliminano le pause fra le prove;
nessuna variazione di velocità, nuovi fotogrammi o audio aggiunto. Il
browser cloud ha fluidità variabile; non certificare 30 FPS costanti.
Il filmato finale H.264/AAC mono 48 kHz dura 63,626 secondi e conserva
900×1600. `condensatore-tempesta-battaglia-stackblitz-con-audio.mp4`,
`libfile_f9ff2f7314f481918c9768804805293a`. Conservata anche la registrazione
originale WebM/Opus, 60.651.442 byte,
`libfile_793215fcf42c8191ba01ea64a2c4dbfe`. Hash e riferimenti sono nel rapporto.
La vibrazione fisica richiede ancora un telefono compatibile.

## Archivio della preparazione prima della conferma

Le attese di approvazione e di allineamento numerico nelle sezioni seguenti
sono storiche, superate dall'inserimento autorizzato sopra.

## Meccanica verificata prima della grafica

Famiglia `weapon-designed-ionic-condensatore-tempesta`, Fulmine, Epica e
Leggendaria. Tre turni propri, una nuova Energia Fulmine giocata per ogni
attivazione, consumo reale di una carica; una vecchia riserva da sola non
basta. Una sola nuova carica non alimenta due Armi. Saltare un pagamento
fa perdere quel colpo, senza impedire di riprendere nei turni rimasti né
prolungare la durata. I supporti vivi amplificano il danno senza sacrificio
di HP. Valgono difese, copertura, affinità e modificatori del motore.

| Rarità | Base di stampa | Bonus per supporto vivo | 0 / 1 / 2 supporti |
| --- | --- | --- | --- |
| Epica | 31 HP | 14 HP | 31 / 45 / 59 HP |
| Leggendaria | 43 HP | 19 HP | 43 / 62 / 81 HP |

Fonte dei numeri delle carte: `WEAPON_NEAR_FINAL_VALUES`. Il vecchio
profilo del motore conserva 18 +8 / 23 +10, prima del fattore strategico.
I due strati sono registrati nel manifest; prima della promozione verificare
e allineare gli arrotondamenti sul percorso completo, senza un secondo
moltiplicatore né una revisione generale del bilanciamento. Questo lavoro
non modifica i danni: al motore sono aggiunti solo i metadati della vera
carica spesa e degli ID dei supporti contribuenti. Un tentativo disabilitato
consuma ancora la carica nel motore corrente, ma la prova non inventa uno
sparo riuscito o un danno. Conservare questa distinzione.

## Due fronti e livelli linguistici

Illustrazioni originali PNG 1448×1086 in
`asset-sources/weapon-previews/condensatore-tempesta-2026-11-27/art`.
Epica: banco capacitivo in grafite e argento, isolatori, bobine e costole
di compressione, con montaggio laterale. Leggendaria: stessa struttura,
scena e componenti, più tre stabilizzatori fisici in cristallo prismatico.
Ogni illustrazione mostra la macchina e una singola nube elettrica.

I fronti completi sono RGBA 3072×4608. Le cornici rosse ufficiali Epica e
Leggendaria, gli adesivi Arma/Fulmine e il font originali sono ricomposti
materialmente. Zero pixel protetti della cornice modificati e alfa esterna
invariata. I testi EN/IT sono esterni, su livelli SVG separati; il cambio
lingua non modifica un pixel fuori dalle regioni testo dichiarate dal
progetto. Non dichiarare le illustrazioni native a 3072.

## Anteprima dell'effetto e stato

`stormCapacitorSpec`, `stormCapacitorRenderer` e `stormCapacitorAudio`
costituiscono lo studio da riutilizzare nell'inserimento dopo approvazione.
Una nube a volume con billows ombreggiati e fulmini ramificati, correnti
intrecciate nella Leggendaria, contatto aderente alla corazza e vero
contraccolpo. La Difesa reagisce sul proprio simbolo e sullo scudo: zero
danno e zero contraccolpo dello scafo. Le posizioni dei supporti rimangono
stabili dopo la distruzione del primo supporto.

La pagina interattiva contiene 12 casi di tre turni, EN/IT, pausa/cursore,
volume/mute, movimento ridotto, aptica facoltativa e cancellazione quando
la pagina è nascosta. Il video è uno studio dell'effetto, 32,9 secondi,
720×1280, H.264/AAC stereo a velocità nativa: Epica, Leggendaria, tiro B,
salto e ripresa dell'alimentazione, Difesa. Non è una registrazione della
partita ufficiale. Il collaudo in partita segue l'inserimento approvato;
la vibrazione fisica richiede un telefono compatibile.

30 test mirati passati, build e preflight passati. Verifica software delle
geometrie e dei contatti con stato Canvas bilanciato; stessa partitura
per video e pagina. Bundle HTML compilato e dati/script controllati;
nessun nuovo collaudo interattivo nel browser dichiarato. Rapporti in
`docs/collaudi/condensatore-tempesta-2026-11-27`.

**Stato: direzione approvata; due fronti completi in attesa di approvazione.
Le 50 varianti già approvate rimangono registrate. Non aggiungere questi
fronti ai percorsi giocabili prima della conferma delle due immagini.**
Non rigenerare le immagini dopo la conferma: promuovere gli stessi byte.
Rimane poi il Cannone del Giudizio Temporale, da leggere prima di proporne
l'effetto. Non confondere questa chat Armi con la progettazione dei Boss.
