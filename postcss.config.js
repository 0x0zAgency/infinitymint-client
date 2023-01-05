module.exports = {
  plugins: {
    "postcss-for": {},
    "postcss-mixins": {},
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: {},
    "postcss-preset-env": {
      features: { "nesting-rules": true },
    },
    autoprefixer: {},
  },
};
