# AGENT INSTRUCTIONS — ECLISSI STELLARE / test7

## Aggiornamento approvato il 23 novembre 2026 — cornici di rarità

Leggere [docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md](docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md) per la palette aggiornata: **Comune grafite, Rara sabbia bronzata, Epica argento, Leggendaria oro**, identica per ogni categoria. Le quattro basi vuote Attacco in `docs/riferimenti-carte/nuove-basi-2026-11-23/attacco/` sono approvate. Il colore interno rimane quello della categoria. Questa decisione esplicita dell'utente prevale sulle vecchie indicazioni Comune argento / Rara blu / Epica viola, senza modificare i due PNG originali del 21 novembre o le regole sui simboli ufficiali. Le basi delle altre categorie devono essere verificate visivamente prima di diventare fronti giocabili.

## IMPORTANTISSIMO — ogni richiesta «crea una carta»

La PRIMA OPERAZIONE, anche in nuove chat o sessioni, è leggere il file
[docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md](docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).
**Non saltare i passaggi perché l'utente ha scritto solo "crea la carta".**

Ordine FISSO: **catalogo + valori giocati → base PNG ufficiale → tavola
PNG dei simboli ufficiali → composizione sul modello ORIGINALE → controllo
visuale → anteprima in chat → approvazione prima dell'inserimento.**

Sorgenti obbligatorie, originali da riutilizzare MATERIALMENTE:
- `docs/riferimenti-carte/BASE_UFFICIALE_CARTE_2026-11-21.png`
- `docs/riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png`
- `docs/CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md`
- `src/fleetNext/rules.js`, `src/fleetNext/weaponRarityEvolutions.js`
- `docs/VALORI_QUASI_DEFINITIVI_235_ARMI_2026-11-22.md` per le Armi

**Divieto assoluto** di inventare icone "simili": ARMA è la torretta/cannone
futuristico arancione **esattamente nella tavola ufficiale**, non cannone
storico su ruote o mirino. Le icone elemento si ritagliano realmente dalla
stessa tavola. Nessun logo del gioco sulle carte. Grafica base immutabile.
Le rarità cambiano la finitura esterna, non la categoria.

**Ogni evoluzione della stessa carta deve avere un dettaglio VISIVO
AGGIUNTIVO E DIVERSO nell'illustrazione centrale**, progressivo fra Comune,
Rara, Epica e Leggendaria. Non basta cambiare i danni, la cornice o il suo
colore: si deve vedere la progressione fisica del soggetto pur conservandone
identità, scena, simboli ufficiali e geometria della base. I dettagli artistici
NON aggiungono nuove abilità o modifiche al combattimento. Prima di mostrare
le varianti, verificare questa differenza a colpo d'occhio.
Riferimento operativo: `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

**CARTE ARMA — REGOLA DI REALIZZABILITÀ 3D OBBLIGATORIA:** prima
di generare qualsiasi Arma, pensarla come un dispositivo offensivo
futuristico realmente modellabile e montabile su una navicella. La scena
deve mostrarne scocca, volumi 3D, innesti, struttura meccanica, emettitori,
nuclei e parti funzionali leggibili. **Non disegnare utensili fantasy o
martelli tradizionali**. Anche se la carta si chiama «Maglio
Ferrogravitazionale», raffigurare un apparato gravitazionale pesante
tecnologico con aggancio navale, non un martello da impugnare. Ogni
evoluzione mantiene l'identità dell'apparato ma ne evolve componenti
fisici riproducibili in 3D. Se non è plausibile modellarlo e animarlo
come arma della flotta, l'illustrazione va rifatta. Non alterare regole,
danni, simboli, cornice e base di carta. La procedura completa è in
`docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

Se una sorgente PNG non può essere letta come immagine, non dichiarare
conforme una generazione che ne imita la forma: dirlo e risolvere la lettura
della sorgente prima di proseguire.

**Le anteprime di immagini non si inseriscono negli asset giocabili finché
non sono approvate dall'utente.**

## Lavoro sul repository

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`.
Non creare cloni, progetti paralleli o versioni di prova.
Non cambiare meccaniche, valori, layout della plancia 3D o vecchie
immagini approvate mentre si crea un'anteprima carta.

**Questa è una regola operativa persistente del progetto.**
