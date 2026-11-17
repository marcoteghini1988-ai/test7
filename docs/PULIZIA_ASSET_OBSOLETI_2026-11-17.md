# Pulizia fisica dei vecchi asset — stato aggiornato al 17 novembre 2026

## Prima rimozione
Eliminati 664 asset obsoleti: 362 vecchi SVG di fronti, 248 SVG di gradi e 54 WebP di illustrazioni. Comprendono 36 SVG di Personaggi ormai sostituiti dal rendering nativo.

## Rimozione definitiva dei riferimenti grafici alle carte ritirate
Eliminati anche i 45 file WebP di public/assets/fleet-approved-fronts e il loro manifest.json. Tutti i 45 ID erano presenti fra i 350 ID delle carte ritirate, quindi nessuna delle nuove 120 esclusive viene privata della propria immagine attiva.

**Totale storico: 709 file grafici obsoleti rimossi**, più un manifest non grafico. Nel repository operativo non deve più esistere la cartella fleet-approved-fronts.

## Contenuti da mantenere
Restano 17 SVG di fronti attivi, 10 SVG di varianti di grado attive, 12 carte Boss, ambienti Terreno di campagna, i fronti provvisori nativi delle 120 esclusive e gli asset delle navicelle. Non cambiano il motore delle 120 esclusive, i Personaggi, i Boss, la plancia 3D, il PvP simulato o l'Arca.

I 350 ID storici rimangono soltanto nel documento ARCHIVIO_ID_CARTE_RITIRATE_2026-11-16.json per impedire conflitti e gestire migrazioni; non sono carte eseguibili.

## Nuova fonte grafica
Le scelte storiche che avevano valore (colore per funzione e cromatura per rarità) sono trascritte nella [bozza grafica provvisoria](BOZZA_GRAFICA_CARTE_FUNZIONE_RARITA.md), in attesa di approvazione per le nuove carte. Non usare i vecchi manifest o i vecchi generatori: non devono tornare.
