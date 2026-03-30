import { Trend, Rate, Counter } from 'k6/metrics';
import { sleep } from 'k6';

if (!__ENV.BASE_URL) {
  throw new Error('Variable BASE_URL no definida. Ejecutar con: k6 run -e BASE_URL=https://... script-principal.js');
}
export const BASE_URL = __ENV.BASE_URL;

export function thinkTime(min, max) {
  sleep(Math.random() * (max - min) + min);
}

export const duracionLogin = new Trend('login_req_duration', true);
export const tasaErrores = new Rate('tasa_errores_negocio');
export const loginExitosos = new Counter('login_exitosos');