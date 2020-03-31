const core = require('cyberway-core-service');
const BasicMain = core.services.BasicMain;
const env = require('./data/env');
// const Prism = require('./services/Prism');
// const Connector = require('./services/Connector');
// const { createCustomForkManager } = require('./services/ForkManager');
// const Hot = require('./services/Hot');
// const ImagesMetaUpdater = require('./services/ImagesMetaUpdater');
const createCommunityTest = require('./tests/create-community');

class Main extends BasicMain {
    constructor() {
        super(env);

        this.startMongoBeforeBoot(null);
    }

    async boot() {
        await createCommunityTest();
    }
}

module.exports = Main;
