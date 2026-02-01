const AENA_AIRLINES_URL = 'https://www.aena.es/es/palma-de-mallorca/aerolineas-y-destinos/aerolineas.html';
const AENA_DESTINATIONS_URL = 'https://www.aena.es/es/palma-de-mallorca/aerolineas-y-destinos/destinos-aeropuerto.html';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	});
}

// --- HTML Parsing ---
// AENA structure:
//   Airlines page: <article class="fila resultado ..."> blocks
//     - Airline name in: <span class="title bold">AIRLINE NAME</span>
//     - Destinations in: <span class="nombre">DEST_NAME (IATA)</span>
//   Destinations page: same structure
//     - Destination name in: <span class="title bold">DEST (IATA)</span>
//     - Country in: <span class="titulo">Pais</span><span class="resultado">COUNTRY</span>
//     - Airlines in: <span class="nombre">AIRLINE</span>

function parseIata(text) {
	const match = text.match(/\(([A-Z]{3})\)\s*$/);
	const city = match ? text.replace(match[0], '').trim() : text.trim();
	return { city, iata: match ? match[1] : null };
}

async function scrapeAirlines() {
	const res = await fetch(AENA_AIRLINES_URL, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AenaPMI-Worker/1.0)' },
	});
	if (!res.ok) throw new Error(`Airlines fetch failed: ${res.status}`);
	const html = await res.text();

	const airlines = [];
	// Split into article blocks for each airline row
	const blockRegex = /<article class="fila resultado[^"]*">([\s\S]*?)<\/article>/gi;
	const titleRegex = /<span class="title bold">([^<]+)<\/span>/i;
	const destRegex = /<span class="nombre">([^<]+)<\/span>/gi;

	let blockMatch;
	while ((blockMatch = blockRegex.exec(html)) !== null) {
		const block = blockMatch[1];

		const titleMatch = block.match(titleRegex);
		if (!titleMatch) continue;

		const airlineName = titleMatch[1].trim();
		const destinations = [];
		let destMatch;
		while ((destMatch = destRegex.exec(block)) !== null) {
			const raw = destMatch[1].trim();
			const { city, iata } = parseIata(raw);
			destinations.push({ city, iata, raw });
		}

		airlines.push({
			name: airlineName,
			destinations,
		});
	}

	return airlines;
}

async function scrapeDestinations() {
	const res = await fetch(AENA_DESTINATIONS_URL, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AenaPMI-Worker/1.0)' },
	});
	if (!res.ok) throw new Error(`Destinations fetch failed: ${res.status}`);
	const html = await res.text();

	const destinations = [];
	const blockRegex = /<article class="fila resultado[^"]*">([\s\S]*?)<\/article>/gi;
	const titleRegex = /<span class="title bold">([^<]+)<\/span>/i;
	const countryRegex = /<span class="titulo">Pa[ií]s<\/span>\s*<span class="resultado">([^<]+)<\/span>/i;
	const airlineRegex = /<span class="nombre">([^<]+)<\/span>/gi;

	let blockMatch;
	while ((blockMatch = blockRegex.exec(html)) !== null) {
		const block = blockMatch[1];

		const titleMatch = block.match(titleRegex);
		if (!titleMatch) continue;

		const raw = titleMatch[1].trim();
		const { city, iata } = parseIata(raw);

		const countryMatch = block.match(countryRegex);
		const country = countryMatch ? countryMatch[1].trim() : null;

		const airlines = [];
		let airlineMatch;
		while ((airlineMatch = airlineRegex.exec(block)) !== null) {
			airlines.push(airlineMatch[1].trim());
		}

		destinations.push({ city, iata, country, airlines, raw });
	}

	return destinations;
}

async function runScraper(env) {
	const timestamp = new Date().toISOString();
	const results = { timestamp, airport: 'PMI', airlines: [], destinations: [], routes: [], errors: [] };

	try {
		results.airlines = await scrapeAirlines();
	} catch (e) {
		results.errors.push(`airlines: ${e.message}`);
	}

	try {
		results.destinations = await scrapeDestinations();
	} catch (e) {
		results.errors.push(`destinations: ${e.message}`);
	}

	// Build routes from airlines data (airline -> destination pairs)
	for (const airline of results.airlines) {
		for (const dest of airline.destinations) {
			results.routes.push({
				airline: airline.name,
				destination: dest.city,
				iata: dest.iata,
			});
		}
	}

	await env.AENA_DATA.put('latest', JSON.stringify(results));
	const dateKey = timestamp.split('T')[0];
	await env.AENA_DATA.put(`snapshot:${dateKey}`, JSON.stringify(results));

	return results;
}

// --- Router ---

async function handleRequest(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;

	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS });
	}

	if (request.method !== 'GET') {
		return jsonResponse({ error: 'Method not allowed' }, 405);
	}

	// GET /api/airlines
	if (path === '/api/airlines') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse({
			updated: data.timestamp,
			count: data.airlines.length,
			airlines: data.airlines,
		});
	}

	// GET /api/destinations
	if (path === '/api/destinations') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse({
			updated: data.timestamp,
			count: data.destinations.length,
			destinations: data.destinations,
		});
	}

	// GET /api/routes
	if (path === '/api/routes') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse({
			updated: data.timestamp,
			count: data.routes.length,
			routes: data.routes,
		});
	}

	// GET /api/all
	if (path === '/api/all') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse(data);
	}

	// GET /api/snapshot/:date
	if (path.startsWith('/api/snapshot/')) {
		const date = path.replace('/api/snapshot/', '');
		const data = await env.AENA_DATA.get(`snapshot:${date}`, 'json');
		if (!data) return jsonResponse({ error: `No snapshot for ${date}` }, 404);
		return jsonResponse(data);
	}

	// GET /api/scrape - Manual trigger
	if (path === '/api/scrape') {
		const result = await runScraper(env);
		return jsonResponse({ message: 'Scrape completed', ...result });
	}

	// GET /api/status
	if (path === '/api/status') {
		const data = await env.AENA_DATA.get('latest', 'json');
		return jsonResponse({
			service: 'aena-pmi-api',
			airport: 'PMI - Palma de Mallorca',
			lastUpdate: data?.timestamp || null,
			airlinesCount: data?.airlines?.length || 0,
			destinationsCount: data?.destinations?.length || 0,
			routesCount: data?.routes?.length || 0,
		});
	}

	// Root
	if (path === '/' || path === '') {
		return jsonResponse({
			service: 'AENA PMI Flight Data API',
			airport: 'PMI - Palma de Mallorca',
			endpoints: {
				'/api/airlines': 'Airlines with their destinations',
				'/api/destinations': 'Destinations with country and serving airlines',
				'/api/routes': 'All airline-destination route pairs',
				'/api/all': 'Complete scraped data',
				'/api/scrape': 'Manually trigger a new scrape',
				'/api/snapshot/:date': 'Historical snapshot (YYYY-MM-DD)',
				'/api/status': 'Service status',
			},
		});
	}

	return jsonResponse({ error: 'Not found' }, 404);
}

export default {
	async fetch(request, env, ctx) {
		return handleRequest(request, env);
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(runScraper(env));
	},
};
