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

    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    duracionLogin.add(res.timings.duration);

    const ok = check(res, {
      'login: status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    if (ok) {
      loginExitosos.add(1);
      tasaErrores.add(0);
    } else {
      tasaErrores.add(1);
    }

    thinkTime(0.5, 1.5);
  });
}