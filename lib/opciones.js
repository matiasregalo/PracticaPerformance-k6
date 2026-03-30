export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    prueba_carga_login: {
      executor:        'ramping-arrival-rate',
      startRate:       1,            
      timeUnit:        '1s',
      preAllocatedVUs: 30,           
      maxVUs:          60,           
      stages: [
        { duration: '30s', target: 10 }, 
        { duration: '1m',  target: 20 }, 
        { duration: '20s', target: 0 },  
      ],
    },
  },
  thresholds: {
    'http_req_duration':    ['p(90)<1500'],
    'login_req_duration':   ['p(90)<1500'],
    'http_req_failed': ['rate<0.03'],
    'checks': ['rate>=0.97'],
    'tasa_errores_negocio': ['rate<0.03'],
  },
};
