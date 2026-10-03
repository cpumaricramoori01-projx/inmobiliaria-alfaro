export type ReportValue = string | number | boolean | null | undefined | string[];
export type ReportRow = Record<string, ReportValue>;
export type ReportSummary = {
  total: number; activos: number; historicos: number; disponibles: number;
  visitasPendientes: number; visitasRealizadas: number; tasacionesPendientes: number;
  tasacionesRealizadas: number; aprobaciones: number; negociaciones: number;
  materialPendiente: number; listosParaPublicar: number; publicados: number;
};
