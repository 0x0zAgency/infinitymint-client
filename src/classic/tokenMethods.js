import tinySVG from 'tinysvg-js';
import { Button } from 'react-bootstrap';
import Config from '/src/config.js';
import Controller from './controller.js';
import StorageController from './storageController.js';

/**
 * SVG Render methods
 * ===============================================================================
 */

/**
 * Experimental function which converts a token to SVG.
 * @param {object} token
 * @param {Array} stickers
 * @returns
 */

export const tokenToSVG = (token, stickers = [], options = {}) => {
    if (typeof token !== 'object') {
        throw new TypeError('token must be an object');
    }

    const pathSettings = Controller.getPathSettings(token.pathId);
    const paths = Controller.getPaths(token.pathId);
    let map = Object.values(tinySVG.readTinySVG(paths));
    let groupCount = 0;
    let stickerCount = 0;
    let renderedColours = 0;

    const colours = [...token.colours].reverse();

    if (map.length === 0) {
        throw new Error('token map is invalid');
    }

    /**
     * Token
     */

    // replace colours & do ids
    map = map.map((value, index) => {
        if (value.properties === undefined) {
            value.properties = {};
        }

        // Heading tag
        if (value.tag === 'h') {
            value.properties.id = 'token_' + token.tokenId || token.previewId;

            // Add style options from path settings
            /**
			value.properties.style =
				Controller.getCSSProperties({
					//no padding on tokenURI as it can break
					padding: !options.isTokenURI
						? pathSettings.padding || 0
						: 0,
					"background-color": Controller.getTokenExtraColour(
						token,
						"background"
					),
					"font-family": pathSettings.fontFamily || "sans-serif",
					"box-shadow": `1px 0px 0px ${pathSettings.borderThickness || "4px"
						} ${Controller.getTokenExtraColour(token, "border_1")}`,
				}) + (value.properties.style || "");

			if (pathSettings.viewbox !== undefined)
				value.properties.viewbox = pathSettings.viewbox;
				**/
        }

        if (
            tinySVG.isColourTag(value.tag) &&
            value.properties.fill === undefined &&
            renderedColours++ < pathSettings.pathSize
        ) {
            value.properties.fill =
                colours.length > 0
                    ? !isNaN(colours[colours.length - 1])
                        ? tinySVG.toHexFromDecimal(colours.pop())
                        : colours.pop()
                    : 'none';
        }

        if (
            tinySVG.isPathTag(value.tag) &&
            value.properties.stroke === undefined &&
            pathSettings.hideStroke !== true
        ) {
            value.properties.stroke = '#000';
        }

        if (
            value.tag !== 'g' &&
            value.tag !== 'h' &&
            value.properties.id === undefined
        ) {
            value.properties.id = 'token_' + token.tokenId + '_path_' + index;
        } else if (value.tag !== 'h' && value.properties.id === undefined) {
            value.properties.id =
                'token_' + token.tokenId + '_group_' + groupCount++;
        }

        return value;
    });

    /**
     * Stickers
     */
    const func = (sticker) => {
        // Reset group count for each sticker
        groupCount = 0;

        const colours = [...sticker.colours];
        let paths;
        paths =
            sticker.paths.slice(0, 4) !== '<svg'
                ? tinySVG.toSVG(sticker.paths, false, colours)[0]
                : sticker.paths;

        const result = Object.values(tinySVG.toTinySVG(paths, true).map).map(
            (value, index) => {
                if (value.properties === undefined) {
                    value.properties = {};
                }

                if (value.properties.transform === '*') {
                    delete value.properties.transform;
                }

                if (tinySVG.isColourTag(value.tag)) {
                    value.properties = {
                        ...value.properties,
                        fill:
                            colours.length > 0
                                ? !isNaN(colours[colours.length - 1])
                                    ? tinySVG.toHexFromDecimal(colours.pop())
                                    : colours.pop()
                                : 'none',
                    };
                }

                if (
                    value.tag !== 'g' &&
                    value.tag !== 'h' &&
                    value.properties.id === undefined
                ) {
                    value.properties.id =
                        'token_' +
                        token.tokenId +
                        '_sticker_' +
                        stickerCount +
                        '_path_' +
                        index;
                } else if (value.tag !== 'h') {
                    value.properties.id =
                        'token_' +
                        token.tokenId +
                        '_sticker_' +
                        stickerCount +
                        '_group_' +
                        groupCount++;
                }

                return value;
            }
        );

        return [
            {
                ...tinySVG.createElement('g', {
                    ...sticker.properties.group,
                    id: 'token_' + token.tokenId + '_sticker_' + stickerCount++,
                    style: `transform: scale(${
                        sticker.properties.scale
                    }) translate(${
                        sticker.properties.x / sticker.properties.scale
                    }px, ${
                        sticker.properties.y / sticker.properties.scale
                    }px); transform-origin: center center;`,
                }),
                startTag: true,
            },
            result.slice(1, -2),
            {
                ...tinySVG.createElement('g', {
                    ...sticker.properties.group,
                }),
                endTag: true,
            },
        ];
    };

    // Top stickers above the token
    for (const sticker of stickers
        .filter((value) => value?.properties?.top === true)
        .map(func)) {
        map = tinySVG.insertMap(sticker, map, true);
    }

    // Bottom stickers below the token
    for (const sticker of stickers
        .filter((value) => value?.properties?.top !== true)
        .map(func)) {
        map = tinySVG.insertMap(sticker, map, false);
    }

    /**
     * Text and text positioning
     */
    // map = renderTokenSVGText(map.pathSettings, token);

    /**
		 * Finally any css styles / imports

		map.push(
			tinySVG.createElement(
				"style",
				{},
				`
					${map[0].properties.id !== undefined ? `#${map[0].properties.id}` : ".token"}{

					}
				`
			)
		);
			*/

    for (const [index, value] of map.entries()) {
        if (Array.isArray(value)) {
            map = map.slice(0, index);
            const tail = map.slice(index + 1);
            for (const _value of value) {
                map.push(_value);
            }

            map = [...map, ...tail];
        }
    }

    const element = tinySVG.createElement('g', {
        style: Controller.getCSSProperties({
            // No padding on tokenURI as it can break
            padding: !options.isTokenURI ? pathSettings.padding || 0 : 0,
            'background-color': Controller.getTokenExtraColour(
                token,
                'background'
            ),
            'font-family': pathSettings.fontFamily || 'sans-serif',
            'box-shadow': `1px 0px 0px ${
                pathSettings.borderThickness || '4px'
            } ${Controller.getTokenExtraColour(token, 'border_1')}`,
        }),
    });

    map = [
        { ...element, startTag: true },
        ...map,
        { ...element, endTag: true },
    ];

    // Finally output the svg
    if (options.isHeaderless) {
        map = map.slice(1, -2);
    }

    return tinySVG.toSVG(map, true)[0];
};

