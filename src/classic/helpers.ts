import validator from 'validator';
import tinySVG from './tinysvg';
import CryptoJS from 'crypto-js';
import StorageController from './storageController';
import StickerController from './stickerController';
import Controller from './controller';
import { Component } from 'react';

/**
 *
 * @returns
 */
export const getGasPrice = () => {
    let config = Controller.getConfig();
    return config.getGasPrice(
        StorageController.getGlobalPreference('gasSetting') || 'medium'
    );
};

interface TransactionOptions {
    gasPrice?: number;
    gasLimit?: number;
    gas?: number;
    from?: string;
    value?: number;
}

/**
 * Will send a transaction to the blockchain. If you do not specif as gasPrice it will use the current gas price frm the config for the current network. Will return the transaction hash.
 * @param {string} contractName
 * @param {string} method
 * @param {*} args
 * @param {*} options
 * @returns
 */
export const send = async (
    contractName: string,
    method: string,
    args: any = [],
    options: TransactionOptions = {}
) => {
    let statement = prepareCall(contractName, method, args);
    if (options.gasPrice === undefined) options.gasPrice = getGasPrice();
    return await statement.send(options);
};

/**
 * Will call a method on a contract and return the result
 * @param {*} contractName
 * @param {*} method
 * @param {*} args
 * @returns
 */
