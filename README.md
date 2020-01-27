# TodoApp
A simple app to maintain group of todo list.

Made a simple REST API server as a sample project with the following technologies:

- TypeScript (NodeJS v12)
- ExpressJS
- TypeORM
- Swagger
- Postgres
- Docker

# Setup

## Docker
- Clone the repository
- Run `docker-compose up`

## Without Docker
- Clone the repository
- Run `yarn install`
- Run `yarn typeorm migration:run`*
- Run `yarn watch`*

\* You need to set environment variables to provide configuration for database connection. Please see `src/config.ts` for environment variable names.

---

After the server is setup, you will be provided with an API Key on the terminal.

The API will be useable from the documentation available at http://localhost:3000/docs.
