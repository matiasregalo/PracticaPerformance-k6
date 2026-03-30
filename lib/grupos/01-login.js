import http   from 'k6/http';
import { check, group, fail } from 'k6';

import {
  BASE_URL,
  duracionLogin,
  tasaErrores,
  loginExitosos,
  thinkTime,
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
      'login: token presente':     (r) => r.json('token') !== undefined,
      'login: duración < 1500 ms': (r) => r.timings.duration < 1500,
    });
    if (ok) {
      loginExitosos.add(1);
      tasaErrores.add(0);
    } else {
      tasaErrores.add(1);
      fail('Login fallido — no tiene sentido continuar sin token');
    }

    thinkTime(1, 3);
  });
}