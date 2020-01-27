import express from "express";

export function wrapAsync(fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) {
    return async function(_req: express.Request, _res: express.Response, _next: express.NextFunction) {
        try {
            await fn(_req, _res, _next);
        } catch (err) {
            _next(err);
        }
    }
}
