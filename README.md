# SkyCast Weather

A clean, responsive weather app that runs in your browser. Search any city and see the current conditions plus a 5-day forecast.

Built with plain HTML, CSS and JavaScript. Weather data comes from the free [Open-Meteo](https://open-meteo.com/) API, so there is no API key and no backend.

**Live demo:** https://himajanandini57.github.io/skycasty/

## Features

- Search any city in the world
- Current temperature, "feels like", humidity and wind speed
- 5-day forecast with icons and high / low temperatures
- Switch between °C and °F (remembers your choice)
- "Use my location" button
- Recent searches as quick-access chips
- Dark mode (remembers your choice)
- Responsive layout for phones and desktops
- Friendly error messages for unknown cities or network problems

## Getting started

1. Clone the repository
```bash
   git clone https://github.com/himajanandini57/skycasty.git
```
2. Open `index.html` in your browser. That's it.

## Project structure

```
skycasty/
├── index.html   # page structure
├── style.css    # styling and dark mode
├── script.js    # API calls and app logic
└── README.md
```

## How it works

1. The city name is sent to the Open-Meteo geocoding API, which returns its latitude and longitude.
2. Those coordinates are sent to the Open-Meteo forecast API, which returns the current weather and daily forecast as JSON.
3. The app converts the weather codes into descriptions and emoji, and shows everything on the page.

## What I learned

- Fetching data from an API with `fetch` and `async` / `await`
- Handling errors and loading states
- Working with JSON and URL parameters
- Unit conversion and formatting dates
- Saving settings with `localStorage`

## Future improvements

- City suggestions while typing
- Hourly forecast chart
- Sunrise and sunset times
- Weather-based background colors

## License

MIT
