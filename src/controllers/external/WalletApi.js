const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const { Logger } = core.utils;
const errors = require('../../data/errors');

class WalletApi extends BasicController {
    constructor({ connector }) {
        super({ connector });
    }

    async getTransfer({ trxId }) {
        return await this.callService('facade', 'wallet.getTransfer', { trxId });
    }

    async getBalance({ userId }) {
        return await this.callService('facade', 'wallet.getBalance', { userId });
    }

    async waitForTrx(trxId, maxRetries = 3, retryNum = 0) {
        const params = { transactionId: trxId };

        try {
            return await this.callService('facade', 'wallet.waitForTransaction', params);
        } catch (error) {
            const code = error.code;
            const isTimeOut = code === 408 || code === 'ECONNRESET' || code === 'ETIMEDOUT';

            if (isTimeOut && retryNum <= maxRetries) {
                return await this.waitForTrx(trxId, maxRetries, ++retryNum);
            }

            Logger.error(`Error calling wallet.waitForTransaction`, error);

            error.isTimeOut = true;

            throw error;
        }
    }
}

module.exports = WalletApi;
