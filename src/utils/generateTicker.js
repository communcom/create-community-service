const { slugify } = require('transliteration');
const CommunityModel = require('../models/Community');

function generateRandomId(alphabet, length) {
    const id = [];

    for (let i = 0; i < length; i += 1) {
        id.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
    }

    return id.join('');
}

async function isIdAvailable(communityId) {
    const community = await CommunityModel.findOne({ communityId }, { _id: false }, { lean: true });
    return !community;
}

async function generateIdByAddingLetter(id, revertedAlphabetArr) {
    for (const letter of revertedAlphabetArr) {
        const nextId = id + letter;
        const checkedIdAvailable = await isIdAvailable(nextId);

        if (checkedIdAvailable) {
            return nextId;
        }
    }

    return null;
}

async function getTickerFromName(name) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let checkedIdAvailable;

    let id = slugify(name, {
        uppercase: true,
        trim: true,
        allowedChars: 'a-zA-Z',
    })
        .replace(/-/g, '')
        .substr(0, 6);

    if (!id) {
        id = generateRandomId(ALPHABET, 6);
    }

    checkedIdAvailable = await isIdAvailable(id);

    if (checkedIdAvailable) {
        return id;
    }

    const clippedId = id.replace(/A|E|I|O|U/g, '');
    checkedIdAvailable = await isIdAvailable(clippedId);

    if (checkedIdAvailable) {
        return clippedId;
    }

    const revertedAlphabetArr = ALPHABET.split('').reverse();
    const revertedAlphabetId = await generateIdByAddingLetter(id, revertedAlphabetArr);

    if (revertedAlphabetId) {
        return revertedAlphabetId;
    }

    id = generateRandomId(ALPHABET, 6);
    checkedIdAvailable = await isIdAvailable(id);

    if (checkedIdAvailable) {
        return id;
    }

    id = await generateIdByAddingLetter(id, revertedAlphabetArr);

    if (id) {
        return id;
    }

    throw new Error('Cannot generate communityId from this communityName');
}

module.exports = getTickerFromName;
