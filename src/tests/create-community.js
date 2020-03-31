// const CommunityCreator = require('../controllers/CreateCommunity');
const Flow = require('../controllers/Flow');
const faker = require('faker');

async function main() {
    const communitySettings = generateRandomCommunitySettings();
    console.log(
        'Creating community with community settings:',
        JSON.stringify(communitySettings, null, 4)
    );
    const flow = new Flow(communitySettings);
    await flow.executeFlow();
    // const cc = new CommunityCreator(communitySettings);
    // console.log('Start create account');
    // await cc.createNewAccount();
    // console.log('Done create account');
    //
    // console.log('Start append username');
    // await cc.appendUsername();
    // console.log('Done create account');
    //
    // console.log('Start grant permissions');
    // await cc.grantPermissions();
    // console.log('Done grant permissions');
    //
    // console.log('Start return one token');
    // await cc.returnOneToken();
    // console.log('Done return one token');
    //
    // console.log('Start create point');
    // await cc.createPoint();
    // console.log('Done create point');
    //
    // console.log('Start restock one token');
    // await cc.restockOneToken();
    // console.log('Done restock one token');
    //
    // console.log('Start open gallery balance');
    // await cc.openGalleryBalance();
    // console.log('Done open gallery balance');
    //
    // console.log('Start create community in list');
    // await cc.createCommunityInList();
    // console.log('Done create community in list');
    //
    // console.log('Start set info');
    // await cc.setInfo();
    // console.log('Done set info');
    //
    // console.log('Start set sys params');
    // await cc.setSysParams();
    // console.log('Done set sys params');

    // try {
    //     console.log('Start set params');
    //     await cc.setParams();
    //     console.log('Done set params');
    // } catch (error) {
    //     if (error.json) {
    //         let err = error.json.error;
    //         if (err.details[0]) {
    //             err = err.details[0];
    //             if (err.message !== 'assertion failure with message: No params changed') {
    //                 throw error;
    //             }
    //         }
    //     }
    // }
    //
    // console.log('Start grant permissions again');
    // await cc.grantAdditionalPermissions();
    // console.log('Done grant permissions again');
    //
    // console.log('Start open tech balance');
    // await cc.openTechBalance();
    // console.log('Done open tech balance');
    //
    // console.log('Start buy initial supply');
    // await cc.buyInitialSupplyPoints();
    // console.log('Done buy initial supply');
}

function generateRandomCommunitySettings() {
    const name = capitalize(faker.company.companyName() + ' ' + faker.commerce.product());
    const ticker = tickerize(name);
    const description = faker.company.catchPhrase();

    const rules = [];

    let afterId;
    for (let i = 0; i < 5; i++) {
        let id;
        const nexId = faker.helpers
            .shuffle((faker.random.word() + faker.random.number()).split(''))
            .join('')
            .toLowerCase();
        if (afterId) {
            id = afterId;
            afterId = nexId;
        } else {
            id = nexId;
            afterId = faker.helpers
                .shuffle((faker.random.word() + faker.random.number()).split(''))
                .join('')
                .toLowerCase();
        }

        const title = faker.random.words();
        const text = faker.lorem.text();

        const rule = {
            id,
            afterId,
            title,
            text,
        };

        rules.push(rule);
    }
    const avatarUrl = faker.internet.avatar();
    // todo: cover url
    return { ticker, name, description, language: 'eng', rules: JSON.stringify(rules), avatarUrl };

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function tickerize(s) {
        let ticker = s.toUpperCase().replace(/[ ,.-]/gi, '');
        ticker = faker.helpers.shuffle(ticker.split('')).join('');
        if (ticker.length > 6) {
            ticker = ticker.substr(0, 6);
        }

        return ticker;
    }
}
module.exports = () => {
    main()
        .then(() => console.log('OK'))
        .catch((err) => {
            console.error(JSON.stringify(err.json || err, null, 4));
        });
};
