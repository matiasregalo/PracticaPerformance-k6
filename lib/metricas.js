import { Trend, Rate, Counter } from 'k6/metrics';

export const BASE_URL = __ENV.BASE_URL;
export const duracionLogin = new Trend('login_req_duration', true);
export const tasaErrores = new Rate('tasa_errores_negocio');
export const loginExitosos = new Counter('login_exitosos');