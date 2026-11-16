
const API_BASE = "";

const connectionText = document.getElementById("connectionText");
const apiStatus = document.getElementById("apiStatus");
const sensorForm = document.getElementById("sensorForm");
const submitButton = document.getElementById("submitButton");
const resultBox = document.getElementById("resultBox");
const historyBody = document.getElementById("historyBody");

let anomalyCount = 0;
let history = [];


let temperatureChart = null;
let activityChart = null;

function initializeCharts() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load.");
        return;
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                title: { display: true, text: "Reading number" }
            },
            y: {
                beginAtZero: false
            }
        }
    };

    temperatureChart = new Chart(
        document.getElementById("temperatureChart"),
        {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Temperature (°C)",
                    data: [],
                    borderColor: "#176b4d",
                    backgroundColor: "rgba(23, 107, 77, 0.12)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        }
    );

    activityChart = new Chart(
        document.getElementById("activityChart"),
        {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Activity",
                    data: [],
                    borderColor: "#d69e36",
                    backgroundColor: "rgba(214, 158, 54, 0.12)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        }
    );
}

function updateCharts() {
    if (!temperatureChart || !activityChart) return;

    const orderedHistory = [...history].reverse();
    const labels = orderedHistory.map((_, index) => index + 1);

    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data =
        orderedHistory.map(item => item.temperature);
    temperatureChart.update();

    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data =
        orderedHistory.map(item => item.activity);
    activityChart.update();
}


async function checkAPI() {
    try {
        const response = await fetch(`${API_BASE}/health`);

        if (!response.ok) {
            throw new Error("Health check failed");
        }

        const data = await response.json();

        if (!data.model_loaded) {
            throw new Error("Model is not loaded");
        }

        apiStatus.textContent = "Online";
        connectionText.textContent = "API connected";
        document.querySelector(".status-dot").classList.add("online");
    } catch (error) {
        apiStatus.textContent = "Offline";
        connectionText.textContent = "API unavailable";
        document.querySelector(".status-dot").classList.remove("online");
    }
}

function showResult(title, message, type = "") {
    resultBox.className = `result-box ${type}`;

    const icon = resultBox.querySelector(".result-icon");
    const strong = resultBox.querySelector("strong");
    const paragraph = resultBox.querySelector("p");

    icon.textContent = type === "alert" ? "!" : type === "error" ? "!" : "✓";
    strong.textContent = title;
    paragraph.textContent = message;
}

function renderHistory() {
    document.getElementById("historyCount").textContent =
        `${history.length} record${history.length === 1 ? "" : "s"}`;

    if (history.length === 0) {
        historyBody.innerHTML = `
            <tr><td colspan="3" class="empty">
                No readings analyzed yet.
            </td></tr>`;
        return;
    }

    // Create cells with textContent rather than inserting user input as HTML.
    historyBody.replaceChildren();

    history.forEach((item) => {
        const row = document.createElement("tr");
        const temperatureCell = document.createElement("td");
        const activityCell = document.createElement("td");
        const resultCell = document.createElement("td");
        const badge = document.createElement("span");

        temperatureCell.textContent = `${item.temperature} °C`;
        activityCell.textContent = item.activity;
        badge.className = `badge ${item.isAnomaly ? "anomaly" : "normal"}`;
        badge.textContent = item.isAnomaly ? "Anomaly" : "Normal";
        resultCell.appendChild(badge);

        row.append(temperatureCell, activityCell, resultCell);
        historyBody.appendChild(row);
    });

    updateCharts();
}

sensorForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const temperature = Number(document.getElementById("temperature").value);
    const activity = Number(document.getElementById("activity").value);

    if (!Number.isFinite(temperature) || !Number.isFinite(activity)) {
        showResult("Invalid input", "Enter valid numerical readings.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Analyzing...";

    try {
        const response = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                temperature_c: temperature,
                activity: activity
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Prediction request failed");
        }

        const isAnomaly = data.status === "anomaly_detected";

        document.getElementById("lastTemp").textContent =
            `${data.temperature_c} °C`;
        document.getElementById("lastActivity").textContent =
            data.activity;

        if (isAnomaly) {
            anomalyCount += 1;
            document.getElementById("anomalyCount").textContent = anomalyCount;
            showResult("Unusual readings detected", data.message, "alert");
        } else {
            showResult("No anomaly detected", data.message);
        }

        history.unshift({
            temperature: data.temperature_c,
            activity: data.activity,
            isAnomaly
        });

        history = history.slice(0, 8);
        renderHistory();
    } catch (error) {
        showResult(
            "Could not analyze readings",
            `${error.message}. Check that the API server is running.`,
            "error"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Analyze Readings →";
    }
});

initializeCharts();
checkAPI();
