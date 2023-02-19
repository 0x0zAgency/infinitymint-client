import web3 from 'web3';
import Onboard from 'bnc-onboard';
import tinySVG from './tinysvg.js';
import StorageController from './storageController.js';
import { getStickers, tryDecodeURI, unpackColours } from './helpers.js';
import tokenMethods from './tokenMethods.js';

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info
 *
 **/
export const Base64 = {
    // Private property
    _keyStr:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    // Public method for encoding
    encode(input) {
        let output = '';
        let chr1;
        let chr2;
        let chr3;
        let enc1;
        let enc2;
        let enc3;
        let enc4;
        let i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output =
                output +
                this._keyStr.charAt(enc1) +
                this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) +
                this._keyStr.charAt(enc4);
        } // Whend

        return output;
    }, // End Function encode

    // public method for decoding
    decode(input) {
        let output = '';
        let chr1;
        let chr2;
        let chr3;
        let enc1;
        let enc2;
        let enc3;
        let enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z\d+/=]/g, '');
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output += String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output += String.fromCharCode(chr2);
            }

            if (enc4 !== 64) {
                output += String.fromCharCode(chr3);
            }
        } // Whend

        output = Base64._utf8_decode(output);

        return output;
    }, // End Function decode

    // private method for UTF-8 encoding
    _utf8_encode(string) {
        let utftext = '';
        string = string.replace(/\r\n/g, '\n');

        for (let n = 0; n < string.length; n++) {
            const c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        } // Next n

        return utftext;
    }, // End Function _utf8_encode

    // private method for UTF-8 decoding
    _utf8_decode(utftext) {
        let string = '';
        let i = 0;
        let c;
        let c1;
        let c2;
        let c3;
        c = c1 = c2 = 0;

        while (i < utftext.length) {
            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if (c > 191 && c < 224) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(
                    ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
                );
                i += 3;
            }
        } // Whend

        return string;
    }, // End Function _utf8_decode
};

/**
 * Web3 Controller Class
 *      Llydia Cross 2022
 */

export class Controller {
    Base64; // For accessing in tokenMethod scripts
    StorageController; // For accesing in tokenMethod scripts
    /**
     * @type {import('./utils/config')}
     */
    Config;

    // Public
    /**
     * @var web3
     */
    web3 = null;
    walletError = null;
    isLoading = false;
    isAdmin = false;
    isWeb3Valid = false;
    isWalletValid = false;
    accounts = [];
    onboard = null;
    lastAction = {};
    defaultProjectURI = {};
    localProjectURI = {};
    paths = {};
    nullAddress = '0x0000000000000000000000000000000000000000';

    // Private
    #events = {};
    #instances = {};
    // Set in initializeControllerData
    #abis;
    // Set in initializeControllerData
    #preloadVariables;
    #preloadInterval; // This is useful ignore vscodes lies

    constructor() {
        this.Base64 = Base64;
        this.StorageController = StorageController;

        try {
            // Registers a conversion/parse method for SVG style tag with tinySVG
            tinySVG.registerTag(
                [
                    'style',
                    (properties) => ({
                        tag: 'style',
                        properties: { ...properties },
                    }),
                ],
                [
                    'style',
                    (properties) => [
                        'style',
                        tinySVG.collapseProperties(properties),
                        `/** Generated ${new Date(Date.now).toDateString()} */`,
                    ],
                ]
            );
        } catch {
            this.log('could not register tinySVG methods');
        }
    }

    setAdmin(value) {
        this.isAdmin = value === true;
    }

    /**
     *
     * @param {*} config
     */
    setConfig(config) {
        if (config.default === undefined)
            throw new Error('please provide the full module');

        this.Config = config;
    }

