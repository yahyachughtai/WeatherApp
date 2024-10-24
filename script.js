const MY_API_KEY = "f209948b9ca851c3f962d0374402455a";
const MY_BASE_URL = "https://api.openweathermap.org/data/2.5";

const cityInput = document.getElementById("cityInput");
const getWeatherBtn = document.getElementById("getWeatherBtn");
const unitToggle = document.getElementById("unitToggle");
const myLoadingMessage = document.getElementById("loading");
const myWeatherWidget = document.getElementById("weatherWidget");
const cityNameDisplay = document.getElementById("cityName");
const myCurrentWeather = document.getElementById("currentWeather");
const myForecastTable = document.getElementById("forecastTable");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const currentPageSpan = document.getElementById("currentPage");
const chatbotInput = document.getElementById("chatbotInput");
const sendChatbotMsgBtn = document.getElementById("sendChatbotMsg");
const myChatbotMessages = document.getElementById("chatbotMessages");

let currentPage = 1;
const itemsPerPage = 10;
let myForecastData = [];

getWeatherBtn.addEventListener("click", getWeather);
unitToggle.addEventListener("change", getWeather);
prevPageBtn.addEventListener("click", () => changePage(-1));
nextPageBtn.addEventListener("click", () => changePage(1));
sendChatbotMsgBtn.addEventListener("click", sendChatbotMessage);

async function getWeather() {
  const city = cityInput.value;
  const units = unitToggle.value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  myLoadingMessage.style.display = "block";
  myWeatherWidget.style.display = "none";

  try {
    const currentWeatherData = await fetchWeatherData(
      `${MY_BASE_URL}/weather?q=${city}&units=${units}&appid=${MY_API_KEY}`
    );
    const forecastWeatherData = await fetchWeatherData(
      `${MY_BASE_URL}/forecast?q=${city}&units=${units}&appid=${MY_API_KEY}`
    );

    displayCurrentWeather(currentWeatherData);
    processForecastData(forecastWeatherData);
    displayForecastTable();
    createCharts();

    myLoadingMessage.style.display = "none";
    myWeatherWidget.style.display = "block";
  } catch (error) {
    console.error("Error fetching weather data:", error);
    alert("Error fetching weather data. Please try again.");
    myLoadingMessage.style.display = "none";
  }
}

async function fetchWeatherData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather data not found");
  }
  return response.json();
}

function displayCurrentWeather(data) {
  const tempUnit = unitToggle.value === "metric" ? "°C" : "°F";
  cityNameDisplay.textContent = `${data.name}, ${data.sys.country}`;
  myCurrentWeather.innerHTML = ` 
        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="${data.weather[0].description}">
        <p>Temperature: ${data.main.temp}${tempUnit}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
        <p>Weather: ${data.weather[0].description}</p>
    `;
  myWeatherWidget.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${data.weather[0].main}')`;
}

function processForecastData(data) {
  myForecastData = data.list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        date,
        temps: [],
        weather: [],
      };
    }
    acc[date].temps.push(item.main.temp);
    acc[date].weather.push(item.weather[0].main);
    return acc;
  }, {});

  myForecastData = Object.values(myForecastData).map((day) => ({
    ...day,
    avgTemp: day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length,
    mainWeather: getMostFrequentWeather(day.weather),
  }));
}

function getMostFrequentWeather(weatherArray) {
  return weatherArray
    .sort(
      (a, b) =>
        weatherArray.filter((v) => v === a).length -
        weatherArray.filter((v) => v === b).length
    )
    .pop();
}

