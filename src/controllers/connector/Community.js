const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const errors = require('../../data/errors');
const CommunityModel = require('../../models/Community');
const Flow = require('../Flow');

class CommunityApi extends BasicController {
    async createNewCommunity({ name, communityId }, { userId: creator }) {
        const existingCommunity = await CommunityModel.findOne({ communityId });
        if (existingCommunity) {
            throw errors.ERR_ALREADY_EXISTS;
        }

        await CommunityModel.create({ name, communityId, creator });
    }

    async setSettings(
        { communityId, newCommunityId, name, description, language, rules, avatarUrl, coverUrl },
        { userId: creator }
    ) {
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

    async startCommunityCreation({ communityId }, { userId: creator }) {
        const existingCommunity = await CommunityModel.findOne(
            { communityId, creator },
            { _id: false },
            { lean: true }
        );

        if (!existingCommunity) {
            throw errors.ERR_COMMUNITY_NOT_FOUND;
        }

        if (existingCommunity.isDone) {
            throw errors.ERR_COMMUNITY_ALREADY_CREATED;
        }

        if (!existingCommunity.isInProgress) {
            await CommunityModel.updateOne({ communityId }, { $set: { currentStep: 'ready' } });
        }

        const flow = new Flow(existingCommunity);

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
}

module.exports = CommunityApi;
