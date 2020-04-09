const env = process.env;

module.exports = {
    CYBERWAY_HTTP_URL: env.CYBERWAY_HTTP_URL,
    GLS_PROVIDER_KEY: env.GLS_PROVIDER_KEY,
    GLS_COM_KEY: env.GLS_COM_KEY,
    GLS_TECH_KEY: env.GLS_TECH_KEY,
    GLS_CLIENTS_KEY: env.GLS_CLIENTS_KEY,
    GLS_TECH_NAME: env.GLS_TECH_NAME,
    GLS_BOUNTY_NAME: env.GLS_BOUNTY_NAME || 'c.bounty',
    GLS_ACCOUNT_NAME_PREFIX: env.GLS_ACCOUNT_NAME_PREFIX,
    GLS_WALLET_CONNECT: env.GLS_WALLET_CONNECT,
    GLS_WALLET_WRITER_CONNECT: env.GLS_WALLET_WRITER_CONNECT,
    GLS_ENCRYPTION_PASSWORD: env.GLS_ENCRYPTION_PASSWORD,
    GLS_LEADER_EMISSION_ITERATION_HRS: Number(env.GLS_LEADER_EMISSION_ITERATION_HRS) || 6,
    GLS_POINTS_FOR_USER_PERCENT: Number(env.GLS_POINTS_FOR_USER_PERCENT) || 80,
    GLS_POINTS_FOR_BURN_PERCENT: Number(env.GLS_POINTS_FOR_BURN_PERCENT) || 10,
    GLS_POINTS_FOR_BOUNTY_PERCENT: Number(env.GLS_POINTS_FOR_BOUNTY_PERCENT) || 10,
};
