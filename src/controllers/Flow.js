const core = require('cyberway-core-service');
const { Logger } = core.utils;
const CommunityModel = require('../models/Community');
const errors = require('../data/errors');
const CreateCommunity = require('./CreateCommunity');
const flow = require('../data/flow');

class Flow {
    constructor(
        {
            communityId: ticker,
            name,
            description,
            language,
            subject,
            rules,
            avatarUrl,
            coverUrl,
            creator,
        },
        { connector }
    ) {
        this.commuitySetup = {
            name,
            description,
            language,
            subject,
            rules,
            avatarUrl,
            coverUrl,
            creator,
            ticker,
        };

        this.communityCreator = creator;
        this.connector = connector;
    }

    async executeFlow() {
        const existingFlow = await CommunityModel.findOne(
            { communityId: this.commuitySetup.ticker, creator: this.communityCreator },
            { _id: false },
            { lean: true }
        );

        if (!existingFlow) {
            throw errors.ERR_COMMUNITY_NOT_FOUND;
        }

        this.communityCreator = new CreateCommunity(
            {
                ...existingFlow,
                ticker: existingFlow.communityId,
                restoreData: existingFlow.stepsData,
            },
            { connector: this.connector }
        );

        this.currentStep = existingFlow.currentStep;

        while (this.currentStep !== flow[flow.length - 1]) {
            await this.nextStep();
        }
    }

    async nextStep() {
        this.stepInProgress = flow[flow.indexOf(this.currentStep) + 1];

        if (this.stepInProgress === 'done') {
            await CommunityModel.updateOne(
                { communityId: this.communityCreator.communitySettings.ticker },
                { $set: { isDone: true, isInProgress: false, currentStep: 'done' } }
            );
            this.currentStep = 'done';
            Logger.log('Community creation done', this.communityCreator.communitySettings.ticker);
            return;
        }
        let stepData;
        switch (this.stepInProgress) {
            case 'waitForUsersTransfer':
                try {
                    stepData = await this.communityCreator.waitForUsersTransfer();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'createAccount':
                try {
                    stepData = await this.communityCreator.createNewAccount();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'appendUsername':
                try {
                    stepData = await this.communityCreator.appendUsername();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'grantPermissions':
                try {
                    stepData = await this.communityCreator.grantPermissions();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'returnOneToken':
                try {
                    stepData = await this.communityCreator.returnOneToken();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'createPoint':
                try {
                    stepData = await this.communityCreator.createPoint();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'restockOneToken':
                try {
                    stepData = await this.communityCreator.restockOneToken();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'returnRestocked':
                try {
                    stepData = await this.communityCreator.returnRestocked();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'openGalleryBalance':
                try {
                    stepData = await this.communityCreator.openGalleryBalance();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'createCommunityInList':
                try {
                    stepData = await this.communityCreator.createCommunityInList();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setInfo':
                try {
                    stepData = await this.communityCreator.setInfo();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setSysParams':
                try {
                    stepData = await this.communityCreator.setSysParams();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'setParams':
                try {
                    stepData = await this.communityCreator.setParams();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'grantAdditionalPermissions':
                try {
                    stepData = await this.communityCreator.grantAdditionalPermissions();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'openTechBalance':
                try {
                    stepData = await this.communityCreator.openTechBalance();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'burnPoints':
                try {
                    stepData = await this.communityCreator.burnPoints();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'waitForSupplyRebuyTrx':
                try {
                    stepData = await this.communityCreator.waitForSupplyRebuyTrx();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'transferPointsToUser':
                try {
                    stepData = await this.communityCreator.transferPointsToUser();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            case 'buyInitialSupplyPoints':
                try {
                    stepData = await this.communityCreator.buyInitialSupplyPoints();
                } catch (error) {
                    this._throwStepError(error);
                }
                break;
            default:
                throw {
                    ...errors.ERR_UNKNOWN_STEP_EXECUTION,
                    data: {
                        step: this.stepInProgress,
                    },
                };
        }

        Logger.log(
            'Executed step',
            this.stepInProgress,
            this.communityCreator.communitySettings.ticker
        );

        this.currentStep = this.stepInProgress;
        await CommunityModel.updateOne(
            { communityId: this.communityCreator.communitySettings.ticker },
            {
                $set: {
                    currentStep: this.currentStep,
                    ...this.communityCreator.communitySettings,
                    isInProgress: true,
                    [`stepsData.${this.currentStep}`]: stepData,
                },
            }
        );
    }

    _throwStepError(error) {
        throw {
            ...errors.ERR_DURING_STEP_EXECUTION,
            data: {
                error: error.json || error.message || error,
                step: this.stepInProgress,
            },
        };
    }
}

module.exports = Flow;
