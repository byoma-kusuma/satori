# Local Environment Setup

If you haven't set up Bun, Node, or pnpm yet, you can use [Mise](https://mise.jdx.dev/getting-started.html) for convenience.

### Quick References:
- [Install Mise](https://mise.jdx.dev/getting-started.html)
- [Install Bun](https://mise.jdx.dev/lang/bun.html)
- [Set up Node](https://mise.jdx.dev/lang/node.html)

### Install Dependencies
Run the following command to install the required dependencies:
```sh
bun install
```

## Database Setup

### 1. Configure Your Database
If you already have a PostgreSQL database, update the `DATABASE_URL` in the `.env` file with your database URL.

For reference, you can use the provided `env.example` file:
```sh
cp env.example .env
```
Modify it as needed.

### 2. Set Up a Local Database with Docker
If you don’t have a database, you can set up one locally using Docker:
```sh
# For Development (with hot reload and pgAdmin):
docker-compose -f docker-compose.dev.yml up -d

# For Production (optimized for deployment):
docker-compose -f docker-compose.prod.yml up -d
```
This will use the `.env` file variables to set up a PostgreSQL database along with a pgAdmin instance.
Make sure to run this from the server folder which has docker compose files.

> 📚 **For detailed Docker Compose documentation**, see [docs/DOCKER_COMPOSE_GUIDE.md](./docs/DOCKER_COMPOSE_GUIDE.md)

### 3. Connect to Your Database with pgAdmin
Use the following credentials to connect to the database via pgAdmin:
```sh
DB_USER=postgres      
DB_PASS=password      
DB_HOST=localhost
DB_PORT=5432        
DB_NAME=satori
```
Ensure these values match the ones in your `.env` file.

## Set Up Database Tables

Run the following commands to configure the database:

### Apply Better Auth Migrations
```sh
npx @better-auth/cli migrate
```

### Generate Types from the Database
```sh
npx @better-auth/cli generate
```
[Better Auth Cli Doc](https://www.better-auth.com/docs/concepts/database#cli)

### Apply Existing Migrations
```sh
npx dbmate up
```

### Create a New Migration (if needed)
```sh
npx dbmate new <migration-name>
```
[Dbmate Doc](https://github.com/turnitin/dbmate/blob/master/README.md#commands)

### Generate Types for Kysely
```sh
npx kysely-codegen --out-file ./src/types.ts
```
[Kysely Type Generation Doc](https://kysely.dev/docs/generating-types)

## Start the Application
Run the app with:
```sh
bun run dev
```
## Local Development Email Sending setup
Replace the 
`GMAIL_USER` and `GMAIL_PASS` with your email and password in the `.env` file. Please go through the following links to understand how to use nodemailer with gmail.
 - https://stackoverflow.com/questions/19877246/nodemailer-with-gmail-and-nodejs
 - https://www.nodemailer.com/usage/using-gmail/
 - https://medium.com/@y.mehnati_49486/how-to-send-an-email-from-your-gmail-account-with-nodemailer-837bf09a7628
 
> [!WARNING] Do not commit your email and password to the repository. This is a temporary setup while we work to implement a more secure way to send emails.


## Delete database and start from scratch
```sh
docker-compose -f docker-compose.dev.yml down -v
```
Then start from the database parts again.

## Person Type Migration

A new migration has been added to add a required `type` field to the person table. This field is of type `enum` with possible values:
- `interested`
- `contact` 
- `sangha_member`

To apply this migration, run:

```bash
# Make sure you're in the server directory
cd apps/server

# Make sure the database container is running
docker-compose -f docker-compose.dev.yml up -d

# Apply the migration
npx dbmate up
```

All existing person records will have their type set to `interested` by default.

### API Changes

The Person API now supports:

1. Filtering persons by type:
   - `GET /api/person?type=interested`
   - `GET /api/person?type=contact`
   - `GET /api/person?type=sangha_member`

2. Creating persons with a specified type:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "address": "123 Main St",
     "type": "contact" 
   }
   ```

3. Updating a person's type:
   ```json
   {
     "type": "sangha_member"
   }
   ```

If not specified during creation, the default type is `interested`.

## 📚 Documentation

For more detailed documentation, check the [docs/](./docs/) folder:

- **[Docker Compose Guide](./docs/DOCKER_COMPOSE_GUIDE.md)** - Development vs Production environments
- **[SSL Mode Options](./docs/SSL_MODE_OPTIONS.md)** - Database security configuration  
- **[Script Cleanup](./docs/SCRIPT_CLEANUP.md)** - npm scripts organization

Or browse the [docs folder README](./docs/README.md) for a complete index.
