const path = require('path');

module.exports = {
    // ... other config
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false,
            "buffer": require.resolve("buffer/")
        }
    }
}; 