import tinySVG from 'tinysvg-js';
import Controller from './controller.js';
import { md5 } from './helpers.js';
import StorageController from './storageController.js';

/**
 * Web3 Sticker Controller Class
 *      Llydia Cross 2022
 *
 * Like the Web3 Controller class but only for stickers
 */

export const parseBlockchainSticker = async (value, tokenId) => {
    let Config = Controller.getConfig();
    const unpacked = Controller.decodeRequest(value, true, false);
    unpacked.request = Controller.decodeSticker(unpacked.request, false, false);

    if (unpacked.request.sticker.includes('{')) {
        unpacked.request.sticker = JSON.parse(unpacked.request.sticker);
    } else {
        const result = await fetch(unpacked.request.sticker);
        unpacked.request.sticker = await result.json();
    }

    unpacked.verified = false;
    if (StickerController.verifyStickerChecksum(unpacked.request.sticker)) {
        unpacked.verified = true;
    }

    if (unpacked.verified) {
        // TODO: Make it so they can be images as well
        try {
            unpacked.request.sticker.convertedPath = tinySVG.toSVG(
                unpacked.request.sticker.paths,
                true,
                unpacked.request.sticker.colours,
                false,
                true
            );

            if (StorageController.values.requests[tokenId] === undefined) {
                StorageController.values.requests[tokenId] = {};
            }

            StorageController.values.requests[tokenId][
                unpacked.request.sticker.id
            ] = {
                id: unpacked.request.sticker.id,
                time: Date.now(),
                source: 'result',
                sticker:
                    StorageController.values.stickers[
                        unpacked.request.sticker.id
                    ] !== undefined
                        ? unpacked.request.sticker.id
                        : unpacked.request.sticker,
                verified: unpacked.verified,
                validTill: Date.now() + Config.settings.cacheLength,
            };

            StorageController.saveData();
        } catch (error) {
            Controller.log('[😞] Error', 'error');
            Controller.log(error);
        }
    } else {
        Controller.log(
            '[😞] WARNING! Could not verify sticker potentially very bads sticker! Please look into this sticker:',
            'error'
        );
        console.log(unpacked);
    }

    return { ...unpacked };
};

export class StickerController {
    instance;
    #token;
    #tokenId;
    #contractName;

    async isDifferentTokenId(comparable) {
        return this.#tokenId !== comparable;
    }

    /**
     *
     * @param {number} tokenId
     * @returns
     * @throws
     */
    async createContract(tokenId, contractName = 'Fake_EADStickers') {
        let Config = Controller.getConfig();
        const abi = Config.getDeployment(contractName).abi;
        this.#token = await Controller.getTokenObject(tokenId);
        this.#tokenId = tokenId;

        if (this.#token.tokenId !== this.#tokenId) {
            throw new Error('object does not match class parameter');
        }

        if (
            this.#token.destinations[1] === undefined ||
            this.#token.destinations[1] === Controller.nullAddress
        ) {
            throw new Error('user has not linked sticker contract');
        }

        this.#contractName = contractName;
        this.instance = Controller.initializeContract(
            this.#token.destinations[1],
            contractName,
            true,
            abi
        );
        Controller.setupEvents(contractName);
        return this.instance;
    }

    /**
     * Supply a string instead of an object to look up an Id locally
     * @param {string|Object} sticker
     * @returns
     */
    verifyStickerChecksum(sticker) {
        if (typeof sticker === 'string') {
            sticker = this.getLocalSticker(sticker);
        }

        if (sticker.final !== undefined) {
            sticker = sticker.final;
        }

        if (
            sticker?.checksum === undefined ||
            typeof sticker.checksum !== 'string'
        ) {
            return false;
        }

        const copy = { ...sticker };
        if (copy.checksum !== undefined) {
            delete copy.checksum;
        }

        if (copy.convertedPath !== undefined) {
            delete copy.convertedPath;
        }

        if (sticker.checksum !== md5(JSON.stringify(copy))) {
            return false;
        }

        return true;
    }

    /**
     * When passing a string, will look up the id in storage controller, use second argument to specify of final if normal sticker.
     * If passing object, second parameter is obsolete. Third parameter set to true will throw on all errors instead of silent return, it
     * silent returns on name check and sticker Id undefined in storage controller check.
     * @param {object|string} potentialSticker
     * @param {bool} final
     * @param {bool} throwAll
     * @returns
     */

