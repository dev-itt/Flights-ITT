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

// --- Name cleaning ---

const AIRLINE_NAMES = {
	'AIR ALGERIE': 'Air Algerie',
	'AIR ARABIA MAROC': 'Air Arabia Maroc',
	'AIR EUROPA': 'Air Europa',
	'AIR NOSTRUM': 'Air Nostrum',
	'AUSTRIAN AIRLINES': 'Austrian Airlines',
	'BA EUROFLYER': 'BA Euroflyer',
	'BINTER CANARIAS': 'Binter Canarias',
	'BRITISH CITYFLYER': 'British Cityflyer',
	'CHAIR AIRLINES AG': 'Chair Airlines',
	'CONDOR FLUGDIENST': 'Condor',
	'DISCOVER AIRLINES': 'Discover Airlines',
	'EASYJET (EZY)': 'EasyJet',
	'EASYJET EUROPE (EJU)': 'EasyJet Europe',
	'EDELWEISS AIR AG': 'Edelweiss Air',
	'EUROWINGS': 'Eurowings',
	'IBERIA': 'Iberia',
	'JET2.COM': 'Jet2',
	'LUFTHANSA': 'Lufthansa',
	'LUFTHANSA CITY AIRLINES GMBH': 'Lufthansa City Airlines',
	'LUXAIR': 'Luxair',
	'MARABU AIRLINES OU': 'Marabu Airlines',
	'PRIVILEGE STYLE': 'Privilege Style',
	'RYANAIR (RYR)': 'Ryanair',
	'SCANDINAVIAN AIRLINES SYSTEM': 'SAS',
	'SMARTWINGS': 'Smartwings',
	'SWIFTAIR': 'Swiftair',
	'SWISS INTERNATIONAL AIR LINES': 'Swiss',
	'TRANSAVIA': 'Transavia',
	'TRANSAVIA (TRA)': 'Transavia',
	'TUIFLY GMBH, LANGENHAGEN': 'TUIfly',
	'VUELING AIRLINES': 'Vueling',
};

const CITY_NAMES = {
	'ALICANTE-ELCHE': 'Alicante',
	'AMSTERDAM /SCHIPHOL': 'Amsterdam',
	'ANDORRA / LA SEU D\'URGELL': 'Andorra - La Seu d\'Urgell',
	'ARGEL/ HOUARI BOUMEDIEN': 'Algiers',
	'ASTURIAS': 'Asturias',
	'BADEN BADEN-KARLSRUHE  (FKB)': 'Baden-Baden',
	'BADEN BADEN-KARLSRUHE (FKB)': 'Baden-Baden',
	'BARCELONA-EL PRAT JOSEP TARRADELLAS': 'Barcelona',
	'BASEL /MULHOUSE': 'Basel-Mulhouse',
	'BERLIN-BRANDERBURG WILLY BRANDT': 'Berlin',
	'BILBAO': 'Bilbao',
	'BIRMINGHAM / INTERNACIONAL': 'Birmingham',
	'BOLONIA': 'Bologna',
	'BREMEN': 'Bremen',
	'BRISTOL': 'Bristol',
	'BRUSELAS /CHARLEROI': 'Brussels Charleroi',
	'COLONIA/BONN': 'Cologne-Bonn',
	'COPENHAGUE': 'Copenhagen',
	'DORTMUND': 'Dortmund',
	'DRESDEN': 'Dresden',
	'DUSSELDORF': 'Dusseldorf',
	'DUSSELDORF /WEEZE': 'Dusseldorf Weeze',
	'EINDHOVEN': 'Eindhoven',
	'ESTOCOLMO /ARLANDA': 'Stockholm',
	'FRANKFURT': 'Frankfurt',
	'FRANKFURT /HAHN': 'Frankfurt Hahn',
	'GINEBRA': 'Geneva',
	'GRAN CANARIA': 'Gran Canaria',
	'GRANADA-JAÉN F.G.L.': 'Granada',
	'HAMBURGO': 'Hamburg',
	'HAMBURGO /LUEBECK': 'Hamburg Lubeck',
	'HANNOVER': 'Hanover',
	'IBIZA': 'Ibiza',
	'JEREZ DE LA FRONTERA': 'Jerez',
	'LEIPZIG': 'Leipzig',
	'LEON': 'Leon',
	'LLEIDA - ALGUAIRE': 'Lleida',
	'LONDRES /GATWICK': 'London Gatwick',
	'LONDRES /LONDON CITY APT.': 'London City',
	'LONDRES /LUTON': 'London Luton',
	'LONDRES /STANSTED': 'London Stansted',
	'LUXEMBURGO': 'Luxembourg',
	'MADRID-BARAJAS ADOLFO SUÁREZ': 'Madrid',
	'MALAGA-COSTA DEL SOL': 'Malaga',
	'MALTA': 'Malta',
	'MANCHESTER': 'Manchester',
	'MELILLA': 'Melilla',
	'MEMMINGEN': 'Memmingen',
	'MENORCA': 'Menorca',
	'MILAN /MALPENSA': 'Milan Malpensa',
	'MILAN/BERGAMO': 'Milan Bergamo',
	'MUENSTER': 'Munster',
	'MUNICH': 'Munich',
	'NADOR / EL AROUI': 'Nador',
	'NUREMBERG': 'Nuremberg',
	'PARIS /ORLY': 'Paris Orly',
	'PRAGA': 'Prague',
	'SANTIAGO-ROSALÍA DE CASTRO': 'Santiago de Compostela',
	'SEVILLA': 'Seville',
	'SOFIA': 'Sofia',
	'SOUTHEND': 'Southend',
	'STUTTGART': 'Stuttgart',
	'TENERIFE NORTE-C. LA LAGUNA': 'Tenerife North',
	'TREVISO/S.ANGELO (MIL)': 'Treviso',
	'VALENCIA': 'Valencia',
	'VARSOVIA': 'Warsaw',
	'VIENA': 'Vienna',
	'VIGO': 'Vigo',
	'ZARAGOZA': 'Zaragoza',
	'ZURICH': 'Zurich',
};

