import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
    status?: number;
    statusCode?: number;
}

function errorHandler (
    err: CustomError, 
    req: Request,
    res: Response,
    next: NextFunction
) : void {
    const status = err.status || err.statusCode || 500;
    const message = status >= 500 ? "Internal Server Error" : err.message;
    res.status(status).json({ err: message });
}

module.exports = errorHandler;