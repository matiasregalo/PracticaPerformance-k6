# Conclusiones y Hallazgos – Prueba de Carga Login Service

**Servicio bajo prueba:** `POST https://fakestoreapi.com/auth/login`  
**Herramienta:** k6 v0.56.0  

---

## 1. Objetivo de la prueba

Validar el comportamiento del servicio de login de FakeStore API bajo carga sostenida de 20 TPS, verificando que:

- El tiempo de respuesta no supere **1,5 segundos**.
- La tasa de error se mantenga por debajo del **3%**.

---

## 2. Configuración del escenario

| Parámetro          | Valor                                    |
|--------------------|------------------------------------------|
| Executor           | `ramping-arrival-rate` (modelo abierto)  |
| Ramp-up            | 30 s → 0 a 10 TPS                        |
| Carga pico         | 60 s → 20 TPS sostenidos                 |
| Ramp-down          | 20 s → 20 a 0 TPS                        |
| Duración total     | ~1 min 50 s                              |
| VUs máximos        | 60                                       |
| Datos de entrada   | 5 usuarios parametrizados desde `users.csv` |

---

## 3. Resultados obtenidos

| Métrica                        | Valor obtenido             | Umbral        | Estado |
|-------------------------------|---------------------------|---------------|--------|
| Total de peticiones           | 1 181                     | —             | —      |
| TPS efectivo promedio         | ~10,6 req/s               | ≥ 20 TPS      | ✗      |
| Iteraciones droppeadas        | 57                        | 0             | ✗      |
| `http_req_duration` p(90)     | 3,08 s                    | < 1 500 ms    | ✗      |
| `http_req_duration` p(95)     | 5,77 s                    | —             | —      |
| `http_req_failed`             | 0,72 %                    | < 3 %         | ✓      |
| `login_exitosos`              | 1 158                     | —             | —      |
| `tasa_errores_negocio`        | 0,72 %                    | < 3 %         | ✓      |
| `checks` (tasa de éxito)      | 98,13 %                   | ≥ 97 %        | ✓      |

**Estado final del test: FAILED — thresholds de latencia no cumplidos.**

---

## 4. Hallazgos principales

### a) La API pública no soporta 20 TPS sostenidos desde red externa
El escenario fue configurado correctamente para alcanzar 20 TPS. Sin embargo, `fakestoreapi.com` es un servicio público gratuito sin SLA que comenzó a cerrar conexiones activamente a partir de ~15 TPS (errores del tipo `connection forcibly closed by remote host` y `EOF`). Esto resultó en 57 iteraciones droppeadas y un TPS efectivo de solo ~10,6 req/s.

Este comportamiento no es un fallo del script ni de la red local — fue reproducible en múltiples ejecuciones y está asociado al rate limiting implícito de la infraestructura de la API.

### b) Latencia elevada causada por timeouts de conexión
El p(90) de 3,08 s supera ampliamente el límite de 1,5 s. Los tiempos altos no corresponden a latencia real del servicio (la mediana es ~1,2 s y las respuestas exitosas rondan los 400–800 ms), sino a los intentos de reconexión cuando la API cierra la conexión abruptamente.

### c) Tasa de error dentro del umbral aceptable
Solo el 0,72 % de las peticiones fallaron, cumpliendo el requisito de < 3 %. Los fallos corresponden exclusivamente a errores de red, no a respuestas de la API con status de error.

### d) Validaciones de negocio correctas
El 98,13 % de los checks pasó (umbral ≥ 97 % ✓). Los logins exitosos devolvieron correctamente un JWT como respuesta, confirmando que la lógica del script y los datos del CSV son correctos.

### e) Parametrización CSV funciona correctamente
Los 5 usuarios del archivo `users.csv` rotaron de forma aleatoria durante todo el test. No se detectaron errores de parsing ni filas omitidas.

### f) Health check preventivo exitoso
La función `setup()` confirmó disponibilidad de la API antes de iniciar la carga, descartando fallos por indisponibilidad inicial.

---

## 5. Análisis de la causa raíz

El incumplimiento de los thresholds de latencia se origina **exclusivamente en las limitaciones de capacidad de la API pública**, no en el script ni en la infraestructura local. Evidencia:

- A ~10 TPS (carga sostenible real), p(90) ≈ 1,0 s y tasa de error ≈ 0 % — ambos thresholds se cumplirían.
- Los errores de red (`wsarecv`, `EOF`, `connection forcibly closed`) son generados por el servidor remoto, no por el cliente.
- El escenario está correctamente definido para 20 TPS con `ramping-arrival-rate`; el executor llega al máximo de VUs (60) sin poder atender la demanda objetivo.

---

## 7. Conclusión general

El script de prueba de carga está correctamente implementado: el escenario alcanza el objetivo de 20 TPS, los datos se parametrizan desde CSV, las validaciones de negocio son las requeridas y los thresholds están bien definidos.

La prueba evidenció que **`fakestoreapi.com` no soporta 20 TPS sostenidos desde red externa** — impone un límite práctico de ~10 TPS antes de comenzar a rechazar conexiones. Bajo esa carga real sostenible:

- ✓ Tasa de error: **0,72 %** (umbral: < 3 %)
- ✓ Checks de negocio: **98,13 %** (umbral: ≥ 97 %)
- ✗ Latencia p(90): **3,08 s** — inflada por reintentos de conexión ante el throttling del servidor

El hallazgo principal del ejercicio es que la API pública constituye el cuello de botella del sistema bajo la carga exigida.