function cleanAirline(raw) {
	return AIRLINE_NAMES[raw] || raw.replace(/\s*\([A-Z]{3}\)\s*$/, '').replace(/\bGMBH\b.*$/i, '').replace(/\bAG\b\s*$/i, '').replace(/\bOU\b\s*$/i, '').trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function cleanCity(raw) {
	return CITY_NAMES[raw] || raw.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// --- HTML Parsing ---

function parseIata(text) {
	const match = text.match(/\(([A-Z]{3})\)\s*$/);
	const city = match ? text.replace(match[0], '').trim() : text.trim();
	return { city, iata: match ? match[1] : null };
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
	const results = { timestamp, airport: 'PMI', destinations: [], errors: [] };

	try {
		results.destinations = await scrapeDestinations();
	} catch (e) {
		results.errors.push(`destinations: ${e.message}`);
	}

	await env.AENA_DATA.put('latest_raw', JSON.stringify(results));

	// Build clean version
	const allAirlines = new Set();
	const airports = results.destinations.map((d) => {
		const label = `${cleanCity(d.city)} (${d.iata})`;
		const airlines = d.airlines.map(cleanAirline);
		airlines.forEach((a) => allAirlines.add(a));
		return {
			label,
			iata: d.iata,
			country: d.country,
			airlines: airlines.sort(),
		};
	});
	airports.sort((a, b) => a.label.localeCompare(b.label));

	const clean = {
		updated: timestamp,
		airport: 'PMI',
		airports,
		airlines: [...allAirlines].sort(),
	};

	await env.AENA_DATA.put('latest', JSON.stringify(clean));
	const dateKey = timestamp.split('T')[0];
	await env.AENA_DATA.put(`snapshot:${dateKey}`, JSON.stringify(clean));
	await env.AENA_DATA.put(`snapshot_raw:${dateKey}`, JSON.stringify(results));

	return clean;
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

	// GET /api/airports - Main clean endpoint
	if (path === '/api/airports') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse(data);
	}

	// GET /api/airlines - Deduplicated sorted list
	if (path === '/api/airlines') {
		const data = await env.AENA_DATA.get('latest', 'json');
		if (!data) return jsonResponse({ error: 'No data yet. Trigger /api/scrape first.' }, 404);
		return jsonResponse({ updated: data.updated, airlines: data.airlines });
	}

	// GET /api/raw - Raw AENA data
	if (path === '/api/raw') {
		const data = await env.AENA_DATA.get('latest_raw', 'json');
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
			lastUpdate: data?.updated || null,
			airportsCount: data?.airports?.length || 0,
			airlinesCount: data?.airlines?.length || 0,
		});
	}

	// Root
	if (path === '/' || path === '') {
		return jsonResponse({
			service: 'AENA PMI Flight Data API',
			airport: 'PMI - Palma de Mallorca',
			endpoints: {
				'/api/airports': 'Clean airports with airlines (main endpoint)',
				'/api/airlines': 'Deduplicated sorted airline list',
				'/api/raw': 'Raw AENA scraped data',
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
