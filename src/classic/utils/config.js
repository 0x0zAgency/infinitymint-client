/**
 * InfinityMint DAPP Configuration File
 */

import modController from '../modController';
import pageController from '../pageController';

/**
 * Locations for the various required files
 */
const deploymentsRoot = './Deployments/';
const deploymentsProductionRoot = './Deployments/production/';
const tokenMethodRoot = './Deployments/scripts/';
const modsRoot = './Deployments/mods/';

export const requireModules = async (production) => {
    let results = {
        deployInfo: await import('./Deployments/deployInfo.json'),
        defaultStaticManifest: await import(
            './Deployments/static/default_manifest.json'
        ),
        staticManifest: await import('./Deployments/static/manifest.json'),
        modManifest: await import('./Deployments/mods/modManifest.json'),
        pages: await import('./Resources/pages.json'),
        tokenMethodManifest: await import(
            './Deployments/scripts/manifest.json'
        ),
    };

    Object.keys(results).forEach((key) => {
        results[key] = results[key].default || results[key];
    });
    return results;
};

export const loadTokenMethods = async (tokenMethodManifest) => {
    let scripts = {};
    if (
        tokenMethodManifest !== null &&
        tokenMethodManifest?.scripts !== undefined &&
        tokenMethodManifest.scripts.length > 0
    )
        for (let i = 0; i < tokenMethodManifest.scripts.length; i++) {
            try {
                scripts[tokenMethodManifest.scripts[i].split('.')[0]] = (
                    await require(`${
                        tokenMethodRoot + tokenMethodManifest.scripts[i]
                    }`)
                ).default;
                Config.tokenMethodScripts = scripts;
            } catch (error) {
                console.log(
                    '[😞] could not load token script:' +
                        tokenMethodManifest.scripts[i]
                );
                console.error(error);
            }
        }
};

export const loadPages = async (pages) => {
    for (const page of pages) {
        console.log('[✒️pages] requiring page ' + page.path);
        let requirePage = await require(`${
            './' + (page?.path || '').replace('.js', '')
        }`);
        requirePage = requirePage.default || requirePage;

        if (requirePage.url === undefined) {
            console.log(
                '[⚠️] WARNING! Page at ' +
                    (page.id || page.name) +
                    ' does not have url set, registering as virtual page'
            );
            requirePage = pageController.registerFakePage(requirePage);
        } else {
            requirePage = pageController.registerPage(
                requirePage,
                requirePage.developer === true
            );
        }
    }
};

export const loadStaticManifest = async (staticManifest) => {
    // Init with default values so stuff isnt broken
    const object = {
        background: 'Images/default_background.jpg',
        headerBackground: 'Images/default_header.jpg',
        defaultImage: 'Images/sad_panda.jpg',
        backgroundColour: 'black',
        stylesheets: ['Styles/bootstrap.min.css', 'Styles/app.css'],
        images: {
            features: 'Images/default_features.jpg',
        },
    };

    for (let i = 0; i < staticManifest.stylesheets.length; i++) {
        console.log(
            '[⚡] Importing Stylesheet: ' + staticManifest.stylesheets[i]
        );
        await require(`${
            './' + staticManifest.stylesheets[i].replace('@', '')
        }`);
        staticManifest.stylesheets[i] = true;
    }

    const background = (
        staticManifest.background ||
        object.background ||
        ''
    ).replace('@', '');
    const headerBackground = (
        staticManifest.headerBackground ||
        object.headerBackground ||
        ''
    ).replace('@', '');
    const defaultImage = (
        staticManifest.defaultImage ||
        object.defaultImage ||
        ''
    ).replace('@', '');

    console.log('[⚡] Fetching Site Background Image: ' + background);
    staticManifest.background = await require('./' + background);
    console.log('[⚡] Fetching Header Background Image: ' + headerBackground);
    staticManifest.headerBackground = await require(`${
        './' + headerBackground
    }`);
    console.log('[⚡] Fetching Default Placeholder Image: ' + defaultImage);
    staticManifest.defaultImage = await require('./' + background);

    if (
        staticManifest.images === undefined ||
        staticManifest.images.length === 0
    ) {
        staticManifest.images = object.images;
    }

    try {
        const keys = Object.keys(staticManifest.images);
        for (const key of keys) {
            const value = staticManifest.images[key];
            console.log('[⚡] Fetching Custom Image: ' + value);
            staticManifest.images[key.toLowerCase()] = await require(`${
                './' + (value || '').replace('@', '')
            }`);
        }
    } catch (error) {
        console.log('[😞] Bad custom image files');
        console.log(error);
    }

    Config.loadedContent = staticManifest;
    return staticManifest;
};

