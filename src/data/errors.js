module.exports = {
    ERR_ALREADY_EXISTS: {
        code: 1000,
        message: 'Community already exists',
    },
    ERR_DURING_STEP_EXECUTION: {
        code: 1001,
        message: 'Something went wrong',
    },
    ERR_UNKNOWN_STEP_EXECUTION: {
        code: 1002,
        message: 'Tried to execute unknown step',
    },
    ERR_USER_NOT_AUTHORIZED: {
        code: 1003,
        message: 'User not authorized',
    },
    ERR_COMMUNITY_NOT_FOUND: {
        code: 1004,
        message: 'Community not found',
    },
    ERR_CANNOT_CHANGE_COMMUNITY_SETTINGS: {
        code: 1005,
        message: 'Community creation has already started, cannot change settings',
    },
    ERR_COMMUNITY_ALREADY_CREATED: {
        code: 1006,
        message: 'Community creation has already started, cannot change settings',
    },
    ERR_CANT_GENERATE_ID: {
        code: 1007,
        message: 'Cannot generate communityId for this community name',
    },
    ERR_NO_TRX_ID_PROVIDED: {
        code: 1008,
        message: 'Transaction id with transfer is not provided',
    },
    ERR_ALREADY_IN_PROGRESS: {
        code: 1009,
        message: 'Community creation is already in progress',
    },
};
