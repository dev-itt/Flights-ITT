# Flights ITT - AENA PMI API

Cloudflare Worker que extrae datos de vuelos del aeropuerto de **Palma de Mallorca (PMI)** desde la web de AENA y los expone como API REST.

## Arquitectura

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare KV (snapshots diarios)
- **Scraping**: Fetch + regex parsing del HTML de AENA
- **Cron**: Ejecucion diaria a las 06:00 UTC

## URL Base

```
https://aena-pmi-api.reviews-google-itt.workers.dev
```

---

## Endpoints

### `GET /`

Devuelve la lista de endpoints disponibles.

**Response:**
```json
{
  "service": "AENA PMI Flight Data API",
  "airport": "PMI - Palma de Mallorca",
  "endpoints": {
    "/api/airlines": "Airlines with their destinations",
    "/api/destinations": "Destinations with country and serving airlines",
    "/api/routes": "All airline-destination route pairs",
    "/api/all": "Complete scraped data",
    "/api/scrape": "Manually trigger a new scrape",
    "/api/snapshot/:date": "Historical snapshot (YYYY-MM-DD)",
    "/api/status": "Service status"
  }
}
```

---

### `GET /api/airlines`

Lista todas las aerolineas que operan en PMI con sus destinos.

**Response:**
```json
{
  "updated": "2026-02-01T23:32:49.096Z",
  "count": 31,
  "airlines": [
    {
      "name": "AIR EUROPA",
      "destinations": [
        {
          "city": "ALICANTE-ELCHE",
          "iata": "ALC",
          "raw": "ALICANTE-ELCHE (ALC)"
        },
        {
          "city": "BARCELONA-EL PRAT JOSEP TARRADELLAS",
          "iata": "BCN",
          "raw": "BARCELONA-EL PRAT JOSEP TARRADELLAS (BCN)"
        }
      ]
    }
  ]
}
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `updated` | string (ISO 8601) | Fecha/hora del ultimo scrape |
| `count` | number | Total de aerolineas |
| `airlines[].name` | string | Nombre de la aerolinea |
| `airlines[].destinations[]` | array | Destinos que opera desde PMI |
| `airlines[].destinations[].city` | string | Nombre de la ciudad/aeropuerto |
| `airlines[].destinations[].iata` | string \| null | Codigo IATA (3 letras) |
| `airlines[].destinations[].raw` | string | Texto original de AENA |

---

### `GET /api/destinations`

Lista todos los destinos conectados con PMI, incluyendo pais y aerolineas que los operan.

**Response:**
```json
{
  "updated": "2026-02-01T23:32:49.096Z",
  "count": 69,
  "destinations": [
    {
      "city": "ALICANTE-ELCHE",
      "iata": "ALC",
      "country": "ESPAÑA",
      "airlines": ["AIR EUROPA", "VUELING AIRLINES", "RYANAIR (RYR)"],
      "raw": "ALICANTE-ELCHE (ALC)"
    }
  ]
}
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `destinations[].city` | string | Nombre de la ciudad/aeropuerto |
| `destinations[].iata` | string \| null | Codigo IATA |
| `destinations[].country` | string \| null | Pais |
| `destinations[].airlines` | string[] | Aerolineas que operan esa ruta |
| `destinations[].raw` | string | Texto original de AENA |

---

### `GET /api/routes`

Lista plana de todos los pares aerolinea-destino (rutas).

**Response:**
```json
{
  "updated": "2026-02-01T23:32:49.096Z",
  "count": 115,
  "routes": [
    {
      "airline": "AIR EUROPA",
      "destination": "ALICANTE-ELCHE",
      "iata": "ALC"
    }
  ]
}
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `routes[].airline` | string | Nombre de la aerolinea |
| `routes[].destination` | string | Ciudad de destino |
| `routes[].iata` | string \| null | Codigo IATA del destino |

---

### `GET /api/all`

Devuelve todos los datos del ultimo scrape en una sola respuesta.

**Response:**
```json
{
  "timestamp": "2026-02-01T23:32:49.096Z",
  "airport": "PMI",
  "airlines": [],
  "destinations": [],
  "routes": [],
  "errors": []
}
```

---

### `GET /api/scrape`

Ejecuta un scrape manual de AENA y actualiza los datos en KV.

**Response:** Misma estructura que `/api/all` con un campo adicional `message: "Scrape completed"`.

---

### `GET /api/snapshot/:date`

Recupera un snapshot historico por fecha.

**Parametros:**

| Parametro | Formato | Ejemplo |
|-----------|---------|---------|
| `date` | YYYY-MM-DD | 2026-02-01 |

**Response:** Misma estructura que `/api/all`.

**Error (404):**
```json
{
  "error": "No snapshot for 2026-01-01"
}
```

---

### `GET /api/status`

Estado del servicio y resumen de datos.

**Response:**
```json
{
  "service": "aena-pmi-api",
  "airport": "PMI - Palma de Mallorca",
  "lastUpdate": "2026-02-01T23:32:49.096Z",
  "airlinesCount": 31,
  "destinationsCount": 69,
  "routesCount": 115
}
```

---

## CORS

Todos los endpoints incluyen cabeceras CORS permisivas:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Cron Schedule

El Worker ejecuta un scrape automatico diario:

| Expresion | Hora UTC | Descripcion |
|-----------|----------|-------------|
| `0 6 * * *` | 06:00 | Scrape diario de AENA |

Los datos se almacenan en KV con dos claves:
- `latest` - Datos mas recientes (sobreescrito en cada scrape)
- `snapshot:YYYY-MM-DD` - Snapshot por fecha (historico)

## Fuentes de datos

| Pagina AENA | Datos extraidos |
|-------------|-----------------|
| `/es/palma-de-mallorca/aerolineas-y-destinos/aerolineas.html` | Aerolineas + sus destinos |
| `/es/palma-de-mallorca/aerolineas-y-destinos/destinos-aeropuerto.html` | Destinos + pais + aerolineas |

## Desarrollo local

```bash
npx wrangler dev
```

## Deploy

```bash
npx wrangler deploy
```
