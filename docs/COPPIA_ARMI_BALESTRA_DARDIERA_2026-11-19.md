# Eclissi Stellare — Balestra di Nebbia Gelata + Dardiera della Brina Inversa

**Data:** 19 novembre 2026 · **Stato:** bozza corretta dopo la revisione degli elementi e dei bersagli, da approvare nei dettagli e bilanciare. **Non implementata nel motore.**

## Perché queste due Armi sono compatibili
Entrambe sono di elemento **Ghiaccio**, ma hanno **dardi di polarità criogenica opposta**: la Balestra deposita una struttura cristallina positiva, la Dardiera un reagente cristallino inverso. Il contatto provoca una **frattura esplosiva**. Nessuna combinazione Fuoco/Acqua né Fuoco/Ghiaccio.

## Balestra di Nebbia Gelata
- **ID:** `weapon-new-cryogenic-03`
- **Rarità iniziale:** Comune; evoluzione con 3 doppioni per passaggio, da Comune fino a Leggendaria; gli HP evoluti vanno bilanciati
- **Elemento:** Ghiaccio
- **Danno diretto:** 15 HP nominali, un dardo
- **Bersaglio unico:** **nave madre nemica**, anche se ha uno o due supporti operativi
- **Effetto:** se l'impatto supera le Difese e sottrae HP, lascia un cristallo sulla madre; scartata l'Arma, il cristallo rimane
- **Scadenza:** al termine del **turno proprio successivo** di chi ha installato la Balestra, se non viene innescato, si scioglie senza danno
- **Limite:** un cristallo per bersaglio, non cumulabile gratuitamente

## Dardiera della Brina Inversa
- **ID:** `weapon-new-cryogenic-05`
- **Rarità iniziale:** Rara, progressione per doppioni ancora da definire
- **Elemento:** Ghiaccio
- **Danno diretto:** 12 HP nominali, un dardo
- **Bersaglio unico:** **nave madre nemica**, anche se i supporti sono operativi
- **Danno autonomo:** anche senza cristallo, infligge il proprio danno normale e si scarta
- **Reazione:** solo se infligge **HP reali** alla madre con il cristallo della Balestra attivo, il dardo negativo provoca la frattura cristallina: **12 HP nominali aggiuntivi** alla madre, una sola volta, e consuma il cristallo

## Come si giocano
**Stesso turno:** installa la Balestra in uno dei due slot Arma; risolvi il suo colpo contro la madre. Installi la Dardiera nel secondo slot, che spara sulla **stessa nave madre**. Se entrambe le condizioni di danno reale sono soddisfatte, esplode il cristallo. Le Armi si scartano a fine turno e liberano gli alloggiamenti.

**Turni propri consecutivi:** nel primo turno installi la Balestra e lasci il cristallo sulla madre. Dopo il turno avversario, nel tuo turno successivo installi la Dardiera, che può innescare il cristallo. A fine turno, se inutilizzato, il cristallo si scioglie. La Balestra non deve restare installata per conservare il cristallo.

**Senza seconda Arma:** la Balestra fa solo il danno iniziale, il cristallo si scioglie senza esplodere. **Senza cristallo:** la Dardiera fa solo il suo danno base.

## Difese e regole di bersaglio
Queste due Armi sono una **eccezione progettata all'obbligo di colpire prima i supporti**: sparano direttamente alla madre anche quando i supporti nemici sono vivi. **Questo non significa perforazione.** Le difese ordinarie, la mitigazione, gli elementi e i limiti HP madre si applicano a entrambi i colpi e alla reazione, ciascuno come evento distinto. Un colpo completamente bloccato non può creare o innescare il cristallo. Nessuna esplosione può avvenire a vuoto.

## Conteggi
La Dardiera è stata assegnata a una delle **100** posizioni già esistenti, nella categoria **Ghiaccio Rara**. Al posto della vecchia Dardiera Fuoco ritorna il progetto originale **Siluro Piromante** in **Fuoco Comune**. Le prime 33 Armi, le altre 67 Armi proposte, le 67 Carte Attacco da rivedere e le 4 Armi confermate mantengono tutti i loro conteggi. **Nessuna 101ª Arma.**

**Ancora da discutere:** valore dell'esplosione, potenziamento nelle rarità, contromisure specifiche future, implementazione e collaudo nel vero motore.