export const call = async (contractName: any, method: any, args: any = []) => {
    try {
        let statement = prepareCall(contractName, method, args);
        return await statement.call();
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 *
 * @param contractName
 * @param method
 * @param args
 * @returns
 */
export const prepareCall = (contractName, method: string, args?: any) => {
    let contract = Controller.getContract(contractName);

    if (!contract?.methods?.[method])
        throw new Error(
            `Contract ${contractName} does not have method ${method}`
        );

    args = args.parameters || args;
    if (args instanceof Array === false && typeof args !== 'object')
        args = [args];
    else if (args instanceof Array === false && typeof args === 'object')
        args = Object.values(args);

    let callable = contract.methods[method];
    // invalid attempt to spread non-iterable instance in order to be iterable, non-array objects must have a [symbol.iterator]() method
    //IM SO SORRY FOR THIS
    if (args.length === 0) return callable();
    else if (args.length === 1) return callable(args[0]);
    else if (args.length === 2) return callable(args[0], args[1]);
    else if (args.length === 3) return callable(args[0], args[1], args[2]);
    else if (args.length === 4)
        return callable(args[0], args[1], args[2], args[3]);
    else if (args.length === 5)
        return callable(args[0], args[1], args[2], args[3], args[4]);
    else if (args.length === 6)
        return callable(args[0], args[1], args[2], args[3], args[4], args[5]);
    else if (args.length === 7)
        return callable(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            args[5],
            args[6]
        );
    else
        return callable(
            args[0],
            args[1],
            args[2],
            args[3],
            args[4],
            args[5],
            args[6],
            args[7] // I'm sorry
        );
};
/**
 * A helper function to storage data, this is used with stickers. Key refers to one of the fields inside
 * the storage controller, id is the index of that field and the values are what it will equal. It also
 * saves after it is done.
 * @param {string} key
 * @param {string|number} id
 * @param {any} values
 * @param {boolean} encode
 */
export const saveObject = (
    key: string,
    id: string | number,
    values: any,
    encode: boolean = true
) => {
    if (StorageController.values[key] === undefined) {
        StorageController.values[key][id] = {};
    }

    if (StorageController.values[key][id] === undefined) {
        StorageController.values[key][id] = {};
    }

    for (let [index, value] of Object.entries<any>(values)) {
        if (value === undefined) {
            continue;
        }

        if (encode) {
            try {
                value = encodeURI(value);
            } catch (error) {
                Controller.log('failed to encode value', 'error');
                Controller.log(error);
            }
        }

        StorageController.values[key][id][index] = value;
    }

    StorageController.saveData();
};

/**
 * Will try and decode URI data and return a bland string if it fails.
 * @param {string} value
 * @returns
 */
export const tryDecodeURI = (value: string) => {
    try {
        return decodeURI(value);
    } catch {
        return ''; // Return no value
    }
};

/**
 * Used for turning non conventional form types into their HTML compatiable counter parts.
 * @param {string} type
 * @returns
 */
export const toRealFormType = (type: string) => {
    switch (type) {
        case 'address':
        case 'string':
        case 'twitter': {
            return 'text';
        }

        default: {
            return type;
        }
    }
};

/**
 * This essentially maps an array to an object by stepping through each
 * entry of the object and replacing the value based on its nuemrical positon. For example,
 * the value of position 0 in the array will be the value of the first key in the object.
 *
 * You could one line this, but meh. You do it :^)
 * @param {Array} array
 * @param {object} obj
 * @returns
 */
export const mapArrayToObject = (array: Array<any>, object) => {
    let count = 0;
    const result = {};
    // eslint-disable-next-line
    for (let [key, _] of Object.entries(object)) {
        let value = array[count++];
        if (
            value === undefined ||
            value === null ||
            value === 'undefined' ||
            value === 'null'
        ) {
            value = '';
        }

        result[key] = value;
    }

    return result;
};

export const unpackColours = (colours) => {
    const extraColours = colours.pop();
    const seedNumber = colours.pop();
    const unpackedColours = [];
    // Is a colour
    let lastColour;

    // Get colour
    const getColour = (baseColour, i) => {
        const colour = Number.parseInt(baseColour);
        const r = colour >> 16;
        const g = colour >> 8;
        const b = colour >> 24;
        const seedNumberR = seedNumber >> 8;
        const seedNumberG = seedNumber >> 16;
        const seedNumberB = seedNumber >> 24;
        const seedNumberN = (seedNumber >> 32) ^ i;

        const combination = parseInt(
            (
                (r * seedNumberR + g * seedNumberG + b * seedNumberB) *
                seedNumberN
            ).toString()
        );
        return combination % 0xff_ff_ff;
    };

    for (const [index, value] of colours.entries()) {
        if (index === 0 || index % 2 === 0) {
            lastColour = value;
            continue;
        }

        if (index % 2 === 1 && lastColour !== undefined) {
            for (let i = 0; i < Number.parseInt(value); i++) {
                unpackedColours.push(getColour(lastColour, i));
            }
        }
    }

    for (let i = 0; i < extraColours; i++) {
        unpackedColours.push(getColour(lastColour, i));
    }

    return unpackedColours;
};

export const getDeploymentAddress = (token, link) => {
    let Config = Controller.getConfig();
    if (StorageController.values.deployments[token.tokenId] === undefined) {
        return Config.nullAddress;
    }

    if (
        StorageController.values.deployments[token.tokenId][link.contract] ===
        undefined
    ) {
        return Config.nullAddress;
    }

    return (
        StorageController.values.deployments[token.tokenId][link.contract]
            ._address ||
        StorageController.values.deployments[token.tokenId][link.contract]
            .address ||
        Config.nullAddress
    );
};

export const hasLink = (token, key) => {
    const links = Controller.getProjectSettings().links || {};

    if (links[key] === undefined) {
        return false;
    }

    try {
        return token?.destinations[links[key].index] !== undefined;
    } catch {
        return false;
    }
};

export const hasDeployment = (token, index) => {
    let Config = Controller.getConfig();
    const links = Controller.getProjectSettings().links || {};
    const keys = Object.keys(links);
    let link;

    for (const key of keys) {
        if (links[key].index === index) {
            link = links[key];
            break;
        }
    }

    if (link === undefined || link.contract === undefined) {
        return false;
    }

    return (
        StorageController.values.deployments[token.tokenId] !== undefined &&
        StorageController.values.deployments[token.tokenId][link.contract] !==
            undefined &&
        StorageController.values.deployments[token.tokenId][link.contract].link
            ?.index === index &&
        StorageController.values.deployments[token.tokenId][link.contract]
            .address !== undefined &&
        StorageController.values.deployments[token.tokenId][link.contract]
            .address !== Config.nullAddress
    );
};

export const enycrptString = (string, key) => CryptoJS.AES.encrypt(string, key);

export const getHost = () => {
    let host = window.location.host;

    host = !StorageController.getLocationHref().includes('https://')
        ? 'http://' + host
        : 'https://' + host;

    if (!host.endsWith('/')) {
        host += '/';
    }

    return host;
};

export const connectWallet = async () => {
    const result = await Controller.onboardWallet();
    let Config = Controller.getConfig();

    if (result) {
        StorageController.setGlobalPreference('forceWallet', true);

        if (!Config.settings.requireWallet) {
            StorageController.setGlobalPreference('requireWallet', true);
        }
    }

    window.location.reload();
};

export const getCodes = (phraseCount, options: any = {}) => {
    const characterRange = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
    const codes = [];

    for (let y = 0; y < phraseCount; y++) {
        codes[y] = '';

        for (let i = 0; i < (options.chunks || 4); i++) {
            if (options.id !== undefined && i === 0) {
                options.id = options.id.replace(/ /g, '_');
                codes[y] = btoa(options.id)
                    .slice(0, Math.max(0, options.length))
                    .toUpperCase()
                    .padStart(2, 'B')
                    .padEnd(options.length, 'A')
                    .replace(/=/g, '');
            } else {
                for (let x = 0; x < (options.length || 6); x++) {
                    codes[y] =
                        codes[y] +
                        characterRange[
                            Math.floor(Math.random() * characterRange.length)
                        ];
                }
            }

            codes[y] = codes[y] + '-';
        }

        codes[y] = codes[y].slice(0, Math.max(0, codes[y].length - 1));
    }

    return codes;
};

export const getRowClass = (maxRowClass = 'row-cols-4') => {
    let rowClass = 'row-cols-2';
    if (window.innerWidth <= 768) {
        rowClass = 'row-cols-1';
    }

    if (
        (window.innerWidth >= 768 && window.innerWidth <= 1224) ||
        window.innerWidth >= 768
    ) {
        rowClass = 'row-cols-2';
    }

    if (window.innerWidth >= 1224) {
        rowClass = maxRowClass;
    }

    return rowClass;
};

export const decideRowClass = (results = [], maxColWidth = 'row-cols-3') => {
    let rowClass = 'row-cols-2';
    if (window.innerWidth <= 768) {
        rowClass = 'row-cols-1';
    }

    if (
        (window.innerWidth >= 768 && window.innerWidth <= 1224) ||
        (window.innerWidth >= 768 && results.length > 0)
    ) {
        rowClass = 'row-cols-2';
    }

    if (window.innerWidth >= 1224 && results.length > 1) {
        rowClass = maxColWidth;
    }

    return rowClass;
};

/**
 *
 * @param {Component} reactComponent
 */
export const loadStickers = async (reactComponent: Component) => {
    reactComponent.setState({
        loading: true,
    });

    try {
        if ((reactComponent.state as any)?.tokenId === undefined) {
            throw new Error('tokenId is not defined');
        }

        // Must be called before any use of sticker controller method
        if (
            StickerController.instance === undefined ||
            StickerController.isDifferentTokenId(
                (reactComponent.state as any).tokenId
            )
        ) {
            await StickerController.createContract(
                (reactComponent.state as any).tokenId
            );
        }

        let stickerPrice = await StickerController.getStickerPrice();

        if (stickerPrice !== undefined && stickerPrice !== null) {
            stickerPrice = Controller.web3.utils.fromWei(stickerPrice);
        }

        reactComponent.setState({
            stickerPrice,
        });

        let stickers = await StickerController.getStickers();

        stickers = stickers.map((value) => {
            let sticker;
            sticker =
                typeof value !== 'object'
                    ? Controller.decodeSticker(value, true, false)
                    : value;

            sticker = sticker.request || sticker;

            if (typeof sticker.sticker === 'string') {
                sticker.sticker = JSON.parse(sticker.sticker);
            }

            sticker.verified = false;
            if (StickerController.verifyStickerChecksum(sticker.sticker)) {
                sticker.verified = true;
            }

            sticker.sticker.convertedPath = tinySVG.toSVG(
                sticker.sticker.paths,
                true,
                sticker.sticker.colours,
                false,
                true
            );

            return sticker;
        });

        if (stickers.length > 0) {
            reactComponent.setState({
                hasStickers: true,
                hasStickerContract: true,
                stickers,
            });
        } else {
            reactComponent.setState({
                hasStickers: false,
                hasStickerContract: true,
            });
        }
    } catch (error) {
        Controller.log('[😞] Sticker Error', 'error');
        Controller.log(error);
        reactComponent.setState({
            hasStickerContract: false,
        });
    } finally {
        reactComponent.setState({
            loading: false,
        });
    }
};

/**
 * Retuns an array of stickers.
 * @param {*} tokenId
 * @returns
 */
export const getStickers = async (tokenId: any) => {
    try {
        // Must be called before any use of sticker controller method
        await StickerController.createContract(tokenId);
        let stickers = await StickerController.getStickers();

        stickers = stickers.map((value: any) => {
            let sticker = value;
            if (typeof sticker !== 'object') {
                sticker = Controller.decodeSticker(value, true, false);
                sticker.sticker = JSON.parse(sticker.sticker);
                sticker.verified = false;
                if (StickerController.verifyStickerChecksum(sticker.sticker)) {
                    sticker.verified = true;
                }

                sticker.sticker.convertedPath = tinySVG.toSVG(
                    sticker.sticker.paths,
                    true,
                    sticker.sticker.colours,
                    false,
                    true
                );
            }

            return sticker;
        });

        return stickers;
    } catch (error) {
        Controller.log('[😞] Could not get stickers', 'error');
        Controller.log(error);
    }

    return [];
};

// TODO: needs rewriting, pulls image paths twice right now
export const loadPath = async (projectURI, pathId) => {
    let Config = Controller.getConfig();
    // If don't load
    try {
        if (
            Controller.paths[pathId] !== undefined &&
            Controller.paths[pathId].loaded
        ) {
            Controller.log(
                'skipping loading path for pathId ' +
                    pathId +
                    ' as already loaded',
                'paths'
            );
            return;
        }

        if (
            projectURI.paths[pathId].dontLoad ||
            (projectURI.paths[pathId].paths.dontLoad &&
                Controller.paths[pathId] === undefined)
        ) {
            if (
                (projectURI?.paths[pathId].paths.ipfs === false ||
                    projectURI?.paths[pathId].paths?.ipfsURL) &&
                projectURI.paths[pathId].paths.localStorage !== true
            ) {
                Controller.paths[pathId] = {
                    ...projectURI.paths[pathId],
                    loaded: true,
                };
            } else {
                let fetchResult;
                if (
                    projectURI?.paths[pathId].paths.ipfs === true &&
                    projectURI.paths[pathId].paths.localStorage !== true &&
                    (Config.settings.forceLocalContent !== true ||
                        (!window.location.href.includes('localhost') &&
                            !Config.settings.localContentOnLocalhost))
                ) {
                    try {
                        const abortController = new AbortController();
                        const timeout = setTimeout(
                            () => {
                                abortController.abort();
                            },
                            projectURI.paths[pathId].paths.localStorage === true
                                ? 1000 *
                                      (Config.settings.ipfsPatchFetchTimeout ||
                                          10)
                                : 1000 *
                                      (Config.settings.ipfsPatchFetchTimeout ||
                                          10) *
                                      10
                        ); // Try for 15 seconds
                        Controller.log(
                            'Fetching big path from IPFS: ' +
                                projectURI.paths[pathId].paths.ipfsURL,
                            'ipfs'
                        );
                        fetchResult = await fetch(
                            projectURI.paths[pathId].paths.ipfsURL,
                            {
                                signal: abortController.signal,
                            }
                        );
                        clearTimeout(timeout);
                    } catch (error) {
                        if (
                            projectURI.paths[pathId].paths.localStorage === true
                        ) {
                            Controller.log(
                                'Fetching big path from local storage: ' +
                                    projectURI.paths[pathId].paths.data,
                                'paths'
                            );
                            fetchResult = await fetch(
                                projectURI.paths[pathId].paths.data,
                                {
                                    mode: 'cors',
                                    headers: {
                                        'Access-Control-Allow-Origin': '*',
                                        crossOrigin: 'Anoynmous',
                                    },
                                }
                            );
                        } else {
                            throw error;
                        }
                    }
                } else if (
                    projectURI.paths[pathId].paths.localStorage === true
                ) {
                    Controller.log(
                        'Fetching big path from local storage: ' +
                            projectURI.paths[pathId].paths.data,
                        'paths'
                    );
                    fetchResult = await fetch(
                        projectURI.paths[pathId].paths.data,
                        {
                            mode: 'cors',
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                                crossOrigin: 'Anoynmous',
                            },
                        }
                    );
                }

                const blob = await fetchResult.blob();
                fetchResult = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', () =>
                        resolve(reader.result)
                    );
                    reader.readAsText(blob);
                });

                try {
                    Controller.paths[pathId] = {
                        ...projectURI.paths[pathId],
                        paths: {
                            ...projectURI.paths[pathId].paths,

                            data: JSON.parse(fetchResult),
                        },
                        loaded: true,
                    };
                } catch {
                    // Only do this on SVG's for now as I know they need tis way
                    if (
                        projectURI.paths[pathId].fileName !== null &&
                        projectURI.paths[pathId].fileName.includes('.svg')
                    ) {
                        const binary = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.addEventListener('load', () =>
                                resolve(reader.result)
                            );
                            reader.readAsDataURL(blob);
                        });
                        Controller.paths[pathId] = {
                            ...projectURI.paths[pathId],
                            paths: {
                                ...projectURI.paths[pathId].paths,
                                data: binary,
                            },
                        };
                        // Decode the SVG
                        if (
                            Controller.paths[pathId].paths.data.includes(
                                'base64,'
                            )
                        ) {
                            Controller.paths[pathId].paths.data =
                                Controller.Base64.decode(
                                    Controller.paths[pathId].paths.data.split(
                                        'base64,'
                                    )[1]
                                );
                        }
                    } else if (
                        projectURI.paths[pathId].fileName.includes('.png') ||
                        projectURI.paths[pathId].fileName.includes('.jpg') ||
                        projectURI.paths[pathId].fileName.indexOf('.jpeg')
                    ) {
                        Controller.log(
                            `fetching pathId's ${pathId} image data and encoding it in base64`,
                            'paths'
                        );
                        const src = await imageToOutput(
                            projectURI.paths[pathId].paths.localStorage
                                ? projectURI.paths[pathId].paths.data
                                : projectURI.paths[pathId].paths.ipfsURL ||
                                      projectURI.paths[pathId].paths.data,
                            'base64'
                        );
                        Controller.paths[pathId] = {
                            ...projectURI.paths[pathId],
                            paths: {
                                ...projectURI.paths[pathId].paths,
                                data: src,
                            },
                            loaded: true,
                        };
                    } else {
                        Controller.log(
                            'Path loading not supported for unknown filetype: ' +
                                projectURI.paths[pathId].fileName,
                            'warning'
                        );
                    }
                }
            }
        }
    } catch (error) {
        Controller.log('[😞] Could not load path', 'error');
        Controller.log(error);
    }
};

