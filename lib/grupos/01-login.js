import http   from 'k6/http';
import { check, group } from 'k6';

import {
  BASE_URL,
  duracionLogin,
  tasaErrores,
  loginExitosos,
} from '../metricas.js';

export function flujoLogin(usuario) {
  group('01 - login', function () {
    const payload = JSON.stringify({
      username: usuario.user,
      password: usuario.passwd,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',
      tags:    { endpoint: 'login' },
    };

    const t0  = Date.now();
    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    duracionLogin.add(Date.now() - t0);

    const ok = check(res, {
      'login: status 200':         (r) => r.status === 200,
      'login: token presente':     (r) => {
        try {
          return JSON.parse(r.body).token !== undefined;
        } catch (_) {
          return false;
        }
      },
      'login: duración < 1500 ms': (r) => r.timings.duration < 1500,
    });
    if (ok) {
      loginExitosos.add(1);
    } else {
      tasaErrores.add(1);
    }
  });
}