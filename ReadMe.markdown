# InfinityMint Typescript Boilerplate by 0x0zAgency

Want to get straight into InfinityMint? Well this is the easiest solution for you! With just one click you can setup the developer environment to work with InfinityMint.

## 🗿 Requirements

- Mac OSX (any version), Windows (XP, Vista, 7, 8, 10, 11), Debian (5+), Ubuntu (14+)
- Node **16.0.0** or Higher
- ZSH, Fish or equivalent. **(Bash users may/not encounter issues.)**

## 🗿 Boilerplates & Starter-kits

Don't feel like using this template? Check out our other boilerplates and starter-kits and get building with InfinityMint straight away!

[Javascript Boilerplate](https://github.com/0x0zAgency/infinitymint-javascript-boilerplate)

[React Starter-kit (Typescript)](https://github.com/0x0zAgency/infinitymint-react-typescript-starterkit)

[React Starter-kit (Javascript)](https://github.com/0x0zAgency/infinitymint-react-javascript-starterkit)

[NextJS Starter-kit](https://github.com/0x0zAgency/infinitymint-nextjs-starterkit)

## 🗿 Installation

**Simply use this repository as a template**. By using this repository as a template it should automatically create a new git repository for you.

Please note that if you are running this through an online workspace, be patient. Wait for the Github workspace commands to fully complete before running `npm start`. The *postCommandScript* is already gathering your node dependencies for you :)

## Using this template

For developer convenience, [TailwindCSS](<https://tailwindcss.com>) is already plugged in with PostCSS.
If you do not wish to use it, simply uninstall & remove the following lines within your `webpack.config.js`:

```js
// Starts at line 119
loader: require.resolve('postcss-loader'),
    options: {
     postcssOptions: {
      // Necessary for external CSS imports to work
      // https://github.com/facebook/create-react-app/issues/2677
      ident: 'postcss',
      config: true,
			// And so on...
```

## 🗿 Documentation

[Official Documentation](https://docs.infinitymint.app)

[TypeDoc Documentation](https://typedoc.org/)