function displayForecastTable() {
  const tbody = myForecastTable.querySelector("tbody");
  tbody.innerHTML = "";
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = myForecastData.slice(startIndex, endIndex);

  pageData.forEach((day) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = day.date;
    row.insertCell(1).textContent = `${day.avgTemp.toFixed(1)}${
      unitToggle.value === "metric" ? "°C" : "°F"
    }`;
    row.insertCell(2).textContent = day.mainWeather;
  });

  currentPageSpan.textContent = `Page ${currentPage} of ${Math.ceil(
    myForecastData.length / itemsPerPage
  )}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled =
    currentPage === Math.ceil(myForecastData.length / itemsPerPage);
}

function changePage(direction) {
  currentPage += direction;
  displayForecastTable();
}

function createCharts() {
  createTemperatureBarChart();
  createWeatherConditionsPieChart();
  createTemperatureLineChart();
}

function createTemperatureBarChart() {
  const ctx = document.getElementById("temperatureBarChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: myForecastData.map((day) => day.date),
      datasets: [
        {
          label: "Average Temperature",
          data: myForecastData.map((day) => day.avgTemp),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text:
              unitToggle.value === "metric"
                ? "Temperature (°C)"
                : "Temperature (°F)",
          },
        },
      },
      animation: {
        delay: (context) => context.dataIndex * 100,
      },
    },
  });
}

function createWeatherConditionsPieChart() {
  const weatherCounts = myForecastData.reduce((acc, day) => {
    acc[day.mainWeather] = (acc[day.mainWeather] || 0) + 1;
    return acc;
  }, {});

  const ctx = document
    .getElementById("weatherConditionsPieChart")
    .getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(weatherCounts),
      datasets: [
        {
          data: Object.values(weatherCounts),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(0, 100, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Weather Conditions Distribution",
        },
      },
      animation: {
        delay: (context) => context.dataIndex * 100,
      },
    },
  });
}

function createTemperatureLineChart() {
  const ctx = document.getElementById("temperatureLineChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: myForecastData.map((day) => day.date),
      datasets: [
        {
          label: "Average Temperature",
          data: myForecastData.map((day) => day.avgTemp),
          borderColor: "rgba(75, 1, 192, 1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text:
              unitToggle.value === "metric"
                ? "Temperature (°C)"
                : "Temperature (°F)",
          },
        },
      },
      animation: {
        tension: {
          duration: 1000,
          easing: "linear",
          from: 1,
          to: 0,
          loop: true,
        },
      },
    },
  });
}

function sendChatbotMessage() {
  const userMessage = chatbotInput.value.trim();
  if (!userMessage) return;

  appendChatMessage("user", userMessage);
  chatbotInput.value = "";

  // Process user message and generate response
  const botResponse = generateChatbotResponse(userMessage);
  appendChatMessage("bot", botResponse);
}

function appendChatMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", sender);
  messageElement.textContent = message;
  myChatbotMessages.appendChild(messageElement);
  myChatbotMessages.scrollTop = myChatbotMessages.scrollHeight;
}

function generateChatbotResponse(userMessage) {
  return "My apologies, I am unable to assist you with that right now.";
}

// Geolocation support
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoordinates(lat, lon);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get location. Please enter a city manually.");
      }
    );
  } else {
    alert(
      "Geolocation is unsupported by your browser. Please enter a city manually."
    );
  }
}

async function fetchWeatherByCoordinates(lat, lon) {
  const units = unitToggle.value;
  myLoadingMessage.style.display = "block";
  myWeatherWidget.style.display = "none";

  try {
    const currentWeatherData = await fetchWeatherData(
      `${MY_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${MY_API_KEY}`
    );
    const forecastWeatherData = await fetchWeatherData(
      `${MY_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${MY_API_KEY}`
    );

    cityInput.value = currentWeatherData.name;
    displayCurrentWeather(currentWeatherData);
    processForecastData(forecastWeatherData);
    displayForecastTable();
    createCharts();

    myLoadingMessage.style.display = "none";
    myWeatherWidget.style.display = "block";
  } catch (error) {
    console.error("Error fetching weather data:", error);
    alert("Error fetching weather data. Please try again.");
    myLoadingMessage.style.display = "none";
  }
}

// Filters
function filterRainyDays() {
  return myForecastData.filter((day) =>
    day.mainWeather.toLowerCase().includes("rain")
  );
}

function sortTemperatures(ascending = true) {
  return [...myForecastData].sort((a, b) =>
    ascending ? a.avgTemp - b.avgTemp : b.avgTemp - a.avgTemp
  );
}

function getHighestTemperatureDay() {
  return myForecastData.reduce(
    (max, day) => (day.avgTemp > max.avgTemp ? day : max),
    myForecastData[0]
  );
}

// Event listeners for filters
document.getElementById("filterRainyDays").addEventListener("click", () => {
  const rainyDays = filterRainyDays();
  updateForecastTable(rainyDays);
});

document.getElementById("sortTempAsc").addEventListener("click", () => {
  const sortedData = sortTemperatures(true);
  updateForecastTable(sortedData);
});

document.getElementById("sortTempDesc").addEventListener("click", () => {
  const sortedData = sortTemperatures(false);
  updateForecastTable(sortedData);
});

document.getElementById("highestTempDay").addEventListener("click", () => {
  const highestTempDay = getHighestTemperatureDay();
  updateForecastTable([highestTempDay]);
});

function updateForecastTable(data) {
  myForecastData = data;
  currentPage = 1;
  displayForecastTable();
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  getUserLocation();
});
