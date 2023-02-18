import Controller from './controller.js';
// Works with local storage to save and load data we will use in the react application
const StorageController = new (class {
    values = {};
    // Private
    #fields;
    /**
     * Constructor
     */
    constructor() {
        // Define new keys here
        this.#fields = {
            transactions: {}, // All of your transactions
            tokens: {}, // Cached tokens from the block chain,
            previews: {},
            stickers: {},
            requests: {},
            preload: {},
            paths: {},
            tokenURI: {},
            images: {},
            deployments: {},
            offers: {},
            transfers: {},
            redemptionRequests: {},
            awaitingCollection: {},
            pagePrefrences: {},
        };
    }

    /**
     *
     * @param {string|number} key
     * @param {*} value
     */
    setGlobalPreference(key, value) {
        const pref = { ...this.getGlobalPreferences() };
        pref[key] = value;
        this.values.pagePrefrences.global = pref;
        this.saveData();
    }

    /**
     *
     * @param {string|number} key
     * @returns
     */
    getGlobalPreference(key) {
        return this.getGlobalPreferences()[key];
    }

    /**
     *
     * @param {string|number} key
     * @returns
     */
    isGlobalPreference(key) {
        return this.getGlobalPreferences()[key] === true;
    }

    /**
     *
     * @returns
     */
    getGlobalPreferences() {
        return this.values.pagePrefrences.global || {};
    }

    /**
     * Removes ? and # tags from a url so we just get the folder/page
     * @returns
     */
    getLocationHref() {
        let location = window.location.href;
        let split = location.split('?'); // No get
        if (split[1] !== undefined) {
            location = split[0];
        }

        split = location.split('#'); // No href
        if (split[1] !== undefined) {
            location = split[0];
        }

        if (location.at(-1) !== '/') {
            return location + '/';
        }

        return location;
    }

    /**
     *
     * @param {string} key
     * @param {*} value
     * @param {string|number} id
     */
    setPagePreference(key, value, id = null) {
        if (id !== null && typeof id !== 'string') {
            id = id.id || id.name || 'default';
        } else if (
            id === null ||
            (typeof id === 'string' && id.toLowerCase() === 'global')
        ) {
            id = this.getLocationHref();
        }

        Controller.log(
            "Saving page prefrence for page id '" +
                (id === null ? 'global' : id) +
                "' key of: " +
                key,
            'storage'
        );

        if (this.values.pagePrefrences[id] === undefined) {
            this.values.pagePrefrences[id] = {};
        }

        this.values.pagePrefrences[id][key] = value;
        this.saveData();
    }

    /**
     *
     * @param {string} key
     * @param {string} id
     * @returns
     */
    getPagePreference(key, id = null, log = true) {
        if (id !== null && typeof id !== 'string') {
            id = id.id || id.name || 'default';
        } else if (
            id === null ||
            (typeof id === 'string' && id.toLowerCase() === 'global')
        ) {
            id = this.getLocationHref();
        }

        if (log) {
            Controller.log(
                "Reading page prefrence for page id '" +
                    (id === null ? 'global' : id) +
                    "' key of: " +
                    key,
                'storage'
            );
        }

        if (this.values.pagePrefrences[id] === undefined) {
            return undefined;
        }

        return this.values.pagePrefrences[id][key];
    }

    /**
     *
     * @param {string} key
     * @param {string} id
     * @returns
     */
    isPageReference(key, id = null) {
        return this.getPagePreference(key, id) === true;
    }

    /**
     * Trurns true if the key exists, and is not null. use existsAndNotEmpty if using arrays/objects
     * @param {string} key
     * @param {bool} nullCheck
     * @returns
     */
    exists(key, nullCheck = true) {
        return (
            this.values[key] !== undefined &&
            (!nullCheck ? true : this.values[key] !== undefined)
        );
    }

    /**
     * Returns true only if the key exists and the length of entries inside of the key is not zero. Will
     * return false if the key is not an array, or an object.
     * @param {string} key
     * @returns
     */
    existsAndNotEmpty(key) {
        if (!this.exists(key)) {
            return false;
        }

        if (
            typeof this.values[key] !== 'object' &&
            Array.isArray(this.values[key]) === false
        ) {
            return false;
        }

        if (Object.entries(this.values[key]).length === 0) {
            return false;
        }

        return true;
    }

    /**
     * Saves a transaction
     * @param {object} tx
     * @param {string} method
     * @param {bool} save
     */
    saveTransactionResult(tx, method = 'mint', save = true) {
        Controller.log(
            'Saving transaction result from method: ' + method,
            'storage'
        );
        const object = {
            address: Controller.accounts[0],
            date: Date.now(),
            method,
            ...tx,
        };
        if (this.values.transactions[method] === undefined) {
            this.values.transactions[method] = [object];
        } else {
            this.values.transactions[method].push(object);
        }

        if (save) {
            this.saveData();
        }
    }

    /**
     * Must be called before Controller.load()
     */
    loadSavedData() {
        Controller.log('Loading storaged data from local storage', 'storage');
        for (const [key, value] of Object.entries(this.#fields)) {
            this.values[key] = null;
            const item = localStorage.getItem(key);

            if (item === null && typeof value !== 'object') {
                continue;
            } else if (item === null && typeof value === 'object') {
                this.values[key] = {};
                continue;
            }

            switch (typeof value) {
                case 'object': {
                    this.values[key] = JSON.parse(item);
                    break;
                }

                case 'boolean': {
                    this.values[key] = item === 'false' ? false : Boolean(item);
                    break;
                }

                case 'number': {
                    this.values[key] = Number.parseInt(item);
                    break;
                }

                default: {
                    this.values[key] = item;
                }
            }
        }
    }

    /**
     * Wipes the storage clean. Does not save.
     */
    wipe() {
        Controller.log('Wiping storage', 'storage');
        for (const [key] of Object.entries(this.#fields)) {
            this.values[key] = {};
        }
    }

    /**
     * Sets item to value
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        Controller.log('Setting ' + key, 'storage');
        if (this.values[key] === undefined) {
            throw new Error('trying to set an undefined value');
        }

        this.values[key] = value;
        this.saveData();
    }

    /**
     * Saves all the data inside of fields to local storage and packs objects accordingly
     */
    saveData() {
        Controller.log('Saving storage data', 'storage');
        for (const [key, value] of Object.entries(this.#fields)) {
            let item = this.values[key];
            if (typeof value === 'object') {
                if (item === null) {
                    item = {};
                }

                item = JSON.stringify(item);
            }

            // Save
            localStorage.setItem(key, item);
        }
    }
})();

export default StorageController;
