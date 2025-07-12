# X-Ray Diagnosis System - Frontend

This is the React + TypeScript frontend for the AI-Powered X-ray Diagnosis System.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router v6
- Axios
- react-hook-form + zod
- Jest + React Testing Library

## Running the Application

### Standalone (Development)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** by copying the example:
    ```bash
    cp .env.example .env
    ```
    Update `VITE_API_URL` in `.env` to point to your backend API (e.g., `http://localhost:8000`).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### With Docker Compose

The easiest way to run the entire system (frontend and backend) is with Docker Compose.

1.  **From the project root directory**, simply run:
    ```bash
    docker-compose up --build
    ```

2.  The frontend will be available at `http://localhost:3000`, and it will automatically connect to the backend API service.

## Testing

To run the component tests, use the following command in the `frontend` directory:
```bash
npm test
```