    /**
     * This is called after we've loaded the .chainId and the .deployInfo file
     */
    loadAbis() {
        this.#abis = {
            // Everything here is loaded instantly
            // these can be invoked through createCntract and just supplying InfnityMintWallet,
            contracts: {
                Fake_InfinityMintWallet: this.Config.default.getDeployment(
                    'Fake_InfinityMintWallet'
                ),
                InfinityMint: this.Config.default.getDeployment('InfinityMint'),
                [this.Config.default.deployInfo.modules.svg ||
                this.Config.default.deployInfo.modules.controller]:
                    this.Config.default.getDeployment(
                        this.Config.default.deployInfo.modules.svg ||
                            this.Config.default.deployInfo.modules.controller
                    ),
                InfinityMintApi:
                    this.Config.default.getDeployment('InfinityMintApi'),
                InfinityMintProject: this.Config.default.getDeployment(
                    'InfinityMintProject'
                ),
                InfinityMintLinker:
                    this.Config.default.getDeployment('InfinityMintLinker'),
            },
        };
    }

    /**
     * NOTE: Please cold somebody enlighten me on how to unpack an array as arguments into a method?
     * I tried using .call() but it needs this passed as the first argument which in this case is a web3.js class and it didn't
     * work so I just did this because its faster but it feels very, very dumb. - Lyds
     * @param {string} type
     * @param {string} contract
     * @param {string} method
     * @param {object|string} account
     * @param {Array} args
     * @param {number} value
     * @returns
     * @private
     */
    async executeTransaction(
        type = 'send',
        contract,
        method,
        account,
        args,
        value
    ) {
        let parameters;

        if (Array.isArray(args)) {
            parameters = [...args].filter(
                (value) => value !== undefined && value !== null
            );
        } else {
            parameters = (args.parameters || []).filter(
                (value) => value !== undefined && value !== null
            );
        }

        if (args.loadGasPrice) {
            await this.Config.default.loadGasPrices().catch((error) => {
                this.log('could not get updated gas prices');
                this.log(error, 'error');
            });
        }

        this.log(
            'sending ' + type + ' transaction to ' + method + ' at ' + contract,
            'transaction'
        );

        const gasPrice =
            args.gasPrice ||
            (type === 'send'
                ? this.Config.default.getGasPrice(
                      StorageController.getGlobalPreference('gasSetting') ||
                          'medium'
                  )
                : undefined);

        if (args.gasLimit !== undefined) {
            args.gasLimit = Math.round(args.gasLimit);
        }

        // If no parameters
        if (parameters.length === 0) {
            console.log(this.#instances);
            return await this.#instances[contract].methods[method]()[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
                gasLimit: args.gasLimit || 1_256_024,
            });
        }

        // If 1
        if (parameters.length === 1) {
            return await this.#instances[contract].methods[method](
                parameters[0]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 2
        if (parameters.length === 2) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 3 - inspired by YandereDev
        if (parameters.length === 3) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 4 - inspired by YandereDev
        if (parameters.length === 4) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2],
                parameters[3]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 5 - inspired by YandereDev
        if (parameters.length === 5) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2],
                parameters[3],
                parameters[4]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 5 - inspired by YandereDev
        if (parameters.length === 6) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2],
                parameters[3],
                parameters[4],
                parameters[5]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 5 - inspired by YandereDev
        if (parameters.length === 7) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2],
                parameters[3],
                parameters[4],
                parameters[5],
                parameters[6]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        // If 5 - inspired by YandereDev
        if (parameters.length === 8) {
            return await this.#instances[contract].methods[method](
                parameters[0],
                parameters[1],
                parameters[2],
                parameters[3],
                parameters[4],
                parameters[5],
                parameters[6],
                parameters[7]
            )[type]({
                from: account.address || account,
                value,
                gas: args.gas || undefined,
                gasPrice,
            });
        }

        throw new Error('Unsupported parameter length');
    }

    /**
     * Gets the paths associated with a token
     * @param {*} pathId
     * @returns
     */

    getPaths(pathId) {
        const objectURI = this.getProjectSettings();

        if (this.paths[pathId] !== undefined) {
            return this.getTinySVGFromPath(this.paths[pathId].paths);
        }

        if (objectURI.paths[pathId] === undefined) {
            return this.getTinySVGFromPath(objectURI.paths.default.paths);
        }

        return this.getTinySVGFromPath(objectURI.paths[pathId].paths);
    }

    getPathRarity(pathId) {
        const objectURI = this.getProjectSettings();
        const values = Object.values(objectURI.paths);

        for (const value of values) {
            if (value.pathId === Number.parseInt(pathId)) {
                return value.rarity;
            }
        }

        return undefined;
    }

    /**
     * Attempts to get tinySVG from a path object in the project settings. Since it can be either a string of tinySVG or an object
     * @param {string|object} paths
     * @returns
     */
    getTinySVGFromPath(paths) {
        if (typeof paths === 'object') {
            return paths.data;
        }

        if (!paths.includes('{')) {
            try {
                const decoded = JSON.parse(paths);
                return decoded.data;
            } catch {
                this.log('Path probably isnt JSON and is raw', 'warning');
                return paths;
            }
        }
    }

    /**
     * Updates the tokenURI of a token (will start a wallet transaction)
     * @param {*} tokenId
     */
    async updateTokenURI(tokenId) {
        const token = this.getStoredToken(tokenId).token.token;
        const encodedResult = this.createTokenURI(token);

        // Upload to IPFS if above kb
        await this.sendMethod(this.accounts[0], 'InfinityMint', 'setTokenURI', {
            parameters: [tokenId, encodedResult],
        });
    }

    getTokenMethodInterface() {
        return tokenMethods.interface;
    }

    getTokenMethodType() {
        return (tokenMethods.interface.type || 'unknown').toLowerCase();
    }

    /**
     *
     * @param {*} token
     * @param {*} renderedToken
     * @param {*} returnEncoded
     * @param {*} settings
     * @returns
     */
    async createTokenURI(
        token,
        renderedToken,
        returnEncoded = true,
        settings = {}
    ) {
        const stickers = await getStickers(token.tokenId);
        const object = tokenMethods.createTokenURI(
            this,
            renderedToken,
            token,
            stickers,
            settings
        );
        if (!returnEncoded) {
            return object;
        }

        return (
            'data:application/json;base64,' +
            Base64.encode(JSON.stringify(object))
        );
    }

    /**
     * Will return null if it does not exist / reverted
     * @param {number} tokenId
     * @returns
     */
    async getTokenFromContract(tokenId) {
        try {
            const result = await this.callMethod(
                this.accounts[0],
                'InfinityMintApi',
                'getRaw',
                {
                    parameters: [tokenId],
                }
            );
            // Mimics how it looks when its returned by an event
            return [
                null,
                {
                    returnValues: [tokenId, result],
                },
            ];
        } catch (error) {
            console.log(error);
            this.log(error, 'error');
            return null;
        }
    }

    /**
     *
     * @param {number} tokenId
     * @returns
     */
    async tryGetToken(tokenId) {
        const result = await this.getTokenFromContract(tokenId);

        if (result !== null) {
            this.storeToken(result[1], 'result', 'result');
            return true;
        }

        return false;
    }

    /**
     *
     * @param {number} tokenId
     * @returns
     */
    getStoredToken(tokenId) {
        if (StorageController.values.tokens[tokenId] === undefined) {
            throw new Error('Bad token');
        }

        const token = StorageController.values.tokens[tokenId];
        return token;
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * @param {object} result
     */
    storePreview(result) {
        if (result.returnValues !== undefined) {
            result = result.returnValues[1];
        }

        StorageController.values.previews = {
            source: 'event',
            address: this.accounts[0],
            date: Date.now(),
            // TODO: Get the reset time from the blockchain
            validTill: Date.now() + this.getContractValue('previewTimeout'),
            previews: result,
        };

        StorageController.saveData();
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * @param {number} tokenId
     * @param {*} key
     * @returns
     */
    toggleFlag(tokenId, key) {
        if (
            StorageController.values.tokens === undefined ||
            StorageController.values.tokens[tokenId] === undefined
        ) {
            return;
        }

        if (StorageController.values.tokens[tokenId].flags === undefined) {
            StorageController.values.tokens[tokenId].flags = {};
        }

        StorageController.values.tokens[tokenId].flags[key] =
            StorageController.values.tokens[tokenId].flags[key] === undefined
                ? true
                : !StorageController.values.tokens[tokenId].flags[key];
        StorageController.saveData();
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * @param {number} tokenId
     * @param {*} key
     * @paral {bool} value
     * @returns
     */
    setFlag(tokenId, key, value) {
        if (value !== true && value !== false) {
            throw new Error('invalid value');
        }

        if (
            StorageController.values.tokens === undefined ||
            StorageController.values.tokens[tokenId] === undefined
        ) {
            return;
        }

        if (StorageController.values.tokens[tokenId].flags === undefined) {
            StorageController.values.tokens[tokenId].flags = {};
        }

        StorageController.values.tokens[tokenId].flags[key] = value;
        StorageController.saveData();
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * returns true if they have that flag
     * @param {number} tokenId
     * @param {*} key
     * @returns
     */
    hasFlag(tokenId, key) {
        if (
            StorageController.values.tokens === undefined ||
            StorageController.values.tokens[tokenId] === undefined ||
            StorageController.values.tokens[tokenId].flags === undefined
        ) {
            return false;
        }

        return StorageController.values.tokens[tokenId].flags[key] === true;
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * @param {number} tokenId
     * @param {*} key
     * @param {bool} condition
     * @returns
     */
    hasFlagToggle(tokenId, key, condition = true) {
        if (
            StorageController.values.tokens === undefined ||
            StorageController.values.tokens[tokenId] === undefined ||
            StorageController.values.tokens[tokenId].flags === undefined
        ) {
            return false;
        }

        if (StorageController.values.tokens[tokenId].flags[key] === condition) {
            this.toggleFlag(tokenId, key);
            return true;
        }

        return false;
    }

    /**
     * NOTE: maybe this need to be in StorageController class?
     * Automatically saves
     *
     * NOTE: if return object (4th arg) is true will return object
     * @param {*} result
     * @param {*} source
     * @param {*} from
     * @returns {number|object}
     */

    storeToken(result, source = 'event', from = 'mint', flags = undefined) {
        // Index 0 is error, index 1 is the token
        // save the token under its token ID
        const tokenId = Number.parseInt(result.returnValues[0]);
        const object = {
            ...StorageController.values?.tokens[tokenId],
            source,
            from,
            flags:
                flags || StorageController.values?.tokens[tokenId]?.flags || {},
            date: Date.now(),
            originalDate:
                StorageController.values?.tokens[tokenId]?.originalDate ||
                Date.now(),
            validTill:
                Date.now() +
                this.Config.default.settings.cacheLength +
                (Math.random() * 6 + 1) * 1000 * 60, // So they all don't hit at once
            token: {
                tokenId,
                token: { ...this.decodeToken(result.returnValues[1]) },
                // Keep stickers intact
                stickers: {
                    ...StorageController.values.tokens[tokenId]?.token
                        ?.stickers,
                },
            },
        };

        console.log(object);

        StorageController.values.tokens[tokenId] = object;
        StorageController.saveData();

        return tokenId;
    }

    /**
     *
     * @param {object} token
     * @param {string} type
     * @returns
     */
    getTokenExtraColour(token, type = 'background', preverseAlpha = false) {
        const pathSize = Number.parseInt(token.pathSize || 0);
        let result;

        if (token.colours === undefined || token.colours.length === 0) {
            return tinySVG.toHexFromDecimal(0);
        }

        switch (type) {
            case 'background': {
                result = tinySVG.toHexFromDecimal(token.colours[pathSize] || 0);
                break;
            }

            case 'stroke': {
                result = tinySVG.toHexFromDecimal(
                    token.colours[pathSize + 1] || 0
                );
                break;
            }

            case 'text': {
                result = tinySVG.toHexFromDecimal(
                    token.colours[pathSize + 2] || 0
                );
                break;
            }

            case 'shadow': {
                result = tinySVG.toHexFromDecimal(
                    token.colours[pathSize + 3] || 0
                );
                break;
            }

            case 'border_1': {
                result = tinySVG.toHexFromDecimal(
                    token.colours[pathSize + 4] || 0
                );
                break;
            }

            case 'border_2': {
                result = tinySVG.toHexFromDecimal(
                    token.colours[pathSize + 5] || 0
                );
                break;
            }

            default: {
                result = '#000000';
            }
        }

        if (preverseAlpha) {
            return result;
        }

        return result.padEnd(7, 'F');
    }

    /**
     * @param {string} event
     * @returns
     */

    getEventErrorKey(event) {
        return event + '_Error';
    }

    /**
     * Renders a token using its tokenMethod
     * @param {object} token
     * @returns
     */
    renderToken(token, stickers = [], settings) {
        return tokenMethods.getRenderedToken(token, stickers, settings);
    }

    /**
     *
     * @param {*} renderedToken
     * @param {*} token
     * @param {*} stickers
     * @returns
     */
    async callPostRenderToken(renderedToken, token, stickers, settings = {}) {
        return tokenMethods.postRenderToken(
            this,
            renderedToken,
            token,
            stickers,
            settings
        );
    }

    /**
     *
     * @param {*} renderedToken
     * @param {*} token
     * @param {*} stickers
     * @returns
     */
    async callUpdateToken(renderedToken, token, stickers, settings = {}) {
        return tokenMethods.updateToken(
            this,
            renderedToken,
            token,
            stickers,
            settings
        );
    }

    /**
     *
     * @param {*} renderedToken
     * @param {*} token
     * @param {*} stickers
     * @returns
     */
    callTokenUnmount(renderedToken, token, stickers, settings = {}) {
        return tokenMethods.tokenUnmount(
            this,
            renderedToken,
            token,
            stickers,
            settings
        );
    }

    /**
     * Gets the value of the viewbox from the token
     * @param {string|object} token
     * @returns
     */
    getTokenViewbox(token) {
        let map;
        if (typeof token.token === 'object') {
            token = token.token;
        }

        const settings = this.getPathSettings(token.pathId);
        map = tinySVG.readTinySVG(this.getPaths(token.pathId));

        if (map[0] === undefined || map[0].tag !== 'h') {
            return settings.viewbox || '0 0 800 600';
        }

        return settings.viewbox || map[0]?.properties?.viewbox !== undefined
            ? tryDecodeURI(map[0]?.properties?.viewbox)
            : '0 0 800 600';
    }

    /**
     *
     * @param {string} pathSettings
     * @returns
     */
    getCSSProperties(pathSettings) {
        let string_ = '';
        for (const value of Object.keys(pathSettings)) {
            string_ += `${value}: ${pathSettings[value].replace('"', "'")};`;
        }

        return string_;
    }

    /**
     *
     */
    mapWindowMethods() {
        window.addEventListener('resize', () => {
            try {
                tokenMethods.onWindowResize(Controller);
            } catch (error) {
                this.log('failed to call resize on tokenMethods', 'warning');
                console.log(error);
            }
        });
    }

    /**
     *
     * @param {string} tokenId
     * @returns
     */

    getCollectionURL(tokenId) {
        return (
            this.Config.default.getNetwork().openseaAssets +
            this.#abis.contracts.InfinityMint.address +
            '/' +
            tokenId
        );
    }

    /**
     *
     * @param {string} encodedData
     * @param {bool} convertToUFT8
     * @param {bool} implodeNames
     * @returns
     */
    decodeToken(
        encodedData,
        convertToUFT8 = true,
        implodeNames = true,
        preview = false
    ) {
        const result = this.decodeAbi(
            encodedData,
            [
                'uint64', // PathId
                'uint64', // PathSize
                'uint64', // TokenKid
                'address', // Owner address
                'bytes', // Colours
                'bytes', // MintData
                'uint64[]', // Assets
                'string[]', // Names
                'address[]', // Destinations
            ],
            convertToUFT8,
            implodeNames,
            [
                'pathId',
                'pathSize',
                preview ? 'previewId' : 'tokenId',
                'owner',
                'colours',
                'mintData',
                'assets',
                'names',
                'destinations',
            ]
        );

        const project = this.getProjectSettings();

        let encoding = ['uint64[]'];
        if (project?.encoding?.colours !== undefined) {
            encoding = [...project?.encoding?.colours];
        }

        let colours = [];
        if (Array.isArray(result.colours) !== true) {
            result.colours = this.web3.eth.abi.decodeParameters(
                encoding,
                result.colours
            )[0];

            if (!this.Config.default.settings.useOldColours) {
                colours = unpackColours([...result.colours]);
            }
        }

        try {
            result.mintData = JSON.parse(
                this.web3.utils.hexToAscii(result.mintData)
            );
        } catch (error) {
            this.log('warning: could not decode parseData for ' + result[0]);
            this.log(error, 'error');
        }

        return { ...result, colours };
    }

    /**
     *
     * @param {string} encodedData
     * @param {bool} convertToUFT8
     * @param {bool} implodeNames
     * @returns
     */
    decodeRequest(encodedData, convertToUFT8 = true, implodeNames = true) {
        return this.decodeAbi(
            encodedData,
            [
                'uint256', // Price
                'address', // Address
                'bytes', // Packed sticker
            ],
            convertToUFT8,
            implodeNames,
            ['price', 'address', 'request']
        );
    }

    /**
     *
     * @param {string} encodedData
     * @param {bool} convertToUFT8
     * @param {bool} implodeNames
     * @returns
     */
    decodeSticker(encodedData, convertToUFT8 = true, implodeNames = true) {
        return this.decodeAbi(
            encodedData,
            [
                'uint64', // TokenId
                'string', // CheckSum
                'string', // Object
                'address', // Owner
            ],
            convertToUFT8,
            implodeNames,
            ['tokenId', 'checksum', 'sticker', 'owner']
        );
    }

    /**
     *
     * @param {string} encodedData
     * @param {Array} params
     * @param {bool} convertToAscii
     * @param {bool} implodeNames
     * @param {Array} keyMap
     * @returns
     */

    decodeAbi(
        encodedData,
        parameters = [],
        convertToAscii = true,
        implodeNames = true,
        keyMap = []
    ) {
        let result;
        result =
            Array.isArray(encodedData) !== true
                ? this.web3.eth.abi.decodeParameters(parameters, encodedData)
                : encodedData;

        const object = { ...result };
        for (let [index, value] of Object.entries(result)) {
            if (isNaN(index)) {
                continue;
            }

            index = Number.parseInt(index);

            if (keyMap[index] !== undefined) {
                object[keyMap[index]] = value;
            }
        }

        if (convertToAscii && object.token !== undefined) {
            object.token = this.web3.utils.toAscii(object.token);
        }

        const path = this.getPathSettings(object.pathId);

        if (object.names !== undefined) {
            let names;
            names = path.addPathToName
                ? [...object.names, path.name]
                : [...object.names];

            object.names = names;

            if (implodeNames) {
                object.name = object.names.join(' ');
            }
        }

        return object;
    }

    // Want to add new events? check src/this.Config.default.js => events array
    setupEvents(contract = 'InfinityMint') {
        for (const event of Object.values(
            this.Config.default.events[contract.replace('Fake_', '')]
        )) {
            this.#instances[contract].events[event]((error, events) => {
                if (!this.Config.default.getNetwork().useAllEvents) {
                    this.pushToEvent(event, error, events);
                }
            });
        }
    }

    pushToEvent(event, error, events) {
        if (this.#events[event] === undefined) {
            this.#events[event] = {};
        }

        this.#events[event][
            events?.id || 'item_' + this.getLengthOfEvent(event)
        ] = [error, events];
    }

    /**
     *
     * @param {string} key
     * @returns
     */
    getContractValue(key) {
        if (this.#preloadVariables?.values[key] === undefined) {
            return 0;
        }

        return this.#preloadVariables.values[key];
    }

    /**
     * Loads onboard JS
     */
    initializeOnboardJs(chainId = undefined) {
        this.onboard = Onboard({
            dappId: this.Config.default.onboardApiKey,
            networkId: chainId || this.Config.default.requiredChainId,
            subscriptions: {
                wallet: async (wallet) => {
                    // Instantiate web3 when the user has selected a wallet
                    this.instance = new web3(wallet.provider);
                    this.instance.eth.transactionConfirmationBlocks = 50;
                },
            },
        });
    }

    /**
     * Non-thrown load
     * @returns bool
     */
    async tryWallet() {
        try {
            this.isWalletValid = await this.loadWallet();
        } catch (error) {
            this.log('WALLET VAILED TO VALIDATE');
            this.log(error, 'error');
            this.isWalletValid = false;
        }

        // If we have an invalid wallet then we need to "onboard" then aka show the onboard js pop up
        if (
            !this.isWalletValid &&
            !this.Config.default.settings.requireWallet &&
            StorageController.getGlobalPreference('web3Check') !== true
        ) {
            this.log('[⚠️] Wallet needs onboarding', 'warning');

            if (!(await this.onboardWallet())) {
                return false;
            }

            this.isWalletValid = await this.loadWallet();
        }

        return this.isWalletValid;
    }

    /**
     * Will send to a method to the web3 contract, await specified event to be fired from the contract and return
     * the data fired from the event.
     *
     * @param {object} account
     * @param {string} contract
     * @param {string} method
     * @param {string} event
     * @param {object} args
     * @param {number} value
     * @returns
     */
    async sendAndWaitForEvent(
        account,
        contract,
        method,
        event,
        args = {},
        value = 0,
        saveTx = true
    ) {
        const blockNumber = await this.web3.eth.getBlockNumber();
        const eventError = this.getEventErrorKey(event);

        // Just do it in the background
        this.sendMethod(account, contract, method, args, value)
            .catch((error) => {
                this.pushToEvent(eventError, error, {});
            })
            .then(() => {
                // If we are on polygon we cant just listen for events on the contract so
                // we need to historically pull stuff
                if (this.Config.default.getNetwork().useAllEvents) {
                    this.#instances[contract].events.allEvents(
                        {
                            filter: args.filter || {},
                            fromBlock: blockNumber,
                            to:
                                blockNumber +
                                this.Config.default.settings.blockRange,
                        },
                        (error, events) => {
                            if (error !== null && error.code !== undefined) {
                                this.pushToEvent(eventError, error, events);
                            } else if (events) {
                                if (events.event !== event) {
                                    return;
                                }

                                this.pushToEvent(event, error, events);
                            }
                        }
                    );
                }
            });

        const result = await this.awaitEvent(event, args.timeout || 3000);

        if (saveTx) {
            StorageController.saveTransactionResult(result, method, true);
        }

        return result;
    }

    /**
     * @param {string} eventKey
     * @returns
     * @private
     */

    getLengthOfEvent(eventKey) {
        return this.#events[eventKey] === undefined
            ? 0
            : Object.values(this.#events[eventKey]).length || 0;
    }

    /**
     * @param {*} event
     * @param {*} timeout
     * @returns Promise
     */
    awaitEvent(event, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const eventError = this.getEventErrorKey(event);
            const length = this.getLengthOfEvent(event);
            const lengthError = this.getLengthOfEvent(eventError);

            // Create a new interval which runs each second
            const interval = setInterval(() => {
                // If the lenght of the events array has increased (a new event emitted)
                if (
                    this.#events[event] !== undefined &&
                    length !== this.getLengthOfEvent(event)
                ) {
                    this.log(
                        'transaction event resolved: ' + event,
                        'transaction'
                    );
                    resolve(Object.values(this.#events[event]).pop());
                    clearInterval(interval);
                    return;
                }

                // If there has been an error
                if (
                    this.#events[eventError] !== undefined &&
                    lengthError !== this.getLengthOfEvent(eventError)
                ) {
                    this.log(
                        'transaction event rejected: ' + event,
                        'transaction'
                    );
                    reject(Object.values(this.#events[eventError]).pop());
                    clearInterval(interval);
                    return;
                }

                // If we have timed out
                if (--timeout < 0) {
                    this.log(
                        'transaction event timeout: ' + event,
                        'transaction'
                    );
                    clearInterval(interval);
                    reject('timeout');
                }
            }, 1000);
        });
    }

    /**
     *
     * @param {number} tokenId
     * @param {bool} onlyObject
     * @returns
     */
    async getTokenObject(tokenId, onlyObject = true) {
        let result;
        // If we don't have any tokens or the current token is undefined, get token from the blockchain
        if (
            StorageController.values?.tokens === undefined ||
            StorageController.values.tokens[tokenId] === undefined
        ) {
            result = await this.tryGetToken(tokenId);
        } else if (
            StorageController.values.tokens[tokenId].validTill < Date.now() ||
            this.hasFlagToggle(tokenId, 'reload')
        ) {
            // Else, if its out of date, get it
            result = await this.tryGetToken(tokenId);
        }
        // Else if not, then lets get our stored result
        else {
            return onlyObject
                ? this.getStoredToken(tokenId).token.token
                : this.getStoredToken(tokenId);
        }

        // If the result type is a boolean and it was successful
        if (result === true) {
            return onlyObject
                ? this.getStoredToken(tokenId).token.token
                : this.getStoredToken(tokenId);
        }

        return null;
    }

    makeFakeToken(
        pathId,
        name = undefined,
        signature = undefined,
        colourSeeds = []
    ) {
        const fakeToken = {
            names: [],
            tokenId: Math.floor(Math.random() * 10_000),
            colours: [],
            mintData: {},
            name: name || this.getDescription().token,
            pathId,
            pathSize: 0,
            assets: [1, 4],
            owner: this.accounts[0],
        };

        const projectFile = this.getProjectSettings();
        const pathSize = this?.paths[fakeToken.pathId]?.pathSize || 1;
        const extraColours = projectFile.deployment.extraColours || 6;
        const div = projectFile.deployment?.colourChunkSize;
        let objects = [];
        if (pathSize <= div) {
            objects = [
                colourSeeds[0] || Math.floor(Math.random() * 0xff_ff_ff),
                pathSize,
                signature || Math.floor(Math.random() * 0xff_ff_ff_ff),
                extraColours,
            ];
        } else {
            let groups = 0;
            const div = projectFile.deployment?.colourChunkSize || 4;

            for (let i = 0; i < pathSize; i++) {
                if (i % div === 0) {
                    groups++;
                }
            }

            let count = 0;
            const temporaryPathSize = pathSize;
            let seedCount = 0;
            for (let i = 0; i < groups * 2; i++) {
                if (i % 2 === 0) {
                    objects[i] =
                        colourSeeds[seedCount++] ||
                        Math.floor(Math.random() * 0xff_ff_ff);
                } else {
                    const result = temporaryPathSize - div * count++;
                    objects[i] = result > div ? div : result;
                }
            }

            objects.push(
                signature || Math.floor(Math.random() * 0xff_ff_ff_ff),
                extraColours
            );
        }

        return {
            ...fakeToken,
            compressedColours: objects,
            colours: [...unpackColours(objects)],
            pathSize:
                this?.paths[fakeToken.pathId]?.pathSize === undefined
                    ? 0
                    : this.paths[fakeToken.pathId].pathSize,
        };
    }

    /**
     * Gets all of the tokens attached to an address (our address)
     * @returns object
     */

    async getTokens(maxCount = 64, page = 0, address = null) {
        if (address == null) {
            address = this.accounts[0];
        }

        const objs = {};
        let objectCount = 0;
        if (StorageController.existsAndNotEmpty('tokens'))
            // eslint-disable-next-line
            for (let [key, value] of Object.entries(
                StorageController.values.tokens
            )) {
                try {
                    // We want it to be equal to our current account and the valid time is still greater than now
                    if (
                        value !== undefined &&
                        value.token.token.owner === address &&
                        (value.validTill > Date.now() ||
                            this.hasFlagToggle(value.token.tokenId, 'reload'))
                    ) {
                        if (objectCount < maxCount * page) {
                            continue;
                        }

                        // Max per page
                        if (objectCount >= maxCount * (page + 1)) {
                            break;
                        }

                        objs[value.token.tokenId] = value;
                        objectCount++;
                    }
                } catch (error) {
                    this.log(error, 'error');
                    // Just continue
                }
            }

        const result = await this.callMethod(
            this.accounts[0],
            'InfinityMintApi',
            'allTokens',
            {
                parameters: [address],
            }
        );

        for (const [i, element] of result.entries()) {
            if (i < maxCount * page) {
                continue;
            }

            // Max per page
            if (i >= maxCount * (page + 1)) {
                break;
            }

            if (objs[element] !== undefined) {
                continue;
            }

            const token = await this.getTokenFromContract(element);

            if (token === null) {
                continue;
            }

            const tokenId = this.storeToken(token[1], 'result', 'result');
            objs[tokenId] = StorageController.values.tokens[tokenId];
            if (objs[tokenId].token?.token?.owner !== address) {
                delete objs[tokenId];
            } else if (
                Object.values(StorageController.values.tokens).length >
                (this.Config.default.settings.saveTokenRange || 16)
            ) {
                if (
                    tokenId >
                    (this.Config.default.settings.saveTokenRange || 16)
                ) {
                    delete StorageController.values.tokens[
                        Object.keys(StorageController.values.tokens).shift()
                    ];
                } else {
                    delete StorageController.values.tokens[
                        Object.keys(StorageController.values.tokens).pop()
                    ];
                }
            }
        }

        return Object.values(objs);
    }

    /**
     * Sends a method on the web3 contract (but using call instead which denotes no changes/normally used to read stuff)
     *
     * @param {object} account
     * @param {string} contract
     * @param {string} method
     * @param {object} args
     * @param {number} value
     * @param {bool} saveTx
     * @returns
     */
    async callMethod(account, contract, method, args = {}) {
        args.gas = null;
        args.gasPrice = null;
        return await this.executeMethod(
            account,
            contract,
            method,
            args,
            0,
            'call'
        );
    }

    /**
     *
     * @param {*} account
     * @param {string} contract
     * @param {string} method
     * @param {object} args
     * @param {number} value
     */
    async sendMethod(account, contract, method, args, value = 0) {
        await this.executeMethod(
            account,
            contract,
            method,
            args,
            value,
            'send'
        );
    }

    /**
     *
     * @param {number} tokenId
     * @param {bool} instance
     * @returns
     */
    async createWalletContract(tokenId, instance = true) {
        const token = await this.getTokenObject(tokenId);
        return this.initializeContract(
            token.stickers,
            'InfinityMintWallet',
            instance
        );
    }

    /**
     * Sends a method on the web3 contract of value or if it changes something on the blockchain
     *
     * @param {object} account
     * @param {string} contract
     * @param {string} method
     * @param {object} args
     * @param {number} value
     * @param {bool} saveTx
     */
    async executeMethod(
        account,
        contract,
        method,
        args = {},
        value = 0,
        type = 'call'
    ) {
        if (type !== 'call' && type !== 'send') {
            throw new Error('Invalid type');
        }

        this.isLoading = true;

        // For loading purposes
        this.lastAction = {
            account,
            contract,
            method,
            args,
            value,
            type,
        };

        let result = null;
        try {
            result = await this.executeTransaction(
                type,
                contract,
                method,
                account,
                args,
                value
            );
        } catch (error) {
            this.isLoading = false;
            throw error;
        } finally {
            this.isLoading = false;
        }

        if (result === undefined || result === null) {
            throw new Error('Result probably undefined meaning bad parameters');
        }

        return result;
    }

    /**
     * Onboards a wallet
     * @param {bool} reload
     */
    async onboardWallet(reload = false) {
        try {
            await this.onboard.walletSelect();
            await this.onboard.walletCheck();

            if (reload) {
                window.location.reload();
            }

            return true;
        } catch (error) {
            this.log(error, 'error');
        }

        return false;
    }

    /**
     * Loops through and gets data from a contract such as mints and mintPrice
     */
    async preloadContractVariables() {
        this.isLoading = true;
        for (let i = 0; i < this.#preloadVariables.methods.length; i++) {
            await this.preloadVariable(this.#preloadVariables.methods[i]);
        }

        this.isLoading = false;
    }

    /**
     * Gets draw settings for the current path
     */

    getPathSettings(pathId) {
        const settings = this.getProjectSettings();
        return {
            ...settings.paths.default,
            ...settings.paths[pathId],
        };
    }

    /**
     * Reads a project URI
     * @param {string} fileName
     * @returns
     * @private
     */
    async getProjectURI(fileName = 'default', isJson = false) {
        let result;
        result = await require('../../../../../src/Deployments/projects/' +
            (isJson ? fileName + '.json' : fileName));

        result = result?.default || result;

        if (
            fileName !== 'default' &&
            this.Config.default.settings.overwriteModules &&
            result.modules !== undefined
        ) {
            this.Config.default.deployInfo.modules = { ...result.modules };
        }

        tokenMethods.load();

        return result;
    }

    /**
     *
     * @returns
     */
    getConfig() {
        return this.Config.default;
    }

    /**
     * Call this to get the current project settings.
     * @returns
     */
    getProjectSettings() {
        let settings = this.defaultProjectURI;

        if (
            !this.isWalletValid &&
            this.Config.default.settings.useLocalProjectAsDefault
        ) {
            settings = this.localProjectURI;
        } else if (
            !this.Config.default.settings.useLocalProjectURI &&
            this.isWalletValid
        ) {
            settings = this.getContractValue('objectURI');
            if (
                Object.values(settings).length === 0 ||
                settings === null ||
                settings === undefined
            ) {
                settings = this.Config.default.settings.useLocalProjectAsBackup
                    ? this.localProjectURI
                    : this.defaultProjectURI;
            }
        } else if (this.Config.default.settings.useLocalProjectURI) {
            settings = this.localProjectURI;
        }

        if (settings.paths?.default?.paths === undefined) {
            settings.paths = {
                ...settings.paths,
                default: {
                    ...(settings.paths?.default ||
                        this.defaultProjectURI?.paths?.default),
                    paths: '<PQCw2gbglgpg7gIwPYA8AkAGApAJg9vANgGYB2AOnyoI2IFYAOS6jAHwGcAXAQwCdOAugDIA5mE69uAO3YAzJLwC2aCdPYAbbpxgAKDM2oAaekxYYAlLgzsAxt3W79ARhaGAtM5bnWUACZoAKg4efmEABzB-AFkaJ1IAThp1Gjc4xKsAFkIaGiycq1iE-Lw0lLyCqzdyvGKMVKKAL1ZVGXklQOCATwdA8Mi0KLoMukL0vGTK0szsirxq-FmMKZqrZbr5spmV7brSppa5BWUgrm6YXqEI6OJ4oatiDLGMGzdSQknSSZwMyrfKnCcPzwbhwJEmGWI-3iDH+S0qhDo72BAKRu2IZC+lToTic9yBdXi8UhJRwxLRGHxxBSLk+eDo8Q+dFWj0qD3xpHxqRuq0IMOBTiJVm+DP5EKsdzw6KsDCZeA5q3oq1Isow8XxApwzJVEM1JXiutVcJKfKWpBNTnNGBwIoWJLwrNxkoevxN2WpGLl8uBDEdVoyvvqBrZ-x99wBDSsilRbmxqJsMt+BsBKpBDFiDFpdUILLwOANqUFuZTDGz4smGDoKYynP90ac9uBCIDeZThFulQymZBKQTyPLmZGHZo+sqGfuGDrLkyTzc3MledZNpcANWCq2VpNpJt8V9GVDJWIBuxNClubJ+6WS7ikyc+0krSOHVOPQCfWiLkHJSKVgm-IRJ9JRZD3xGhESsUhfToTNSANQoyUKTlvgNfNvjJeDxSnHZjyFJwVRVAE8MWOIVQQ1kVRtF4BTLfknFRet-lwnkf1SNMrFRXJhkWat8NPWghUPIUiK9W1TTJGNoOjRhwOjYh6JKB10J2VJ-zvNQ2mOLoXzfAYLXXNZf12JtxUzMkwMlTJ2VyMk20WQgwR2Oy0JtGgbCyRYGEQzMcQDBJMjE3tVS7ehUQI-sQpTXD8T3EMTWxKFM05Riv0mE1SDEi0f15IiVQg1YcvzM1phNF4SwwutnTlDJqUKvAGEVcYQRtezaDJUErBsD0NysNVVgXEoqL1E0bRwTM2pKCd7nNZUhViOSrSTZrALmEagNy-lYqcfybVIESuXuMTZOlfN-VWVVKmGmTfVLYFotqsSoLY1tXRNWdAXA311BBJaKUWZS6BwCM8EUR4rwevAbH+-5UT+floTYl7Oy7aMiH+fMqWjBFFzKfyUzS8tqTh-kRM+lwQK4p5cieTaTRchhnK1LEeQDTbVIfdoTk4M4LiuAYRqpJUngMv7QLJ8HIaw9U2KDA11RNE1g3G8Dvt9YhWNzNj4lRMkdta1Yl0-JY6N8m6-NZGgbKJ9UcQdfE+t2TbMhTUkj2bTG9RvA0LyqOnTpSbJLXhfC6ziyUIpHcZr2BaaiHp8HCEzc2lzY22Dt6jtfVJLsApGMpbeuuoxzpB3gU18VK3+Lz6oLtDDqJm1VZQsk3ORKKbTcVFy7mdV1R+8bYk6gUmrondpXluzR-Ao0RP9F66G1s7RTlu2qjwsTCYnA7eOaz7zJ2akVMjCFZs754dtZOjMN2Bgk0j9Yxom9a28Q0vgVVoc2+IOtl-F8l-jFfl+YNUBLHB+LViqyxypkUBCVBaxB-ptEi7VlxEX-usHkEU6Cs0OOzTS5xXyXH6FEYYc0HhWnaixWEHZZ6cnjr8fEn0q6zgTpMEYotdgjBVOPKOV1oxrQrCA+kiwaBpRVDYYR99hFVwbBgERQpEFED9pmBgL04ixDblww0HYqq9QDCQFUjCARy05CMA0M5Yz3HLNMDsmYX7Vx-D7RsqIso7A6swog8t4bgXcozOYPZKYqJEoQS+qQcwYDqohUBaouwrTpGJGJFYyQDRkfXX0GU8DthJF5FcuYZHinNHVd6Qp158LsrBPWkk8TpSbsE60Qpl41VoDDXY2i5i8RjDLNuhcKwplkgOFUO9L4BjaWQQGGBFCyWjFkTMNgmnt0SaAr6+JCRYiSlmf4c8K6slCW4Gc-ouxpLqNI2cKRvo7Lbt9T6DTaiPGuU8C2IkIYgOElUbq5zMHNHvNgjSz48HCDEDAKQvhhDgABUCoAA>',
                },
            };
        }

        if (typeof settings === 'string') {
            settings = JSON.parse(settings);
        }

        return settings;
    }

    /**
     * Gets description of current project
     * @returns
     */
    getDescription() {
        const settings = this.getProjectSettings();

        return (
            settings.description || {
                name: 'Infinity Mint',
                token: 'Token',
                tokenPlural: 'Tokens',
            }
        );
    }

    /**
     *
     * @param {string|Error} msg
     * @param {string} context
     */
    log(message, context = 'general') {
        context = context.toLowerCase();

        if (message instanceof Error) {
            console.log(message);
            message = message.message;

            if (context === 'general') {
                context = 'error';
            }
        }

        if (context === 'general') {
            context = `📄${context}`;
        }

        if (context === 'main component') {
            context = `👽${context}`;
        }

        if (context === 'paths') {
            context = `🎨${context}`;
        }

        if (context === 'transaction') {
            context = `🏷️${context}`;
        }

        if (context === 'preload') {
            context = `✈️${context}`;
        }

        if (context === 'storage') {
            context = `🚚${context}`;
        }

        if (context === 'ipfs') {
            context = `🔮${context}`;
        }

        if (context === 'token method') {
            context = `🗿${context}`;
        }

        if (context === 'pages') {
            context = `✒️${context}`;
        }

        if (context === 'gems') {
            context = `💎${context}`;
        }

        if (context === 'web3') {
            context = `🌈${context}`;
        }

        if (context === 'error') {
            context = `⚠️${context}`;
            console.log(
                `%c [${context}] ${message}`,
                'color:darkred;font-size:16px'
            );
        } else if (context === 'warning') {
            context = `🔶${context}`;
            console.log(
                `%c [${context}] ${message}`,
                'color:orange;font-size:14px'
            );
        } else {
            console.log(`[${context}] ${message}`);
        }
    }

    /**
     * Gets data from the blockchain based on object defined inside of preload at the top of the class. Used to get
     * stuff like totalMints and mintPrice
     * @param {object} variable
     * @returns
     */
    async preloadVariable(variable) {
        try {
            // For loading modal purposes
            this.lastAction = {
                account: this.accounts[0],
                contract: variable.contract,
                method: variable.method,
                args: [],
                value: 0,
                type: 'call',
            };

            if (
                StorageController.values.preload[variable.key] !== undefined &&
                Date.now() <
                    StorageController.values.preload[variable.key].validTill
            ) {
                this.#preloadVariables.values[variable.key] =
                    StorageController.values.preload[variable.key].value;
                this.#preloadVariables.validTill[variable.key] = {
                    loaded: Date.now(),
                    date: StorageController.values.preload[variable.key]
                        .validTill,
                    variable,
                };

                return;
            }

            let result = await this.callMethod(
                this.accounts[0],
                variable.contract,
                variable.method,
                {
                    parameters: [...(variable.parameters || [])],
                }
            );

            if (variable.parse !== undefined) {
                result = await variable.parse(result);
            }

            this.#preloadVariables.values[variable.key] = result;
            this.#preloadVariables.validTill[variable.key] = {
                loaded: Date.now(),
                date: Date.now() + variable.lifetime,
                variable,
            };
            StorageController.values.preload[variable.key] = {
                value: result,
                variable,
                loaded: Date.now(),
                validTill: this.#preloadVariables.validTill[variable.key].date,
            };

            StorageController.saveData();
        } catch (error) {
            if (StorageController.values.preload[variable.key]) {
                delete StorageController.values.preload[variable.key];
            }

            this.log(error, 'error');
            this.#preloadVariables.values[variable.key] =
                variable.default || null;
        }
    }

    /**
     * Runs each second and checks each preload variable if we need to reload it again
     */
    startPreloadInterval() {
        this.#preloadVariables.loading = {};
        this.#preloadInterval = setInterval(() => {
            try {
                for (const [key, value] of Object.entries(
                    this.#preloadVariables.validTill
                )) {
                    if (this.#preloadVariables.values[key] === undefined) {
                        delete this.#preloadVariables.validTill[key];
                        continue;
                    }

                    if (
                        this.#preloadVariables.loading[key] !== true &&
                        (isNaN(value.date) || value.date < Date.now())
                    ) {
                        this.#preloadVariables.loading[key] = true;
                        this.log(
                            'getting value from chain for ' + key,
                            'preload'
                        );
                        this.preloadVariable(value.variable).then(() => {
                            this.#preloadVariables.loading[key] = false;
                        });
                    }
                }
            } catch (error) {
                this.log(error, 'error');
            }
        }, 1000);
    }

    /**
     * Checks the current wallet network id
     * @returns
     */
    async checkNetworkId() {
        // Checks if we are on the right network
        const chainId = await this.web3.eth.getChainId();

        if (
            this.Config.default.requiredChainId !== chainId ||
            this.Config.default.networks[chainId] === undefined
        ) {
            throw new Error(
                'Invalid network, please make sure the network you are connected to is ' +
                    this.Config.default.networks[
                        this.Config.default.requiredChainId
                    ].name
            );
        }

        return true;
    }

    /**
     * Loads the projects objectURI called before react application renders
     */
    async loadObjectURI() {
        this.defaultProjectURI = await this.getProjectURI();

        try {
            if (
                this.Config.default.settings.useLocalProjectAsDefault ||
                this.Config.default.settings.useLocalProjectURI
            ) {
                this.localProjectURI = await this.getProjectURI(
                    this.Config.default.settings.localProject,
                    true
                );
            }
        } catch (error) {
            this.localProjectURI = { ...this.defaultProjectURI };
            this.log('cannot set local object URI: ' + error.message);
        }
    }

    /**
     * Loads the pathgroups from the blockchain or either IFPS. Pathgroups are the SVG data of the tokens.
     *
     */
    async loadPathGroups(checksumCheck = true) {
        const projectURI = this.getProjectSettings();

        for (const [pathId, path] of Object.entries(projectURI.paths)) {
            if (pathId === 'default' || path.useLocal === true) {
                continue;
            }

            // Only load when its seen
            if (
                path.dontLoad ||
                path.paths === undefined ||
                path.paths.dontLoad
            ) {
                this.log('not preloading path ' + pathId, 'paths');
                continue;
            }

            if (
                (path.dontStore !== true || path.paths.dontStore !== true) &&
                StorageController.values.paths[pathId] !== undefined
            ) {
                if (
                    checksumCheck &&
                    path.paths?.checksum !== undefined &&
                    (this.paths[pathId].paths.checksum === undefined ||
                        this.paths[pathId].paths.checksum !==
                            path.paths.checksum)
                ) {
                    this.log(
                        'checksum mismatch for ' +
                            pathId +
                            ' trashing stored value',
                        'paths'
                    );
                    delete StorageController.values.paths[pathId];
                    StorageController.saveData();
                } else {
                    this.log(
                        'using saved storage data for path ' + pathId,
                        'paths'
                    );
                    this.paths[pathId] = StorageController.values.paths[pathId];
                    continue;
                }
            }

            // Is as it is
            if (typeof path?.paths?.data !== 'string') {
                this.log(
                    'Path id ' + pathId + ' has weird paths data',
                    'warning'
                );
                continue;
            }

            let parsedResult;

            if (
                this.Config.default.settings.localContentOnLocalhost &&
                window.location.href.includes('localhost') &&
                path.paths.localStorage
            ) {
                path.paths.ipfs = false;
            }

            // Already handled
            if (
                path.paths.data.includes('<?xml') ||
                path.paths.data.includes('data:') ||
                (path.paths.localStorage &&
                    path.paths.data.slice(0, 5) !== '/imgs')
            ) {
                this.log('potentially bugged pathId ' + pathId, 'paths');
                path.paths.projectStorage = true;
                this.paths[pathId] = {
                    ...path,
                };
                continue;
            }

            if (
                (path.paths.ipfs && !path.paths.projectStorage) ||
                (path.paths.localStorage === true &&
                    !this.Config.default.settings.forceLocalContent &&
                    path.paths.ipfs)
            ) {
                this.log('fetching ipfs: ' + path.paths.ipfsURL, 'ipfs');
                let response;
                try {
                    const abortController = new AbortController();
                    const timeout = setTimeout(() => {
                        abortController.abort();
                    }, 20_000); // Try for 15 seconds
                    response = await fetch(path.paths.ipfsURL, {
                        signal: abortController.signal,
                    });
                    clearTimeout(timeout);
                } catch (error) {
                    this.log(error);
                    if (path.paths.localStorage) {
                        response = await fetch(path.paths.data);
                        this.log('fetching from local storage', 'ipfs');
                    } else {
                        throw error;
                    }
                }

                if (
                    response === null ||
                    response === undefined ||
                    response.length === 0
                ) {
                    this.log('probably invalid ipfs URL', 'ipfs');
                    parsedResult = '';
                } else {
                    parsedResult = await response.text();
                }
            } else if (
                !path.paths.projectStorage &&
                this.Config.default.settings.forceLocalContent &&
                !path.paths.localStorage
            ) {
                this.log(
                    'Settings are set to forceLocalContent and path id ' +
                        pathId +
                        ' does not have local storage...',
                    'warning'
                );
            } else if (
                !path.paths.projectStorage &&
                path.paths.localStorage &&
                (path.paths.ipfs !== true ||
                    (window.location.href.includes('localhost') &&
                        this.Config.default.settings.localContentOnLocalhost))
            ) {
                const response = await fetch(path.paths.data);
                this.log('fetching from current websites storage', 'ipfs');
                if (
                    response === null ||
                    response === undefined ||
                    response.length === 0
                ) {
                    this.log('probably invalid ipfs URL', 'ipfs');
                    parsedResult = '';
                } else {
                    parsedResult = await response.text();
                }
            } else if (path.paths.contractStorage) {
                throw new Error('Contract storage is no longer supported');
            } else if (path.paths.projectStorage) {
                // Keep it as it is
                parsedResult = path.paths.data;
            }

            this.paths[pathId] = {
                ...path,
                paths: {
                    ...path.paths,
                    data: parsedResult,
                },
            };

            this.log('processed ' + pathId);
            if (
                path.paths.dontStore !== true &&
                path.paths.projectStorage !== true
            ) {
                this.log('saving path to storage: ' + pathId, 'paths');
                StorageController.values.paths[pathId] = this.paths[pathId];
            } else {
                this.log('not storing path to object ' + pathId, 'paths');
            }
        }

        StorageController.saveData();
    }

    /**
     * Must be the first thing which is called in the application.
     */
    async loadWallet() {
        // Web3 stuff
        this.web3 = new web3(web3.givenProvider || 'http://localhost:8545'); // Throws
        this.web3.eth.transactionConfirmationBlocks = 50;
        this.accounts = await this.web3.eth.getAccounts();
        this.gasPrice = await this.web3.eth.getGasPrice();

        try {
            if (this.accounts.length === 0) {
                throw new Error('length of wallets is zero');
            }

            await this.checkNetworkId();
            this.walletError = null;
            return true;
        } catch (error) {
            this.log(error, 'error');
            this.walletError = error;
            return false;
        }
    }

    async deployContract(
        contract,
        args = [],
        libraries = null,
        forceAbi = undefined
    ) {
        if (libraries === null) {
            libraries = {
                InfinityMintUtil:
                    this.Config.default.getDeployment('InfinityMintUtil'),
            };
        }

        let abi;
        let instance;
        if (
            this.#abis.contracts[contract] === undefined &&
            forceAbi === undefined
        ) {
            try {
                abi = this.Config.default.getDeployment(contract);
            } catch (error) {
                this.log(error);
                throw new Error('bad contract: ' + contract);
            }
        } else {
            abi = this.#abis.contracts[contract] || forceAbi;
        }

        instance = new this.web3.eth.Contract(abi.abi);
        instance = await instance.deploy({
            from: this.accounts[0],
            data: abi.bytecode,
            arguments: args,
        });
        instance = await instance.send({
            from: this.accounts[0],
            gasPrice: this.Config.default.getGasPrice(
                StorageController.getGlobalPreference('gasSetting') || 'medium'
            ),
        });

        return instance;
    }

    /**
     * Using the name of the contract's ABI, initializes a new web3 class for that contract for us to call. If last bool is set to true it will store this
     * instance inside the controller class so we can await events.
     * @param {string} address
     * @param {string} contract
     * @param {bool} instance
     * @returns
     */
    initializeContract(
        address,
        contract,
        instance = true,
        forceAbi = undefined
    ) {
        let abi;
        if (
            this.#abis.contracts[contract] === undefined &&
            forceAbi === undefined
        ) {
            try {
                abi = this.Config.default.getDeployment(contract).abi;
            } catch (error) {
                this.log(error);
                throw new Error('bad contract: ' + contract);
            }
        } else {
            abi = this.#abis.contracts[contract] || forceAbi;
        }

        this.log('intiailizing contract: ' + contract, 'web3');

        if (instance) {
            this.#instances[contract] = new this.web3.eth.Contract(
                abi.abi || abi,
                address
            );
            return this.#instances[contract];
        }

        return new this.web3.eth.Contract(abi.abi || abi, address);
    }

    /**
     * Gets called only when web3 access + wallet access is granted
     */
    initializePreload() {
        this.#preloadVariables = {
            values: {},
            validTill: {},
            methods: [
                {
                    contract: 'InfinityMintApi',
                    method: 'getPrice',
                    key: 'getPrice',
                    lifetime: 1000 * 60 * 1, // 1 minutes
                    default: -1,
                    parse: (value) => this.web3.utils.fromWei(value),
                },
                {
                    contract: 'InfinityMintApi',
                    method: 'totalMints',
                    key: 'totalMints',
                    lifetime: 1000 * 60, // 60 seconds
                    default: 1874,
                    parse: (value) => Number.parseInt(value),
                },
                {
                    contract: 'InfinityMintApi',
                    method: 'totalSupply',
                    key: 'totalSupply',
                    lifetime: 1000 * 60 * 24, // 24 hours
                    default: 1874,
                    parse: (value) => Number.parseInt(value),
                },
                {
                    contract: 'InfinityMint',
                    method: 'balanceOf',
                    key: 'balanceOf',
                    parameters: [this.accounts[0]],
                    lifetime: 1000 * 60 * 1, // 1 minute
                    default: 0,
                    parse: (value) => Number.parseInt(value),
                },
                {
                    contract: 'InfinityMintProject',
                    method: 'getProject',
                    key: 'objectURI',
                    lifetime: 1000 * 60 * 2, // Minute
                    default: {},
                    parse: async (value) => {
                        value = this.web3.utils.toUtf8(value);
                        // Probably json
                        if (value.includes('{')) {
                            try {
                                value = value.replace(/'/g, '"');
                                value = JSON.parse(value);
                                if (
                                    value.local === true &&
                                    !this.Config.default.settings
                                        .useLocalProjectURI
                                ) {
                                    this.log(
                                        'not using local project URI but one is set on chain, forcing to use local',
                                        'warning'
                                    );
                                    value = {
                                        ...this.localProjectURI,
                                        ...value,
                                    };
                                }
                            } catch (error) {
                                console.log(value);
                                console.log('bad parse');
                                console.log(error);
                                value = this.Config.default.settings
                                    .useLocalProjectAsBackup
                                    ? this.localProjectURI
                                    : this.defaultProjectURI;
                            }
                        } else {
                            let result = {};

                            // Probably IPFS
                            try {
                                const abortController = new AbortController();
                                const timeout = setTimeout(() => {
                                    abortController.abort();
                                }, 10_000);
                                result = await fetch(value, {
                                    signal: abortController.signal,
                                });
                                clearTimeout(timeout);
                                result = await result.json();
                                result.fetched = Date.now();
                                value = { ...result };
                            } catch {
                                this.log(
                                    'failed to get object uri: ' + value,
                                    'warning'
                                );
                                value = this.Config.default.settings
                                    .useLocalProjectAsBackup
                                    ? this.localProjectURI
                                    : this.defaultProjectURI;
                            }
                        }

                        // Add initial tag if tag is missing
                        if (
                            this.Config.default.settings.useLocalProjectAsBackup
                        ) {
                            if (value.tag === undefined) {
                                value.tag =
                                    this.localProjectURI.tag || 'initial';
                            }

                            if (value.version === undefined) {
                                value.version =
                                    this.localProjectURI.version || 0;
                            }
                        }

                        if (
                            StorageController.getGlobalPreference('lastTag') !==
                                undefined &&
                            value.tag !==
                                StorageController.getGlobalPreference('lastTag')
                        ) {
                            StorageController.setGlobalPreference(
                                'previousTag',
                                StorageController.getGlobalPreference('lastTag')
                            );
                            StorageController.setGlobalPreference(
                                'needsPathReset',
                                true
                            );
                        }

                        if (
                            StorageController.getGlobalPreference(
                                'lastVersion'
                            ) !== undefined &&
                            value.version !==
                                StorageController.getGlobalPreference(
                                    'lastVersion'
                                )
                        ) {
                            StorageController.setGlobalPreference(
                                'previousVersion',
                                StorageController.getGlobalPreference(
                                    'lastVersion'
                                )
                            );
                            StorageController.setGlobalPreference(
                                'needsPathReset',
                                true
                            );
                        }

                        StorageController.setGlobalPreference(
                            'lastTag',
                            value.tag || 'unknown'
                        );
                        StorageController.setGlobalPreference(
                            'lastVersion',
                            value.version === undefined
                                ? 'unknown'
                                : value.version
                        );

                        if (
                            StorageController.getGlobalPreference('lastId') !==
                                undefined &&
                            value.id !==
                                StorageController.getGlobalPreference('lastId')
                        ) {
                            StorageController.setGlobalPreference(
                                'needsFullReset',
                                true
                            );
                        }

                        StorageController.setGlobalPreference(
                            'lastId',
                            value.id || 1
                        );

                        return value;
                    },
                },
            ],
        };
    }

    /**
     * Called when first loaded
     */
    initializeContracts() {
        for (const [key, value] of Object.entries(this.#abis.contracts)) {
            this.log('intiailizing contract: ' + key, 'web3');
            this.#instances[key] = new this.web3.eth.Contract(
                value.abi,
                value.address
            );
        }
    }
}

const controller = new Controller();
export default controller;