export const loadGems = async (modManifest) => {
    try {
        for (const modname of Object.keys(modManifest.mods)) {
            modController.mods[modname] = modManifest.mods[modname];
            console.log('[💎gems] found gem: ' + modname);

            try {
                console.log(
                    '[💎gems] reading mod manifest: ' + modname + '.json'
                );
                const manifest = require(`${
                    modsRoot + modname + '/' + modname + '.json'
                }`);
                modManifest.mods[modname] = manifest;
            } catch (error) {
                console.log(
                    '[⚠️] WARNING! Failed to load mod manifest for ' +
                        modname +
                        ' information might appear missing'
                );
                console.log(error);
            }

            if (modManifest.mods[modname].main) {
                console.log('[💎gems] loading ' + modname + "'s main.js");
                // eslint-disable-next-line no-loop-func
                let result = await require(`${
                    modsRoot +
                    (modManifest.mods[modname].mainSrc || modname + '/main.js')
                }`);
                console.log('[💎gems] loaded' + modname + "'s main.js");
                modController.modMains[modname] = result.default || result;
            }

            if (
                modManifest.mods[modname].enabled &&
                modManifest.files[modname] !== undefined &&
                modManifest.files[modname].pages !== undefined
            ) {
                modController.modPages[modname] = Object.values(
                    modManifest.files[modname].pages
                ).map((_page) => {
                    console.log('[💎gems] found page: ' + _page);
                    return {
                        page: _page,
                        modname,
                    };
                });
            }
        }

        modController.modManifest = { ...modManifest };

        // Now lets require all the mod pages
        let pages = [];
        for (const newPages of Object.values(modController.modPages)) {
            pages = [...pages, ...newPages];
        }

        const newModPages = {};
        for (const page of pages) {
            try {
                console.log('[💎gems] requiring page: ' + page.page);
                let requirePage = await require(`${
                    modsRoot + page.page.replace('.js', '')
                }`);

                requirePage = requirePage.default || requirePage;
                requirePage.src = page.page;
                requirePage.mod = page.modname;

                if (requirePage.url === undefined) {
                    console.log(
                        '[⚠️] WARNING! Page at ' +
                            (page.id || page.name) +
                            '  does not have url set, registering as virtual gem page'
                    );
                    requirePage = pageController.registerFakePage(requirePage);
                } else {
                    requirePage = pageController.registerPage(
                        requirePage,
                        requirePage.developer === true,
                        null,
                        true
                    );
                }

                if (
                    newModPages[page.modname] === undefined ||
                    Array.isArray(newModPages[page.modname]) !== true
                ) {
                    newModPages[page.modname] = [];
                }

                newModPages[page.modname].push(requirePage);
            } catch (error) {
                console.log('[⚠️] WARNING! could not require: ' + page);
                console.log(error);
            }
        }

        modController.modPages = newModPages;
        modController.modsSuccess = true;
    } catch (error) {
        console.log('[⚠️] WARNING! failure to load gems');
        console.log(error);
    }
};

export const loadResourceStrings = async (resourceFile) => {
    let result = await require('./Resources/' +
        resourceFile.replace(/.js/g, '') +
        '.js');

    Config.resourceFile = result.default || result;
};

/**
 * DAPP ChainID and deployInfo
 */
export let chainId;
export let deployInfo;

/**
 * Holds all of the configuation for the DAPP
 */
