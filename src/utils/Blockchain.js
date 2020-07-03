const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('text-encoding');
const { JsonRpc, Api } = require('cyberwayjs');
const JsSignatureProvider = require('cyberwayjs/dist/eosjs-jssig').default;
const ecc = require('eosjs-ecc');
const randomstring = require('randomstring');
const env = require('../data/env');

class Blockchain {
    constructor() {
        this.rpc = new JsonRpc(env.CYBERWAY_HTTP_URL, { fetch });
        this.addPrivateKeys([env.GLS_PROVIDER_KEY, env.GLS_COM_KEY, env.GLS_TECH_KEY]);
        this._createSignatureProvider();
        this._createApi();
    }

    generateEmitTransaction({ communCode: commun_code, communityTechAccount }) {
        return this.generateSingleActionTrx(
            {
                contract: 'c.ctrl',
                action: 'emit',
                actor: 'c.ctrl',
                permission: 'clients',
                data: {
                    commun_code,
                },
            },
            [communityTechAccount]
        );
    }

    generateSetParamsTransaction({
        communCode,
        leadersNum,
        maxVotes,
        permission,
        requiredThreshold,
        emissionRate,
        leadersPercent,
        authorPercent,
        actor,
    }) {
        return this.generateSingleActionTrx({
            contract: 'c.list',
            action: 'setparams',
            actor,
            data: {
                commun_code: communCode,
                permission,
                required_threshold: requiredThreshold,
                leaders_num: leadersNum,
                max_votes: maxVotes,
                emission_rate: emissionRate,
                leaders_percent: leadersPercent,
                author_percent: authorPercent,
            },
        });
    }

    generateSetSysInfoTransaction({
        communCode,
        name,
        permission,
        requiredThreshold,
        collectionPeriod,
        moderationPeriod,
        extraRewardPeriod,
        gemsPerDay,
        rewardedMosaicNum,
        opuses,
        removeOpuses,
        minLeadRating,
        damnedGemRewardEnabled,
        refillGemEnabled,
        customGemSizeEnabled,
    }) {
        return this.generateSingleActionTrx({
            contract: 'c.list',
            action: 'setsysparams',
            actor: 'c.list',
            permission: 'clients',
            data: {
                commun_code: communCode,
                community_name: name,
                permission,
                required_threshold: requiredThreshold,
                collection_period: collectionPeriod,
                moderation_period: moderationPeriod,
                extra_reward_period: extraRewardPeriod,
                gems_per_day: gemsPerDay,
                rewarded_mosaic_num: rewardedMosaicNum,
                opuses,
                remove_opuses: removeOpuses,
                min_lead_rating: minLeadRating,
                damned_gem_reward_enabled: damnedGemRewardEnabled,
                refill_gem_enabled: refillGemEnabled,
                custom_gem_size_enabled: customGemSizeEnabled,
            },
        });
    }

    generateSetInfoTransaction({
        communCode,
        description,
        language,
        rules,
        avatarUrl,
        coverUrl,
        actor,
        subject,
    }) {
        return this.generateSingleActionTrx({
            contract: 'c.list',
            action: 'setinfo',
            actor,
            data: {
                commun_code: communCode,
                description,
                language,
                rules,
                avatar_image: avatarUrl,
                cover_image: coverUrl,
                subject,
            },
        });
    }

    generateCreateCommunityTransaction({ communityName, communCode }) {
        return this.generateSingleActionTrx(
            {
                contract: 'c.list',
                action: 'create',
                actor: 'c.list',
                permission: 'clients',
                data: {
                    commun_code: communCode,
                    community_name: communityName,
                },
            },
            ['c.ctrl', 'c.emit', 'c.gallery']
        );
    }

    generateOpenBalanceTrx({ owner, communCode, ramPayer = 'c' }) {
        return this.generateSingleActionTrx({
            contract: 'c.point',
            action: 'open',
            actor: 'c',
            permission: 'providebw',
            data: {
                owner,
                commun_code: communCode,
                ram_payer: ramPayer,
            },
        });
    }

    generateCreatePointTrx({ issuer, initialSupply, maximumSupply, cw, fee }) {
        return this.generateSingleActionTrx({
            contract: 'c.point',
            action: 'create',
            actor: 'c.point',
            permission: 'clients',
            data: {
                issuer,
                initial_supply: initialSupply,
                maximum_supply: maximumSupply,
                cw,
                fee,
            },
        });
    }

    generateRestockTrx({ account, quantity, ticker }) {
        return this.generateTokenTransferTrx({
            from: account,
            to: 'c.point',
            quantity,
            memo: `restock: ${ticker}`,
        });
    }

    generatePointTransferTrx({ from, to, quantity, ticker, memo }) {
        quantity = Number(quantity);

        return this.generateSingleActionTrx({
            contract: 'c.point',
            action: 'transfer',
            actor: from,
            data: { from, to, quantity: `${quantity.toFixed(3)} ${ticker}`, memo },
        });
    }

