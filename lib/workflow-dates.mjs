export function dateOnly(value) { return value instanceof Date ? value.toISOString().slice(0,10) : String(value??'').slice(0,10); }
export function appraisalAfterVisit(appraisal,visit){return !!dateOnly(visit)&&dateOnly(appraisal)>=dateOnly(visit);}