    checkSticker(potentialSticker, final = false, throwAll = false) {
        let sticker;
        let Config = Controller.getConfig();

        if (
            typeof potentialSticker !== 'object' &&
            typeof potentialSticker !== 'string'
        ) {
            throw new TypeError('bad sticker');
        }

        if (
            typeof potentialSticker === 'object' &&
            potentialSticker.name !== undefined
        ) {
            sticker = { ...potentialSticker };
            final = false;
        } else if (
            StorageController.values.stickers[potentialSticker] === undefined
        ) {
            if (throwAll) {
                throw new Error('bad sticker');
            } else {
                return;
            }
        } else {
            sticker = StorageController.values.stickers[potentialSticker];
            if (final && sticker.final === undefined) {
                throw new Error('bad sticker');
            }

            if (final) {
                sticker = sticker.final;
            }
        }

        if (sticker.name === undefined && throwAll) {
            throw new Error('Invalid Metadata');
        } else if (sticker.name === undefined) {
            return;
        }

        if (sticker.paths === undefined || sticker.paths === '') {
            throw new Error('Invalid/Unset Apperance');
        } else {
            try {
                tinySVG.toSVG(sticker.paths);
            } catch (error) {
                throw new Error(
                    'Failed to convert paths back to SVG: ' + error.message
                );
            }
        }

        if (sticker.properties === undefined) {
            throw new Error('Invalid Properties: No properties present');
        }

        if (
            sticker.properties.x === undefined ||
            sticker.properties.y === undefined ||
            sticker.properties.scale === undefined
        ) {
            throw new Error(
                'Invalid Properties: Scale, X or Y property missing.'
            );
        }

        if (sticker.properties.scale < 0 || sticker.properties.scale > 1) {
            throw new Error('Invalid Properties: Scale is invalid');
        }

        if (
            (final && sticker.state === 0) ||
            (final && sticker.checksum === undefined)
        ) {
            throw new Error('bad sticker');
        }

        const pathSize = new Blob([JSON.stringify(sticker.paths)]).size;
        const totalSize = new Blob([JSON.stringify(sticker)]).size;

        if (pathSize > Config.settings.maxPathSize) {
            throw new Error(
                'Invalid Paths: The size of the SVG is currently too big.'
            );
        }

        if (totalSize > Config.settings.maxStickerSize) {
            throw new Error(
                'Invalid Sticker: The size of the sticker is currently too big.'
            );
        }
    }

    getLocalSticker(localStickerId) {
        return StorageController.values.stickers[localStickerId];
    }

    finalizeSticker(localStickerId) {
        StorageController.values.stickers[localStickerId].state = 1;
        StorageController.values.stickers[localStickerId].final = {
            ...StorageController.values.stickers[localStickerId],
        };

        // Delete the final final
        delete StorageController.values.stickers[localStickerId].final.final;

        // Generate MD5 hash of the final struct
        StorageController.values.stickers[localStickerId].final.checksum = md5(
            JSON.stringify(
                StorageController.values.stickers[localStickerId].final
            )
        );

        StorageController.saveData();
    }

    async sendRequest(localStickerId, stickerPrice = null) {
        let Config = Controller.getConfig();
        this.checkSticker(localStickerId, true, true); // Will throw

        if (!this.verifyStickerChecksum(localStickerId)) {
            throw new Error('Checksum Invalid');
        }

        if (stickerPrice === null) {
            stickerPrice = await this.getStickerPrice();
        }

        const sticker = StorageController.values.stickers[localStickerId].final;
        const result = await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            this.#contractName,
            'addRequest',
            Config.events.Stickers.RequestAdded,
            {
                parameters: [this.encodeStickerRequest(sticker)],
                gasPrice: Config.getGasPrices().fast,
            },
            stickerPrice
        );

        if (result[0] !== null) {
            throw new Error(result[0]?.message || JSON.stringify(result[0]));
        }

