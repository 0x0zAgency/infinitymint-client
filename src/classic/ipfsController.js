import { Web3Storage, File } from 'web3.storage/dist/bundle.esm.min.js';

export class IPFSController {
    #instance;

    createInstance(apikey) {
        this.#instance = new Web3Storage({ token: apikey });
    }

    async uploadFile(filename, data, type = 'image/png') {
        if (this.#instance === undefined || this.#instance === null) {
            throw new Error('create instance needs to be ran first');
        }

        let file;

        if (type !== null) {
            file = new File(data instanceof Array ? data : [data], filename, {
                type,
            });
        } else {
            file = new File(data instanceof Array ? data : [data], filename);
        }

        return await this.#instance.put([file]);
    }

    getContentType(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'png':
            case 'vector': {
                return 'image/png';
            }

            case 'svg': {
                return 'image/svg+xml';
            }

            case 'jpeg': {
                return 'image/jpeg';
            }

            default: {
                return 'text/plain';
            }
        }
    }

    getContentExtension(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'image/png':
            case 'png':
            case 'image': {
                return 'png';
            }

            case 'image/jpeg':
            case 'jpeg': {
                return 'jpg';
            }

            case 'vector':
            case 'image/svg+xml':
            case 'svg': {
                return 'svg';
            }

            case 'tinysvg':
            case 'image/tinysvg': {
                return 'tinysvg';
            }

            default: {
                return 'bin';
            }
        }
    }

    destroyInstance() {
        this.#instance = null;
    }
}
const ipfsController = new IPFSController();
export default ipfsController;
