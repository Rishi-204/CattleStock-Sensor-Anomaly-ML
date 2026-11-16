# 🐄 CattleStock – Sensor Anomaly Detection Module

**AI-Driven Smart IoT Livestock Health Monitoring and Management System**

CattleStock is a smart livestock monitoring project designed to help identify unusual cattle health-related sensor patterns using IoT and Machine Learning.

This repository contains the independent Machine Learning and software module developed for CattleStock. It includes an Isolation Forest anomaly detection model, a FastAPI backend, a custom web dashboard, and SQLite database integration.

---

## 1. Project Overview

The objective of this module is to analyze cattle sensor readings and identify unusual patterns that may require further attention.

The current prototype uses two input parameters:

- **Temperature:** Cattle temperature reading in Celsius.
- **Activity:** Numerical activity or movement value.

The Machine Learning model analyzes these inputs and classifies them as either normal or anomalous.

The prediction results are returned through a REST API and displayed on the CattleStock web dashboard.

**Important:** The current prototype uses synthetic data for model development and testing. It is not a clinically validated disease prediction system.

---

## 2. Technologies Used

| Component | Technology |
|---|---|
| Programming Language | Python |
| Machine Learning | Scikit-learn |
| ML Algorithm | Isolation Forest |
| Data Processing | NumPy, Pandas |
| Backend | FastAPI |
| API Server | Uvicorn |
| Frontend | HTML, CSS, JavaScript |
| Charts | Chart.js |
| Database | SQLite |
| Database ORM | SQLAlchemy |
| Model Storage | Joblib |
| Development Environment | Visual Studio Code |
| Version Control | Git and GitHub |

---

## 3. Machine Learning Approach

### Algorithm: Isolation Forest

Isolation Forest is an unsupervised Machine Learning algorithm used for anomaly detection.

It identifies unusual data points by isolating observations through randomly generated decision trees.

In CattleStock, the algorithm is used to identify unusual combinations of cattle temperature and activity readings.

### Input Features

| Feature | Description |
|---|---|
| `temperature_c` | Temperature in Celsius |
| `activity` | Numerical activity value |

### Model Configuration

The current implementation uses:

- Algorithm: Isolation Forest
- Number of estimators: 100
- Contamination: Auto
- Random state: 42

### Prediction Output

| Model Output | Meaning |
|---|---|
| `1` | Normal reading |
| `-1` | Anomaly detected |

The application converts these predictions into readable dashboard statuses:

- `normal`
- `anomaly_detected`

### Training and Testing

The model is currently trained using synthetically generated sensor readings.

Artificial anomalies are injected into the test dataset to check whether the model can identify unusual patterns.

The current prototype achieved 82% accuracy on one synthetic test run. This is a software testing result, not evidence of real-world cattle health prediction accuracy.

---

## 4. System Architecture

The current software architecture follows this workflow:

```text
          Sensor Readings
                 |
                 v
          FastAPI Backend
                 |
                 v
       Isolation Forest Model
                 |
                 v
         Anomaly Prediction
                 |
                 v
          SQLite Database
                 |
                 v
          REST API Response
                 |
                 v
        CattleStock Dashboard
                 |
                 v
       Results and Alert History
```

The physical ESP32 and sensor integration is a planned next stage.

---

## 5. Project Folder Structure

```text
CattleStock-Sensor-Anomaly-ML/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── app.py
├── train_model.py
├── predict.py
├── database.py
│
├── cattlestock_anomaly_model.joblib
├── requirements.txt
├── .gitignore
├── README.md
│
└── cattlestock.db
```

**Note:** `cattlestock.db` is generated locally when the backend initializes. It is excluded from GitHub through `.gitignore`.

The trained model file is currently included in the repository so that teammates can run the prediction API without retraining it.

---

## 6. Installation and Setup

Follow these steps to run the project locally.

### Prerequisites

Install the following:

- Python 3.10 or later
- Git
- Visual Studio Code

### Step 1: Clone the repository

```bash
git clone https://github.com/Rishi-204/CattleStock-Sensor-Anomaly-ML.git
```

Move into the project directory:

```bash
cd CattleStock-Sensor-Anomaly-ML
```

### Step 2: Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If using Command Prompt:

