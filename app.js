/* Antipodes map UI. Geometry lives in core.js. */
(function () {
  'use strict';
  const A = window.Antipodes;
  const $ = (id) => document.getElementById(id);

  const DATA_50M = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
  const DATA_110M = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
  const OFFSETS = [-360, 0, 360];
  const MOBILE = 820;
  const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const css = getComputedStyle(document.documentElement);
  const HERE = css.getPropertyValue('--here').trim() || '#2343D6';
  const THERE = css.getPropertyValue('--there').trim() || '#D6246E';

  const state = { results: [], filter: 'all', query: '', current: null, flip: true, split: false };

  // ---------- formatting ----------
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const round = (v) => (v < 100 ? Math.round(v) : Math.round(v / 10) * 10);
  const km = (v) => (v < 10 ? 'under 10 km' : `${nf.format(round(v))} km`);
  const kmMi = (v) => `<span class="nb">${v < 10 ? 'under 10 km' : `${nf.format(round(v))} km (${nf.format(round(v * 0.621371))} mi)`}</span>`;
  const fmtCoord = (lat, lon) =>
    `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  // ---------- maps ----------
  // The basemap is drawn from the same Natural Earth outlines the page already loads,
  // so it needs no tile server, no API key and always matches the site's colours.
  const BASE = {
    land: css.getPropertyValue('--land').trim() || '#FFFFFF',
    border: css.getPropertyValue('--border').trim() || '#C3CCD6',
    grid: css.getPropertyValue('--grid').trim() || '#AEB9C5'
  };

  function makeMap(el) {
    const map = L.map(el, {
      worldCopyJump: true,
      minZoom: window.innerWidth < MOBILE ? 1 : 2,
      maxZoom: 8,
      zoomSnap: 0.5,
      zoomControl: false
    }).setView([20, 20], 2);
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
    map.createPane('base').style.zIndex = 250;
    const v = {
      map,
      baseRenderer: L.canvas({ pane: 'base', padding: 0.5 }),
      flipRenderer: L.canvas({ padding: 0.5 }),
      cityRenderer: L.canvas({ padding: 0.5 }),
      baseLayer: L.layerGroup().addTo(map),
      flipLayer: L.layerGroup(),
      cityLayer: L.layerGroup().addTo(map),
      selLayer: L.layerGroup().addTo(map)
    };
    if (canHover) {
      map.on('mousemove', (e) => hover(e.latlng));
      map.on('mouseout', () => { readout.hidden = true; });
    }
    return v;
  }

  // what's under the cursor and what's opposite it
  const readout = $('readout');
  const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  let hoverFrame = 0, hoverAt = null;
  function placeName(lat, lon) {
    const ci = A.countryAt(lat, lon);
    return ci >= 0 ? A.COUNTRIES[ci].name : A.waterName(lat, lon);
  }
  function hover(latlng) {
    hoverAt = latlng;
    if (hoverFrame || !A.COUNTRIES.length) return;
    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0;
      const lat = Math.max(-89.9, Math.min(89.9, hoverAt.lat));
      const lon = A.wrapLon(hoverAt.lng);
      const [alat, alon] = A.antipode(lat, lon);
      readout.innerHTML = `<span class="h">${esc(placeName(lat, lon))}</span><span class="x">↔</span><span class="t">${esc(placeName(alat, alon))}</span>`;
      readout.hidden = false;
    });
  }

  // Two levels of detail keep zooming smooth: 1:110m outlines for the world view,
  // 1:50m once zoomed in (with 1:110m copies past the 180th meridian, which only show at the edges).
  const DETAIL_ZOOM = 4;
  function toLatLngs(features) {
    return features.map((f) => A.polygonsOf(f.geometry).map((poly) => poly.map((ring) => ring.map(([x, y]) => [y, x]))))
      .filter((p) => p.length);
  }
  function addShapes(group, renderer, shapes, offsets) {
    for (const off of offsets) {
      for (const polys of shapes) {
        const latlngs = off ? polys.map((p) => p.map((r) => r.map(([la, lo]) => [la, lo + off]))) : polys;
        L.polygon(latlngs, {
          renderer, interactive: false, smoothFactor: 1.2, stroke: false, fillColor: BASE.land, fillOpacity: 1
        }).addTo(group);
      }
    }
  }
  // borders shared by two countries only: coastlines come from the fill, and the data's
  // cut along the 180th meridian never shows up as a line
  function addBorders(group, renderer, topo, offsets) {
    const mesh = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
    const lines = mesh.coordinates.map((line) => line.map(([x, y]) => [y, x]));
    for (const off of offsets) {
      const latlngs = off ? lines.map((l) => l.map(([la, lo]) => [la, lo + off])) : lines;
      L.polyline(latlngs, { renderer, interactive: false, smoothFactor: 1.2, color: BASE.border, weight: 0.8 }).addTo(group);
    }
  }
  function buildBaseLayer(f50, f110, t50, t110) {
    // features are already normalised (rings unwrapped across the 180th meridian)
    const fine = toLatLngs(f50), coarse = toLatLngs(f110);
    for (const v of views) {
      v.baseLo = L.layerGroup(); v.baseHi = L.layerGroup();
      addShapes(v.baseLo, v.baseRenderer, coarse, OFFSETS);
      addShapes(v.baseHi, v.baseRenderer, fine, [0]);
      addShapes(v.baseHi, v.baseRenderer, coarse, [-360, 360]);
      addBorders(v.baseLo, v.baseRenderer, t110, OFFSETS);
      addBorders(v.baseHi, v.baseRenderer, t50, [0]);
      addBorders(v.baseHi, v.baseRenderer, t110, [-360, 360]);
      // the equator: every antipode is mirrored across it
      L.polyline([[0, -540], [0, 540]], {
        renderer: v.baseRenderer, interactive: false, color: BASE.grid, weight: 1, dashArray: '4 6'
      }).addTo(v.baseLayer);
      const pick = () => {
        const hi = v.map.getZoom() >= DETAIL_ZOOM;
        const on = hi ? v.baseHi : v.baseLo, off = hi ? v.baseLo : v.baseHi;
        if (v.map.hasLayer(off)) v.baseLayer.removeLayer(off);
        if (!v.baseLayer.hasLayer(on)) v.baseLayer.addLayer(on);
      };
      v.map.on('zoomend', pick);
      pick();
    }
  }

  const views = [makeMap('mapA'), makeMap('mapB')];
  const [VA, VB] = views;
  window.__antipodes = { views, state }; // handy for poking around in the console

  // Upside-down world: every outline point is mirrored through the Earth's centre (−lat, lon + 180°).
  function buildFlipLayer(features) {
    A.normalizeFeatures(features);
    const polys = [];
    for (const f of features) {
      for (const poly of A.polygonsOf(f.geometry)) {
        polys.push(poly.map((ring) => ring.map(([x, y]) => [-y, x + 180])));
      }
    }
    // the base copy spans 0…360°; neighbouring copies cover the rest of the visible world
    for (const v of views) {
      for (const off of [-720, -360, 0, 360]) {
        for (const p of polys) {
          const shifted = off ? p.map((r) => r.map(([la, lo]) => [la, lo + off])) : p;
          L.polygon(shifted, {
            renderer: v.flipRenderer, interactive: false,
            color: THERE, weight: 1, opacity: 0.75, fillColor: THERE, fillOpacity: dark ? 0.22 : 0.18
          }).addTo(v.flipLayer);
        }
      }
      for (const r of state.results) {
        for (const off of OFFSETS) {
          L.circleMarker([r.alat, r.alon + off], {
            renderer: v.flipRenderer, radius: 3, weight: 1.5, color: THERE, fill: false, interactive: false
          }).addTo(v.flipLayer);
        }
      }
      if (state.flip) v.flipLayer.addTo(v.map);
    }
  }

  function buildCityMarkers() {
    for (const v of views) {
      for (const r of state.results) {
        const c = r.city;
        for (const off of OFFSETS) {
          L.circleMarker([c.lat, c.lon + off], {
            renderer: v.cityRenderer,
            radius: 3 + Math.sqrt(c.pop) * 0.9,
            weight: 1.5, color: dark ? '#0B1220' : '#fff', fillColor: HERE, fillOpacity: 0.9,
            bubblingMouseEvents: false
          })
            .bindTooltip(`${c.name} ↔ ${r.there}`, { direction: 'top', offset: [0, -4] })
            .on('click', () => selectCity(c.i, true))
            .addTo(v.cityLayer);
        }
      }
    }
  }

  const pinIcon = (cls) => L.divIcon({ className: '', html: `<div class="pin ${cls}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });

  function drawSelection(res) {
    for (const v of views) {
      v.selLayer.clearLayers();
      for (const off of OFFSETS) {
        L.marker([res.lat, res.lon + off], { icon: pinIcon('here'), keyboard: false, interactive: false }).addTo(v.selLayer);
        L.marker([res.alat, res.alon + off], { icon: pinIcon('there'), keyboard: false, interactive: false, zIndexOffset: 500 }).addTo(v.selLayer);
      }
    }
  }

  // the copy of a longitude closest to the map centre
  function unwrapNear(lon, center) {
    while (lon - center > 180) lon -= 360;
    while (center - lon > 180) lon += 360;
    return lon;
  }

  function frameSelection(res) {
    const m = VA.map;
    if (state.split) {
      m.setView([res.lat, unwrapNear(res.lon, m.getCenter().lng)], Math.max(m.getZoom(), 4));
      return;
    }
    const cLon = m.getCenter().lng;
    const hereU = unwrapNear(res.lon, cLon);
    const a = hereU + 180, b = hereU - 180;
    const thereU = Math.abs((hereU + a) / 2 - cLon) < Math.abs((hereU + b) / 2 - cLon) ? a : b;
    m.flyToBounds([[res.lat, hereU], [res.alat, thereU]], { padding: [70, 70], maxZoom: 4, duration: 0.8 });
  }

  function zoomTo(which) {
    const r = state.current; if (!r) return;
    const m = VA.map;
    // in split view the antipode is already centred on the right map, so zooming the left one zooms both
    const useHere = which === 'here' || state.split;
    const lat = useHere ? r.lat : r.alat;
    const lon = useHere ? r.lon : r.alon;
    m.flyTo([lat, unwrapNear(lon, m.getCenter().lng)], 6, { duration: 0.8 });
  }

  // two-map sync: the right map always shows the antipode of the left map's centre
  let syncing = false;
  function sync(src, dst) {
    if (!state.split || syncing) return;
    syncing = true;
    const c = src.getCenter();
    dst.setView([-c.lat, A.wrapLon(c.lng + 180)], src.getZoom(), { animate: false });
    syncing = false;
  }
  VA.map.on('move zoom', () => sync(VA.map, VB.map));
  VB.map.on('move zoom', () => sync(VB.map, VA.map));

  for (const v of views) {
    v.map.on('click', (e) => selectPoint(e.latlng.lat, A.wrapLon(e.latlng.lng), true));
  }

  // ---------- panel ----------
  function renderCard(res) {
    const c = res.city;
    $('hereName').textContent = c ? c.name : 'Point on the map';
    $('hereSub').textContent = c ? c.country : res.here;
    $('hereCoord').textContent = fmtCoord(res.lat, res.lon);

    const tn = $('thereName');
    tn.textContent = res.there;
    tn.classList.toggle('sea', !res.thereLand);
    $('thereCoord').textContent = fmtCoord(res.alat, res.alon);

    const facts = [];
    if (res.land) facts.push(`Nearest land is <b>≈ ${kmMi(res.land.km)}</b> away: ${esc(res.land.name)}`);
    const nc = res.nearCity;
    if (nc.city) facts.push(`Closest listed city: <b>${esc(nc.city.name)}</b>, ${esc(nc.city.country)}, ${kmMi(nc.km)}`);
    $('facts').innerHTML = facts.map((f) => `<li>${f}</li>`).join('');
  }

  function rowsMatching() {
    const q = state.query.trim().toLowerCase();
    return state.results.filter((r) => {
      if (state.filter === 'land' && !r.thereLand) return false;
      if (state.filter === 'sea' && r.thereLand) return false;
      if (!q) return true;
      return (r.city.name + ' ' + r.city.country + ' ' + r.there).toLowerCase().includes(q);
    });
  }

  function renderList() {
    const rows = rowsMatching();
    const cur = state.current && state.current.city ? state.current.city.i : -1;
    $('list').innerHTML = rows.length
      ? rows.map((r) => `
        <li><button class="row" type="button" data-i="${r.city.i}" aria-current="${r.city.i === cur}">
          <span class="rname">${esc(r.city.name)}</span>
          <span class="rthere${r.thereLand ? ' land' : ''}">${esc(r.there)}</span>
          <span class="rmeta">${esc(r.city.country)}</span>
          <span class="rdist">${r.land ? km(r.land.km) + ' to land' : 'land ↔ land'}</span>
        </button></li>`).join('')
      : '<li class="empty">No matches. Try another name or clear the filter.</li>';
  }

  $('list').addEventListener('click', (e) => {
    const b = e.target.closest('.row'); if (!b) return;
    selectCity(+b.dataset.i, true);
    if (window.innerWidth < MOBILE) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('q').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
  document.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => {
    state.filter = ch.dataset.f;
    document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === ch)));
    renderList();
  }));
  $('zoomHere').addEventListener('click', () => zoomTo('here'));
  $('zoomThere').addEventListener('click', () => zoomTo('there'));
  $('copyLink').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied'); }
    catch (e) { toast('Couldn’t copy. The link is in the address bar.'); }
  });

  $('flipBtn').addEventListener('click', function () {
    state.flip = !state.flip;
    this.setAttribute('aria-pressed', String(state.flip));
    for (const v of views) state.flip ? v.flipLayer.addTo(v.map) : v.flipLayer.remove();
  });
  $('splitBtn').addEventListener('click', function () {
    state.split = !state.split;
    this.setAttribute('aria-pressed', String(state.split));
    $('app').classList.toggle('split', state.split);
    setTimeout(() => {
      VA.map.invalidateSize(); VB.map.invalidateSize();
      if (state.split && state.current) {
        VA.map.setView([state.current.lat, state.current.lon], Math.max(VA.map.getZoom(), 4), { animate: false });
      }
      sync(VA.map, VB.map);
    }, 30);
  });
  $('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('This browser can’t detect your location.'); return; }
    toast('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (p) => { $('toast').hidden = true; selectPoint(p.coords.latitude, p.coords.longitude, true); },
      (err) => toast(err.code === 1
        ? 'Location access is blocked. Allow it in your browser settings, or click the map instead.'
        : 'Couldn’t detect your location. Click the map to pick a point.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });

  // ---------- selection ----------
  function apply(res, frame) {
    state.current = res;
    renderCard(res);
    drawSelection(res);
    renderList();
    if (frame) frameSelection(res);
    const h = `#${res.lat.toFixed(4)},${res.lon.toFixed(4)}`;
    if (location.hash !== h) history.replaceState(null, '', h);
    document.title = `${res.city ? res.city.name : 'Point'} ↔ ${res.there} · Through the Earth`;
  }

  function selectCity(i, frame) { apply(state.results[i], frame); }

  function selectPoint(lat, lon, frame) {
    lat = Math.max(-89.9999, Math.min(89.9999, lat));
    lon = A.wrapLon(lon);
    const near = A.nearestCity(lat, lon);
    if (near.city && near.km < 3) return selectCity(near.city.i, frame);
    apply(A.analyze(lat, lon, null), frame);
  }

  function fromHash() {
    const m = location.hash.match(/^#(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
    if (!m) return false;
    selectPoint(+m[1], +m[2], true);
    return true;
  }
  window.addEventListener('hashchange', fromHash);

  // ---------- loading ----------
  async function load() {
    try {
      const [t50, t110] = await Promise.all([
        fetch(DATA_50M).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch(DATA_110M).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      ]);
      const f50 = topojson.feature(t50, t50.objects.countries).features;
      const f110 = A.normalizeFeatures(topojson.feature(t110, t110.objects.countries).features);
      A.buildIndex(f50);
      buildBaseLayer(f50, f110, t50, t110);
      // "here" comes from the city list: at 1:50m a port city sometimes lands just offshore
      state.results = A.CITIES.map((c) => A.analyze(c.lat, c.lon, c.i));
      const landCount = state.results.filter((r) => r.thereLand).length;
      $('stat').innerHTML = `Only <b>${landCount}</b> of ${state.results.length} cities have land on the other side. The rest face open ocean.`;

      buildFlipLayer(f110);
      buildCityMarkers();
      $('status').hidden = true;
      if (!fromHash()) selectCity(A.CITIES.findIndex((c) => c.name === 'Madrid'), true);
    } catch (e) {
      console.error(e);
      $('status').textContent = 'Couldn’t load the country outlines. Check your internet connection and reload the page.';
    }
  }
  load();
})();