// In order to save a png as a propper base64 image we can render later, we need to put it into a canvas and save that canvas's output.
const imageToOutput = (src, outputFormat) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.addEventListener('load', function () {
            const canvas = document.createElement('CANVAS') as any;
            const ctx = canvas.getContext('2d');
            let dataURL;
            canvas.height = this.naturalHeight;
            canvas.width = this.naturalWidth;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            resolve(dataURL);
        });

        img.src = src;
        if (img.complete || img.complete === undefined) {
            img.src =
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
            img.src = src;
        }
    });

/**
 *
 * @param {Component} reactComponent
 * @param {boolean} checkFlags
 */
export const loadToken = async (
    reactComponent: Component,
    checkFlags: boolean = true,
    returnFlags = false
) => {
    let Config = Controller.getConfig();
    try {
        reactComponent.setState({
            loading: true,
        });

        if ((reactComponent?.state as any).tokenId === undefined) {
            throw new Error('tokenId is not defined');
        }

        const result = await Controller.getTokenObject(
            (reactComponent.state as any).tokenId
        );
        const projectURI = Controller.getProjectSettings();

        // If the final result lands up being an object
        if (result !== null) {
            await loadPath(projectURI, result.pathId);

            reactComponent.setState({
                token: result,
                isValid: true,
            });

            if (
                checkFlags &&
                ((!Controller.hasFlag(
                    (reactComponent.state as any).tokenId,
                    'checkedTokenURI'
                ) &&
                    !Controller.hasFlag(
                        (reactComponent.state as any).tokenId,
                        'tokenURI'
                    ) &&
                    result.owner === Controller.accounts[0]) ||
                    (result.owner === Controller.accounts[0] &&
                        StorageController.values.tokenURI[
                            (reactComponent.state as any).tokenId
                        ] === undefined))
            ) {
                const tokenURI = await Controller.callMethod(
                    Controller.accounts[0],
                    'InfinityMint',
                    'tokenURI',
                    {
                        parameters: [(reactComponent.state as any).tokenId],
                        gasPrice: Config.getGasPrices().fast,
                    }
                );

                /**
                 *
                 * Todo: Check validity of tokenURI by generating our own locally and detect a change
                 * that way as well.
                 */

                Controller.setFlag(
                    (reactComponent.state as any).tokenId,
                    'checkedTokenURI',
                    true
                );

                if (tokenURI === undefined || tokenURI === '') {
                    Controller.setFlag(
                        (reactComponent.state as any).tokenId,
                        'emptyTokenURI',
                        true
                    );
                    if (returnFlags || !Config.settings.forceTokenURIRefresh) {
                        Controller.setFlag(
                            (reactComponent.state as any).tokenId,
                            'tokenURI',
                            true
                        );
                    } else {
                        try {
                            await Controller.updateTokenURI(
                                (reactComponent.state as any).tokenId
                            );
                            Controller.setFlag(
                                (reactComponent.state as any).tokenId,
                                'tokenURI',
                                false
                            );
                        } catch (error) {
                            Controller.log('[😞] TokenURI Error', 'error');
                            Controller.log(error);
                        }
                    }
                } else {
                    try {
                        const finish = (uri) => {
                            if (uri.default === true) {
                                Controller.setFlag(
                                    (reactComponent.state as any).tokenId,
                                    'tokenURI',
                                    false
                                );
                            } else {
                                Controller.setFlag(
                                    (reactComponent.state as any).tokenId,
                                    'tokenURI',
                                    true
                                );
                            }

                            if (
                                StorageController.values.tokenURI[
                                    (reactComponent.state as any).tokenId
                                ] === undefined
                            ) {
                                StorageController.values.tokenURI[
                                    (reactComponent.state as any).tokenId
                                ] = uri;
                            }

                            // Update if newer
                            if (
                                uri.updated >
                                (StorageController.values.tokenURI[
                                    (reactComponent.state as any).tokenId
                                ].updated || 0)
                            ) {
                                StorageController.values.tokenURI[
                                    (reactComponent.state as any).tokenId
                                ] = uri;
                            }
                        };

                        let processedTokenURI;
                        if (tokenURI.slice(0, 1) !== '{') {
                            // Fetch it first
                            processedTokenURI = await fetch(tokenURI);
                            processedTokenURI = await processedTokenURI.json();
                        } else {
                            processedTokenURI = JSON.parse(tokenURI);
                        }

                        finish(processedTokenURI);
                    } catch (error) {
                        Controller.log(
                            '[😞] unparsable or broken tokenURI',
                            'error'
                        );
                        Controller.log(error);
                    }

                    StorageController.saveData();
                }
            }

            // Forces the user to refresh their tokenURI if the tokenURI flag is set
            if (
                !returnFlags &&
                checkFlags &&
                Config.settings.forceTokenURIRefresh &&
                Controller.hasFlag(
                    (reactComponent.state as any).tokenId,
                    'tokenURI'
                ) &&
                result.owner === Controller.accounts[0]
            ) {
                await Controller.updateTokenURI(
                    (reactComponent.state as any).tokenId
                )
                    .then(() => {
                        Controller.toggleFlag(
                            (reactComponent.state as any).tokenId,
                            'tokenURI'
                        );
                        Controller.setFlag(
                            (reactComponent.state as any).tokenId,
                            'checkedTokenURI',
                            true
                        );
                    })
                    .catch((error) => {
                        console.log(error);
                    })
                    .finally(() => {
                        reactComponent.setState({
                            loading: false,
                        });
                    });
                Controller.setFlag(
                    (reactComponent.state as any).tokenId,
                    'emptyTokenURI',
                    false
                );
            } else {
                reactComponent.setState({
                    loading: false,
                });
            }
        } else {
            reactComponent.setState({
                loading: false,
            });
        }

        if ((reactComponent.state as any).isValid && returnFlags) {
            return StorageController.values.tokens[
                (reactComponent.state as any).tokenId
            ].flags;
        }

        if ((reactComponent.state as any).token.tokenId === undefined) {
            throw new Error('bad token');
        }
    } catch (error) {
        Controller.log(error);
        reactComponent.setState({
            error,
            isValid: false,
        });
    }
};