        if (StorageController.values.requests[this.#tokenId] === undefined) {
            StorageController.values.requests[this.#tokenId] = {};
        }

        StorageController.values.requests[this.#tokenId][localStickerId] = {
            id: localStickerId,
            time: Date.now(),
            source: 'local',
            sticker: localStickerId,
            validTill: Date.now() + Config.settings.cacheLength,
            verified: false,
        };

        if (
            StorageController.values.stickers[localStickerId].requests ===
            undefined
        ) {
            StorageController.values.stickers[localStickerId].requests = [
                this.tokenId,
            ];
        }

        StorageController.saveData();
        return result[1];
    }

    encodeStickerRequest(sticker) {
        return Controller.web3.eth.abi.encodeParameters(
            ['uint64', 'string', 'string', 'address'],
            [
                this.#tokenId,
                sticker.checksum,
                JSON.stringify(sticker),
                Controller.accounts[0],
            ]
        );
    }

    async acceptRequest(address, index) {
        let Config = Controller.getConfig();
        const result = await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            this.#contractName,
            'acceptRequest',
            Config.events.Stickers.RequestAccepted,
            {
                parameters: [address, index],
                gasPrice: Config.getGasPrices().fast,
            }
        );

        Controller.toggleFlag(this.#tokenId, 'refresh');
        Controller.toggleFlag(this.#tokenId, 'needsTokenURIREfresh');

        return result;
    }

    async withdrawRequest(index) {
        let Config = Controller.getConfig();
        return await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            this.#contractName,
            'withdrawRequest',
            Config.events.Stickers.RequestWithdrew,
            {
                parameters: [index],
                gasPrice: Config.getGasPrices().fast,
            }
        );
    }

    hasRequestsForSticker(id) {
        const requests = Object.values(StorageController.values.requests || []);
        if (requests.length === 0) {
            return false;
        }

        for (const request_ of requests) {
            const request = Object.values(request_);

            for (const sticker of request) {
                if (sticker.id === id) {
                    return true;
                }
            }
        }
    }

    async denyRequest(address, index) {
        let Config = Controller.getConfig();
        return await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            this.#contractName,
            'denyRequest',
            Config.events.Stickers.RequestDenied,
            {
                parameters: [address, index],
                gasPrice: Config.getGasPrices().fast,
            }
        );
    }

    async setStickerPrice(price) {}

    async getBlockchainSticker(stickerId) {}

    async getStickerObject(stickerId) {}

    async getStorageSticker(stickerId) {}

    async getStickerPrice() {
        if (this.instance === undefined) {
            throw new Error(
                'You have not called createContract inside of this class'
            );
        }

        return Controller.callMethod(
            Controller.accounts[0],
            this.#contractName,
            'stickerPrice'
        );
    }

    /**
     *
     * @param {*} id
     * @param {*} method
     * @returns
     */
    async getSticker(id, method = 'getMyRequestedSticker') {
        const result = await Controller.callMethod(
            Controller.accounts[0],
            this.#contractName,
            method,
            { parameters: [id] }
        );

        return parseBlockchainSticker(result, this.#tokenId);
    }

    /**
     *
     * @returns
     */
    async getRequests() {
        return await this.getRequestedStickersMethod(
            this.#tokenId,
            'getRequests'
        );
    }

    async getMyRequestedStickers() {
        return await this.getRequestedStickersMethod(
            this.#tokenId,
            'getMyRequests'
        );
    }

    /**
     *
     * @returns
     */
    async getRequestedStickersMethod(tokenId, method = 'getRequests') {
        let results = [];

        try {
            results = await Controller.callMethod(
                Controller.accounts[0],
                this.#contractName,
                method
            );
        } catch (error) {
            Controller.log(error);
        }

        if (results.length === 0) {
            Controller.log('[⚠️] Has no requested stickers', 'warning');
            return [];
        }

        const returns = [];
        for (const [i, result] of results.entries()) {
            if (result === '0x') {
                Controller.log(
                    new Error(
                        'index ' +
                            i +
                            ' is zero bytes potentially faulty sticker contract'
                    )
                );
                continue;
            }

            returns[i] = await parseBlockchainSticker(result, tokenId);
        }

        return returns;
    }

    /**
     * Must call await Controller.createStickerContract(tokenId) before
     * @param {number} tokenId
     * @returns
     */
    async getStickers() {
        if (this.instance === undefined) {
            throw new Error(
                'You have not called createContract inside of this class'
            );
        }

        const results = await Controller.callMethod(
            Controller.accounts[0],
            this.#contractName,
            'getStickers',
            {}
        );

        if (results.length === 0) {
            return [];
        }

        const returns = [];
        for (const result_ of results) {
            const result = await this.getSticker(result_, 'getSticker');
            returns.push(result);
        }

        return returns;
    }
}

const stickerController = new StickerController();
export default stickerController;
