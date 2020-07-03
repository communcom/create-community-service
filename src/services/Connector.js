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
                isExists: {
                    handler: this._community.isExists,
                    scope: this._community,
                    validation: {
                        required: [],
                        properties: {
                            name: { type: 'string' },
                            communityId: { type: 'string' },
                        },
                    },
                },
                createNewCommunity: {
                    handler: this._community.createNewCommunity,
                    scope: this._community,
                    validation: {
                        required: ['name'],
                        properties: {
                            name: { type: 'string' },
                        },
                    },
                },
                getCommunity: {
                    handler: this._community.getCommunity,
                    scope: this._community,
                    validation: {
                        required: ['communityId'],
                        properties: {
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
                            communityId: { type: 'string' },
                            description: { type: 'string' },
                            rules: { type: 'string' },
                            language: { type: 'string' },
                            subject: { type: 'string' },
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
                            transferTrxId: { type: 'string' },
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
            requiredClients: {
                facade: env.GLS_FACADE_CONNECT,
                prism: env.GLS_PRISM_CONNECT,
            },
        });
    }
}

module.exports = Connector;
