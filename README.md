📍 DIGIPIN: Federated Digital Addressing Platform (DHRUVA)

A Privacy-Preserving Digital Public Infrastructure (DPI) for India's National Addressing Grid.

📖 Overview

DIGIPIN is a revolutionary addressing system designed to replace unstructured legacy addresses with a precise, geo-coded, and interoperable framework.

Based on the DHRUVA Architecture, this platform divides India into 4m x 4m grid units, assigning a unique 10-character alphanumeric code to every location. It empowers citizens to create user-friendly "Digital Addresses" (e.g., alice@home) and share them securely with service providers (Logistics, Emergency, etc.) using a granular consent-based architecture.

🚀 Key Problem Solved

Precision: Solves last-mile delivery failures caused by vague addresses.

Privacy: Users share their location only when they want, with whom they want, for a specific duration.

Interoperability: A standardized format for public and private sectors.

✨ Key Features

1. 🆔 Federated Identity Registry

Mint Digital Identities: Users can create easy-to-remember handles (e.g., username@work, username@gym).

Custom Suffixes: Support for custom handle naming.

Smart Geocoding: Automatically converts physical addresses into 10-digit DIGIPIN codes.

2. 🔐 Consent & Privacy Manager

Granular Access Control: Grant view access to specific partners (e.g., Amazon, Zomato) for a fixed duration (e.g., 60 mins).

Lock/Unlock Identities: Instantly lock an identity to block all future access.

Drag-and-Drop Dashboard: Easily manage and reorder your digital identities.

3. 🚚 Partner Portal (Logistics View)

Live Access List: Partners see a real-time list of addresses shared with them.

Consent Timers: Live countdown timers showing when access expires.

Interactive Maps: Full-screen Leaflet maps to visualize the exact location.

4. 🤖 AI Intelligence (Powered by Gemini)

Address Cleanup: "AI Enhance" button fixes typos and standardizes address text.

Logistics Context: "Analyze Location" feature tells partners if a location is Residential or Commercial and suggests optimal delivery windows.

🛠️ Tech Stack

Component

Technology

Description

Frontend

React (Vite)

Progressive Web App (PWA), Tailwind CSS, Lucide Icons.

Backend

Python FastAPI

High-performance API, Async support.

Database

SQLite / SQLAlchemy

Relational data storage for Users, Addresses, and Consents.

Maps

Leaflet / OpenStreetMap

Interactive rendering of the DIGIPIN grid.

AI

Google Gemini API

LLM integration for address intelligence.

Auth

JWT / Bcrypt

Secure authentication and password hashing.

⚙️ Installation & Setup

Follow these steps to run the prototype locally.

Prerequisites

Node.js (v16+)

Python (v3.9+)

1. Backend Setup

Navigate to the backend folder.

cd backend

# Create virtual environment (Optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic passlib bcrypt python-multipart python-jose httpx

# Run the server
python main.py


The server will start at http://localhost:8000.

2. Frontend Setup

Open a new terminal and navigate to the frontend folder.

cd digipin-app

# Install dependencies
npm install

# Setup Environment Variables
# Create a file named .env in the root and add your Gemini API Key:
echo "VITE_GEMINI_API_KEY=Your_Google_Gemini_Key_Here" > .env

# Run the app
npm run dev


The app will open at http://localhost:5173.

📖 Usage Guide

Role: Resident (User)

Register: Create an account with role Resident.

Create Identity: Go to "Registry", enter your address, and click "Mint Identity".

Grant Consent: Go to "Consent", select a partner (e.g., Amazon), and grant access for 60 minutes.

Role: Partner (Service Provider)

Register: Create an account with role Partner (Name must match the one used in Resident consent, e.g., "Amazon Logistics").

View Data: Go to the dashboard to see a list of active consents.

Analyze: Click an address to view the map and use the AI Context button to get delivery insights.

🗺️ Roadmap (Future Enhancements)

[ ] Offline Mode: Port DIGIPIN algorithm to pure JavaScript for offline generation.

[ ] Verification Layer (AAVA): Add workflows for physical verification agencies to boost confidence scores.

[ ] Audit Ledger: Implement immutable logs for every data access event.

[ ] Blockchain: Move the consent ledger to a blockchain for tamper-proof security.

📜 License

This project is open-source and available under the MIT License.

🌟 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
