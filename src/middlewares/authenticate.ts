import express from "express";
import Boom from "@hapi/boom";

import { getUserByAPIKey } from "../services/users";

export async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    let apiKey: string | null = null;

    const authheader = (req.headers.authorization || '').split(' ');
    if (authheader.length > 0) {
        // Pick the last part. This will make 'Bearer' optional.
        apiKey = authheader[authheader.length - 1];
    } else {
        apiKey = req.body.apikey || req.query.apikey;
    }

    if (!apiKey) {
        return next(Boom.unauthorized('API Key is required'));
    }

    try {
        const user = await getUserByAPIKey(apiKey);
        req.user = user;

        return next();
    } catch (err) {
        return next(Boom.unauthorized('This API Key is unauthorized'));
    }
}
