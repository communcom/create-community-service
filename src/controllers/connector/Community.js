const core = require('cyberway-core-service');
const { normalizeCommunityNames } = require('commun-utils').community;
const BasicController = core.controllers.Basic;
const errors = require('../../data/errors');
const CommunityModel = require('../../models/Community');
const Flow = require('../Flow');
const generateIdFromName = require('../../utils/generateTicker');

class CommunityApi extends BasicController {
    constructor(...params) {
        super(...params);
        this.communitiesInProgress = new Set();
    }

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
        const { isExists } = await this.isExists({ name });
        if (isExists) {
            throw errors.ERR_ALREADY_EXISTS;
        }

        let communityId;
        try {
            communityId = await generateIdFromName(name, this.isExists.bind(this));
        } catch (e) {
            throw errors.ERR_CANT_GENERATE_ID;
        }

        if (!creator) {
            throw errors.ERR_USER_NOT_AUTHORIZED;
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
        {
            communityId,
            newCommunityId,
            name,
            description,
            language,
            subject,
            rules,
            avatarUrl,
            coverUrl,
        },
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
        if (subject) {
            newSettings.subject = subject;
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
        if (this.communitiesInProgress.has(communityId)) {
            throw errors.ERR_ALREADY_IN_PROGRESS;
        }

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

        if (!existingCommunity.stepsData || !existingCommunity.stepsData.waitForUsersTransfer) {
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

        await CommunityModel.updateOne(
            { communityId },
            { $set: { canChangeSettings: false, isInProgress: true } }
        );

        this.communitiesInProgress.add(communityId);
        try {
            await flow.executeFlow();
        } catch (error) {
            throw error;
        } finally {
            this.communitiesInProgress.delete(communityId);
        }
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
        if (communityId === 'CMN') {
            return true;
        }

        const query = {};
        let communityAlias;

        if (communityId) {
            query.communityId = communityId;
        } else {
            query.name = name;
            const names = normalizeCommunityNames({ name });
            communityAlias = names.alias;
        }

        let community = await CommunityModel.findOne(query, { _id: 1 }, { lean: true });

        if (!community) {
            try {
                community = await this.callService('prism', 'getCommunity', {
                    communityId,
                    communityAlias,
                });
            } catch (error) {
                if (error.code === 404) {
                    community = null;
                } else {
                    throw error;
                }
            }
        }

        return { isExists: !!community };
    }
}

module.exports = CommunityApi;
