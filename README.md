# Brick Breaker Deluxe: Arcade Simulation Engine

A high-performance, polished **Brick Breaker** arcade simulation engine built in standard **HTML5**, **CSS3**, and **ES6 JavaScript**.

This application operates **100% standalone** with zero third-party API dependencies or external keys required for client-side play.

---

## 📋 Table of Contents
- [Installation](#installation)
- [Build](#build)
- [Run](#run)
- [Dependencies](#dependencies)
- [Usage](#usage)
- [Testing](#testing)
- [License](#license)

---

## ⚙️ Installation

### Node.js Environment
To install the project dependencies and set up the local environment, run:

```bash
npm install
```

### Python Environment (Optional)
To configure the optional Python execution runner:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🛠️ Build

To execute the application build and asset verification process:

```bash
npm run build
```

Or using the standard Makefile:

```bash
make build
```

To build a containerized Docker image:

```bash
docker build -t brick-breaker-deluxe .
```

---

## 🚀 Run

To launch the local application server:

```bash
npm start
```

Or using Python:

```bash
python main.py
```

Or via Docker:

```bash
docker run -p 3000:3000 brick-breaker-deluxe
```

Alternatively, you can open [`index.html`](index.html) directly in any modern web browser without starting a server.

---

## 📦 Dependencies

The application utilizes clean, standard dependencies:
- **Express** (`^4.19.2`): Lightweight HTTP server for static hosting.
- **Jest** (`^29.7.0`): Unit testing framework with code coverage support.

---

## 🎮 Usage

1. Select your preferred **Simulation Mode**:
   - **[CAMPAIGN]**: 50 handcrafted progressive sectors with dynamic obstacle layouts.
   - **[ENDLESS]**: Continuous descending brick matrices. Maximize your score.
   - **[FRENZY]**: Increased capsule drops and high-velocity multi-ball arcade action.
2. Click **LAUNCH GAME**.
3. Use **Mouse**, **Touch**, or **Arrow Keys** to steer the paddle chassis.
4. Press **Spacebar** or **Click** to launch the ball and fire dual laser cannons.

---

## 🧪 Testing

To run the automated test suite with code coverage:

```bash
npm test
```

Or execute the engine test suite directly:

```bash
node tests/test_engine.js
```

---

## 🔒 License

Proprietary. All rights reserved. Copyright 2026.
This codebase is private property and may not be distributed under open-source licenses.
