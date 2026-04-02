# BookNow API - Modernized Backend

A professional, modular backend for the BookNow Smart Booking System.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- npm (distributed with Node.js)

### Installation
1. Navigate to the project directory:
   ```bash
   cd booknow-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. Create a `.env` file in the root directory (refer to `.env.example`).
2. Add your sensitive details:
   ```env
   PORT=3002
   DB_PATH=./database.sqlite
   ADMIN_PASSWORD=your_secure_password
   ```

### Running the App
- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

## 📂 Project Structure
- `src/models/`: Database schema and connection.
- `src/routes/`: API endpoint definitions.
- `public/`: Assets and frontend frontend.
- `server.js`: Application entry point.

## 📡 API Endpoints
- `GET /api/business`: Get studio profile.
- `GET /api/services`: List all services.
- `GET /api/bookings`: Manage reservations.
- `GET /api/gallery`: Studio media hub.

---
Powered by Antigravity AI
