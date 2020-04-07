const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const errors = require('../../data/errors');

class WalletApi extends BasicController {
    constructor({ connector }) {
        super({ connector });
    }

    async getBalance({ userId }) {
        return await this.callService('wallet', 'getBalance', { userId });
    }

    async waitForTrx(trxId, maxRetries = 5, retryNum = 0) {
        const params = { transactionId: trxId };

        try {
            return await this.callService('walletWriter', 'waitForTransaction', params);
        } catch (error) {
            const code = error.code;
            const isTimeOut = code === 408 || code === 'ECONNRESET' || code === 'ETIMEDOUT';

            if (isTimeOut && retryNum <= maxRetries) {
                return await this.waitForTrx(trxId, maxRetries, ++retryNum);
            }

            Logger.error(`Error calling walletWriter.waitForBlock`, error);

            error.prismError = true;

            throw error;
        }
    }
}

module.exports = WalletApi;
