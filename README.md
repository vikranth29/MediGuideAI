# MediGuide AI

MediGuide AI is a Flask-powered web application designed for intelligent medical guidance, symptom checking, and health recommendations.

## Tech Stack
- **Backend:** Python Flask, SQLite, Scikit-Learn, Google Gemini AI
- **Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Leaflet.js

## Project Structure
- `app.py` - Application entry point
- `routes/` - Route definitions & blueprints (e.g. `hospital_routes.py`)
- `services/` - Business logic, disease prediction, report analysis & hospital locator
- `models/` - Database schemas & data models (User, Prediction, etc.)
- `database/` - DB initialization & connection scripts
- `datasets/` - Symptom, description, and precaution datasets
- `utils/` - Helper functions & utility tools
- `templates/` - HTML Jinja2 templates
- `static/` - Static assets (CSS, JS, images)
- `tests/` - Automated unit and integration test suite

## Getting Started

Follow these steps to set up and run MediGuide AI locally:

### 1. Clone & Navigate to Repository
```bash
git clone https://github.com/your-username/MediGuideAI.git
cd MediGuideAI
```

### 2. Create and Activate Virtual Environment
- **Windows (Command Prompt / PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the sample `.env.example` file to create your `.env` file:
- **Windows:**
  ```powershell
  copy .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```
Open `.env` in a text editor and add your Google Gemini API key:
```env
GEMINI_API_KEY=your-actual-gemini-api-key
```

### 5. Initialize the Database
Initialize the SQLite database schema and tables:
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database initialized successfully!')"
```
*(Note: Running `python app.py` will also automatically verify and create tables if they do not exist.)*

### 6. Run the Development Server
Start the Flask development server:
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### 7. Running Tests
Run the automated test suite with pytest:
```bash
pytest
```

---

## Running with Docker

A production-ready Docker setup is included. The app runs under **gunicorn** inside
a slim Python image. The SQLite database is stored in a **named volume** so data
persists across container restarts and image rebuilds.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Quick Start

**1. Ensure your `.env` file exists and contains valid values:**
```powershell
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```
Edit `.env` and set at minimum:
```env
SECRET_KEY=a-long-random-string-change-this
GEMINI_API_KEY=your-actual-gemini-api-key
```

**2. Build and start the container in the background:**
```bash
docker compose up -d --build
```

The app will be available at **http://localhost:5000**.

**3. Stream live logs:**
```bash
docker compose logs -f web
```

**4. Stop the container (database volume is preserved):**
```bash
docker compose down
```

**5. Stop and also delete the database volume** _(destructive – all data lost)_:
```bash
docker compose down -v
```

### Useful commands

| Task | Command |
|---|---|
| Rebuild after code changes | `docker compose up -d --build` |
| Open a shell inside the container | `docker compose exec web bash` |
| Run the test suite inside the container | `docker compose exec web python -m pytest tests/` |
| Check container health | `docker compose ps` |
| View resource usage | `docker stats mediguide_web` |

### How data persistence works

The `docker-compose.yml` declares a named volume `mediguide_db` mounted at
`/app/database` inside the container. Docker manages the volume's location on the
host; it survives `docker compose down` and is only removed with `docker compose down -v`.

The `.env` file is loaded at **runtime** via the `env_file` directive — it is never
copied into the image (`.dockerignore` excludes it), so secrets stay off image layers.
