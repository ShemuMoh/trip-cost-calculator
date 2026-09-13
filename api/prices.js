// Averages petrol (E10) and diesel (B7) prices across London fuel stations,
// using the UK government fuel price open data feeds:
// https://www.gov.uk/guidance/access-fuel-price-data

const FEEDS = [
  { name: 'Asda', url: 'https://storelocator.asda.com/fuel_prices_data.json' },
  { name: 'Morrisons', url: 'https://www.morrisons.com/fuel-prices/fuel.json' },
  { name: 'Esso', url: 'https://fuelprices.esso.co.uk/latestdata.json' },
  { name: 'Motor Fuel Group', url: 'https://fuel.motorfuelgroup.com/fuel_prices_data.json' },
  { name: 'Rontec', url: 'https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json' },
];

// Greater London bounding box
const LONDON = { latMin: 51.25, latMax: 51.72, lngMin: -0.55, lngMax: 0.35 };

// Feeds are inconsistent: most report pence (167.9), a few pounds (1.679)
function toPence(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const pence = n < 10 ? n * 100 : n;
  return pence >= 80 && pence <= 300 ? pence : null;
}

async function fetchFeed({ name, url }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (trip-cost-calculator)' },
    });
    if (!res.ok) return { name, stations: [] };
    const data = await res.json();
    return { name, stations: data.stations || [] };
  } catch {
    return { name, stations: [] };
  } finally {
    clearTimeout(timer);
  }
}

// E10/E5 = petrol, B7/B10 = diesel, SDV = super diesel
const FUEL_TYPES = ['E10', 'E5', 'B7', 'B10', 'SDV'];

export default async function handler(req, res) {
  const feeds = await Promise.all(FEEDS.map(fetchFeed));

  const samples = Object.fromEntries(FUEL_TYPES.map((f) => [f, []]));
  const sources = [];
  let stationCount = 0;

  for (const { name, stations } of feeds) {
    let used = 0;
    for (const station of stations) {
      const lat = Number(station.location?.latitude);
      const lng = Number(station.location?.longitude);
      if (
        !(lat >= LONDON.latMin && lat <= LONDON.latMax &&
          lng >= LONDON.lngMin && lng <= LONDON.lngMax)
      ) continue;

      let any = false;
      for (const fuel of FUEL_TYPES) {
        const pence = toPence(station.prices?.[fuel]);
        if (pence) {
          samples[fuel].push(pence);
          any = true;
        }
      }
      if (any) used++;
    }
    if (used > 0) {
      sources.push(name);
      stationCount += used;
    }
  }

  const avg = (arr) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  const fuels = Object.fromEntries(FUEL_TYPES.map((f) => [f, avg(samples[f])]));

  res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=86400');
  res.status(200).json({
    fuels,
    // kept for older cached pages
    petrolPence: fuels.E10,
    dieselPence: fuels.B7,
    stationCount,
    sources,
    updated: new Date().toISOString(),
  });
}
