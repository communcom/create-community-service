const core = require('cyberway-core-service');
const BasicConnector = core.services.Connector;
const env = require('../data/env');
const Community = require('../controllers/connector/Community');

class Connector extends BasicConnector {
    constructor() {
        super();

        const linking = { connector: this };

        this._community = new Community(linking);
    }

    async start() {
        await super.start({
            serverRoutes: {
                createNewCommunity: {
                    handler: this._community.createNewCommunity,
                    scope: this._community,
                    validation: {
                        required: ['name', 'communityId'],
                        properties: {
                            name: { type: 'string' },
                            communityId: { type: 'string' },
                        },
                    },
                },
                setSettings: {
                    handler: this._community.setSettings,
                    scope: this._community,
                    validation: {
                        required: ['communityId'],
                        properties: {
                            name: { type: 'string' },
                            newCommunityId: { type: 'string' },
                            description: { type: 'string' },
                            rules: { type: 'string' },
                            language: { type: 'string' },
                            avatarUrl: { type: 'string' },
                            coverUrl: { type: 'string' },
                        },
                    },
                },
                startCommunityCreation: {
                    handler: this._community.startCommunityCreation,
                    scope: this._community,
                    validation: {
                        required: ['communityId'],
                        properties: {
                            communityId: { type: 'string' },
                        },
                    },
                },
                getUsersCommunities: {
                    handler: this._community.getUsersCommunities,
                    scope: this._community,
                    validation: {},
                },
            },
            serverDefaults: {
                parents: {},
            },
            requiredClients: {},
        });
    }
}

module.exports = Connector;
