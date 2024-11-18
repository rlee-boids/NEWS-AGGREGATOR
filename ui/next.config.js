// next.config.js
module.exports = {
    reactStrictMode: true,   // Enables React strict mode for catching potential issues

    // Custom Webpack configuration
    webpack: (config, { isServer }) => {
      // Example of adding custom rules or plugins to Webpack
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          path: false,
        };
      }
      return config;
    },
  
    // Configuring environment variables
    env: {
      API_URL: process.env.API_URL || 'http://localhost:5000',
    },
  
    // Enabling internationalization (i18n) for multi-language support
    i18n: {
      locales: ['en', 'fr', 'es'],    // List of supported locales
      defaultLocale: 'en',            // Default locale
    }
  };
  