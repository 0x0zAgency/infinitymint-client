import * as Controller from './classic/controller';
import * as ModController from './classic/modController';
import * as StorageController from './classic/storageController';
import * as Helpers from './classic/helpers';
import * as PageController from './classic/pageController';
import * as StickerController from './classic/stickerController';
import * as Resources from './classic/resources';
import * as TinySVG from './classic/tinysvg';
import * as TokenMethods from './classic/tokenMethods';
import * as IPFSController from './classic/ipfs/web3Storage';

export const _ipfsController = IPFSController.default;

export const _controller = Controller.default;

export const _modController = ModController.default;

export const _storageController = StorageController.default;

export const _helpers = Helpers;

export const _pageController = PageController.default;

export const _stickerController = StickerController.default;

export const _resources = Resources.default;

export const _tinySVG = TinySVG.default;

export const _tokenMethods = TokenMethods.default;

const exportDefaultExports = {
    controller: _controller,
    modController: _modController,
    storageController: _storageController,
    helpers: _helpers,
    pageController: _pageController,
    stickerController: _stickerController,
    resources: _resources,
    ipfsController: _ipfsController,
    tinySVG: _tinySVG,
    tokenMethods: _tokenMethods,
};
export default exportDefaultExports;
