module.exports = function override(config, env) {
    // do stuff with the webpack config...
    config.module.noParse = [/benchmark/];
    return config;
};
