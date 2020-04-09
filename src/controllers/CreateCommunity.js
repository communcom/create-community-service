const crypto = require('crypto');
const BlockChain = require('../utils/Blockchain');
const WalletApi = require('../controllers/external/WalletApi');
const {
    communitySettings,
    communitySystemParams,
    communityParams,
} = require('../data/communitySettings');
const { GLS_TECH_NAME, GLS_ENCRYPTION_PASSWORD } = require('../data/env');

class CommunityCreator {
    constructor(
        {
            ticker,
            name,
            description,
            language = 'eng',
            rules,
            avatarUrl,
            coverUrl,
            creator,
            restoreData,
        },
        { connector }
    ) {
        this.bcApi = new BlockChain();
        this.walletApi = new WalletApi({ connector });

        this.communitySettings = {
            ...communitySettings,
            ticker,
            name,
            description,
            language,
            rules,
            avatarUrl,
            coverUrl,
        };

        this.communityCreatorUser = creator;
        this.communitySystemParams = communitySystemParams;
        this.communityParams = communityParams;
        this.initialSupplyRebuyTrxId = null;
        this.initialSupplyTransferTrxId = null;
        this.usersTransferTrxId = null;
        if (restoreData) {
            this.restore(restoreData);
        }
    }

    async waitForUsersTransfer() {
        try {
            await this.walletApi.waitForTrx(this.usersTransferTrxId, 0);
        } catch (err) {
            if (!err.isTimeOut) {
                throw err;
            }
        }
        const { items: transfers } = await this.walletApi.getTransfer({
            trxId: this.usersTransferTrxId,
        });

        const neededTransfer = transfers.find(({ sender, receiver, quantity, symbol, memo }) => {
            if (
                sender === this.communityCreatorUser &&
                receiver === GLS_TECH_NAME &&
                Number(quantity) === this.communitySettings.initialSupply &&
                symbol === 'CMN' &&
                memo === `for community: ${this.communitySettings.ticker}`
            ) {
                return true;
            }
        });

        if (neededTransfer) {
            return { neededTransfer };
        }

        throw { message: 'Cannot find the transfer' };
    }

    async transferPointsToUser() {
        const balance = await this.walletApi.getBalance({ userId: GLS_TECH_NAME });

        const pointBalance = balance.balances.find((balance) => {
            if (balance.symbol === this.communitySettings.ticker) {
                return true;
            }
        });

        const transferTrx = await this.bcApi.generatePointTransferTrx({
            from: GLS_TECH_NAME,
            to: this.communityCreatorUser,
            ticker: pointBalance.symbol,
            memo: 'initial supply',
            quantity: Number(pointBalance.balance) - Number(pointBalance.balance) / 100,
        });

        const { transaction_id: trxId } = await this.bcApi.executeTrx(transferTrx);
        this.initialSupplyTransferTrxId = trxId;
        return { initialSupplyTransferTrxId: trxId };
    }

    async waitForSupplyRebuyTrx() {
        await this.walletApi.waitForTrx(this.initialSupplyRebuyTrxId);
    }

    async buyInitialSupplyPoints() {
        const reBuyTrx = await this.bcApi.generateTokenTransferTrx({
            from: GLS_TECH_NAME,
            quantity: this.communitySettings.initialSupply - 1,
            memo: this.communitySettings.ticker,
            to: 'c.point',
        });

        const { transaction_id: trxId } = await this.bcApi.executeTrx(reBuyTrx);
        this.initialSupplyRebuyTrxId = trxId;
        return { initialSupplyRebuyTrxId: trxId };
    }

    async openTechBalance() {
        const openBalanceTrx = await this.bcApi.generateOpenBalanceTrx({
            owner: GLS_TECH_NAME,
            communCode: this.communitySettings.ticker,
        });

        await this.bcApi.executeTrx(openBalanceTrx);
    }

