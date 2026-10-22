/**
 * VFC de journée (montre Huawei, synchro « dictionnaire », M2) : des mesures ponctuelles prises le jour,
 * marquées `during: 'day'`. Elles ne se mélangent jamais à la VFC de la nuit (ou sans moment précisé, comme
 * celle de Health Connect) qui alimente la tuile « VFC », le Radar, les normes et les analyses : leur arrivée
 * ferait sinon bouger ces moyennes sans que rien n'ait changé chez la personne.
 */
export const isDaytimeHrv = (payload) => payload?.subtype === 'heartRateVariability' && payload?.during === 'day'