/**
 *
 * @param {*} map
 * @param {*} pathSettings
 * @param {*} token
 * @returns
 */
export const renderTokenSVGText = (map, pathSettings, token) => {
    const text = [{ ...tinySVG.createElement('t'), startTag: true }];

    // First we check if we are doing paths but only do them if custom is not defined
    if (
        pathSettings.text?.path !== undefined &&
        pathSettings.text?.path !== null &&
        (pathSettings.text?.custom === undefined ||
            pathSettings.text?.custom === null)
    ) {
        const id =
            typeof pathSettings.text?.path !== 'object'
                ? pathSettings.text?.path
                : pathSettings.text?.path.id; // Should throw if Id does not exist
        for (let name of token.names) {
            const properties = {
                href: '#token_' + token.tokenId + '_path_' + id,
                spacing: 'auto',
                startOffset: pathSettings.text?.path?.offset || 5,
            };

            if (pathSettings.text?.settings?.capitalizeName === true) {
                name =
                    name.slice(0, 1).toUpperCase() +
                    name.substring(1, name.length - 1);
            }

            text.push(tinySVG.createElement('tp', properties, name));
        }
    } else if (
        pathSettings.text?.custom !== undefined &&
        pathSettings.text?.custom === null
    ) {
    } else {
        // Default to inline
    }

    text.push([{ ...tinySVG.createElement('t'), endTag: true }]);
    // Add to the map at the end
    return tinySVG.insertMap(text, map, false);
};

/**
 * End Render Methods
 * ===============================================================================
 */

export class TokenMethods {
    manifest = {};
    interface = {
        type: 'image',
    };

