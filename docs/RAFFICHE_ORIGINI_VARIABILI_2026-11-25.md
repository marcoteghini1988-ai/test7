# Salve, traiettorie e partenze variabili — 25 novembre 2026

L'utente ha rifiutato gli effetti con la stessa dinamica e un diverso
disegno del proiettile. Chiede di variare punti di partenza, numero di
colpi e azione completa: raffiche, esplosioni, rotazioni ed effetti speciali.
Questa decisione sostituisce centro USB fisso e singolo proiettile delle
revisioni precedenti per le 22 varianti già approvate.

| Famiglia | Comune | Rara | Epica | Leggendaria |
| --- | --- | --- | --- | --- |
| Maglio | 1 pistone | 3 traiettorie orbitali | 6, in due gruppi | 9, tempesta gravitazionale e finale pesante |
| Slitta | 3 staccati | 6 incrociati | 9, tre batterie | 6 rapidi + 1 lancia finale |
| Recuperatore | — | — | 3 capsule a parabola | 6 capsule a spirale e fioritura di plasma |
| Ganasce | — | 2 agganci laterali | 2, catene a frusta | 2, agganci orbitali |
| Collassatore | — | — | Trazione dei due scafi e uno schianto | Trazione e uno schianto prismatico |
| Induzione | — | — | 3 lame rotanti | 6 lame a ciclone |
| Cascata | — | — | 1 nucleo perforante | 3 nuclei intrecciati per tratta reale |
| Schegge Erranti | — | 3 a ventaglio | 6 rotanti | 9 in tre gruppi, frattura finale |

## Contratto fra motore e grafica

`approvedWeaponSalvos.js` è l'unica tabella delle salve approvate. Il
catalogo e le evoluzioni vi leggono numero e descrizione. L'emettitore
del combattimento aggiunge pacchetti `projectileHits` con indice, ritardo,
bersaglio e danno effettivo attribuito al singolo proiettile. La somma è
esattamente il danno risolto dal motore, anche con mitigazione, HP residui
minimi o colpi con attribuzione zero. Una salva completamente bloccata
non spara; l'Induzione può mostrare il solo contatto sulla Difesa.

Difesa, copertura, bonus, cap e reazioni restano quelli dell'azione per
bersaglio. Il numero di proiettili non moltiplica la potenza della carta.
I colpi aggregati rimangono leggibili da `fleetWeaponShots`; la scena e
il timer usano `fleetWeaponProjectiles`. La durata comprende l'ultimo
proiettile e il finale, compresa la lancia della Slitta.

Le condizioni speciali rimangono reali: due bersagli per le Ganasce,
combo nel turno corretto per lo schianto, bonus del Recuperatore dalla
perdita HP osservata, Energia e Difesa per l'Induzione, cambio bersaglio
nel turno successivo delle Schegge. Nella Cascata si aspetta l'ultimo
contatto della tratta precedente più 90 ms, si consuma una sola Energia
per trasferimento e si parte dallo scafo appena colpito. I tre nuclei
non pagano tre Energie e non ripartono dal bordo del telefono.

## Camera, scafi e punti di lancio

`weaponKinematics.js` sceglie cinque porte nel proprio lato, con profondità
diverse e variazione deterministica per carta, turno e slot. A e B sono
speculari. Le Ganasce usano i due fianchi opposti e conservano la porta del
bersaglio realmente agganciato anche se il primo arpione è bloccato.

La posizione e la tangente delle curve guidano insieme modello, naso,
scia e luce. I modelli ruotano sui tre assi e le punte arrivano sullo scafo
misurato, non sul centro di un'immagine. Il Maglio mantiene scala massima
0,48. Le curve orbitali escono dall'azimut delle vecchie 24 viste: per le
salve si usa la geometria 3D completa, senza ingrandire o stirare una vista
PNG fuori calibrazione. Le viste Cycles rimangono per il tiro singolo.
I proiettili intermedi delle salve sono più piccoli. Colpi intermedi:
contatti brevi e rinculo ridotto; ultimo
colpo: finale specifico. Le riflessioni di un proiettile in arrivo non
cancellano il rinculo già attivo. Le pose vengono ripristinate.

Le code sonore sono più corte durante la raffica, le partenze hanno pan
della propria porta e i contatti quello del bersaglio. Aptica: piccoli
impulsi per i colpi intermedi e impulso finale distinto. Preferenze e
movimento ridotto continuano a essere rispettati. La vibrazione fisica
va ancora verificata su un telefono compatibile.

## Testo delle carte e verifiche

`WeaponSalvoCardMarks` aggiorna il fronte composto durante mano, slot,
scarti, collezione e rivelazione. Copia lo sfondo delle etichette dalle
quattro cornici originali e disegna testo vettoriale con il font ufficiale:
`TOTAL DAMAGE`, `3/6/9 SHOTS` oppure `6 + 1`. Illustrazioni, cornici,
simboli e numeri HP approvati restano quelli originali. I PNG precedenti
sono lo strato illustrato; per un'esportazione completa comporre anche
le etichette correnti. Il composito è stato controllato alla risoluzione
HD originale e in anteprima ridotta.

I nuovi test verificano salve emesse dal motore per tutte le varianti,
A/B, entrambi gli slot, blocchi, danni e bersagli invariati, origini
variabili e speculari, punte 3D sulle curve, agganci persistenti e costi
della Cascata. Un controllo semantico verifica gli identificatori dei
renderer React: è stato corretto un import mancante nel canvas della
revisione precedente, non rilevato dai soli test del combattimento.

Lo stato del collaudo dal vivo e dell'eventuale video va dichiarato nel
rapporto di verifica: una build, uno studio offline o i vecchi collaudi
StackBlitz non costituiscono prova della nuova partita.

Verifiche del codice completate: **2284 test dell'intera suite logica**,
build di produzione e preflight. Il preflight comprende adesso il
controllo dei collegamenti dei renderer. L'avvio dev prepara automaticamente
la pagina di prova già esistente, con il numero di colpi della salva.
