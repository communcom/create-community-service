const core = require('cyberway-core-service');
const { Logger } = core.utils;
const CommunityModel = require('../models/Community');
const errors = require('../data/errors');
const CreateCommunity = require('./CreateCommunity');
const flow = require('../data/flow');

class Flow {
    constructor({ ticker, name, description, language, rules, avatarUrl, coverUrl, creator }) {
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
        let existingFlow = await CommunityModel.findOne(
            { communityId: this.commuitySetup.ticker },
            { _id: false },
            { lean: true }
        );

        if (existingFlow) {
            if (existingFlow.creator !== this.commuitySetup.creator) {
                throw errors.ERR_ALREADY_EXISTS;
            }
            this.currentStep = existingFlow.currentStep;
        } else {
            existingFlow = await CommunityModel.create({
                ...this.commuitySetup,
                communityId: this.commuitySetup.ticker,
            });
            existingFlow = existingFlow.toObject();
            this.currentStep = flow[0];
        }

        this.communityCreator = new CreateCommunity({
            ...existingFlow,
            ticker: existingFlow.communityId,
        });

        while (this.currentStep !== 'done') {
            await this.nextStep();
        }
    }

    async nextStep() {
        this.currentStep = flow[flow.indexOf(this.currentStep) + 1];

        await CommunityModel.updateOne(
            { communityId: this.communityCreator.communitySettings.ticker },
            { $set: { currentStep: this.currentStep, ...this.communityCreator.communitySettings } }
        );

        switch (this.currentStep) {
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
            case 'done':
                return;
            default:
                throw {
                    ...errors.ERR_UNKNOWN_STEP_EXECUTION,
                    data: {
                        step: this.currentStep,
                    },
                };
        }

        Logger.log('Executed step', this.currentStep);
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