```cmd
.venv\Scripts\activate.bat
```

### Step 3: Install dependencies

```bash
python -m pip install --upgrade pip
```

```bash
python -m pip install -r requirements.txt
```

### Step 4: Start the backend

```bash
python -m uvicorn app:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

### Step 5: Open the dashboard

Visit:

```text
http://127.0.0.1:8000/frontend/
```

### Step 6: Open API documentation

Visit:

```text
http://127.0.0.1:8000/docs
```

The Swagger interface allows developers to test the API endpoints directly.

---

## 7. API Endpoints

The FastAPI application currently provides the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/health` | Check backend and model status |
| POST | `/predict` | Analyze sensor readings and save predictions |
| GET | `/records` | Retrieve previously saved sensor readings |

### Example Prediction Request

**POST `/predict`**

Request body:

```json
{
  "cattle_id": "CATTLE-001",
  "temperature_c": 38.5,
  "activity": 10.0
}
```

Example response:

```json
{
  "record_id": 1,
  "cattle_id": "CATTLE-001",
  "temperature_c": 38.5,
  "activity": 10.0,
  "status": "normal",
  "message": "No anomaly detected",
  "timestamp": "2026-11-16T10:30:00"
}
```

The prediction status depends on the trained model.

### Example History Request

**GET `/records`**

```text
http://127.0.0.1:8000/records?limit=100
```

This endpoint retrieves saved sensor readings and their prediction results from SQLite.

---

## 8. Database Structure

The application uses SQLite with SQLAlchemy.

The current database table is:

### Table: `sensor_records`

| Column | Data Type | Description |
|---|---|---|
| id | Integer | Primary key |
| cattle_id | String | Cattle identification |
| temperature_c | Float | Temperature reading |
| activity | Float | Activity reading |
| status | String | Prediction result |
| message | String | Prediction explanation |
| timestamp | DateTime | Record creation time |

Each successful prediction request is saved automatically.

The current default cattle ID is `DEMO-001` if the caller does not supply one.

---

## 9. Frontend Features

The custom dashboard is developed using HTML, CSS, and JavaScript.

Current features include:

- Dashboard overview.
- Backend connection indicator.
- Temperature and activity input fields.
- ML prediction integration.
- Normal and anomaly status display.
- Anomaly count.
- Analysis history retrieved from the backend.
- Temperature and activity trend chart components.

The dashboard is served directly through FastAPI.

The charts and persistent history should be verified locally after cloning the latest development branch.

---

## 10. Future Development Roadmap

The following features are planned for subsequent development:

1. **ESP32 Integration:** Connect the ESP32 controller with the backend to transmit real sensor readings.

2. **Sensor Integration:** Integrate temperature, MEMS IMU movement, rumination, and other available sensors.

3. **Real Dataset Collection:** Collect actual sensor readings and establish meaningful activity measurements.

4. **ML Model Improvement:** Evaluate and improve the anomaly detection model using real sensor data.

5. **Cattle Management:** Introduce individual cattle profiles and RFID-based identification.

6. **Alert Management:** Store and display anomaly alerts with timestamps and cattle identification.

7. **Dashboard Enhancement:** Add historical charts, cattle-wise monitoring, and improved analytics.

8. **End-to-End Testing:** Test the complete workflow from physical sensors to the dashboard.

Disease-specific prediction may be explored separately when suitable labelled data and validation are available.

---

## 11. Important Limitations

- The current model uses synthetic training data.
- The activity feature is currently a simulated numerical value, not yet a calibrated physical movement measurement.
- The model detects unusual sensor patterns; it does not diagnose diseases.
- Real-world performance has not yet been established.
- Physical sensor communication and complete IoT integration are still under development.

---

## 12. Project Information

**Project Name:** CattleStock

**Project Title:** AI-Driven Smart IoT Livestock Health Monitoring and Management System

**Module:** Sensor Anomaly Detection and Software Backend

**Repository:** [CattleStock-Sensor-Anomaly-ML](https://github.com/Rishi-204/CattleStock-Sensor-Anomaly-ML)

**Development Focus:** Machine Learning, IoT integration, Backend Development, and Web Dashboard.

---

*Developed as part of the CattleStock PBL project.*