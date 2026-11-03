/* Antipodes: data and geometry. No DOM dependencies, so it runs in the browser and in Node. */
(function (root) {
  'use strict';

  const R = 6371.0088; // mean Earth radius, km

  // [name, country, latitude, longitude, metro population in millions]
  const CITIES = [
    // Asia
    ['Tokyo', 'Japan', 35.6762, 139.6503, 37.4],
    ['Delhi', 'India', 28.6139, 77.2090, 32],
    ['Shanghai', 'China', 31.2304, 121.4737, 29],
    ['Dhaka', 'Bangladesh', 23.8103, 90.4125, 23],
    ['Beijing', 'China', 39.9042, 116.4074, 21.8],
    ['Mumbai', 'India', 19.0760, 72.8777, 21],
    ['Osaka', 'Japan', 34.6937, 135.5023, 19],
    ['Chongqing', 'China', 29.5630, 106.5516, 17],
    ['Karachi', 'Pakistan', 24.8607, 67.0011, 17],
    ['Istanbul', 'Turkey', 41.0082, 28.9784, 15.6],
    ['Kolkata', 'India', 22.5726, 88.3639, 15],
    ['Manila', 'Philippines', 14.5995, 120.9842, 14.7],
    ['Guangzhou', 'China', 23.1291, 113.2644, 14],
    ['Tianjin', 'China', 39.3434, 117.3616, 13.9],
    ['Bengaluru', 'India', 12.9716, 77.5946, 13.6],
    ['Lahore', 'Pakistan', 31.5204, 74.3587, 13.5],
    ['Shenzhen', 'China', 22.5431, 114.0579, 13],
    ['Chennai', 'India', 13.0827, 80.2707, 11.8],
    ['Jakarta', 'Indonesia', -6.2088, 106.8456, 11.2],
    ['Bangkok', 'Thailand', 13.7563, 100.5018, 11],
    ['Hyderabad', 'India', 17.3850, 78.4867, 10.8],
    ['Seoul', 'South Korea', 37.5665, 126.9780, 9.9],
    ['Chengdu', 'China', 30.5728, 104.0668, 9.5],
    ['Tehran', 'Iran', 35.6892, 51.3890, 9.4],
    ['Ho Chi Minh City', 'Vietnam', 10.8231, 106.6297, 9.3],
    ['Wuhan', 'China', 30.5928, 114.3055, 8.6],
    ['Kuala Lumpur', 'Malaysia', 3.1390, 101.6869, 8.4],
    ['Xi’an', 'China', 34.3416, 108.9398, 8],
    ['Hong Kong', 'China', 22.3193, 114.1694, 7.6],
    ['Baghdad', 'Iraq', 33.3152, 44.3661, 7.5],
    ['Riyadh', 'Saudi Arabia', 24.7136, 46.6753, 7.5],
    ['Taipei', 'Taiwan', 25.0330, 121.5654, 7],
    ['Singapore', 'Singapore', 1.3521, 103.8198, 6],
    ['Harbin', 'China', 45.8038, 126.5349, 6],
    ['Ankara', 'Turkey', 39.9334, 32.8597, 5.7],
    ['Yangon', 'Myanmar', 16.8661, 96.1951, 5.6],
    ['Hanoi', 'Vietnam', 21.0278, 105.8342, 5.2],
    ['Kabul', 'Afghanistan', 34.5553, 69.2075, 4.5],
    ['Tel Aviv', 'Israel', 32.0853, 34.7818, 4],
    ['Amman', 'Jordan', 31.9454, 35.9284, 4],
    ['Dubai', 'United Arab Emirates', 25.2048, 55.2708, 3.6],
    ['Pyongyang', 'North Korea', 39.0392, 125.7625, 3],
    ['Tashkent', 'Uzbekistan', 41.2995, 69.2401, 2.9],
    ['Sapporo', 'Japan', 43.0618, 141.3545, 2.7],
    ['Doha', 'Qatar', 25.2854, 51.5310, 2.4],
    ['Beirut', 'Lebanon', 33.8938, 35.5018, 2.4],
    ['Baku', 'Azerbaijan', 40.4093, 49.8671, 2.3],
    ['Colombo', 'Sri Lanka', 6.9271, 79.8612, 2.3],
    ['Phnom Penh', 'Cambodia', 11.5564, 104.9282, 2.3],
    ['Almaty', 'Kazakhstan', 43.2220, 76.8512, 2.2],
    ['Ulaanbaatar', 'Mongolia', 47.8864, 106.9057, 1.6],
    ['Kathmandu', 'Nepal', 27.7172, 85.3240, 1.5],
    ['Astana', 'Kazakhstan', 51.1694, 71.4491, 1.4],
    ['Tbilisi', 'Georgia', 41.7151, 44.8271, 1.2],
    ['Bishkek', 'Kyrgyzstan', 42.8746, 74.5698, 1.1],
    ['Yerevan', 'Armenia', 40.1792, 44.4991, 1.1],
    ['Ashgabat', 'Turkmenistan', 37.9601, 58.3261, 1],
    ['Dushanbe', 'Tajikistan', 38.5598, 68.7870, 0.9],
    // Russia
    ['Moscow', 'Russia', 55.7558, 37.6173, 12.6],
    ['Saint Petersburg', 'Russia', 59.9311, 30.3609, 5.6],
    ['Novosibirsk', 'Russia', 55.0084, 82.9357, 1.6],
    ['Yekaterinburg', 'Russia', 56.8389, 60.6057, 1.5],
    ['Kazan', 'Russia', 55.7963, 49.1088, 1.3],
    ['Krasnoyarsk', 'Russia', 56.0153, 92.8932, 1.2],
    ['Irkutsk', 'Russia', 52.2870, 104.3050, 0.6],
    ['Vladivostok', 'Russia', 43.1155, 131.8855, 0.6],
    ['Sochi', 'Russia', 43.6028, 39.7342, 0.45],
    ['Yakutsk', 'Russia', 62.0355, 129.6755, 0.36],
    ['Murmansk', 'Russia', 68.9585, 33.0827, 0.27],
    ['Petropavlovsk-Kamchatsky', 'Russia', 53.0452, 158.6483, 0.16],
    // Europe
    ['Paris', 'France', 48.8566, 2.3522, 11.2],
    ['London', 'United Kingdom', 51.5074, -0.1278, 9.6],
    ['Madrid', 'Spain', 40.4168, -3.7038, 6.8],
    ['Barcelona', 'Spain', 41.3874, 2.1686, 5.7],
    ['Rome', 'Italy', 41.9028, 12.4964, 4.3],
    ['Berlin', 'Germany', 52.5200, 13.4050, 3.7],
    ['Milan', 'Italy', 45.4642, 9.1900, 3.2],
    ['Athens', 'Greece', 37.9838, 23.7275, 3.1],
    ['Kyiv', 'Ukraine', 50.4501, 30.5234, 3],
    ['Lisbon', 'Portugal', 38.7223, -9.1393, 2.9],
    ['Brussels', 'Belgium', 50.8503, 4.3517, 2.1],
    ['Vienna', 'Austria', 48.2082, 16.3738, 2],
    ['Minsk', 'Belarus', 53.9006, 27.5590, 2],
    ['Warsaw', 'Poland', 52.2297, 21.0122, 1.8],
    ['Budapest', 'Hungary', 47.4979, 19.0402, 1.8],
    ['Bucharest', 'Romania', 44.4268, 26.1025, 1.8],
    ['Porto', 'Portugal', 41.1579, -8.6291, 1.7],
    ['Stockholm', 'Sweden', 59.3293, 18.0686, 1.7],
    ['Munich', 'Germany', 48.1351, 11.5820, 1.5],
    ['Seville', 'Spain', 37.3891, -5.9845, 1.5],
    ['Dublin', 'Ireland', 53.3498, -6.2603, 1.4],
    ['Copenhagen', 'Denmark', 55.6761, 12.5683, 1.4],
    ['Belgrade', 'Serbia', 44.7866, 20.4489, 1.4],
    ['Zurich', 'Switzerland', 47.3769, 8.5417, 1.4],
    ['Prague', 'Czechia', 50.0755, 14.4378, 1.3],
    ['Helsinki', 'Finland', 60.1699, 24.9384, 1.3],
    ['Amsterdam', 'Netherlands', 52.3676, 4.9041, 1.2],
    ['Oslo', 'Norway', 59.9139, 10.7522, 1.1],
    ['A Coruña', 'Spain', 43.3623, -8.4115, 0.25],
    ['Reykjavík', 'Iceland', 64.1466, -21.9426, 0.24],
    // Africa
    ['Cairo', 'Egypt', 30.0444, 31.2357, 22],
    ['Kinshasa', 'DR Congo', -4.4419, 15.2663, 16],
    ['Lagos', 'Nigeria', 6.5244, 3.3792, 15.9],
    ['Luanda', 'Angola', -8.8390, 13.2894, 9],
    ['Dar es Salaam', 'Tanzania', -6.7924, 39.2083, 7.8],
    ['Khartoum', 'Sudan', 15.5007, 32.5599, 6.3],
    ['Johannesburg', 'South Africa', -26.2041, 28.0473, 6.2],
    ['Abidjan', 'Côte d’Ivoire', 5.3600, -4.0083, 5.9],
    ['Addis Ababa', 'Ethiopia', 9.0300, 38.7400, 5.5],
    ['Nairobi', 'Kenya', -1.2921, 36.8219, 5.3],
    ['Cape Town', 'South Africa', -33.9249, 18.4241, 4.8],
    ['Antananarivo', 'Madagascar', -18.8792, 47.5079, 3.9],
    ['Casablanca', 'Morocco', 33.5731, -7.5898, 3.8],
    ['Kampala', 'Uganda', 0.3476, 32.5825, 3.8],
    ['Dakar', 'Senegal', 14.7167, -17.4677, 3.3],
    ['Algiers', 'Algeria', 36.7538, 3.0588, 2.9],
    ['Accra', 'Ghana', 5.6037, -0.1870, 2.6],
    ['Tunis', 'Tunisia', 36.8065, 10.1815, 2.4],
    ['Harare', 'Zimbabwe', -17.8252, 31.0335, 1.6],
    ['Maputo', 'Mozambique', -25.9692, 32.5732, 1.1],
    // North and Central America
    ['Mexico City', 'Mexico', 19.4326, -99.1332, 21.8],
    ['New York', 'United States', 40.7128, -74.0060, 18.8],
    ['Los Angeles', 'United States', 34.0522, -118.2437, 12.5],
    ['Chicago', 'United States', 41.8781, -87.6298, 8.9],
    ['Dallas', 'United States', 32.7767, -96.7970, 6.5],
    ['Houston', 'United States', 29.7604, -95.3698, 6.4],
    ['Toronto', 'Canada', 43.6532, -79.3832, 6.4],
    ['Miami', 'United States', 25.7617, -80.1918, 6.1],
    ['Washington, D.C.', 'United States', 38.9072, -77.0369, 5.4],
    ['Guadalajara', 'Mexico', 20.6597, -103.3496, 5.3],
    ['Atlanta', 'United States', 33.7490, -84.3880, 5.1],
    ['San Francisco', 'United States', 37.7749, -122.4194, 4.7],
    ['Boston', 'United States', 42.3601, -71.0589, 4.3],
    ['Montreal', 'Canada', 45.5017, -73.5673, 4.3],
    ['Santo Domingo', 'Dominican Republic', 18.4861, -69.9312, 3.5],
    ['Seattle', 'United States', 47.6062, -122.3321, 3.5],
    ['Guatemala City', 'Guatemala', 14.6349, -90.5069, 3],
    ['Denver', 'United States', 39.7392, -104.9903, 2.9],
    ['Vancouver', 'Canada', 49.2827, -123.1207, 2.6],
    ['Las Vegas', 'United States', 36.1699, -115.1398, 2.3],
    ['Havana', 'Cuba', 23.1136, -82.3666, 2.1],
    ['Panama City', 'Panama', 8.9824, -79.5199, 1.9],
    ['San José', 'Costa Rica', 9.9281, -84.0907, 1.4],
    ['Honolulu', 'United States', 21.3069, -157.8583, 1],
    ['Anchorage', 'United States', 61.2181, -149.9003, 0.3],
    // South America
    ['São Paulo', 'Brazil', -23.5505, -46.6333, 22.4],
    ['Buenos Aires', 'Argentina', -34.6037, -58.3816, 15.4],
    ['Rio de Janeiro', 'Brazil', -22.9068, -43.1729, 13.6],
    ['Bogotá', 'Colombia', 4.7110, -74.0721, 11.3],
    ['Lima', 'Peru', -12.0464, -77.0428, 11],
    ['Santiago', 'Chile', -33.4489, -70.6693, 6.9],
    ['Brasília', 'Brazil', -15.7939, -47.8828, 4.8],
    ['Fortaleza', 'Brazil', -3.7319, -38.5267, 4.1],
    ['Medellín', 'Colombia', 6.2442, -75.5812, 4],
    ['Salvador', 'Brazil', -12.9777, -38.5016, 3.9],
    ['Guayaquil', 'Ecuador', -2.1894, -79.8891, 3],
    ['Caracas', 'Venezuela', 10.4806, -66.9036, 2.9],
    ['Belém', 'Brazil', -1.4558, -48.4902, 2.5],
    ['Manaus', 'Brazil', -3.1190, -60.0217, 2.3],
    ['Asunción', 'Paraguay', -25.2637, -57.5759, 2.3],
    ['Quito', 'Ecuador', -0.1807, -78.4678, 2],
    ['La Paz', 'Bolivia', -16.4897, -68.1193, 1.9],
    ['Montevideo', 'Uruguay', -34.9011, -56.1645, 1.8],
    ['Santa Cruz de la Sierra', 'Bolivia', -17.8146, -63.1561, 1.8],
    ['Córdoba', 'Argentina', -31.4201, -64.1888, 1.6],
    ['Mendoza', 'Argentina', -32.8895, -68.8458, 1.2],
    ['Cuiabá', 'Brazil', -15.6014, -56.0979, 0.9],
    ['Salta', 'Argentina', -24.7821, -65.4232, 0.6],
    ['Bahía Blanca', 'Argentina', -38.7183, -62.2663, 0.3],
    ['Punta Arenas', 'Chile', -53.1638, -70.9171, 0.13],
    ['Ushuaia', 'Argentina', -54.8019, -68.3030, 0.08],
    // Australia and Oceania
    ['Sydney', 'Australia', -33.8688, 151.2093, 5.3],
    ['Melbourne', 'Australia', -37.8136, 144.9631, 5.1],
    ['Brisbane', 'Australia', -27.4698, 153.0251, 2.6],
    ['Perth', 'Australia', -31.9505, 115.8605, 2.1],
    ['Auckland', 'New Zealand', -36.8485, 174.7633, 1.7],
    ['Adelaide', 'Australia', -34.9285, 138.6007, 1.4],
    ['Wellington', 'New Zealand', -41.2865, 174.7762, 0.42],
    ['Port Moresby', 'Papua New Guinea', -9.4438, 147.1803, 0.4],
    ['Christchurch', 'New Zealand', -43.5321, 172.6362, 0.39],
    ['Suva', 'Fiji', -18.1248, 178.4501, 0.18],
    ['Darwin', 'Australia', -12.4634, 130.8456, 0.15],
    ['Papeete', 'French Polynesia', -17.5516, -149.5585, 0.14],
    ['Dunedin', 'New Zealand', -45.8788, 170.5028, 0.13],
    ['Nouméa', 'New Caledonia', -22.2758, 166.4580, 0.1]
  ].map(([name, country, lat, lon, pop], i) => ({ i, name, country, lat, lon, pop }));

  // ISO 3166 numeric → alpha-2, used to get clean country names via Intl.DisplayNames
  const ISO = {"533":"AW","004":"AF","024":"AO","660":"AI","248":"AX","008":"AL","020":"AD","784":"AE","032":"AR","051":"AM","016":"AS","010":"AQ","260":"TF","028":"AG","036":"AU","040":"AT","031":"AZ","108":"BI","056":"BE","204":"BJ","535":"BQ","854":"BF","050":"BD","100":"BG","048":"BH","044":"BS","070":"BA","652":"BL","112":"BY","084":"BZ","060":"BM","068":"BO","076":"BR","052":"BB","096":"BN","064":"BT","074":"BV","072":"BW","140":"CF","124":"CA","166":"CC","756":"CH","152":"CL","156":"CN","384":"CI","120":"CM","180":"CD","178":"CG","184":"CK","170":"CO","174":"KM","132":"CV","188":"CR","192":"CU","531":"CW","162":"CX","136":"KY","196":"CY","203":"CZ","276":"DE","262":"DJ","212":"DM","208":"DK","214":"DO","012":"DZ","218":"EC","818":"EG","232":"ER","732":"EH","724":"ES","233":"EE","231":"ET","246":"FI","242":"FJ","238":"FK","250":"FR","234":"FO","583":"FM","266":"GA","826":"GB","268":"GE","831":"GG","288":"GH","292":"GI","324":"GN","312":"GP","270":"GM","624":"GW","226":"GQ","300":"GR","308":"GD","304":"GL","320":"GT","254":"GF","316":"GU","328":"GY","344":"HK","334":"HM","340":"HN","191":"HR","332":"HT","348":"HU","360":"ID","833":"IM","356":"IN","086":"IO","372":"IE","364":"IR","368":"IQ","352":"IS","376":"IL","380":"IT","388":"JM","832":"JE","400":"JO","392":"JP","398":"KZ","404":"KE","417":"KG","116":"KH","296":"KI","659":"KN","410":"KR","414":"KW","418":"LA","422":"LB","430":"LR","434":"LY","662":"LC","438":"LI","144":"LK","426":"LS","440":"LT","442":"LU","428":"LV","446":"MO","663":"MF","504":"MA","492":"MC","498":"MD","450":"MG","462":"MV","484":"MX","584":"MH","807":"MK","466":"ML","470":"MT","104":"MM","499":"ME","496":"MN","580":"MP","508":"MZ","478":"MR","500":"MS","474":"MQ","480":"MU","454":"MW","458":"MY","175":"YT","516":"NA","540":"NC","562":"NE","574":"NF","566":"NG","558":"NI","570":"NU","528":"NL","578":"NO","524":"NP","520":"NR","554":"NZ","512":"OM","586":"PK","591":"PA","612":"PN","604":"PE","608":"PH","585":"PW","598":"PG","616":"PL","630":"PR","408":"KP","620":"PT","600":"PY","275":"PS","258":"PF","634":"QA","638":"RE","642":"RO","643":"RU","646":"RW","682":"SA","729":"SD","686":"SN","702":"SG","239":"GS","654":"SH","744":"SJ","090":"SB","694":"SL","222":"SV","674":"SM","706":"SO","666":"PM","688":"RS","728":"SS","678":"ST","740":"SR","703":"SK","705":"SI","752":"SE","748":"SZ","534":"SX","690":"SC","760":"SY","796":"TC","148":"TD","768":"TG","764":"TH","762":"TJ","772":"TK","795":"TM","626":"TL","776":"TO","780":"TT","788":"TN","792":"TR","798":"TV","158":"TW","834":"TZ","800":"UG","804":"UA","581":"UM","858":"UY","840":"US","860":"UZ","336":"VA","670":"VC","862":"VE","092":"VG","850":"VI","704":"VN","548":"VU","876":"WF","882":"WS","887":"YE","710":"ZA","894":"ZM","716":"ZW"};
  const NAME_FIX = {
    'Kosovo': 'Kosovo', 'N. Cyprus': 'Northern Cyprus', 'Somaliland': 'Somaliland',
    'Indian Ocean Ter.': 'Australian Indian Ocean Territories', 'Siachen Glacier': 'Siachen Glacier'
  };
  // Intl's English names are good, except for a few CLDR-style labels
  const ALPHA2_FIX = {
    CD: 'DR Congo', CG: 'Republic of the Congo', MM: 'Myanmar', HK: 'Hong Kong', MO: 'Macau',
    PS: 'Palestine', TR: 'Turkey', CI: 'Côte d’Ivoire', VA: 'Vatican City', FM: 'Micronesia',
    UM: 'U.S. Minor Outlying Islands'
  };
  const ANTARCTICA_ID = '010';

  let regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { /* older browser */ }

  function countryName(id, fallback) {
    if (NAME_FIX[fallback]) return NAME_FIX[fallback];
    const a2 = id != null ? ISO[id] : null;
    if (a2 && ALPHA2_FIX[a2]) return ALPHA2_FIX[a2];
    if (a2 && regionNames) {
      try { const n = regionNames.of(a2); if (n && n !== a2) return n.replace(/ & /g, ' and ').replace(/^St\. /, 'Saint '); } catch (e) { /* ignore */ }
    }
    return fallback;
  }

  // Rings that cross the 180th meridian (Chukotka, Fiji) come with a −180 ↔ +180 jump.
  // Unwrap them so each ring is continuous on the plane; longitudes may go past ±180 and the
  // point lookup accounts for that. Antarctica is left alone: its ring circles the pole and the
  // "jump" there is a legitimate polar edge.
  function fixRing(ring) {
    let jump = false, pos = 0;
    for (let i = 0; i < ring.length; i++) {
      if (ring[i][0] > 0) pos++;
      if (i && Math.abs(ring[i][0] - ring[i - 1][0]) > 180) jump = true;
    }
    if (!jump) return;
    const toPositive = pos * 2 >= ring.length;
    for (const p of ring) {
      if (toPositive && p[0] < 0) p[0] += 360;
      else if (!toPositive && p[0] > 0) p[0] -= 360;
    }
  }

  function polygonsOf(geom) {
    if (!geom) return [];
    return geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  }

  function normalizeFeatures(features) {
    for (const f of features) {
      if (String(f.id) === ANTARCTICA_ID) continue;
      for (const poly of polygonsOf(f.geometry)) for (const ring of poly) fixRing(ring);
    }
    return features;
  }

  // ---------- country index ----------
  let COUNTRIES = [];   // {id, name, nameEn, polys:[{bb, rings:[Float64Array]}]}
  let VX, VY, VZ, VC;   // every outline vertex as a unit vector + its country index
  let ANTARCTICA = -1;

  function buildIndex(features) {
    normalizeFeatures(features);
    COUNTRIES = [];
    let total = 0;
    for (const f of features) for (const poly of polygonsOf(f.geometry)) for (const r of poly) total += r.length;
    VX = new Float64Array(total); VY = new Float64Array(total); VZ = new Float64Array(total); VC = new Uint16Array(total);
    let k = 0;
    features.forEach((f) => {
      const ci = COUNTRIES.length;
      const nameEn = (f.properties && f.properties.name) || '—';
      const c = { id: f.id, nameEn, name: countryName(f.id, nameEn), polys: [] };
      if (String(f.id) === ANTARCTICA_ID) ANTARCTICA = ci;
      for (const poly of polygonsOf(f.geometry)) {
        const bb = [Infinity, Infinity, -Infinity, -Infinity];
        const rings = poly.map((ring) => {
          const a = new Float64Array(ring.length * 2);
          ring.forEach(([x, y], j) => {
            a[2 * j] = x; a[2 * j + 1] = y;
            if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y;
            if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
            const la = y * Math.PI / 180, lo = x * Math.PI / 180, cl = Math.cos(la);
            VX[k] = cl * Math.cos(lo); VY[k] = cl * Math.sin(lo); VZ[k] = Math.sin(la); VC[k] = ci; k++;
          });
          return a;
        });
        c.polys.push({ bb, rings });
      }
      COUNTRIES.push(c);
    });
    return COUNTRIES;
  }

  function inRing(a, x, y) {
    let inside = false;
    for (let i = 0, n = a.length / 2, j = n - 1; i < n; j = i++) {
      const xi = a[2 * i], yi = a[2 * i + 1], xj = a[2 * j], yj = a[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function wrapLon(lon) { return ((((lon + 180) % 360) + 360) % 360) - 180; }

  // Index of the country containing the point, or −1 for water.
  function countryAt(lat, lon) {
    lon = wrapLon(lon);
    for (let ci = 0; ci < COUNTRIES.length; ci++) {
      for (const p of COUNTRIES[ci].polys) {
        if (lat < p.bb[1] || lat > p.bb[3]) continue;
        let x = lon;
        if (x < p.bb[0] || x > p.bb[2]) {
          if (p.bb[2] > 180 && lon + 360 <= p.bb[2]) x = lon + 360;
          else if (p.bb[0] < -180 && lon - 360 >= p.bb[0]) x = lon - 360;
          else continue;
        }
        let inside = false;
        for (const r of p.rings) if (inRing(r, x, lat)) inside = !inside;
        if (inside) return ci;
      }
    }
    if (lat < -85 && ANTARCTICA >= 0) return ANTARCTICA;
    return -1;
  }

  function unit(lat, lon) {
    const la = lat * Math.PI / 180, lo = lon * Math.PI / 180, c = Math.cos(la);
    return [c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)];
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    const [x1, y1, z1] = unit(lat1, lon1), [x2, y2, z2] = unit(lat2, lon2);
    return Math.acos(Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2))) * R;
  }

  // Nearest coastline vertex (1:50m scale, accurate to a few km).
  function nearestLand(lat, lon) {
    const [x, y, z] = unit(lat, lon);
    let best = -2, bi = 0;
    for (let k = 0, n = VX.length; k < n; k++) {
      const d = x * VX[k] + y * VY[k] + z * VZ[k];
      if (d > best) { best = d; bi = k; }
    }
    return { km: Math.acos(Math.max(-1, Math.min(1, best))) * R, country: VC[bi] };
  }

  function nearestCity(lat, lon, except) {
    let best = null, bd = Infinity;
    for (const c of CITIES) {
      if (c.i === except) continue;
      const d = distanceKm(lat, lon, c.lat, c.lon);
      if (d < bd) { bd = d; best = c; }
    }
    return { city: best, km: bd };
  }

  function antipode(lat, lon) { return [-lat, wrapLon(lon + 180)]; }

  // Approximate sea or ocean name: fine for a label, not for navigation.
  function waterName(lat, lon) {
    lon = wrapLon(lon);
    const box = (a, b, c, d) => lat >= a && lat <= b && lon >= c && lon <= d;
    if (lat <= -60) return 'Southern Ocean';
    if (box(36.5, 47.2, 46.5, 55)) return 'Caspian Sea';
    if (box(40.8, 47, 27.4, 42)) return 'Black Sea';
    if (box(30, 46, -5.6, 36.5)) return 'Mediterranean Sea';
    if (box(53.5, 66, 9, 30.5)) return 'Baltic Sea';
    if (box(12.5, 30, 32, 43.5)) return 'Red Sea';
    if (box(24, 30.5, 48, 56.5)) return 'Persian Gulf';
    if (lat >= 66.5) return (lon > -45 && lon < 25 && lat < 72) ? 'Atlantic Ocean' : 'Arctic Ocean';
    if (lat < 31 && lon >= 20 && lon <= 100) return 'Indian Ocean';
    if (lon > 100 && lon <= 147 && lat < -10 && !(lon > 130 && lat > -20)) return 'Indian Ocean';
    let west;
    if (lat < -55) west = -67.3;
    else if (lat < 0) west = -70;
    else if (lat < 9.2) west = -75;
    else if (lat < 14) west = -83.5;
    else if (lat < 18) west = -89;
    else if (lat < 31) west = -98;
    else west = -82;
    const east = lat < 31 ? 20 : 45;
    if (lon >= west && lon <= east) return 'Atlantic Ocean';
    return 'Pacific Ocean';
  }

  // Full breakdown of a point: what is here and what is on the other side.
  function analyze(lat, lon, cityIndex) {
    lon = wrapLon(lon);
    const [alat, alon] = antipode(lat, lon);
    const hereCi = countryAt(lat, lon);
    const thereCi = countryAt(alat, alon);
    const res = {
      lat, lon, alat, alon,
      city: cityIndex != null ? CITIES[cityIndex] : null,
      here: hereCi >= 0 ? COUNTRIES[hereCi].name : waterName(lat, lon),
      hereLand: hereCi >= 0,
      there: thereCi >= 0 ? COUNTRIES[thereCi].name : waterName(alat, alon),
      thereLand: thereCi >= 0,
      land: null,
      nearCity: nearestCity(alat, alon, cityIndex)
    };
    if (thereCi < 0) {
      const nl = nearestLand(alat, alon);
      res.land = { km: nl.km, name: COUNTRIES[nl.country].name };
    }
    return res;
  }

  const api = { R, CITIES, buildIndex, countryAt, nearestLand, nearestCity, antipode, analyze, waterName,
    distanceKm, wrapLon, normalizeFeatures, polygonsOf, get COUNTRIES() { return COUNTRIES; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Antipodes = api;
})(typeof self !== 'undefined' ? self : this);
