/** R9: compatibilita' transitoria per rami PvP online inattivi di App.tsx.
 * Ogni riferimento e' impossibile finche' db=null. Non apre connessioni.
 * Se chiamato per errore, segnala subito una regressione invece di fingere un server.
 */
const unavailable = () => {throw new Error('R9: PvP online disattivato. Utilizzare la modalita IA locale.');};
export const ref = unavailable;
export const onValue = unavailable;
export const update = unavailable;
export const onDisconnect = unavailable;
