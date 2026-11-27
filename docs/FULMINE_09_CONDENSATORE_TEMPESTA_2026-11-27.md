# Stellar Storm Capacitor Cannon — due fronti da approvare

L'utente ha approvato la direzione proposta con «procediamo»: richiamo della
Carta Energia realmente coinvolta, impulso sui supporti vivi contribuenti,
nube elettrica compatta e volumetrica dal proprio bordo, compressione sul
vero bersaglio, boato e contraccolpo sincronizzati con l'aptica. Epica e
Leggendaria mantengono un colpo; la Leggendaria intreccia tre correnti
all'interno della stessa nube. Nessun attacco autonomo dei supporti.

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
