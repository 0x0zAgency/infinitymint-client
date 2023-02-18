import Controller from './controller.js';
import Config from './config.js';

// Loaded through await import
let ResStrings = {};

/**
 * Recursive function to replace special keys inside strings in an object
 * @param {object} obj
 * @returns
 */
const replaceInObject = (object) => {
    for (const index of Object.keys(object)) {
        if (typeof object[index] === 'string') {
            if (
                !index.includes('Plural') &&
                object[index + '_Plural'] === undefined
            ) {
                object[index + '_Plural'] = Resources.replaceInString(
                    object[index]
                        .replace(/%token%/g, '%tokens%')
                        .replace(/%tokenCapitalized%/g, '%tokensCapitalized%'),
                    true
                );
            }

            if (
                !index.includes('Plural') &&
                object[index + '_Plural'] !== undefined &&
                object[index + 's'] === undefined
            ) {
                object[index + 's'] = object[index + '_Plural'];
            }

            if (
                !index.includes('Plural') &&
                object[index + '_Plural'] !== undefined &&
                object[index + 'es'] === undefined
            ) {
                object[index + 'es'] = object[index + '_Plural'];
            }

            object[index] = Resources.replaceInString(
                object[index],
                index.includes('Plural')
            );
        } else {
            object[index] = replaceInObject(object[index]);
        }
    }

    return object;
};

/**
 * Controller class to work with the strings
 */

const Resources = new (class {
    $;
    #map; // Set in load
    #savedDescription = {
        token: 'Unknown',
        name: 'Unknown',
    };

    constructor() {
        this.$ = {
            UI: {
                Responses: {
                    Success: '',
                    Failure: '',
                    Error: '',
                },
                Symbols: {},
                Action: {
                    Accept: '',
                    Reject: '',
                    Success: '',
                    Cancel: '',
                    Delete: '',
                    Continue: '',
                    Find: '',
                    Refresh: '',
                },
                Navbar: {},
                Footer: {},
            },
            Pages: {},
        };
    }

    projectName() {
        return this.#savedDescription.name;
    }

    replaceInString(value_, isPlural = false) {
        for (const [index, value] of Object.entries(this.#map)) {
            value_ = value_.replace(
                // Note: Only replaces one!
                index,
                typeof value === 'function' ? value(isPlural) : value
            );
        }

        return value_;
    }

    /**
     * Returns the
     * @returns
     */
    projectToken() {
        return this.#savedDescription.token;
    }

    projectTokenPlural() {
        return (
            this.#savedDescription.tokenPlural ||
            this.#savedDescription.token + 's'
        );
    }

    tokenPlural() {
        return this.projectTokenPlural();
    }

    token() {
        return this.projectToken();
    }

    get(term) {
        let terms = term.split('.');
        let scope = this[terms[0]];

        terms = terms.slice(1);
        for (const term of terms) {
            scope = scope[term];
        }

        return scope;
    }

    getPageString(page, key, plural = false) {
        try {
            return this.replaceInString(this.$.Pages[page][key], plural);
        } catch {
            return page + '.' + key;
        }
    }

    capitalize(string_) {
        return string_.slice(0, 1).toUpperCase() + string_.slice(1);
    }

    async initialize() {
        ResStrings = await import(
            './Resources/' + Config.resources.replace(/.js/g, '') + '.js'
        );

        // This.#map has to be defined here due to getDescription needing to be loaded
        this.#map = {
            '%token%': (isPlural) =>
                (isPlural
                    ? this.projectTokenPlural()
                    : this.projectToken()
                ).toLowerCase(),
            '%tokens%': (isPlural) => this.projectTokenPlural().toLowerCase(),
            '%tokenCapitalized%': (isPlural) =>
                this.capitalize(
                    isPlural ? this.projectTokenPlural() : this.projectToken()
                ),
            '%tokensCapitalized%': (isPlural) =>
                this.capitalize(this.projectTokenPlural()),
            '%name%': Controller.getDescription().name,
            '\\!': (isPlural) => (isPlural ? 's' : ''),
            '\\?': (isPlural) => (isPlural ? "'s" : ''),
            '\\e': (isPlural) => (isPlural ? 'es' : ''),
            '\\g': (isPlural) => (isPlural ? 'es' : ''),
        };

        this.#savedDescription = Controller.getDescription();
    }

    async load() {
        // Populate map, get description etc
        await this.initialize();
        for (const [key, group] of Object.entries(
            ResStrings.default || ResStrings
        )) {
            const indexes = [];
            const _ = Object.keys(group).map((index) => {
                // Push current index to stack to unpack later since map does not retain index
                indexes.push(index);
                if (typeof group[index] === 'string') {
                    if (
                        !index.includes('Plural') &&
                        group[index + '_Plural'] === undefined
                    ) {
                        group[index + '_Plural'] = this.replaceInString(
                            group[index]
                                .replace(/%token%/g, '%tokens%')
                                .replace(
                                    /%tokenCapitalized%/g,
                                    '%tokensCapitalized%'
                                ),
                            true
                        );
                    }

                    if (
                        index.includes('Plural') &&
                        group[index + 's'] === undefined
                    ) {
                        group[index + 's'] = group[index + '_Plural'];
                    }

                    if (
                        index.includes('Plural') &&
                        group[index + 'es'] === undefined
                    ) {
                        group[index + 'es'] = group[index + '_Plural'];
                    }

                    return this.replaceInString(
                        group[index],
                        group[index].includes('Plural')
                    );
                }

                // Recursive function to step through an array creating plural variants of
                // members where possible
                return replaceInObject(group[index]);
            });

            // Unpack stack replacing numerical keys with actual keys
            while (indexes.length > 0) {
                const index = indexes.length - 1;
                _[indexes.pop()] = { ..._[index] };
                delete _[index]; // Delete numerical
            }

            this.$[key] = _;
        }
    }

    getUIString(type, key, plural = false) {
        try {
            return this.replaceInString(ResStrings.UI[type][key], plural);
        } catch {
            return type + '.' + key;
        }
    }
})();

export default Resources;
