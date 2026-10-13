const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const UNIT_KEY = "skycast-unit";
const THEME_KEY = "skycast-theme";
const RECENT_KEY = "skycast-recent";
const LAST_KEY = "skycast-last-place";
const MAX_RECENT = 5;

// Open-Meteo weather codes -> [description, emoji]
const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Freezing fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Light showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Severe thunderstorm with hail", "⛈️"]
};

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const locateBtn = document.getElementById("locate-btn");
const statusEl = document.getElementById("status");
const recentEl = document.getElementById("recent");
const currentEl = document.getElementById("current");
const forecastSection = document.getElementById("forecast-section");
const forecastEl = document.getElementById("forecast");
const unitToggle = document.getElementById("unit-toggle");
const themeToggle = document.getElementById("theme-toggle");

const placeNameEl = document.getElementById("place-name");
const placeDateEl = document.getElementById("place-date");
const descriptionEl = document.getElementById("description");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

let unit = localStorage.getItem(UNIT_KEY) === "f" ? "f" : "c";
let currentPlace = null;
let weatherData = null;

// ---------- helpers ----------

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
  statusEl.classList.toggle("hidden", !text);
}

function convertTemp(celsius) {
  const value = unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°${unit.toUpperCase()}`;
}

function convertWind(kmh) {
  return unit === "f" ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

function describe(code) {
  return WEATHER_CODES[code] || ["Unknown", "🌡️"];
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed (" + response.status + ")");
  return response.json();
}

// ---------- data ----------

async function findCity(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const data = await fetchJSON(url);
  if (!data.results || data.results.length === 0) return null;
  const r = data.results[0];
  return {
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(", "),
    latitude: r.latitude,
    longitude: r.longitude
  };
}

async function fetchWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "5"
  });
  return fetchJSON(`${WEATHER_URL}?${params}`);
}

async function showPlace(place) {
  setStatus("Loading weather...");
  try {
    weatherData = await fetchWeather(place);
    currentPlace = place;
    localStorage.setItem(LAST_KEY, JSON.stringify(place));
    render();
    setStatus("");
  } catch {
    setStatus("Couldn't load the weather. Check your internet connection and try again.", true);
  }
}

async function searchCity(name) {
  setStatus("Searching...");
  try {
    const place = await findCity(name);
    if (!place) {
      setStatus(`No city found for "${name}". Check the spelling and try again.`, true);
      return;
    }
    addRecent(place);
    await showPlace(place);
  } catch {
    setStatus("Search failed. Check your internet connection and try again.", true);
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    setStatus("Your browser doesn't support location.", true);
    return;
  }
  setStatus("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    pos => showPlace({
      name: "Your location",
      region: "",
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    }),
    () => setStatus("Couldn't get your location. Allow location access or search by city.", true)
  );
}

// ---------- rendering ----------

function render() {
  if (!weatherData || !currentPlace) return;

  const cur = weatherData.current;
  const [desc, emoji] = describe(cur.weather_code);

  placeNameEl.textContent = currentPlace.name;
  placeDateEl.textContent =
    (currentPlace.region ? currentPlace.region + " · " : "") +
    new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  descriptionEl.textContent = desc;
  iconEl.textContent = emoji;
  tempEl.textContent = convertTemp(cur.temperature_2m);
  feelsEl.textContent = convertTemp(cur.apparent_temperature);
  humidityEl.textContent = cur.relative_humidity_2m + "%";
  windEl.textContent = convertWind(cur.wind_speed_10m);

  forecastEl.innerHTML = "";
  const daily = weatherData.daily;
  daily.time.forEach((dateStr, i) => {
    const [, dayEmoji] = describe(daily.weather_code[i]);
    const card = document.createElement("div");
    card.className = "day";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = i === 0
      ? "Today"
      : new Date(dateStr + "T00:00:00").toLocaleDateString([], { weekday: "short" });

    const em = document.createElement("span");
    em.className = "emoji";
    em.textContent = dayEmoji;

    const range = document.createElement("span");
    range.className = "range";
    const high = document.createElement("strong");
    high.textContent = convertTemp(daily.temperature_2m_max[i]);
    const low = document.createElement("span");
    low.className = "low";
    low.textContent = " " + convertTemp(daily.temperature_2m_min[i]);
    range.append(high, low);

    card.append(name, em, range);
    forecastEl.appendChild(card);
  });

  currentEl.classList.remove("hidden");
  forecastSection.classList.remove("hidden");
}

// ---------- recent searches ----------

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function addRecent(place) {
  let list = loadRecent().filter(p => !(p.name === place.name && p.region === place.region));
  list.unshift(place);
  list = list.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecent();
}

function renderRecent() {
  recentEl.innerHTML = "";
  loadRecent().forEach(place => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = place.name;
    chip.addEventListener("click", () => showPlace(place));
    recentEl.appendChild(chip);
  });
}

// ---------- settings ----------

function applyUnit() {
  unitToggle.textContent = "°" + unit.toUpperCase();
  localStorage.setItem(UNIT_KEY, unit);
  render();
}

function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeToggle.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
}

// ---------- events ----------

form.addEventListener("submit", e => {
  e.preventDefault();
  const name = cityInput.value.trim();
  if (name) searchCity(name);
});

locateBtn.addEventListener("click", useMyLocation);

unitToggle.addEventListener("click", () => {
  unit = unit === "c" ? "f" : "c";
  applyUnit();
});

themeToggle.addEventListener("click", () => applyTheme(!document.body.classList.contains("dark")));

// ---------- start ----------

applyTheme(localStorage.getItem(THEME_KEY) === "dark");
applyUnit();
renderRecent();

try {
  const last = JSON.parse(localStorage.getItem(LAST_KEY));
  if (last) showPlace(last);
} catch {
  // ignore a broken saved value
}
