const core = require('cyberway-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'Community',
    {
        creator: {
            type: String,
            required: true,
        },
        communityId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        avatarUrl: {
            type: String,
        },
        coverUrl: {
            type: String,
        },
        description: {
            type: String,
        },
        rules: {
            type: String,
        },
        language: {
            type: String,
            default: 'en',
        },
        subject: {
            type: String,
        },
        settings: {
            type: Object,
        },
        currentStep: {
            type: String,
            default: 'settingUp',
            enum: [],
        },
        isDone: {
            type: Boolean,
            default: false,
        },
        canChangeSettings: {
            type: Boolean,
            default: true,
        },
        isInProgress: {
            type: Boolean,
            default: false,
        },
        fee: {
            type: Number,
        },
        cw: {
            type: Number,
        },
        initialSupply: {
            type: Number,
        },
        maximumSupply: {
            type: Number,
        },
        collectionPeriod: {
            type: Number,
        },
        moderationPeriod: {
            type: Number,
        },
        extraRewardPeriod: {
            type: Number,
        },
        gemsPerDay: {
            type: Number,
        },
        rewardedMosaicNum: {
            type: Number,
        },
        minLeadRating: {
            type: Number,
        },
        damnedGemRewardEnabled: {
            type: Boolean,
        },
        refillGemEnabled: {
            type: Boolean,
        },
        customGemSizeEnabled: {
            type: Boolean,
        },
        requiredThreshold: {
            type: Number,
        },
        leadersNum: {
            type: Number,
        },
        maxVotes: {
            type: Number,
        },
        emissionRate: {
            type: Number,
        },
        leadersPercent: {
            type: Number,
        },
        authorsPercent: {
            type: Number,
        },
        stepsData: {
            type: Object,
            default: {},
        },
    },
    {
        index: [
            // Default
            {
                fields: {
                    communityId: 1,
                    creator: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    name: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    isDone: 1,
                },
            },
        ],
    }
);