    generateTokenTransferTrx({ from, to, quantity, memo }) {
        return this.generateSingleActionTrx({
            contract: 'cyber.token',
            action: 'transfer',
            actor: from,
            data: { from, to, quantity: `${quantity.toFixed(4)} CMN`, memo },
        });
    }

    generateLinkAuthTransaction({ account, code, type, requirement }) {
        return this.generateSingleActionTrx({
            contract: 'cyber',
            action: 'linkauth',
            actor: account,
            data: { account, code, type, requirement },
        });
    }

    generateUpdateAuthTransaction({
        account,
        permission,
        parent,
        grantedActor,
        grantedPermission,
        trxPermission,
    }) {
        return this.generateSingleActionTrx({
            contract: 'cyber',
            action: 'updateauth',
            actor: account,
            permission: trxPermission,
            data: {
                account,
                permission,
                parent,
                auth: {
                    threshold: 1,
                    keys: [],
                    accounts: [
                        {
                            permission: {
                                actor: grantedActor,
                                permission: grantedPermission,
                            },
                            weight: 1,
                        },
                    ],
                    waits: [],
                },
            },
        });
    }

    generateNewUsernameTransaction({ userId, username }) {
        return this.generateSingleActionTrx({
            contract: 'cyber.domain',
            action: 'newusername',
            actor: 'c',
            permission: 'clients',
            data: {
                creator: 'c',
                owner: userId,
                name: username,
            },
        });
    }

    generateNewAccountTransaction({ userId, owner, active }) {
        return this.generateSingleActionTrx({
            contract: 'cyber',
            action: 'newaccount',
            actor: 'c.com',
            permission: 'c.com',
            data: {
                creator: 'c.com',
                name: userId,
                owner: {
                    threshold: 1,
                    keys: [{ key: owner.publicKey, weight: 1 }],
                    accounts: [
                        {
                            permission: {
                                actor: 'c.recover',
                                permission: 'cyber.code',
                            },
                            weight: 1,
                        },
                    ],
                    waits: [],
                },
                active: {
                    threshold: 1,
                    keys: [{ key: active.publicKey, weight: 1 }],
                    accounts: [],
                    waits: [],
                },
            },
        });
    }

    async executeTrx(trx) {
        const signedTrx = await this.api.transact(trx, {
            broadcast: false,
            blocksBehind: 5,
            expireSeconds: 3600,
        });

        return await this.api.pushSignedTransaction(signedTrx);
    }

    generateSingleActionTrx(
        { contract, action, data, actor, permission = 'active' },
        provideAccounts = []
    ) {
        const actions = [
            { account: contract, name: action, data, authorization: [{ actor, permission }] },
        ];

        const uniqueAccounts = new Set([actor, contract, ...provideAccounts]);
        for (const acc of uniqueAccounts.values()) {
            if (acc === 'c' || acc === 'cyber') {
                // 'c' account is the provider and cannot provide itself
                continue;
            }

            actions.push({
                account: 'cyber',
                name: 'providebw',
                authorization: [
                    {
                        actor: 'c',
                        permission: 'providebw',
                    },
                ],
                data: {
                    provider: 'c',
                    account: acc,
                },
            });
        }

        return {
            actions,
        };
    }

    async generateKeys(accountName) {
        const privateKey = await ecc.randomKey();
        const masterKey = `P${privateKey}`;
        return {
            accountName,
            masterKey,
            ...this._getFullKeyPairs(accountName, masterKey),
        };
    }

    generateNewUserId() {
        const prefix = env.GLS_ACCOUNT_NAME_PREFIX;

        return (
            prefix +
            randomstring.generate({
                length: 12 - prefix.length,
                charset: 'alphabetic',
                capitalization: 'lowercase',
            })
        );
    }

    _getKeyPairByPermissionName(accountName, masterKey, permName) {
        const privateKey = this._fromSeed(accountName, masterKey, permName);
        const publicKey = ecc.privateToPublic(privateKey, 'GLS');

        return {
            privateKey,
            publicKey,
        };
    }

    _fromSeed(accountName, masterKey, permName) {
        return ecc.seedPrivate(`${accountName}${permName}${masterKey}`);
    }

    _getFullKeyPairs(accountName, masterKey) {
        const keyPairs = {};
        for (const permName of ['active', 'owner']) {
            keyPairs[permName] = this._getKeyPairByPermissionName(accountName, masterKey, permName);
        }
        return keyPairs;
    }

    addPrivateKeys(privateKeys, recreateApi = true) {
        if (!this.privateKeys) {
            this.privateKeys = [];
        }

        if (!Array.isArray(privateKeys)) {
            privateKeys = [privateKeys];
        }

        this.privateKeys.push(...privateKeys);

        if (recreateApi) {
            this._createSignatureProvider();
            this._createApi();
        }
    }

    _createSignatureProvider() {
        this.signatureProvider = new JsSignatureProvider(this.privateKeys);
    }

    _createApi() {
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider: this.signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder(),
        });
    }
}

module.exports = Blockchain;