export const getLink = (token, key) => {
    const project = Controller.getProjectSettings();
    return project.links[key];
};

export const hasLinkKey = (token, key) => {
    if (token.destinations === undefined || token.destinations.length === 0) {
        return false;
    }

    const project = Controller.getProjectSettings();

    if (project.links === undefined) {
        return false;
    }

    if (project.links[key] === undefined) {
        return false;
    }

    return hasDestination(token, (project.links[key] as any).index);
};

export const hasDestination = (token, index) =>
    token?.destinations !== undefined &&
    token.destinations.length > 0 &&
    token.destinations[index] !== undefined &&
    !token.destinations[index].includes('0x0000');

/**
 * Combines two objects
 * @param {object} obj1
 * @param {object} obj2
 * @returns
 */

export const combineObject = (object1, object2) => {
    const res = {
        ...object1,
    };

    for (const [index, value] of Object.entries(object2)) {
        res[index] = value;
    }

    return res;
};

// Of course i stole this from stack overflow :)
export const md5 = (inputString) => {
    const hc = '0123456789abcdef';
    function rh(n) {
        let j;
        let s = '';
        for (j = 0; j <= 3; j++) {
            s +=
                hc.charAt((n >> (j * 8 + 4)) & 0x0f) +
                hc.charAt((n >> (j * 8)) & 0x0f);
        }

        return s;
    }

    function ad(x, y) {
        const l = (x & 0xff_ff) + (y & 0xff_ff);
        const m = (x >> 16) + (y >> 16) + (l >> 16);
        return (m << 16) | (l & 0xff_ff);
    }

    function rl(n, c) {
        return (n << c) | (n >>> (32 - c));
    }

    function cm(q, a, b, x, s, t) {
        return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cm((b & c) | (~b & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cm((b & d) | (c & ~d), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cm(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cm(c ^ (b | ~d), a, b, x, s, t);
    }

    function sb(x) {
        let i;
        const nblk = ((x.length + 8) >> 6) + 1;
        const blks = Array.from({ length: nblk * 16 }) as any;
        for (i = 0; i < nblk * 16; i++) {
            blks[i] = 0;
        }

        for (i = 0; i < x.length; i++) {
            blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
        }

        blks[i >> 2] |= 0x80 << ((i % 4) * 8);
        blks[nblk * 16 - 2] = x.length * 8;
        return blks;
    }

    let i;
    const x = sb(inputString);
    let a = 1_732_584_193;
    let b = -271_733_879;
    let c = -1_732_584_194;
    let d = 271_733_878;
    let olda;
    let oldb;
    let oldc;
    let oldd;
    for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;
        a = ff(a, b, c, d, x[i + 0], 7, -680_876_936);
        d = ff(d, a, b, c, x[i + 1], 12, -389_564_586);
        c = ff(c, d, a, b, x[i + 2], 17, 606_105_819);
        b = ff(b, c, d, a, x[i + 3], 22, -1_044_525_330);
        a = ff(a, b, c, d, x[i + 4], 7, -176_418_897);
        d = ff(d, a, b, c, x[i + 5], 12, 1_200_080_426);
        c = ff(c, d, a, b, x[i + 6], 17, -1_473_231_341);
        b = ff(b, c, d, a, x[i + 7], 22, -45_705_983);
        a = ff(a, b, c, d, x[i + 8], 7, 1_770_035_416);
        d = ff(d, a, b, c, x[i + 9], 12, -1_958_414_417);
        c = ff(c, d, a, b, x[i + 10], 17, -42_063);
        b = ff(b, c, d, a, x[i + 11], 22, -1_990_404_162);
        a = ff(a, b, c, d, x[i + 12], 7, 1_804_603_682);
        d = ff(d, a, b, c, x[i + 13], 12, -40_341_101);
        c = ff(c, d, a, b, x[i + 14], 17, -1_502_002_290);
        b = ff(b, c, d, a, x[i + 15], 22, 1_236_535_329);
        a = gg(a, b, c, d, x[i + 1], 5, -165_796_510);
        d = gg(d, a, b, c, x[i + 6], 9, -1_069_501_632);
        c = gg(c, d, a, b, x[i + 11], 14, 643_717_713);
        b = gg(b, c, d, a, x[i + 0], 20, -373_897_302);
        a = gg(a, b, c, d, x[i + 5], 5, -701_558_691);
        d = gg(d, a, b, c, x[i + 10], 9, 38_016_083);
        c = gg(c, d, a, b, x[i + 15], 14, -660_478_335);
        b = gg(b, c, d, a, x[i + 4], 20, -405_537_848);
        a = gg(a, b, c, d, x[i + 9], 5, 568_446_438);
        d = gg(d, a, b, c, x[i + 14], 9, -1_019_803_690);
        c = gg(c, d, a, b, x[i + 3], 14, -187_363_961);
        b = gg(b, c, d, a, x[i + 8], 20, 1_163_531_501);
        a = gg(a, b, c, d, x[i + 13], 5, -1_444_681_467);
        d = gg(d, a, b, c, x[i + 2], 9, -51_403_784);
        c = gg(c, d, a, b, x[i + 7], 14, 1_735_328_473);
        b = gg(b, c, d, a, x[i + 12], 20, -1_926_607_734);
        a = hh(a, b, c, d, x[i + 5], 4, -378_558);
        d = hh(d, a, b, c, x[i + 8], 11, -2_022_574_463);
        c = hh(c, d, a, b, x[i + 11], 16, 1_839_030_562);
        b = hh(b, c, d, a, x[i + 14], 23, -35_309_556);
        a = hh(a, b, c, d, x[i + 1], 4, -1_530_992_060);
        d = hh(d, a, b, c, x[i + 4], 11, 1_272_893_353);
        c = hh(c, d, a, b, x[i + 7], 16, -155_497_632);
        b = hh(b, c, d, a, x[i + 10], 23, -1_094_730_640);
        a = hh(a, b, c, d, x[i + 13], 4, 681_279_174);
        d = hh(d, a, b, c, x[i + 0], 11, -358_537_222);
        c = hh(c, d, a, b, x[i + 3], 16, -722_521_979);
        b = hh(b, c, d, a, x[i + 6], 23, 76_029_189);
        a = hh(a, b, c, d, x[i + 9], 4, -640_364_487);
        d = hh(d, a, b, c, x[i + 12], 11, -421_815_835);
        c = hh(c, d, a, b, x[i + 15], 16, 530_742_520);
        b = hh(b, c, d, a, x[i + 2], 23, -995_338_651);
        a = ii(a, b, c, d, x[i + 0], 6, -198_630_844);
        d = ii(d, a, b, c, x[i + 7], 10, 1_126_891_415);
        c = ii(c, d, a, b, x[i + 14], 15, -1_416_354_905);
        b = ii(b, c, d, a, x[i + 5], 21, -57_434_055);
        a = ii(a, b, c, d, x[i + 12], 6, 1_700_485_571);
        d = ii(d, a, b, c, x[i + 3], 10, -1_894_986_606);
        c = ii(c, d, a, b, x[i + 10], 15, -1_051_523);
        b = ii(b, c, d, a, x[i + 1], 21, -2_054_922_799);
        a = ii(a, b, c, d, x[i + 8], 6, 1_873_313_359);
        d = ii(d, a, b, c, x[i + 15], 10, -30_611_744);
        c = ii(c, d, a, b, x[i + 6], 15, -1_560_198_380);
        b = ii(b, c, d, a, x[i + 13], 21, 1_309_151_649);
        a = ii(a, b, c, d, x[i + 4], 6, -145_523_070);
        d = ii(d, a, b, c, x[i + 11], 10, -1_120_210_379);
        c = ii(c, d, a, b, x[i + 2], 15, 718_787_259);
        b = ii(b, c, d, a, x[i + 9], 21, -343_485_551);
        a = ad(a, olda);
        b = ad(b, oldb);
        c = ad(c, oldc);
        d = ad(d, oldd);
    }

    return rh(a) + rh(b) + rh(c) + rh(d);
};

/**
 * Verifys form data given from react components. Form is the data given
 * from the form capture, the keys are an object where each of the indexes specify a
 * key in the form data and the value is what it should be, any undefined keys or missing keys
 * or incorrectly typed (number when string) will invalidate the form. Uses validator.js
 *
 * @param {object|Array} form
 * @param {object} keys
 * @param {boolean} allowUndefined
 * @returns
 */
export const validateForm = (
    form: object | Array<any>,
    keys: object,
    allowUndefined: boolean = true
) => {
    let count = 0;
    for (const [index, type] of Object.entries(keys)) {
        const value = form[count++];
        // Miscount
        if (
            (value === undefined ||
                value === null ||
                value === 'undefined' ||
                value === '' ||
                value === 'null') &&
            allowUndefined
        ) {
            continue;
        } else if (value === undefined) {
            return false;
        }

        switch (type) {
            case 'url': {
                if (!validator.isURL(value)) {
                    return [index, 'a http url.'];
                }

                break;
            }

            case 'email': {
                if (!validator.isEmail(value)) {
                    return [index, 'an email.'];
                }

                break;
            }

            case 'string': {
                if (!isNaN(value)) {
                    return [index, 'a non numerical value.'];
                }

                break;
            }

            default:
            case 'text': {
                if (!validator.isAlphanumeric(value)) {
                    return [
                        index,
                        'a plain string that contains no special characters.',
                    ];
                }

                break;
            }

            case 'twitter': {
                const result = value.match(/(^|[^@\w])@(\w{1,15})\b/g);

                if (
                    (value === undefined ||
                        value == null ||
                        value.length === 0) &&
                    allowUndefined
                ) {
                    continue;
                }

                if (
                    result === undefined ||
                    result == null ||
                    result.length !== 1
                ) {
                    return [
                        index,
                        'a valid twitter handle. Must include the @.',
                    ];
                }

                break;
            }

            case 'number': {
                if (!validator.isNumeric(value)) {
                    return [index, 'a number and only that.'];
                }

                break;
            }

            case 'address': {
                if (
                    (value === undefined ||
                        value == null ||
                        value.length === 0) &&
                    allowUndefined
                ) {
                    continue;
                }

                if (!validator.isEthereumAddress(value)) {
                    return [index, 'an ethereum address'];
                }

                break;
            }
        }
    }

    return [true, null];
};

/**
 *
 * @param {Component} setState
 * @param {any} value
 * @returns
 */
export const waitSetState = (reactComponent, values) =>
    new Promise((resolve) => {
        reactComponent.setState(values, resolve);
    });

/**
 * Cuts a string with ... after specified amount of characters
 * @param {string} str
 * @param {number} length
 * @returns
 */
export const cutLongString = (string_, length: number = 18) =>
    tryDecodeURI(string_).length > length
        ? tryDecodeURI(
              tryDecodeURI(string_).slice(0, Math.max(0, length - 1)) + '...'
          )
        : tryDecodeURI(string_);

/**
 * Returns true if a string is empty
 * @param {string} s
 * @returns
 */
export const isEmpty = (s: string) => {
    if (typeof s !== 'string' || s === null || s === undefined) {
        return true;
    }

    if (s.trim().length === 0) {
        return true;
    }

    return false;
};

/**
 * This should be in by default
 * @param {*} seconds
 * @param {*} exec
 */
export const delay = async (seconds: any, miliseconds = false) =>
    new Promise((resolve, reject) => {
        setTimeout(() => resolve(true), seconds * (miliseconds ? 1 : 1000));
    });

/**
 * NOTE: Does not escape HTML
 * @param {*} array
 * @returns
 */
export const cleanStrings = (array: any) =>
    array.map((value) => {
        if (typeof value === 'object') {
            throw new TypeError(`${value} is cannot be a string`);
        }

        if (typeof value !== 'string') {
            value = value.toString();
        }

        return value.replace(/["'/\\`]/g, '');
    });
