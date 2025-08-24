# Local Development Setup

This directory contains the Docker Compose configuration for running Satori locally without Traefik or production dependencies.

## Quick Start

1. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Update email configuration (optional):**
   Edit `.env` and choose your email provider. You have two options:

   **Option A: Gmail (for local testing)**
   ```env
   EMAIL_SERVICE_PROVIDER=gmail
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_PASS=your-gmail-app-password
   ```

   **Option B: Azure Communication Services**
   ```env
   EMAIL_SERVICE_PROVIDER=azure
   AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://your-service.communication.azure.com/;accesskey=your-key"
   AZURE_COMMUNICATION_FROM_EMAIL="noreply@yourdomain.com"
   ```

3. **Start the backend services:**
   ```bash
   docker-compose up -d
   ```

4. **Start the frontend application:**
   ```bash
   # Navigate to the project root
   cd ../../
   
   # Install dependencies (if not already done)
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

## Services

Once running, the following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React/Vite development server |
| Backend API | http://localhost:3000 | Node.js API server |
| pgAdmin | http://localhost:8080 | Database administration interface |
| PostgreSQL | localhost:5432 | Database (direct connection) |

## Database Access

### pgAdmin Web Interface
- URL: http://localhost:8080
- Email: `admin@admin.com`
- Password: `admin`

### Direct Database Connection
- Host: `localhost`
- Port: `5432`
- Database: `satori`
- Username: `postgres`
- Password: `postgres`

### Connecting to Database from pgAdmin
When adding a server in pgAdmin, use these connection details:
- Host: `db` (Docker container name)
- Port: `5432`
- Database: `satori`
- Username: `postgres`
- Password: `postgres`

## Development Workflow

1. **Backend changes:** Rebuild the Docker image when you make changes to the server code:
   ```bash
   docker-compose up --build
   ```

2. **Database migrations:** The migrate service runs automatically, but you can run migrations manually:
   ```bash
   docker-compose run --rm migrate
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f app
   docker-compose logs -f db
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **Clean up (remove volumes):**
   ```bash
   docker-compose down -v
   ```

## Troubleshooting

### Port Conflicts
If you get port conflicts, update these ports in your `.env` file:
- `APP_CONTAINER_PORT` - Backend API port (default: 3000)
- `DB_PORT` - PostgreSQL port (default: 5432)

### Email Testing
For email functionality, you have several options:

1. **Gmail (easiest for local testing):**
   - Set `EMAIL_SERVICE_PROVIDER=gmail`
   - Use your Gmail address and an app password
   - [Generate Gmail App Password](https://support.google.com/accounts/answer/185833)

2. **Azure Communication Services (production-ready):**
   - Set `EMAIL_SERVICE_PROVIDER=azure`
   - Configure Azure Communication Services connection string
   - Set up a verified sender domain in Azure

3. **Disable email features:**
   - Leave email credentials empty
   - Email functionality will be disabled but app will still work

### Database Issues
If you encounter database connection issues:
1. Ensure the database container is healthy: `docker-compose ps`
2. Check logs: `docker-compose logs db`
3. Reset database: `docker-compose down -v && docker-compose up -d`

## Environment Variables

Key variables you might want to customize in your `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_SERVICE_PROVIDER` | `gmail` | Email provider (`gmail` or `azure`) |
| `DB_PASS` | `postgres` | Database password |
| `BETTER_AUTH_SECRET` | `local-dev-secret-change-in-production` | Auth secret |
| `GMAIL_USER` | - | Gmail address (if using Gmail) |
| `GMAIL_PASS` | - | Gmail app password (if using Gmail) |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | - | Azure Communication Services connection string |
| `AZURE_COMMUNICATION_FROM_EMAIL` | - | Verified sender email in Azure |
| `TEST_USERS` | `test1@example.com,...` | Test user accounts |