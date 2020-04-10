const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const errors = require('../../data/errors');
const CommunityModel = require('../../models/Community');
const Flow = require('../Flow');
const generateIdFromName = require('../../utils/generateTicker');

class CommunityApi extends BasicController {
    async getCommunity({ communityId }, { userId: creator }) {
        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
        }
        const community = await CommunityModel.findOne(
            { communityId, creator },
            { _id: false, __v: false, createdAt: false, updatedAt: false },
            { lean: true }
        );

        return { community };
    }

    async createNewCommunity({ name }, { userId: creator }) {
        let communityId;
        try {
            communityId = await generateIdFromName(name);
        } catch (e) {
            throw errors.ERR_CANT_GENERATE_ID;
        }

        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
        }

        const existingCommunity = await CommunityModel.findOne({ name });
        if (existingCommunity) {
            throw errors.ERR_ALREADY_EXISTS;
        }

        await CommunityModel.create({ name, communityId, creator });
        const community = await CommunityModel.findOne(
            { communityId },
            { communityId: true, name: true, _id: false },
            { lean: true }
        );

        return { community };
    }

    async setSettings(
        { communityId, newCommunityId, name, description, language, rules, avatarUrl, coverUrl },
        { userId: creator }
    ) {
        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
        }

        const newSettings = {};

        if (newCommunityId) {
            const existedCommunityWithNewCommunityId = await CommunityModel.findOne(
                { communityId: newCommunityId },
                { _id: true },
                { lean: true }
            );
            if (existedCommunityWithNewCommunityId) {
                throw errors.ERR_ALREADY_EXISTS;
            }

            newSettings.communityId = newCommunityId;
        }

        if (name) {
            newSettings.name = name;
        }
        if (description) {
            newSettings.description = description;
        }
        if (language) {
            newSettings.language = language;
        }
        if (rules) {
            newSettings.rules = rules;
        }
        if (avatarUrl) {
            newSettings.avatarUrl = avatarUrl;
        }
        if (coverUrl) {
            newSettings.coverUrl = coverUrl;
        }

        const existedCommunity = await CommunityModel.findOne(
            { communityId, creator },
            { _id: false, canChangeSettings: true }
        );
        if (!existedCommunity) {
            throw errors.ERR_COMMUNITY_NOT_FOUND;
        }

        if (!existedCommunity.canChangeSettings) {
            throw errors.ERR_CANNOT_CHANGE_COMMUNITY_SETTINGS;
        }

        await CommunityModel.updateOne({ communityId, creator }, { $set: newSettings });
    }

    async startCommunityCreation({ communityId, transferTrxId }, { userId: creator }) {
        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
        }

        const existingCommunity = await CommunityModel.findOne(
            { communityId, creator },
            { _id: false },
            { lean: true }
        );

        if (!existingCommunity) {
            throw errors.ERR_COMMUNITY_NOT_FOUND;
        }

        if (existingCommunity.isDone) {
            throw errors.ERR_ALREADY_EXISTS;
        }

        if (!existingCommunity.isInProgress) {
            await CommunityModel.updateOne({ communityId }, { $set: { currentStep: 'ready' } });
        }

        if (!existingCommunity.transferTrxId) {
            if (!transferTrxId) {
                throw errors.ERR_NO_TRX_ID_PROVIDED;
            } else {
                await CommunityModel.updateOne(
                    { communityId },
                    {
                        $set: {
                            'stepsData.waitForUsersTransfer': { usersTransferTrxId: transferTrxId },
                        },
                    }
                );
            }
        }

        const flow = new Flow(existingCommunity, { connector: this.connector });

        return await flow.executeFlow();
    }

    async getUsersCommunities({}, { userId: creator }) {
        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
        }

        const communities = await CommunityModel.find(
            { creator },
            {
                communityId: true,
                name: true,
                avatarUrl: true,
                _id: false,
                isDone: true,
                currentStep: true,
            }
        );
        return { communities };
    }

    async isExists({ name, communityId }) {
        const query = {};

        if (communityId) {
            query.communityId = communityId;
        } else {
            query.name = name;
        }

        const community = await CommunityModel.findOne(query, { _id: 1 }, { lean: true });
        return !!community;
    }
}

module.exports = CommunityApi;
