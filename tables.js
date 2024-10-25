const MY_API_KEY = "f209948b9ca851c3f962d0374402455a";
const MY_BASE_URL = "https://api.openweathermap.org/data/2.5";

const cityInput = document.getElementById("cityInput");
const getWeatherBtn = document.getElementById("getWeatherBtn");
const unitToggle = document.getElementById("unitToggle");
const myLoadingMessage = document.getElementById("loading");
const myWeatherDataContainer = document.getElementById("weatherData");
const cityNameDisplay = document.getElementById("cityName");
const detailedWeatherTable = document.getElementById("detailedWeatherTable");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const currentPageSpan = document.getElementById("currentPage");

let currentPage = 1;
const itemsPerPage = 10;
let myForecastData = [];

getWeatherBtn.addEventListener("click", getWeather);
unitToggle.addEventListener("change", getWeather);
prevPageBtn.addEventListener("click", () => changePage(-1));
nextPageBtn.addEventListener("click", () => changePage(1));

document
  .getElementById("filterRainyDays")
  .addEventListener("click", () => filterDays("Rain"));
document
  .getElementById("filterSunnyDays")
  .addEventListener("click", () => filterDays("Clear"));
document
  .getElementById("filterAllDays")
  .addEventListener("click", () => filterDays("All"));

document
  .getElementById("sortTempAsc")
  .addEventListener("click", () => sortData("temp", true));
document
  .getElementById("sortTempDesc")
  .addEventListener("click", () => sortData("temp", false));
document
  .getElementById("sortDateAsc")
  .addEventListener("click", () => sortData("date", true));
document
  .getElementById("sortDateDesc")
  .addEventListener("click", () => sortData("date", false));

async function getWeather() {
  const city = cityInput.value;
  const units = unitToggle.value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  myLoadingMessage.style.display = "block";
  myWeatherDataContainer.style.display = "none";

  try {
    const forecastWeatherData = await fetchWeatherData(
      `${MY_BASE_URL}/forecast?q=${city}&units=${units}&appid=${MY_API_KEY}`
    );
    processForecastData(forecastWeatherData);
    displayWeatherTable();
    createCharts();

    myLoadingMessage.style.display = "none";
    myWeatherDataContainer.style.display = "block";
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

function processForecastData(data) {
  cityNameDisplay.textContent = `${data.city.name}, ${data.city.country}`;
  myForecastData = data.list.map((item) => ({
    date: new Date(item.dt * 1000).toLocaleDateString(),
    time: new Date(item.dt * 1000).toLocaleTimeString(),
    temp: item.main.temp,
    feelsLike: item.main.feels_like,
    humidity: item.main.humidity,
    weather: item.weather[0].main,
    windSpeed: item.wind.speed,
    pressure: item.main.pressure,
  }));
}

function displayWeatherTable() {
  const tbody = detailedWeatherTable.querySelector("tbody");
  tbody.innerHTML = "";
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = myForecastData.slice(startIndex, endIndex);

  pageData.forEach((item) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = item.date;
    row.insertCell(1).textContent = item.time;
    row.insertCell(2).textContent = `${item.temp.toFixed(1)}${
      unitToggle.value === "metric" ? "°C" : "°F"
    }`;
    row.insertCell(3).textContent = `${item.feelsLike.toFixed(1)}${
      unitToggle.value === "metric" ? "°C" : "°F"
    }`;
    row.insertCell(4).textContent = `${item.humidity}%`;
    row.insertCell(5).textContent = item.weather;
    row.insertCell(6).textContent = `${item.windSpeed} m/s`;
    row.insertCell(7).textContent = `${item.pressure} hPa`;
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
  displayWeatherTable();
}

function filterDays(condition) {
  if (condition === "All") {
    displayWeatherTable();
  } else {
    const filteredData = myForecastData.filter((item) =>
      item.weather.includes(condition)
    );
    updateTableData(filteredData);
  }
}

function sortData(key, ascending) {
  const sortedData = [...myForecastData].sort((a, b) => {
    if (key === "date") {
      return ascending
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else {
      return ascending ? a[key] - b[key] : b[key] - a[key];
    }
  });
  updateTableData(sortedData);
}

function updateTableData(data) {
  myForecastData = data;
  currentPage = 1;
  displayWeatherTable();
}

function createCharts() {
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get("city");
  if (city) {
    cityInput.value = city;
    getWeather();
  }
});