    // Must return HTML or something react can render.
    renderToken = (
        controller, // Instance of src/Controller.js
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Must return an object
    createTokenURI = (
        controller,
        renderedToken,
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Calls after the token is rendered (html is put onto page and can be accessed through document.getELementId)
    postRenderToken = (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {};

    // Called before the token is mounted
    tokenUnmount = (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {};

    // Called everytime the react component is updated
    updateToken = async (
        controller, // Instance of src/Controller.js
        renderedToken,
        token,
        stickers = [],
        settings = {}
    ) => {};

    // Called when the window is resized
    onWindowResize = (controller) => {};

    /**
     * For each InfinityMint asset contract a render method and createTokenURI method is defined
     * to handle the various different circumstances
     */
    scripts = {
        default: 'SimpleSVG',
        // NOTE: simpleSVG is defined by default but might move back into solidity
        // TODO: Version2 needs to accept options object so we can render differently depending on what page we are on ETC: Gallery, thumbnail etc
        // lower res versions need to be rendered for the thumbnails specifically
        SimpleSVG: {
            // Controller | class (is the site wide instance of https://github.com/0x0zAgency/InfinityMint/blob/master/src/controller.js_
            // renderedToken | string (the token in HTML form)
            // token | object (the token from the blockchain)
            // stickers | Array (list of InfinityMint stickers as objects)
            /**
             * Called by react after the token has been rendered
             * @param {Controller} controller
             * @param {string} renderedToken
             * @param {object} token
             * @param {Array} stickers
             */
            async postRenderToken(
                _controller,
                renderedToken,
                token,
                stickers
            ) {},

            /**
             * Called by react before the token is unmounted
             * @param {Controller} controller
             * @param {string} renderedToken
             * @param {object} token
             * @param {Array} stickers
             */
            tokenUnmount(_controller, renderedToken, token, stickers) {},

            /**
             *
             * @param {Controller} _controller
             * @param {object} token
             * @param {Array} stickers
             * @returns
             */
            async updateToken(
                _controller, // Instance of src/Controller.js
                renderedToken,
                token,
                stickers = [],
                settings = {}
            ) {
                if (
                    document.getElementById('token_' + token.tokenId) !== null
                ) {
                    // Rerender it
                    document.getElementById(
                        'token_' + token.tokenId
                    ).parentNode.innerHTML = tokenToSVG(token, stickers, {
                        isTokenURI: settings.isTokenURI === true,
                        isHeaderless: settings.isHeaderless === true,
                    });
                }
            },

            /**
             *
             * @param {Controller} _controller
             * @param {object} token
             * @param {Array} stickers
             * @param {bool} isTokenURI
             * @param {bool} isHeaderless
             * @returns
             */
            renderToken(
                _controller, // Instance of src/Controller.js
                token,
                stickers = [],
                settings = {}
            ) {
                if (typeof token.token === 'object') {
                    token = token.token;
                }

                try {
                    return tokenToSVG(token, stickers, {
                        isTokenURI: settings.isTokenURI === true,
                        isHeaderless: settings.isHeaderless === true,
                    });
                } catch (error) {
                    Controller.log(
                        '[❌] Drawing token ' +
                            (token.tokenId || token.previewId),
                        'token'
                    );
                    Controller.log(error);
                    return (
                        <div
                            style={{
                                width: '100%',
                                height: '472px',
                                background: 'black',
                                color: 'red',
                                padding: '15%',
                                textShadow: '5px 5px 15px red',
                            }}
                        >
                            <p style={{ fontSize: 48 }}>Error</p>
                            <p>
                                No need to be sad. Its okay. Just clear your
                                cache/local storage and it will be okay.
                            </p>
                            <Button
                                variant="danger"
                                className="mt-4"
                                onClick={() => {
                                    StorageController.values.preload = {};
                                    StorageController.values.tokens = {};
                                    StorageController.values.tokenURI = {};
                                    StorageController.saveData();
                                }}
                            >
                                Refresh InfinityMint
                            </Button>
                        </div>
                    );
                }
            },

            // Called when the window is resized
            onWindowResize(controller) {},

            // Controller | class (is the site wide instance of https://github.com/0x0zAgency/InfinityMint/blob/master/src/controller.js_
            // renderedToken | string (the token in HTML form)
            // token | object (the token from the blockchain)
            // stickers | Array (list of InfinityMint stickers as objects)
            /**
             *
             * @param {object} controller
             * @param {string} renderedToken
             * @param {object} token
             * @param {Array} stickers
             */
            createTokenURI(
                _controller,
                renderedToken,
                token,
                stickers = [],
                settings = {}
            ) {
                const svg = Controller.Base64.encode(renderedToken);
                const object = {
                    name: encodeURIComponent(token.name),
                    external_url: `${Config.settings.url}/view/${token.tokenId}`,
                    description: `This ${
                        Controller.getDescription().token
                    } is #${token.tokenId} and is a ${encodeURIComponent(
                        Controller.getPathSettings(token.pathId).name
                    )}. It is called the '${encodeURIComponent(
                        token.name
                    )} and it is currently owned by ${
                        token.owner
                    }. Find out more at ${Config.settings.url}/view/${
                        token.tokenId
                    }`,
                    image: 'data:image/svg+xml;base64,' + svg,
                    attributes: [
                        {
                            trait_type: 'Type',
                            value: token.pathId,
                        },
                    ],
                };

                return object;
            },
        },
        RaritySVG: 'SimpleSVG',
    };

    /**
     * Takes name of script file to get methods from inside Deployments/Scripts so for instance: SimpleImage, RarityToken
     * @param {string} key
     * @returns
     */
    getScript(key) {
        if (typeof this.scripts[key] === 'string') {
            return this.scripts[this.scripts[key]];
        }

        return this.scripts[key];
    }

    /**
     *
     * @param {object} token
     * @param {Array} stickers
     * @param {bool} isTokenURI
     * @param {bool} isHeaderless
     * @returns
     */

    getRenderedToken(token, stickers, settings = {}) {
        const result = this.renderToken(Controller, token, stickers, settings);

        if (result === null || result === undefined) {
            throw new Error(
                'invalid render token function must return something'
            );
        }

        return result;
    }

    /**
     *
     * @param {*} token
     * @param {*} renderedToken
     * @param {*} stickers
     * @param {*} settings
     * @returns
     */
    getTokenURI(token, renderedToken, stickers, settings = {}) {
        const result = this.createTokenURI(
            Controller,
            renderedToken,
            token,
            stickers,
            settings
        );

        if (typeof result !== 'object') {
            throw new TypeError('invalid tokenURI');
        }

        return result;
    }

    async loadScripts() {
        try {
            this.manifest =
                await require('/src/Deployments/scripts/manifest.json');

            if (
                this.manifest !== null &&
                this.manifest?.scripts !== undefined &&
                this.manifest.scripts.length > 0
            ) {
                for (let i = 0; i < this.manifest.scripts.length; i++) {
                    this.scripts[this.manifest.scripts[i].split('.')[0]] = (
                        await require('/src/Deployments/scripts/' +
                            this.manifest.scripts[i])
                    ).default;
                }
            }
        } catch (error) {
            Controller.log(
                '[😞] could not load token script manifest',
                'error'
            );
            Controller.log(error);
            this.manifest = null;
        }
    }

    /**
     *
     * @returns
     */
    load() {
        this.renderToken = this.getScript('default').renderToken;
        this.createTokenURI = this.getScript('default').createTokenURI;

        let renderScript =
            Config.deployInfo?.modules?.renderScript ||
            Config.deployInfo?.modules?.controller;
        Controller.log(
            'loading token methods for ' + renderScript,
            'token method'
        );

        // For backwards compatability
        if (renderScript === 'RarityImage' || renderScript === 'SimpleImage') {
            renderScript = 'ImageAsset';
        }

        if (
            renderScript === undefined ||
            this.scripts[renderScript] === undefined
        ) {
            console.log(
                ' ! Controller module ' +
                    renderScript +
                    ' does not have render/createTokenURI methods defined!'
            );
            return;
        }

        try {
            this.renderToken = this.getScript(renderScript).renderToken;
            this.createTokenURI = this.getScript(renderScript).createTokenURI;
            this.updateToken = this.getScript(renderScript).updateToken;
            this.tokenUnmount = this.getScript(renderScript).tokenUnmount;
            this.postRenderToken = this.getScript(renderScript).postRenderToken;
            this.onWindowResize = this.getScript(renderScript).onWindowResize;
            this.interface = {
                ...this.getScript(renderScript).interface,
            };
        } catch (error) {
            Controller.log(
                '[😞] Failed to map one or more methods from token script file.',
                'error'
            );
            Controller.log(error);
        }
    }
}

/**
 * tokenMethods class to execute render/createTokenURI methods based on what module we have loaded. So we can render SVG and Audiocover and
 * what ever and have it in a nice maintainable way.
 */
const tokenMethods = new TokenMethods();
export default tokenMethods;
