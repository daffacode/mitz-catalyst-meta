"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonceForChallenge = void 0;
// Code copied from https://github.com/decentraland/pow-authorization-server
const crypto_1 = require("crypto");
async function generateNonceForChallenge(challenge, complexity) {
    while (true) {
        const nonce = (0, crypto_1.randomBytes)(256).toString('hex');
        const hash = await (0, crypto_1.createHash)('sha256')
            .update(challenge + nonce, 'utf8')
            .digest('hex');
        const isValid = hash.startsWith('0'.repeat(complexity));
        if (isValid) {
            return nonce;
        }
    }
}
exports.generateNonceForChallenge = generateNonceForChallenge;
//# sourceMappingURL=ProofOfWork.js.map