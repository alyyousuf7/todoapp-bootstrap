import express from "express";
import { Boom } from "@hapi/boom";
import { ValidationError } from "@hapi/joi";

import config from "../config";

export default function ErrorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    const joiErr = err as ValidationError;
    if (joiErr.isJoi) {
        res.status(400).send({ message: joiErr.details[0].message });
        return next();
    }

    const boomErr = err as Boom;
    if (boomErr.isBoom) {
        res.status(boomErr.output.statusCode).send({ message: boomErr.message });
        return next();
    }

    switch (err.name) {
    default:
        req.log.error(err, 'Something not handled well');
        res.status(500).send({
            message: err.message,
            stack: config.env === 'development' ? err.stack : undefined
        });
        return next();
    }
}
