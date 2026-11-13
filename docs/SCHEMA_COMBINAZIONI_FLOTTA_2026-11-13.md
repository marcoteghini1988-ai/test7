# Eclissi Stellare — passive navicelle e combinazioni tra componenti (13/11/2026)

## Stato reale del codice
- La nuova versione a carte usa 17 navicelle del catalogo ufficiale. In `src/fleetShipPassives.js` ogni modello ha nome, descrizione e una passiva automatica. Le identita' originali delle navi e il loro armamento non sono sostituiti.
- Le passive vengono applicate ad entrambi i giocatori dal motore `src/fleetCardEngine.js` prima della risoluzione simultanea. Le navi continuano a sparare, salvo quelle impegnate in intercettazione.
- La plancia mostra il nome della passiva su ciascuna carta nave e le combinazioni attualmente possibili per entrambe le flotte.
- Le passive sono condizionate da componenti vitali *specifici*. Distruggere Motori, Armi, Generatore o Centralina toglie solo le capacita' dipendenti da quel sistema. Non ogni passiva dipende dalla Centralina.
- Una sola sinergia di coppia viene applicata per lato e round; il motore sceglie la prima combinazione disponibile nell'ordine fissato, senza aggiungere un'altra azione al giocatore.
- Nessun sistema rigenera componenti gia' distrutti. La passiva di riparazione puo' eliminare una frattura (stato 1), ma non ripristinare uno stato 2.
- La scorta difensiva e' il primo passo: se bersaglio e' la madre e scorta ha Generatore/Motori funzionanti, la scorta rinuncia al tiro e riduce da due a una le fratture in arrivo al componente madre. Non azzera il colpo.
- Il motore conserva per ora **la vecchia statistica scudo e la sua barriera**, cosi' come effetti speciali e boss che la utilizzano. La precedente richiesta di eliminarla e di far dipendere la difesa *solo* dalle scorte NON e' stata ancora implementata: occorre convertire riparazioni, boss, effetti delle carte e test in una modifica dedicata.

## Passiva individuale (per archetipo)
| Archetipo | Componenti operativi necessari | Effetto automatico |
| --- | --- | --- |
| Guardia | Generatore, Motori; deve occupare uno slot scorta | Intercetta il danno extra sulla madre, non spara nel round |
| Riparazione | Generatore, Centralina | Ogni 2 round ripara una frattura alleata |
| Assalto | Armi, Motori | Ogni 2 round +1 potenza |
| Congelamento | Generatore, Armi | Ogni 3 round disturba la potenza di tiro nemica |
| Ionico | Generatore, Armi | Ogni 3 round impulso ionico |
| Corrosione | Armi, Generatore | Ogni 3 round colpo corrosivo |
| Precisione | Motori, Armi | Ogni 3 round attacco perforante |
| Artiglieria | Motori, Armi | Ogni 2 round bonus contro Armi o Generatore |
| Analisi | Motori, Centralina | Ogni 3 round potenzia il colpo |

## Sei combinazioni automatiche tra navi (al massimo una per round)
| Combinazione | Ruoli | Componenti richiesti | Reazione |
| --- | --- | --- | --- |
| Baluardo rigenerante | Guardia + Riparazione | Guardia: Generatore/Motori; Riparazione: Generatore/Centralina | Ripara una frattura alleata, se presente |
| Shock termico | Congelamento + Assalto | Congelamento: Generatore; Assalto: Armi/Motori | +1 attacco e Ionico nel terzo round |
| Neurotempesta | Corrosione + Ionico | Corrosione: Armi; Ionico: Generatore | Corrosione e Ionico nello stesso colpo del terzo round |
| Tiro chirurgico | Precisione + Artiglieria | Precisione: Motori; Artiglieria: Armi | Colpo perforante potenziato ogni 3 round |
| Diagnosi di scorta | Analisi + Guardia | Analisi: Centralina; Guardia: Motori | +1 potenza ogni 2 round |
| Ricarica ionica | Ionico + Riparazione | Generatori di entrambe | Ripara una frattura ogni 2 round, se presente |

## Passi successivi
1. Convertire la barra scudo residua in difesa autentica delle scorte, mantenendo la madre sempre bersagliabile.
2. Bilanciare passive e coppie insieme ai 12 boss e a tutte le carte speciali.
3. Evolvere gelo/veleno da bonus al tiro a stati temporanei di componenti, senza impedire all'utente di usare tutte le sue navi.
4. Eseguire CI completa e test visivi Android 9:16, prima di dichiarare il sistema finito.
