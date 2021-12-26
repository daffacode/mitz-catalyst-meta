"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureJWTMiddlewares = exports.missingJWTInRequest = exports.isJWTCookieRemoved = exports.obtainJWT = void 0;
const cookie_1 = __importDefault(require("cookie"));
const log4js_1 = __importDefault(require("log4js"));
const ms_1 = __importDefault(require("ms"));
const ProofOfWork_1 = require("../utils/ProofOfWork");
const LOGGER = log4js_1.default.getLogger('JWTPort');
async function obtainJWT(fetcher, catalystUrl) {
    try {
        const response = (await fetcher.fetchJson(catalystUrl + '/pow-auth/challenge'));
        const challenge = response.challenge;
        const complexity = response.complexity;
        const nonce = await (0, ProofOfWork_1.generateNonceForChallenge)(challenge, complexity);
        const powAuthUrl = new URL('/pow-auth/challenge', catalystUrl).href;
        const challengeBody = JSON.stringify({ challenge: challenge, complexity: complexity, nonce: nonce });
        const jwtResponse = (await fetcher.postForm(powAuthUrl, { body: challengeBody }));
        if (!jwtResponse.jwt) {
            LOGGER.warn('[POW] Could not get a JWT from Pow Auth Server.');
        }
        return jwtResponse.jwt;
    }
    catch (error) {
        LOGGER.warn(`[POW] Could not get a JWT from Pow Auth Server, due to: ${error}`);
        return '';
    }
}
exports.obtainJWT = obtainJWT;
function isJWTCookieRemoved(response) {
    try {
        const headers = response.headers;
        if (headers) {
            const setCookie = headers.get('Set-Cookie');
            if (setCookie && setCookie.includes('JWT=')) {
                const cookies = cookie_1.default.parse(setCookie);
                return cookies.JWT === '';
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
exports.isJWTCookieRemoved = isJWTCookieRemoved;
function missingJWTInRequest(request) {
    const headers = request.requestInit?.headers;
    if (!!headers) {
        if (headers instanceof Headers) {
            return !hasJWTCookie(headers.get('Cookie') ?? '');
        }
        else if (Array.isArray(headers)) {
            return !headers.find((a) => {
                a[0] == 'Cookie' && hasJWTCookie(a[1]);
            });
        }
        else {
            return !hasJWTCookie(headers.Cookie ?? '');
        }
    }
    else {
        return true;
    }
}
exports.missingJWTInRequest = missingJWTInRequest;
function hasJWTCookie(cookieValue) {
    const cookies = cookie_1.default.parse(cookieValue);
    return cookies.JWT ?? '' !== '';
}
function configureJWTMiddlewares(fetcher, baseUrl) {
    let lastFailedPowEndpointTimestamp = 0;
    let minutesToAdd = (0, ms_1.default)('5m');
    let isRequestingJWT = false;
    fetcher.overrideDefaults({
        requestMiddleware: async (request) => {
            if (missingJWTInRequest(request) && !isRequestingJWT) {
                if (lastFailedPowEndpointTimestamp + minutesToAdd < Date.now()) {
                    isRequestingJWT = true;
                    try {
                        const jwt = await obtainJWT(fetcher, baseUrl);
                        if (!!jwt) {
                            fetcher.overrideDefaults({ cookies: { JWT: jwt } });
                            lastFailedPowEndpointTimestamp = 0;
                            minutesToAdd = (0, ms_1.default)('5m');
                        }
                        else {
                            lastFailedPowEndpointTimestamp = Date.now();
                            minutesToAdd = 2 * minutesToAdd;
                        }
                    }
                    catch {
                        LOGGER.warn('[POW] Could not configure Middleware to set JWT.');
                    }
                    finally {
                        isRequestingJWT = false;
                    }
                }
            }
            return request;
        },
        responseMiddleware: async (response) => {
            if (isJWTCookieRemoved(response)) {
                // When executing the requestMiddleware it will get the new JWT
                fetcher.overrideDefaults({ cookies: { JWT: '' } });
            }
            return response;
        }
    });
}
exports.configureJWTMiddlewares = configureJWTMiddlewares;
//# sourceMappingURL=Jwt.js.map