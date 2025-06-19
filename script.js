const apiKey = "f1ef30000c60675e44a17822710b25ed";

function saveToHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 5) history.pop();
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  list.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => {
      document.getElementById("cityInput").value = city;
      getWeather();
    };
    list.appendChild(li);
  });
}

async function getWeather(button) {
  const city = document.getElementById("cityInput").value;
  const unit = document.getElementById("unitSelect").value;
  const resultDiv = document.getElementById("weatherResult");
  const forecastDiv = document.getElementById("forecastResult");

  if (button) {
    button.classList.add("clicked");
    setTimeout(() => button.classList.remove("clicked"), 500);
  }

  if (!city) {
    resultDiv.innerHTML = "<p>Please enter a city name.</p>";
    return;
  }

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok)
      throw new Error("City not found");

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const symbol = unit === 'metric' ? '°C' : '°F';

    const condition = currentData.weather[0].main.toLowerCase();
    document.body.className = document.body.className.replace(/\b(clear|clouds|rain|snow|thunderstorm)\b/g, '');
    document.body.classList.add("background-scene");
    document.body.classList.add(condition);

    const weatherHTML = `
      <h2>${currentData.name}, ${currentData.sys.country}</h2>
      <p>${today}</p>
      <img src="https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="Weather Icon" />
      <p><strong>${currentData.weather[0].main}</strong> - ${currentData.weather[0].description}</p>
      <p>🌡️ Temp: ${currentData.main.temp} ${symbol}</p>
      <p>💧 Humidity: ${currentData.main.humidity}%</p>
      <p>🌬️ Wind: ${currentData.wind.speed} m/s</p>
    `;
    resultDiv.innerHTML = weatherHTML;

    // Forecast
    const forecastList = forecastData.list.filter(item => item.dt_txt.includes("12:00:00"));
    let forecastHTML = '<h3>5-Day Forecast</h3><div class="forecast-cards">';
    forecastList.forEach(day => {
      const date = new Date(day.dt_txt).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      forecastHTML += `
        <div class="forecast-card">
          <p>${date}</p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Forecast Icon" />
          <p>${day.main.temp} ${symbol} - ${day.weather[0].main}</p>
        </div>
      `;
    });
    forecastHTML += '</div>';
    forecastDiv.innerHTML = forecastHTML;

    saveToHistory(city);
  } catch (error) {
    resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    forecastDiv.innerHTML = "";
  }
}

function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(async position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const unit = document.getElementById("unitSelect").value;
    const resultDiv = document.getElementById("weatherResult");
    const forecastDiv = document.getElementById("forecastResult");

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ]);

      if (!currentResponse.ok || !forecastResponse.ok)
        throw new Error("Weather data not available");

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      document.getElementById("cityInput").value = currentData.name;
      getWeather();
    } catch (err) {
      resultDiv.innerHTML = `<p>Failed to get weather for your location.</p>`;
    }
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

window.onload = () => {
  document.body.classList.add("background-scene");
  renderHistory();
  const switchToggle = document.getElementById("themeSwitch");
  switchToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", switchToggle.checked);
  });
  updateMarquee();
};

// === Live Weather Marquee ===
const marqueeSpan = document.getElementById("marquee-text");
const marqueeCities = [
  "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada",
  "Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Davanagere",
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"
];

async function getMarqueeWeather(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await res.json();
    return `🌤️ ${city}: ${data.main.temp}°C, ${data.weather[0].main}`;
  } catch {
    return `⚠️ ${city}: N/A`;
  }
}

async function updateMarquee() {
  const results = await Promise.all(marqueeCities.map(getMarqueeWeather));
  if (marqueeSpan) marqueeSpan.textContent = results.join(" | ");
}
