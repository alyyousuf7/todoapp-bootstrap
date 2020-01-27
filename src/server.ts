import "reflect-metadata";

import { createConnection } from "typeorm";
import express from "express";
import bodyParser from "body-parser";
import bunyanMiddleware from "express-bunyan-logger";
import helmet from "helmet";
import fg from "fast-glob";

import config from "./config";
import logger from "./utils/logger";
import ErrorHandler from "./middlewares/errorHandler";
import { getAllUsers } from "./services/users";

start();

async function start() {
    await createConnection();

    const app = express();

    // Register middlewares
    app.use(helmet({ hidePoweredBy: true }));
    app.use(bodyParser.json());
    app.use(bunyanMiddleware({
        logger,
        parseUA: false,
        excludes: ['response-hrtime', 'req-headers', 'res-headers'],
        format: ':incoming :method :url :status-code',
    }));
    
    // Register routes
    const routes = await fg('./routes/*.ts', { cwd: __dirname });
    for (const routePath of routes) {
        const { default: router } = await import(routePath);
        if (typeof(router) === 'function') app.use(router);
    }

    // Error handler must come last...
    app.use(ErrorHandler);

    // Kick it off!
    app.listen(config.server.port, async () => {
        logger.info({ port: config.server.port }, 'Hey! I\'m listening... API Documentation is available at /docs');

        if (config.env === 'development') {
            // Log some API Keys for demo purposes...
            const [users, total] = await getAllUsers(0, 3, ['username', 'apiKey']);
            if (total > 0) {
                logger.debug('These are some API Keys that you may use for this demo:', users);
            } else {
                logger.debug('Hey, I couldn\'t find any users in the database. You\'ll have to create some to test the API.');
            }
        }
    });
}