    async grantAdditionalPermissions() {
        const smajorTrx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'active',
            parent: 'owner',
            grantedActor: this.communityCreatorAccount.userId,
            grantedPermission: 'lead.smajor',
        });

        await this.bcApi.executeTrx(smajorTrx);
        const cActiveTtx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'owner',
            parent: '',
            grantedActor: 'c',
            grantedPermission: 'active',
            trxPermission: 'owner',
        });

        await this.bcApi.executeTrx(cActiveTtx);
    }

    async setParams() {
        try {
            const setParamsTrx = await this.bcApi.generateSetParamsTransaction({
                communCode: this.communitySettings.ticker,
                ...this.communityParams,
                actor: this.communityCreatorAccount.userId,
            });

            await this.bcApi.executeTrx(setParamsTrx);
        } catch (error) {
            if (error.json) {
                let err = error.json.error;
                if (err.details[0]) {
                    err = err.details[0];
                    if (err.message !== 'assertion failure with message: No params changed') {
                        throw error;
                    }
                }
            }
        }
    }

    async setSysParams() {
        const setSysParamsTrx = await this.bcApi.generateSetSysInfoTransaction({
            communCode: this.communitySettings.ticker,
            ...this.communitySystemParams,
        });

        await this.bcApi.executeTrx(setSysParamsTrx);
    }

    async setInfo() {
        const setInfoTrx = await this.bcApi.generateSetInfoTransaction({
            communCode: this.communitySettings.ticker,
            ...this.communitySettings,
            actor: this.communityCreatorAccount.userId,
        });

        await this.bcApi.executeTrx(setInfoTrx);
    }

    async createCommunityInList() {
        const createTrx = await this.bcApi.generateCreateCommunityTransaction({
            communCode: this.communitySettings.ticker,
            communityName: this.communitySettings.name,
        });

        await this.bcApi.executeTrx(createTrx);
    }

    async openGalleryBalance() {
        const openBalanceTrx = await this.bcApi.generateOpenBalanceTrx({
            owner: 'c.gallery',
            communCode: this.communitySettings.ticker,
        });

        await this.bcApi.executeTrx(openBalanceTrx);
    }

    async restockOneToken() {
        const restockTrx = await this.bcApi.generateRestockTrx({
            account: this.communityCreatorAccount.userId,
            quantity: 1,
            ticker: this.communitySettings.ticker,
        });

        await this.bcApi.executeTrx(restockTrx);
    }

    async createPoint() {
        const pointSettings = {
            issuer: this.communityCreatorAccount.userId,
            initialSupply: `${this.communitySettings.initialSupply.toFixed(3)} ${
                this.communitySettings.ticker
            }`,
            maximumSupply: `${this.communitySettings.maximumSupply.toFixed(3)} ${
                this.communitySettings.ticker
            }`,
            cw: this.communitySettings.cw,
            fee: this.communitySettings.fee,
        };
        const createPointTrx = await this.bcApi.generateCreatePointTrx(pointSettings);

        await this.bcApi.executeTrx(createPointTrx);
    }

    async returnOneToken() {
        const returnTransferTrx = await this.bcApi.generateTokenTransferTrx({
            from: GLS_TECH_NAME,
            to: this.communityCreatorAccount.userId,
            quantity: 1,
            memo: 'returning 1 token for creating a community',
        });

        await this.bcApi.executeTrx(returnTransferTrx);
    }

    async grantPermissions() {
        const smajorTrx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'lead.smajor',
            parent: 'active',
            grantedActor: 'c.ctrl',
            grantedPermission: 'cyber.code',
        });

        await this.bcApi.executeTrx(smajorTrx);

        const majorTrx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'lead.major',
            parent: 'active',
            grantedActor: 'c.ctrl',
            grantedPermission: 'cyber.code',
        });

        await this.bcApi.executeTrx(majorTrx);

        const minorTrx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'lead.minor',
            parent: 'active',
            grantedActor: 'c.ctrl',
            grantedPermission: 'cyber.code',
        });

        await this.bcApi.executeTrx(minorTrx);

        const banTrx = await this.bcApi.generateLinkAuthTransaction({
            account: this.communityCreatorAccount.userId,
            code: 'c.gallery',
            type: 'ban',
            requirement: 'lead.minor',
        });

        await this.bcApi.executeTrx(banTrx);

        const transferTrx = await this.bcApi.generateLinkAuthTransaction({
            account: this.communityCreatorAccount.userId,
            code: 'c.point',
            type: 'transfer',
            requirement: 'lead.minor',
        });

        await this.bcApi.executeTrx(transferTrx);

        const transferCreateTrx = await this.bcApi.generateUpdateAuthTransaction({
            account: this.communityCreatorAccount.userId,
            permission: 'transferperm',
            parent: 'active',
            grantedActor: 'c.emit',
            grantedPermission: 'cyber.code',
        });

        await this.bcApi.executeTrx(transferCreateTrx);
    }

    async appendUsername() {
        this.communityCreatorAccount.username = this.communityCreatorAccount.userId;

        const usernameTrx = await this.bcApi.generateNewUsernameTransaction({
            ...this.communityCreatorAccount,
        });
        await this.bcApi.executeTrx(usernameTrx);
        return { ...this._encryptAccountData(this.communityCreatorAccount) };
    }

    async createNewAccount() {
        const userId = this.bcApi.generateNewUserId();
        const { active, owner } = await this.bcApi.generateKeys(userId);
        this.communityCreatorAccount = { userId, active, owner };
        const newAccTrx = this.bcApi.generateNewAccountTransaction({ userId, active, owner });

        await this.bcApi.executeTrx(newAccTrx);
        this.bcApi.addPrivateKeys([active.privateKey, owner.privateKey]);

        return { ...this._encryptAccountData(this.communityCreatorAccount) };
    }

    _encryptAccountData({ userId, username, active, owner }) {
        const encryptedActivePrivateKey = encrypt(active.privateKey);
        const encryptedOwnerPrivateKey = encrypt(owner.privateKey);

        return {
            userId,
            username,
            active: { publicKey: active.publicKey, privateKey: encryptedActivePrivateKey },
            owner: { publicKey: owner.publicKey, privateKey: encryptedOwnerPrivateKey },
        };
    }

    _decryptAccountData({ userId, username, active, owner }) {
        const decryptedActivePrivateKey = decrypt(active.privateKey);
        const decryptedOwnerPrivateKey = decrypt(owner.privateKey);

        return {
            userId,
            username,
            active: { publicKey: active.publicKey, privateKey: decryptedActivePrivateKey },
            owner: { publicKey: owner.publicKey, privateKey: decryptedOwnerPrivateKey },
        };
    }

    restore(restoreData) {
        for (const dataKey in restoreData) {
            const data = restoreData[dataKey];
            switch (dataKey) {
                case 'createAccount':
                case 'appendUsername':
                    this.communityCreatorAccount = this._decryptAccountData({ ...data });
                    this.bcApi.addPrivateKeys([
                        this.communityCreatorAccount.active.privateKey,
                        this.communityCreatorAccount.owner.privateKey,
                    ]);
                    break;
                case 'buyInitialSupplyPoints':
                    this.initialSupplyRebuyTrxId = data.initialSupplyRebuyTrxId;
                    break;
                case 'transferPointsToUser':
                    this.initialSupplyTransferTrxId = data.initialSupplyTransferTrxId;
                    break;
                case 'waitForUsersTransfer':
                    this.usersTransferTrxId = data.usersTransferTrxId;
                    break;
            }
        }
    }
}

function encrypt(data) {
    const cipher = crypto.createCipher('aes-256-ctr', GLS_ENCRYPTION_PASSWORD);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(data) {
    const decipher = crypto.createDecipher('aes-256-ctr', GLS_ENCRYPTION_PASSWORD);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = CommunityCreator;
