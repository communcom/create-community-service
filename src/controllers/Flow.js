const core = require('cyberway-core-service');
const { Logger } = core.utils;
const CommunityModel = require('../models/Community');
const errors = require('../data/errors');
const CreateCommunity = require('./CreateCommunity');
const flow = require('../data/flow');

class Flow {
    constructor({
        communityId: ticker,
        name,
        description,
        language,
        rules,
        avatarUrl,
        coverUrl,
        creator,
    }) {
        this.commuitySetup = {
            name,
            description,
            language,
            rules,
            avatarUrl,
            coverUrl,
            creator,
            ticker,
        };
    }

    async executeFlow() {
        const existingFlow = await CommunityModel.findOne(
            { communityId: this.commuitySetup.ticker, creator: this.communityCreator },
            { _id: false, creator: true },
            { lean: true }
        );

        if (!existingFlow) {
            throw errors.ERR_COMMUNITY_NOT_FOUND;
        }

        // if (existingFlow) {
        //     if (existingFlow.creator !== this.commuitySetup.creator) {
        //         throw errors.ERR_ALREADY_EXISTS;
        //     }
        //     this.currentStep = existingFlow.currentStep;
        // } else {
        //     existingFlow = await CommunityModel.create({
        //         ...this.commuitySetup,
        //         communityId: this.commuitySetup.ticker,
        //     });
        //     existingFlow = existingFlow.toObject();
        //     this.currentStep = flow[0];
        // }

        this.communityCreator = new CreateCommunity({
            ...existingFlow,
            ticker: existingFlow.communityId,
        });

        this.currentStep = existingFlow.currentStep;

        while (this.currentStep !== 'done') {
            await this.nextStep();
        }
    }

    async nextStep() {
        const stepInProgress = flow[flow.indexOf(this.currentStep) + 1];

        if (stepInProgress === 'done') {
            await CommunityModel.updateOne(
                { communityId: this.communityCreator.communitySettings.ticker },
                { $set: { isDone: true, isInProgress: false, currentStep: 'done' } }
            );
            Logger.log('Community creation done');
            return;
        }

        switch (stepInProgress) {
            case 'createAccount':
                try {
                    await this.communityCreator.createNewAccount();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'appendUsername':
                try {
                    await this.communityCreator.appendUsername();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'grantPermissions':
                try {
                    await this.communityCreator.grantPermissions();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'returnOneToken':
                try {
                    await this.communityCreator.returnOneToken();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'createPoint':
                try {
                    await this.communityCreator.createPoint();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'restockOneToken':
                try {
                    await this.communityCreator.restockOneToken();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'openGalleryBalance':
                try {
                    await this.communityCreator.openGalleryBalance();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'createCommunityInList':
                try {
                    await this.communityCreator.createCommunityInList();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setInfo':
                try {
                    await this.communityCreator.setInfo();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setSysParams':
                try {
                    await this.communityCreator.setSysParams();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setParams':
                try {
                    await this.communityCreator.setParams();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'grantAdditionalPermissions':
                try {
                    await this.communityCreator.grantAdditionalPermissions();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'openTechBalance':
                try {
                    await this.communityCreator.openTechBalance();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'buyInitialSupplyPoints':
                try {
                    await this.communityCreator.buyInitialSupplyPoints();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            default:
                throw {
                    ...errors.ERR_UNKNOWN_STEP_EXECUTION,
                    data: {
                        step: stepInProgress,
                    },
                };
        }

        Logger.log('Executed step', stepInProgress);

        this.currentStep = stepInProgress;
        await CommunityModel.updateOne(
            { communityId: this.communityCreator.communitySettings.ticker },
            {
                $set: {
                    currentStep: this.currentStep,
                    ...this.communityCreator.communitySettings,
                    isInProgress: true,
                },
            }
        );
    }

    _throwStepError(error) {
        throw {
            ...errors.ERR_DURING_STEP_EXECUTION,
            data: {
                error,
                step: this.currentStep,
            },
        };
    }
}

module.exports = Flow;
