# 📍 DIGIPIN — Federated Digital Addressing Platform (DHRUVA)

A **Privacy-Preserving Digital Public Infrastructure (DPI)** for India’s next-generation national addressing grid.

DIGIPIN replaces unstructured legacy addresses with a **precise, geo-coded, interoperable**, and **consent-based** digital addressing layer. Inspired by the DHRUVA architecture, it divides India into **4m x 4m grids**, assigning each a **unique 10-character alphanumeric code**.

Citizens create user-friendly **Digital Address Handles** (e.g., `alice@home`) and share them securely with service providers using granular consent.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Problems Solved](#-key-problems-solved)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

DIGIPIN is designed to:

✔ Fix last-mile delivery failures  
✔ Protect user privacy  
✔ Provide a universal addressing format for both public and private sectors  

Every location receives a **10-character DIGIPIN**, and users can generate **human-readable handles** mapped to them.

---

## 🚀 Key Problems Solved

### 🎯 Precision
Converts ambiguous addresses into exact 4m x 4m grid points.

### 🔐 Privacy
Users choose **who** can view their address and **for how long**.

### 🔄 Interoperability
A shared addressing layer usable across e-commerce, logistics, government services, and emergency systems.

---

## ✨ Key Features

### 1️⃣ Federated Identity Registry
- Mint easy-to-remember digital address handles (`username@home`, `username@work`)
- Support for custom suffixes
- Automatically converts physical addresses into DIGIPIN codes
- Offline-ready design (future release)

---

### 2️⃣ Consent & Privacy Manager
- Fine-grained control over what partners can access
- Set consent duration (e.g., 60 minutes)
- Lock/unlock digital identities instantly
- Drag-and-drop dashboard for identity management

---

### 3️⃣ Partner Portal (Logistics Dashboard)
- Live view of addresses shared by residents
- Consent timers with automatic expiring
- Full-screen interactive Leaflet map
- Visualize exact DIGIPIN grid cell
- AI-powered contextual delivery insights

---

### 4️⃣ AI Intelligence (Gemini)
- **Address Cleanup** — automatically corrects typos and standardizes text  
- **Location Analysis** — determines residential/commercial nature, accessibility, and optimal delivery windows  

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|----------|------------|-------------|
| **Frontend** | React (Vite), Tailwind, PWAs, Lucide Icons | Modern UI with fast load times |
| **Backend** | FastAPI (Python) | Async, high-performance API |
| **Database** | SQLite + SQLAlchemy | Stores users, identities, and consents |
| **Maps** | Leaflet + OpenStreetMap | DIGIPIN grid visualization |
| **AI** | Google Gemini API | Address intelligence and classification |
| **Auth** | JWT + Bcrypt | Secure login and hashing |

---

## ⚙️ Installation

### Prerequisites
- Node.js `16+`
- Python `3.9+`

---

### 🖥️ 1. Backend Setup

```sh
cd backend

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install fastapi uvicorn sqlalchemy pydantic passlib bcrypt python-multipart python-jose httpx

python main.py
