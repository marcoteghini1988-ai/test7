# Eclissi Stellare — Punto 10, motore scudi e quattro parti vitali
Data: 5 novembre 2026

## Decisioni recepite
- Ogni **navicella madre** ha uno scudo generale e 4 parti vitali: motore, sistema armi, generatore scudi, centralina di comando.
- Attraversando le soglie **75%, 50%, 25%, 0%** dello scudo, si sblocca **una nuova scelta** di componente intatto da esporre. **È l'attaccante a scegliere**, non esiste ordine fisso.
- Le parti vitali possiedono **HP propri**, dunque l'esposizione non le distrugge automaticamente. Per danneggiarle occorre la firma matematica o pokeristica prevista dal modello.
- Dopo una riparazione dello scudo, le parti intatte precedentemente esposte oltre la quota disponibile tornano protette; i componenti già distrutti **restano distrutti**.
- **Nessuna rigenerazione automatica** degli scudi. Le future carte speciali potranno ripristinarli, se previste dal loro effetto.
- Distruzione completa della madre quando tutti e 4 i sistemi vitali hanno HP a zero; la distruzione delle scudiere non è necessariamente obbligatoria.
- Una scudiera possiede **un solo scudo**, e a zero può essere distrutta con la propria firma. **Non** ha quattro parti vitali.

## Implementazione
- `src/vitalDefense.js`: funzioni pure e indipendenti per scudi, soglie, esposizione a scelta, HP dei sistemi, riparazioni, firme math/poker e scudiere.
- `src/vitalDefense.test.js`: verifica dei vincoli.
- Il motore è **isolato** e volutamente **non collegato alla battaglia attiva**: `MathDuelBattle.jsx` e gli asset restano intatti, per non sostituire i vecchi quattro motori prima di avere la gestione corretta delle navicelle madri/scudiere.

## Decisioni ancora aperte
1. Valori numerici definitivi degli HP scudi e delle quattro parti per ogni nave e per ogni livello evolutivo.
2. Firma **fissa per modello** di ognuna delle 4 parti (matematica, coppia/tris/scala/colore/full/poker, ecc.), senza requisiti irrealistici.
3. Differenze **tra i 17 modelli** nella perdita del motore, armi, generatore scudi e centralina.
4. Rappresentazione grafica nell'arena 9:16 e aggancio degli impatti, senza compromettere le 85 varianti delle carte navicella.
5. Navicelle scudiere specifiche della madre, sbloccate a L3 e L5 (non carte navicella autonome).

**HP di default (100 scudo, 25 vitali, 60 scudiera) sono unicamente segnaposto di test, non numeri approvati.** Le firme non vengono inventate: in assenza di firma, il codice rifiuta di danneggiare la parte e restituisce `signature_undecided`.
