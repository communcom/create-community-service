const core = require('cyberway-core-service');
const BasicService = core.services.Basic;
const { Logger } = core.utils;
const Blockchain = require('../utils/Blockchain');
const { GLS_CLIENTS_KEY, GLS_LEADER_EMISSION_ITERATION_HRS } = require('../data/env');
const CommunityModel = require('../models/Community');

class Emit extends BasicService {
    constructor() {
        super();
        this.blockchainApi = new Blockchain();
        this.blockchainApi.addPrivateKeys(GLS_CLIENTS_KEY);
    }

    async start() {
        await super.start();
        this.startLoop(0, GLS_LEADER_EMISSION_ITERATION_HRS * 60 * 1000);
    }

    async iteration() {
        Logger.log('Emission iteration start');
        await this.emitLeadersRewards();
        Logger.log('Emission iteration stop');
    }

    async emitLeadersRewards() {
        let oneMoreRound = true;
        let offset = 0;
        const emissionTransactions = [];

        while (oneMoreRound) {
            const { hasMore, communities } = await this.getCommunitiesForEmission({
                limit: 1,
                offset,
            });
            oneMoreRound = hasMore;
            offset++;

            for (const { communityId: communCode } of communities) {
                const trx = this.blockchainApi.generateEmitTransaction({ communCode });
                emissionTransactions.push(trx);
            }
        }

        const emissionTransactionPromises = [];
        for (const trx of emissionTransactions) {
            emissionTransactionPromises.push(
                this.blockchainApi.executeTrx(trx).catch((err) => {
                    // todo: catch "its not time for rewards"
                    Logger.error(err);
                })
            );
        }
        await Promise.all(emissionTransactionPromises);
    }

    async getCommunitiesForEmission({ limit = 1000, offset = 0 }) {
        const communities = await CommunityModel.find(
            { isDone: true },
            { communityId: true, _id: false },
            { lean: true }
        )
            .limit(limit)
            .skip(offset);
        let hasMore = true;
        if (communities.length < limit) {
            hasMore = false;
        }

        return { communities, hasMore };
    }
}

module.exports = Emit;
