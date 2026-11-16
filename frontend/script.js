
const API_BASE = "";

const connectionText = document.getElementById("connectionText");
const apiStatus = document.getElementById("apiStatus");
const sensorForm = document.getElementById("sensorForm");
const submitButton = document.getElementById("submitButton");
const resultBox = document.getElementById("resultBox");
const historyBody = document.getElementById("historyBody");

let history = [];
let temperatureChart = null;
let activityChart = null;


// 1. Initialize charts
function initializeCharts() {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded.");
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
                title: {
                    display: true,
                    text: "Reading number"
                }
            },
            y: {
                beginAtZero: false
            }
        }
    };

    const temperatureCanvas =
        document.getElementById("temperatureChart");

    const activityCanvas =
        document.getElementById("activityChart");

    if (temperatureCanvas) {
        temperatureChart = new Chart(temperatureCanvas, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Temperature",
                    data: [],
                    borderColor: "#176b4d",
                    backgroundColor: "rgba(23,107,77,0.12)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }

    if (activityCanvas) {
        activityChart = new Chart(activityCanvas, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Activity",
                    data: [],
                    borderColor: "#d69e36",
                    backgroundColor: "rgba(214,158,54,0.12)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }
}


// 2. Check backend connection
async function checkAPI() {
    try {
        const response = await fetch(`${API_BASE}/health`);

        if (!response.ok) {
            throw new Error("API health check failed");
        }

        const data = await response.json();

        apiStatus.textContent = "Online";
        connectionText.textContent =
            data.database === "connected"
                ? "API and database connected"
                : "API connected";

        document.querySelector(".status-dot")
            ?.classList.add("online");

    } catch (error) {
        apiStatus.textContent = "Offline";
        connectionText.textContent = "API unavailable";

        document.querySelector(".status-dot")
            ?.classList.remove("online");
    }
}


// 3. Display prediction result
function showResult(title, message, type = "") {
    resultBox.className = `result-box ${type}`;

    resultBox.querySelector(".result-icon").textContent =
        type === "alert" ? "!" : type === "error" ? "!" : "✓";

    resultBox.querySelector("strong").textContent = title;
    resultBox.querySelector("p").textContent = message;
}


// 4. Load saved records from SQLite through FastAPI
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/records?limit=100`);

        if (!response.ok) {
            throw new Error("Unable to retrieve saved records");
        }

        const data = await response.json();

        history = data.records || [];

        renderHistory();
        updateCharts();

        // Update dashboard metrics
        document.getElementById("historyCount").textContent =
            `${data.total} records`;

        const anomalyCount = history.filter(
            item => item.status === "anomaly_detected"
        ).length;

        document.getElementById("anomalyCount").textContent =
            anomalyCount;

        if (history.length > 0) {
            document.getElementById("lastTemp").textContent =
                `${history[0].temperature_c} °C`;

            document.getElementById("lastActivity").textContent =
                history[0].activity;
        }

    } catch (error) {
        console.error("History loading error:", error);
    }
}


// 5. Display database history in the table
function renderHistory() {
    historyBody.replaceChildren();

    if (history.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.className = "empty";
        cell.textContent = "No saved readings available.";

        row.appendChild(cell);
        historyBody.appendChild(row);
        return;
    }

    history.forEach(item => {
        const row = document.createElement("tr");

        const tempCell = document.createElement("td");
        tempCell.textContent = `${item.temperature_c} °C`;

        const activityCell = document.createElement("td");
        activityCell.textContent = item.activity;

        const resultCell = document.createElement("td");
        const badge = document.createElement("span");

        const isAnomaly = item.status === "anomaly_detected";

        badge.className =
            `badge ${isAnomaly ? "anomaly" : "normal"}`;

        badge.textContent = isAnomaly ? "Anomaly" : "Normal";

        resultCell.appendChild(badge);

        row.append(tempCell, activityCell, resultCell);
        historyBody.appendChild(row);
    });
}


// 6. Update charts from saved database records
function updateCharts() {
    const orderedHistory = [...history].reverse();

    // Display up to 20 most recent readings
    const chartHistory = orderedHistory.slice(-20);

    const labels = chartHistory.map((_, index) => index + 1);

    if (temperatureChart) {
        temperatureChart.data.labels = labels;

        temperatureChart.data.datasets[0].data =
            chartHistory.map(item => item.temperature_c);

        temperatureChart.update();
    }

    if (activityChart) {
        activityChart.data.labels = labels;

        activityChart.data.datasets[0].data =
            chartHistory.map(item => item.activity);

        activityChart.update();
    }
}


// 7. Submit new readings to the ML API
sensorForm.addEventListener("submit", async event => {
    event.preventDefault();

    const temperature = Number(
        document.getElementById("temperature").value
    );

    const activity = Number(
        document.getElementById("activity").value
    );

    if (!Number.isFinite(temperature) ||
        !Number.isFinite(activity)) {

        showResult(
            "Invalid input",
            "Please enter valid numerical readings.",
            "error"
        );
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
                cattle_id: "DEMO-001",
                temperature_c: temperature,
                activity: activity
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Prediction failed");
        }

        if (data.status === "anomaly_detected") {
            showResult(
                "Unusual readings detected",
                data.message,
                "alert"
            );
        } else {
            showResult(
                "No anomaly detected",
                data.message
            );
        }

        // Reload history directly from the database
        await loadHistory();

    } catch (error) {
        showResult(
            "Prediction failed",
            error.message,
            "error"
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Analyze Readings →";
    }
});


// 8. Start dashboard
initializeCharts();
checkAPI();
loadHistory();
