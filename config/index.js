let config;

switch(process.env.NODE_ENV) {
    case 'development':
        config = require('./development');
        break;
    case 'test':
        config = require('./test');
        break;
    case 'production':
        config = require('./production');
        break;
    default:
        config = require('./default');
}

module.exports = config;