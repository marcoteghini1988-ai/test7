# Sei Carte Arma — Giudizio Temporale e Fuoco

**Stato al 27/11/2026: integrate e collaudate.** L’utente ha approvato le due direzioni Fuoco con «Confermo entrambe le direzioni» e poi i sei fronti e l’inserimento su test7/main con «procedi». Non richiedere una nuova approvazione e non rigenerare i PNG approvati.

Il registro giocabile comprende **58 varianti: 22 Metallo, 31 Fulmine, 5 Fuoco**. Integrazione: `6ae9bfd178d8900e39b368f238db591a69d7c2d0`. Materializzazione dei dodici PNG originali e sorgente collaudato su StackBlitz: `cf381aaafd0a5b5f12239ef38e115f26cac4ef74`.

## Sei fronti e regole eseguite

| Famiglia | Rarità | Nome sul fronte EN | Nominali diretti | Durata |
| --- | --- | --- | --- | --- |
| Cannone del Giudizio Temporale | Leggendaria | Temporal Judgment Cannon | 20% HP massimi del bersaglio | 3 turni propri, un attacco alla posa |
| Mortaio Magmatico | Rara | Magmatic Mortar | 20 base, 8 per extra | 3 turni propri |
| Mortaio Magmatico | Epica | Magmatic Mortar | 48 base, 19 per extra | 3 turni propri |
| Mortaio Magmatico | Leggendaria | Magmatic Mortar | 67 base, 28 per extra | 3 turni propri |
| Inceneritore a Plasma Rotante | Epica | Rotating Plasma Incinerator | 37 al T1, 27 al T2 | 2 turni propri |
| Inceneritore a Plasma Rotante | Leggendaria | Rotating Plasma Incinerator | 54 al T1, 39 al T2 | 2 turni propri |

I valori Fuoco stampati si applicano una volta sola attraverso `approvedBatchNominals.js`; coperture, resistenze e modificatori ordinari determinano il danno effettivo. Non è un nuovo bilanciamento definitivo.

- **Giudizio:** un solo attacco nel turno di posa; nessun tiro automatico ai turni 2 e 3. Nessun costo Energia. Per un componente della madre la percentuale usa gli HP massimi della madre; per un altro bersaglio usa i suoi HP massimi. Difese e coperture ordinarie si applicano. Scade al quarto turno proprio.
- **Mortaio:** un colpo base gratuito, al massimo due extra per turno, ciascuno pagato con una carica Fuoco reale. Le cariche sono riservate prima del Generatore. Con 0/1/2/3 cariche iniziali produce 1/2/3/3 colpi; la carica residua del caso da tre consente un extra al T2. Il conteggio considera il consumo reale anche per carte a cariche multiple.
- **Inceneritore:** il primo impatto che infligge danno fissa cinque tick di Bruciatura in base alle proprie Strategie negli scarti. Epica: 2 per Strategia, minimo 2 e massimo 12; Leggendaria: 3, minimo 3 e massimo 16, prima delle difese ordinarie della madre. Il secondo colpo non rinnova la Bruciatura. Se il primo è bloccato, non applica Bruciatura.
- Il motore applica il primo tick alla chiusura del turno di posa e poi a ogni passaggio di turno. Sono cinque eventi, non cinque soli turni avversari. I tick residui continuano dopo la scadenza dell’Arma, senza nuova posa, rivelazione della carta o proiettile inventato.

## Effetti, suoni e aptica

Giudizio avvicina un nucleo con tre anelli elettrici su piani e ritmi diversi, li allinea e li concentra in una sola scarica. Il Mortaio lancia sfere di magma con archi pesanti, crepe, frammenti e filamenti propri per R/E/L. L’Inceneritore emette un getto elicoidale: la Leggendaria intreccia più filamenti nello stesso contatto. Le decorazioni non aggiungono attacchi o danni.

Studio e partita condividono `weaponBatchSpec`, i renderer Giudizio/Fuoco e `weaponBatchAudio`; il punteggio sonoro determina anche il piano aptico. Energia, Bruciatura, contraccolpi dello scafo e scudi seguono gli eventi effettivi. Azioni indipendenti si concludono in sequenza; la raffica interna del Mortaio conserva i suoi 480 ms di distanza. Le origini A/B vengono dai rispettivi bordi. Nessun modello di macchina Arma viene montato sulla plancia.

## Originali e testi EN/IT

