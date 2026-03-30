# PracticaPerformance-k6

Prueba de carga del servicio de login — FakeStore API  
Herramienta: **k6 v0.56.0** 

---

## Tecnologías y versiones requeridas

- **k6 v0.56.0** — https://github.com/grafana/k6/releases/tag/v0.56.0
- Sistema operativo: Windows 10/11, Linux o macOS

---

## Paso 1 – Instalar k6

**Windows (via Chocolatey):**
```bash
choco install k6
```

**macOS (via Homebrew):**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring \
         --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
         --keyserver hkp://keyserver.ubuntu.com:80 \
         --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
     https://dl.k6.io/deb stable main" \
     | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

**Verificar instalación:**
```bash
k6 version   # debería mostrar "k6 v0.56.0 ..."
```

---

## Paso 2 – Clonar / abrir el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd PracticaPerformance-k6
```

O bien abrir directamente la carpeta si ya fue descargada.

---


## Paso 3 – Ejecutar el test

> **La variable `BASE_URL` es OBLIGATORIA.** El script abortará si no se provee.

```bash
k6 run -e BASE_URL=https://fakestoreapi.com script-principal.js
```

### Ejecución con dashboard en tiempo real (opcional)

Al activar `K6_WEB_DASHBOARD`, el dashboard oficial de k6 queda disponible en **http://127.0.0.1:5665** mientras dura el test. Permite observar TPS, latencia y errores en vivo, a diferencia del reporte HTML que solo se genera al finalizar.

**Windows (PowerShell):**
```powershell
$env:K6_WEB_DASHBOARD="true"; k6 run -e BASE_URL=https://fakestoreapi.com script-principal.js
```

**Windows (CMD):**
```cmd
set K6_WEB_DASHBOARD=true && k6 run -e BASE_URL=https://fakestoreapi.com script-principal.js
```

**Linux / macOS:**
```bash
K6_WEB_DASHBOARD=true k6 run -e BASE_URL=https://fakestoreapi.com script-principal.js
```

> Para exportar también el dashboard a un archivo HTML al finalizar, agregar `K6_WEB_DASHBOARD_EXPORT=reportes/dashboard.html`.

El test realizará las siguientes fases:

| Fase       | Duración | Descripción                          |
|------------|----------|--------------------------------------|
| ramp-up    | 30 s     | Sube de 1 TPS a 10 TPS gradualmente  |
| carga pico | 60 s     | Mantiene 20 TPS (requisito mínimo)   |
| ramp-down  | 20 s     | Reduce la carga a 0 TPS              |

Duración total estimada: ~1 minuto 50 segundos.

---

## Paso 5 – Revisar los reportes

Al finalizar el test se generan automáticamente tres salidas:

- **Terminal:** resumen con métricas de `http_req_duration`, `http_req_failed`, `checks`, TPS alcanzado, etc.
- **Reporte HTML interactivo** (`reportes/resultado-prueba.html`): abrir en cualquier navegador. Muestra gráficas de percentiles, errores y tasa de peticiones.
- **Datos JSON** (`reportes/resultado-prueba.json`): útil para integración con CI/CD o análisis adicional.

---

## Criterios de aprobación

El test pasa (exit code `0`) solo si se cumplen **todos** los thresholds:

| Métrica                   | Threshold    | Requisito         |
|---------------------------|--------------|-------------------|
| `http_req_duration` p95   | < 1500 ms    | Tiempo máximo     |
| `login_req_duration` p95  | < 1500 ms    | Tiempo máximo     |
| `http_req_failed`         | rate < 3 %   | Tasa de error     |
| `tasa_errores_negocio`    | rate < 3 %   | Tasa de error     |
| `checks`                  | rate >= 97 % | Calidad respuesta |

Si algún threshold falla, k6 retorna exit code `99` e indica el fallo en rojo en la consola.

---