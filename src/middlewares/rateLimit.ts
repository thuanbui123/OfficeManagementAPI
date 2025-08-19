const rateLimit = require('express-rate-limit');
import { RateLimitRequestHandler } from "express-rate-limit";

function apiRateLimit() : RateLimitRequestHandler {
    return rateLimit({
        windowMs: 60_000, // 1 phút
        max: 100, // 100 req/phút/IP
        standardHeaders: true,
        legacyHeaders: false,
    });
}

module.exports = apiRateLimit;