I sei fronti EN e le sei basi senza testo sono RGBA 3072×4608, conservati byte per byte in `asset-sources/weapon-fronts/lotto-giudizio-fuoco-2026-11-27`. Il ripristino verifica parti, SHA-256 e formato. CI materializza i PNG nativi in `public/assets/fleet-weapon-fronts`. Le sei illustrazioni originali sono 1448×1086: la risoluzione del fronte non è quella nativa dell’illustrazione.

Lo sprite magma trasparente, le illustrazioni e i prompt approvati sono in `asset-sources/weapon-previews/lotto-giudizio-fuoco-2026-11-27`. I testi sono SVG separati EN/IT sopra la stessa base. Cornici, simboli ed evoluzioni approvate sono preservati. `%` e `+`, assenti nel font ufficiale, usano i vettori del livello testo.

## Collaudo della partita StackBlitz

È stata aggiornata la copia esistente `github-edu2s6xy`, senza un nuovo progetto. Il bootstrap salvato carica il sorgente verificato e serve le immagini dal medesimo SHA. Dopo l’incolla con tastiera nativa, una nuova riga e Ctrl+S, il riferimento è rimasto presente anche al reload; l’avvio ha verificato **826 sorgenti** e il pannello mostra **58 varianti**. Il generatore del package ora ripristina il proprio comando salvato dopo il sync, così un aggiornamento dei sorgenti non lo sostituisce.

Le prove usano stati iniziali preparati nel pannello di collaudo, poi risoluzione e presentazione della partita ufficiale con avversario AI:

- tutte le sei varianti A/B, madre e supporti, entrambi gli slot;
- Mortaio con 0/1/2/3 cariche, limite di due extra e residuo al T2;
- Mortaio con due Energie Fuoco realmente selezionate dalla mano nello stesso turno, sulla flotta Fuoco compatibile;
- Inceneritore al T2 e Bruciatura residua al T3 senza rimontare l’Arma;
- Giudizio ai T2/T3 senza nuovi attacchi e scadenza al T4;
- tre prove di Difesa: Giudizio bloccato, Mortaio con primo colpo bloccato e due extra reali, Inceneritore bloccato senza incendio;
- sei Armi disabilitate senza colpi o animazioni offensive;
- sei basi caricate realmente a 3072×4608; cambio EN/IT sugli stessi URL con soli testi diversi.

Le flotte di prova vengono scelte per non confondere la selezione di Energie del Generatore da parte dell’AI con un attacco Arma. L’AI rimane quella reale. Le misure sono in `docs/collaudi/lotto-giudizio-fuoco-2026-11-27/verifica-partita-stackblitz.json`: 39 riscontri DOM conservati, sei coppie di letture EN/IT e tre letture di Difesa trascritte dai risultati CUA.

Suite completa sul codice di integrazione: **2493/2493**; build e preflight passati. I tre test del sincronizzatore passano. Il collaudo riguarda questo lotto; non certifica la distinta nuova specifica Personaggi/Strategie/Energie immediate o lo Stratega.

## Video reale con audio

- [Estratto, 97,077 secondi](https://chatgpt.com/library?file_id=libfile_2130dc7cc2b48191a3a9f7eb76e24d3a&account_id=personal): 900×1600, H.264 High 4.0 e AAC mono 48 kHz. Tagliate soltanto attese fra le prove, senza cambiare la velocità dei colpi né aggiungere audio.
- [Registrazione integrale, 196,665 secondi](https://chatgpt.com/library?file_id=libfile_cf6ad2563d1c8191b47292aada0c41b5&account_id=personal): MP4 H.264/AAC della scheda, con i tempi originali.
- [Originale WebM](https://chatgpt.com/library?file_id=libfile_3c825c9ef1f08191b51edc8e791ed77e&account_id=personal): acquisizione VP9/Opus preservata.

Audio integrale: picco −4,5 dB, medio −33,3 dB. La fluidità è variabile nel browser cloud: non dichiarare 30 FPS costanti. Il valore 30 nel contenitore dell’estratto è nominale, non la frequenza effettiva dei fotogrammi. La vibrazione fisica resta da verificare su un telefono compatibile.

Lo studio precedente da 62,9 secondi rimane una consegna storica separata (`libfile_500baaedc43c8191aeabfee4e869fc75`). Il pacchetto HD EN/IT approvato resta `libfile_80d318638a4c81918b8b030583c534f3`. Nessuna delle carte approvate è stata rigenerata per questa integrazione.