export const Config = {
    /**
     * DAPP Settings
     * ============================================================∂========================
     */
    settings: {
        hideFooter: true,
        requireWallet: false,
        production: false,
        showHim: true,
        useLocalProjectURI: false,
        forceLocalContent: false,
        localContentOnLocalhost: true,
        useLocalProjectAsBackup: true,
        projectSpecificMode: false,
        useLocalProjectAsDefault: true,
        useDeployInfoProject: true,
        hideUtilitiesForAdmins: false,
        suggestWallet: true,
        navbarRefreshInterval: 0.1, // Every 10 seconds
        overwriteModules: true, // What ths do?
        maxPathCount: 24,
        forceTokenURIRefresh: false,
        marketplaceEnabled: true, // Make sure you have marketplace contract deployed
        errorTimeout: 30, // 10 seconds
        animationSpeed: 175,
        maxTokenCount: 8, // MUST BE LESS THAN THE LOWER VALUE ELSE WILL CAUSE ERRORS!
        saveTokenRange: 100, // Will keep 100 tokens in local storage. Removing the oldest one first to keep it under this amount.
        maxPathSize: 1024 * 128, // 128kb MUST BE SMALLER THAN MAX STICKER SIZE!!!
        maxStickerSize: 1024 * 152, // 152kb
        txWait: 60, // Wait 60 seconds before warning of lost tx
        apiServer: 'https://localhost:7000',
        openseaCollection: 'https://opensea.io/MaskMode',
        discordInvite: 'https://discord.gg/2UhRtqmDcP',
        twitter: 'https://twitter.com/0x0zAgency',
        ipfsNode: 'https://dweb.link/ipfs/',
        cacheLength: 1000 * 60 * 15, // 30 mins
        useOldColours: false,
        blockRange: 16,
        url: 'https://awedacity.infintiymint.app', // Full URL no trailing slashes /
        environments: [
            {
                name: 'TokenURI',
                type: 'Vector Image',
                assets: ['svg'],
                disabled: false,
            },
            {
                name: 'Decentraland',
                type: '3D Model',
                assets: ['model'],
                disabled: true,
            },
            {
                name: 'Source 1',
                type: 'Valve 3D Model',
                assets: ['model'],
                disabled: true,
            },
            {
                name: 'Unity',
                type: '3D Model',
                assets: ['model'],
                disabled: true,
            },
            {
                name: 'Unreal 5',
                type: '3D Model',
                assets: ['model'],
                disabled: true,
            },
            {
                name: 'Low-Quality Audio (w/ Cover)',
                type: 'MP3 92kbps (length restricted)',
                assets: ['sound'],
                disabled: true,
            },
            {
                name: 'Mid-Quality Audio (w/ Cover)',
                type: 'MP3 190kbps (length restricted)',
                assets: ['sound'],
                disabled: true,
            },
            {
                name: 'High-Quality Audio (w/ Cover)',
                type: 'MP3 320kbps (length restricted)',
                assets: ['sound'],
                disabled: true,
            },
            {
                name: 'Ultra-Quality Audio (w/ Cover)',
                type: 'FLAC Audio (unrestricted)',
                assets: ['sound'],
                disabled: true,
            },
        ],
        galleryCategories: ['💎', '💎💎', '💎💎💎', '💎💎💎💎', '💎💎💎💎💎'],
        maxButtons: [2, 4, 6, 8, 10, 12, 24, 52, 64],
        galleryOrderBy: ['Creation', 'Owner', 'Stickers'],
        stickerOrderBy: ['Created', 'Size'],
        transactionsOrderBy: ['Date', 'Method', 'Value'],
        localProject: 'SR22_RarityImage', // Overwritten by .deployInfo
    },

    /**
     * Pages
     * ====================================================================================
     */
    hiddenPages: [],

    /**
     * Networks
     * ====================================================================================
     */
    networks: {
        1337: {
            name: 'Ganache',
            tokenscan: 'https://',
            token: 'eth',
            exchange: '',
            openseaAssets: '',
            gasPrices: {
                fast: 2 * 1e9,
                medium: 1.5 * 1e9,
                slow: 1 * 1e9,
            },
            useAllEvents: false,
        },
        1: {
            name: 'Ethereum',
            tokenscan: 'https://etherscan.io/',
            token: 'eth',
            exchange: '',
            async getGasPrices() {
                let result = await fetch(
                    'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH'
                );
                result = await result.json();

                if (result.status !== '1') {
                    return {
                        fast: 10 * 1e9,
                        medium: 10 * 1e9,
                        slow: 10 * 1e9,
                    };
                }

                return {
                    fast: Math.round(result.result.FastGasPrice * 1e9),
                    medium: Math.round(result.result.SafeGasPrice * 1e9),
                    slow: Math.round(result.result.SafeGasPrice * 1e9),
                };
            },
            openseaAssets: 'https://testnets.opensea.io/assets/',
            useAllEvents: false,
        },
        3: {
            name: 'Ropsten',
            tokenscan: 'https://ropsten.etherscan.io/',
            token: 'eth',
            exchange: '',
            async getGasPrices() {
                console.log(
                    '[⚠️] Using ethereum mainnet gas prices for ropsten'
                );
                let result = await fetch(
                    'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH'
                );
                result = await result.json();

                if (result.status !== '1') {
                    return {
                        fast: 1 * 1e9,
                        medium: 2 * 1e9,
                        slow: 3 * 1e9,
                    };
                }

                return {
                    fast: Math.round(result.result.FastGasPrice * 1e9),
                    medium: Math.round(result.result.SafeGasPrice * 1e9),
                    slow: Math.round(result.result.SafeGasPrice * 1e9),
                };
            },
            openseaAssets: 'https://testnets.opensea.io/assets/',
            useAllEvents: false,
        },
        4: {
            name: 'Rinkeby',
            tokenscan: 'https://rinkeby.etherscan.io/',
            token: 'eth',
            exchange: '',
            async getGasPrices() {
                console.log(
                    '[⚠️] Using ethereum mainnet gas prices for ropsten'
                );
                let result = await fetch(
                    'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH'
                );
                result = await result.json();

                if (result.status !== '1') {
                    return {
                        fast: 1 * 1e9,
                        medium: 2 * 1e9,
                        slow: 3 * 1e9,
                    };
                }

                return {
                    fast: Math.round(result.result.FastGasPrice * 1e9),
                    medium: Math.round(result.result.SafeGasPrice * 1e9),
                    slow: Math.round(result.result.SafeGasPrice * 1e9),
                };
            },
            openseaAssets: 'https://testnets.opensea.io/assets/',
            useAllEvents: true,
        },
        5: {
            name: 'Goerli',
            tokenscan: 'https://goerli.etherscan.io/',
            token: 'eth',
            exchange: '',
            gasPrices: {
                fast: 3 * 1e9,
                medium: 2 * 1e9,
                slow: 1 * 1e9,
            },
            openseaAssets: 'https://testnets.opensea.io/assets/goerli/',
            useAllEvents: false,
        },
        80001: {
            name: 'Polygon Mumbai',
            tokenscan: 'https://mumbai.polygonscan.com/',
            token: 'matic',
            exchange: '',
            openseaAssets: '',
            gasPrices: {
                fast: 30 * 1e9,
                medium: 27.5 * 1e9,
                slow: 25 * 1e9,
            },
            async getGasPrices() {
                console.log(
                    '[⚠️] Using polygon mainnet gas prices for rinkeby'
                );
                let result = await fetch(
                    'https://gasstation-mainnet.matic.network/v2'
                );
                result = await result.json();

                return {
                    fast: Math.round(result.fast.maxFee * 1e9),
                    medium: Math.round(result.standard.maxFee * 1e9),
                    slow: Math.round(result.safeLow.maxFee * 1e9),
                };
            },
            useAllEvents: true, // Subscribing to event methods on the contract does not work on Polygon subchains so internally we use AllEvents see controller/js:248
        },
        137: {
            name: 'Polygon',
            tokenscan: 'https://polygonscan.com/',
            token: 'matic',
            exchange: '',
            openseaAssets: 'https://opensea.io/assets/matic/',
            gasPrices: {
                fast: 30 * 1e9,
                medium: 27.5 * 1e9,
                slow: 25 * 1e9,
            },
            async getGasPrices() {
                let result = await fetch(
                    'https://gasstation-mainnet.matic.network/v2'
                );
                result = await result.json();

                return {
                    fast: Math.round(result.fast.maxFee * 10 ** 9),
                    medium: Math.round(result.standard.maxFee * 10 ** 9),
                    slow: Math.round(result.safeLow.maxFee * 10 ** 9),
                };
            },
            useAllEvents: true, // Subscribing to event methods on the contract does not work on Polygon subchains so internally we use AllEvents see controller/js:248
        },
    },

    /**
     * Resources
     * ====================================================================================
     */
    // references a resource file inside of the resources folder
    // you can use this to change the language of the site or implement custom text with out editing react code
    resources: 'default_awedacity', // You don't need to put the .js but you can.

    /**
     * Gas Limits
     * ====================================================================================
     */
    useGasLimitEstimates: true, // Pull from receipt file
    gasLimit: {
        preview: 1_500_000,
        mint: 1_250_000,
        mintPreview: 750_000,
    },

    /**
     * Misc
     * ====================================================================================
     */
    loadReasons: [
        'Preparing Bitcoin Ramen...',
        'Abstracting Core Principles...',
        'Injecting Mantas DNA Into People...',
        'Resurrecting Christ And Minting Him To The Blockchain...',
        'Rolling Up A Joint, Sec...',
        'Assembling Battle Robots...',
        'Generating Sad Panda Dalle-2 Outputs...',
        'Checking For Splunge Buildups...',
        'Crying...',
    ],
    credits: {
        llydiaTwitter: '',
        joshTwitter: '',
        agencyTwitter: '',
    },
    dataReader: {
        readAsText: ['svg', 'tinysvg', 'xml', 'html', 'text'],
        readAsDataURL: ['jpg', 'jpeg', 'gif', 'png'],
    },

    /**
     * Gems
     * ====================================================================================
     */
    defaultSet: 'AwE',
    sets: {
        AwE: 'MTY3NDA2NDAzNzIzOC4xOTUz',
    },

    /**
     * Onboard Settings
     * ====================================================================================
     */
    onboardApiKey: 'a67bbab8-49d6-4fb3-88d3-2446be6c37d7',

    /**
     * Do not edit below this line
     * ====================================================================================
     * Ignore and do not change these!
     * ====================================================================================
     */
    tokenMap: {
        pathId: 'pathId',
        pathSize: 'pathSize',
        tokenId: 'previewId',
        owner: 'owner',
        colours: 'colours',
        mintData: 'mintData',
        assets: 'assets',
        names: 'names',
        destinations: 'destinations',
    },
    events: {
        InfinityMint: {
            Mint: 'TokenMinted',
            PreviewMint: 'TokenPreviewMinted',
            Preview: 'TokenPreviewComplete',
        },
        EADStickers: {
            RequestAccepted: 'EASRequestAccepted',
            RequestWithdrew: 'EASRequestWithdrew',
            RequestDenied: 'EASRequestDenied',
            RequestAdded: 'EASRequestAdded',
        },
        Stickers: {
            RequestAccepted: 'EASRequestAccepted',
            RequestWithdrew: 'EASRequestWithdrew',
            RequestDenied: 'EASRequestDenied',
            RequestAdded: 'EASRequestAdded',
        },
        Mod_Marketplace: {
            Offer: 'Offer',
            AwaitingTransfer: 'AwaitingTransfer',
            TransferConfirmed: 'TransferConfirmed',
        },
    },
    deployInfo: {},
    tokenMethodScripts: {},
    // Only change these if you know what ya doin!
    requiredChainId: 1337, // If .chainId exists in deployments this will be overshadowed
    resourceFile: {},
    loadedContent: {},
    isBadStaticManifest: false,
    nullAddress: '0x0000000000000000000000000000000000000000',

    /**
     * Returns true if api is enabled in deployInfo and there is a public key defined
     * does not check for vailidity of API key
     * @returns
     */
    isApiEnabled() {
        return (
            Config.deployInfo?.api?.enabled === true &&
            Config.deployInfo.api.publickey !== undefined
        );
    },

    /**
     * returns the current name of the project
     * @returns
     */
    getProjectName() {
        return Config?.deployInfo?.project || Config.settings.localProject;
    },

    /**
     * Reads an ABI from the deployments folder, non promise
     * @param {*} contract
     * @returns
     */
    getDeployment(contract) {
        const split = contract.split('.');
        if (split.length !== 1) {
            contract = split[1];
        }

        let path = Config.settings.projectSpecificMode
            ? Config.getProjectName() + '/'
            : '';

        return require(`${
            (Config.settings.production
                ? deploymentsRoot
                : deploymentsProductionRoot) +
            path +
            contract +
            '.json'
        }`);
    },

    /**
     *
     * @returns
     */
    getNetwork() {
        return (
            Config.networks[Config.requiredChainId] || {
                name: 'Unknown',
            }
        );
    },

    /**
     *
     * @returns
     */
    getGasPrices() {
        return Config.networks[Config.requiredChainId].gasPrices || {};
    },

    /**
     * Loads gas prices from the network config
     */
    async loadGasPrices() {
        const _ = Config.networks[Config.requiredChainId] || {};

        if (_.getGasPrices !== undefined) {
            try {
                Config.networks[Config.requiredChainId].gasPrices =
                    await _.getGasPrices();

                if (
                    typeof Config.networks[Config.requiredChainId].gasPrices !==
                    'object'
                ) {
                    throw new TypeError('not an object');
                }
            } catch {
                console.log('[😞] failed to load gas price');
                Config.networks[Config.requiredChainId].gasPrices = {};
            }
        }

        if (
            _.gasPrices === undefined ||
            Object.values(_.gasPrices).length === 0
        ) {
            Config.networks[Config.requiredChainId].gasPrices = {
                fast: 1,
                medium: 1,
                slow: 1,
            };
        }
    },

    getGasPrice(type = undefined) {
        if (Config.getNetwork() === undefined) {
            return 22 * 1e9;
        }

        if (type === undefined) {
            return Config.getNetwork().gasPrice || undefined;
        }

        try {
            return Config.getNetwork()?.gasPrices[type];
        } catch (error) {
            console.log(error);
        }

        return 22 * 1e9;
    },

    /**
     * Reads a project URI
     * @param {string} fileName
     * @returns
     * @private
     */
    async getProjectURI(fileName, isJson = false) {
        let result;
        result = await require(`${
            './Deployments/projects/' + (isJson ? fileName + '.json' : fileName)
        }`);

        result = result?.default || result;

        if (
            fileName !== 'default' &&
            Config.settings.overwriteModules &&
            result.modules !== undefined
        ) {
            Config.deployInfo.modules = { ...result.modules };
        }

        return result;
    },

    /**
     * Returns a background from the projects resources
     */
    getBackground() {
        return (
            Config.loadedContent.background?.default ||
            Config.loadedContent.defaultImage?.default
        );
    },

    /**
     * Returns a header background from the projects resources
     * @returns
     */
    getHeaderBackground() {
        return (
            Config.loadedContent.headerBackground?.default ||
            Config.loadedContent.defaultImage?.default
        );
    },

    /**
     * Returns a base64 encoded image from the projects resources
     * @param {string} image
     * @returns
     */
    getImage(image) {
        return (
            Config.loadedContent?.images[image.toLowerCase()]?.default ||
            Config.loadedContent.defaultImage?.default
        );
    },
    /**
     * Loads deployInfo, chainId and project as well as the project specific settings and resource files, must be called immediately before the app is started
     */
    async load() {
        // Set up the chainId
        try {
            const {
                deployInfo,
                staticManifest,
                defaultStaticManifest,
                pages,
                modManifest,
                tokenMethodManifest,
            } = await requireModules();

            Config.deployInfo = deployInfo;
            console.log('[📙] Requiring token methods');
            await loadTokenMethods(tokenMethodManifest);
            console.log('[📙] Requiring resource strings');
            await loadResourceStrings(Config.resources);
            console.log('[📙] Requiring pages');
            await loadPages(pages);
            console.log('[📙] Requiring gems');
            await loadGems(modManifest);
            console.log('[📙] Requiring Static Manifest Assets');
            await loadStaticManifest(staticManifest);
        } catch (error) {
            console.log(error);
        }
    },
};
export default Config;
