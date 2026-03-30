import http    from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { htmlReport }  from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { options as loadOptions } from './lib/opciones.js';
import { flujoLogin }             from './lib/grupos/01-login.js';
import { BASE_URL }               from './lib/metricas.js';

export const options = loadOptions;

const usuarios = new SharedArray('usuarios', function () {
  return papaparse
    .parse(open('./users.csv'), { header: true, skipEmptyLines: true })
    .data
    .filter((u) => u.user && u.passwd);
});

export function setup() {
  const res = http.get(`${BASE_URL}/products?limit=1`, {
    tags: { endpoint: 'health_check' },
  });
  check(res, { 'health check: API disponible': (r) => r.status === 200 });
}

export default function () {
  const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
  flujoLogin(usuario);
}

export function handleSummary(data) {
  return {
    'reportes/resultado-prueba.json': JSON.stringify(data, null, 2),
    'reportes/resultado-prueba.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}