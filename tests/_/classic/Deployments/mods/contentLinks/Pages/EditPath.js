import React, { Component } from 'react';
import { waitSetState } from 'infinitymint-client/dist/src/classic/helpers';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import ipfsController from 'infinitymint-client/dist/src/classic/ipfsController';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import EditPathModal from '../Modals/EditPathModal.js';
import StorageController from 'infinitymint-client/dist/src/classic/storageController.js';
const Config = Controller.getConfig();
// 1.
// Make sure that setting the values in the input boxes works
// Create a box that uploads a file, reads it and lets you edit its contents
// These can be a string, file or whatever
// Once done, save and upload to IPFS, then save the new content to the project file
// Also do this when it changes
// Create a loading screen for when it's uploading
// Put a loading up when I do controller.sendMethod
// Ensure that the path data gets set into IPFS
// They'll require admin

// 2.
// Create ticketmint-experimental
// Copy awedacity
// Get rid of the awedacity look & restore it to a more template-y look
// (Bonus) Deploy it too

class EditPath extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pathId: this?.props?.match?.params?.pathId || 0,
            project: {},
            path: {},
            setIsOpen: false,
            value: {},
            selectedDropdown: '',
            showDeleteModal: false,
            showSaveModal: false,
            object: {},        
        };
    }

    async componentDidMount() {
        await waitSetState(this, {
            project: Controller.getProjectSettings(),
        });

        if (this.state.pathId && this.state.project.paths[this.state.pathId])
            this.setState({
                path: Controller.getPathSettings(this.state.pathId),
            });
    }

    async componenetDidUpdate(prevProps, prevState) {
        if (this.state.pathId !== prevState.pathId) {
            await waitSetState(this, {
                project: Controller.getProjectSettings(),
            });
        }

        if (this.state.pathId && this.state.project.paths[this.state.pathId]){
            this.setState({
                path: Controller.getPathSettings(this.state.pathId),
            });
        }

        this.setState({
            currentSavedValues: prevProps.savedValues,
        });
    }


    async addContent(key, extension, content) {
        let contentIndex = Object.values(this.state.path.content).length;
        let ipfsFile = contentIndex + '_' + key;
        let cid = await ipfsController.uploadFile(ipfsFile, content);
        let newContent = {
            pathId: this.state.pathId,
            fileName: null,
            contentIndex: 1,
            key,
            extension,
            type: extension,
            ipfsFileName: ipfsFile,
            paths: {
                data: cid,
                uploaded: Date.now(),
                type: 'text/plain',
                pathSize: 1,
                fileName: null,
                extension: 'gltf',
                colours: [],
                dontLoad: true,
                dontStore: true,
                projectStorage: false,
                localStorage: false,
                checksum: Controller.Base64.encode(content),
                ipfsURL: 'https://dweb.link/ipfs/' + cid,
                ipfs: true,
                size: new Blob([content]).size / 1024,
            },
        };
        let project = { ...this.state.project };
        project.paths[this.state.pathId].content[key] = newContent;
        this.setState({ project });

        let newProject = await ipfsController.uploadFile(
            'project',
            JSON.stringify(project)
        );
        let currentVersion = await Controller.callMethod(
            Controller.accounts[0],
            'InfinityMintProject',
            'getCurrentVersion'
        );
        currentVersion = parseInt(currentVersion.toString());

        await Controller.sendMethod(
            Controller.accounts[0],
            'InfinityMintProject',
            'updateProject',
            {
                parameters: [
                    Controller.web3.utils.fromAscii(
                        'https://dweb.link/ipfs/' +
                            newProject +
                            '/' +
                            Config.deployInfo.project +
                            '.json'
                    ),
                    Controller.web3.utils.fromAscii(
                        'version_' + (currentVersion + 1)
                    ),
                    true,
                ],
            }
        );
    }

    handleSelectChange(event, index) {
        const currentValues = [...this.state.value];
        StorageController.setGlobalPreference('curentValues', currentValues)
        this.setState({ selectedDropdown: event.target.value });
    }

    handleSubmit(event) {
        const extension = this.state.path.content.data.split('.').pop();
        this.addContent(
            this.state.path.content.data,
            extension,
            this.state.path.content
        );
        let currentProject = Controller.getProjectSettings();
        let project = { ...this.state.project };
        event.preventDefault();
    }

    reset(selected) {
        this.setState({
            value: selected.target[selected.target.selectedIndex].text,
            selectedDropdown: selected.target.value,
        });
        console.log(
            'selected.target: ',
            selected.target[selected.target.selectedIndex].text
        );
    }

    makeTextInput = (index) => {
        if (this.state.value[this.state.selectedDropdown] === undefined) {
            let _obj = {
                value: {
                    ...this.state.value,
                    [index]: this.state.value,
                },
            };
            this.setState(_obj);
            console.log(_obj);
        }

        return (
            <input
                type="text"
                key={this.state.value}
                ref={(elem) => (this.input = elem)}
                value={this.state.value[this.state.selectedDropdown]}
                showClear
                placeholder={
                    typeof contentValue === 'object'
                        ? JSON.stringify(this.state.value)
                        : this.state.value.current
                }
                onChange={(event) =>
                    this.setState({
                        value: {
                            [this.state.selectedDropdown]: event.target.value,
                        },
                    })
                }
            />
        );
    };

    saveValuesToProjectFile = async () => {
        let project = { ...this.state.project };
        project.paths[this.state.pathId].content = this.state.value;
        this.setState({ project });

        let newProject = await ipfsController.uploadFile(
            'project',
            JSON.stringify(project)
        );
        let currentVersion = await Controller.callMethod(
            Controller.accounts[0],
            'InfinityMintProject',
            'getCurrentVersion'
        );
        currentVersion = parseInt(currentVersion.toString());
        
        await Controller.sendMethod(
            Controller.accounts[0],
            'InfinityMintProject',
            'updateProject',
            {
                parameters: [
                    Controller.web3.utils.fromAscii(
                        'https://dweb.link/ipfs/' +

                            newProject +
                            '/' +
                            Config.deployInfo.project +
                            '.json'
                    ),
                    Controller.web3.utils.fromAscii(
                        'version_' + (currentVersion + 1)
                    ),
                    true,
                ],
            }
        );
    };


    render() {
        let content = this.state.path?.content || {};

        let renderContentFields = (contentBlock) => {
            let copy = { ...contentBlock };
            if (copy.paths) {
                delete copy.paths;
            }

            return Object.keys(contentBlock).map((contentKey) => {
                let value = contentBlock[contentKey];
                // contentIndex is the key
                // contentValue is the value

                return (
                    <>
                        <Row>
                            <Col>
                                <EditPathModal
                                    show={this.state.showSaveModal}
                                    onHide={() => {
                                        this.setState({
                                            showSaveModal:
                                                !this.state.showSaveModal,
                                        });
                                    }}
                                    onSelected={(sticker) => {
                                        this.setState({
                                            location: '/sticker/' + sticker.id,
                                        });
                                    }}
                                />
                                <div className="d-grid gap-4">
                                    {/* Ask what they're going to replace this content with */}

                                    <h1>{value.key}</h1>
                                    <h4>Content Keys</h4>
                                    <Form>
                                        <Form.Group>
                                            <Form.Label>{value.key}</Form.Label>
                                            <Form.Select
                                                onChange={(selected) =>
                                                    this.reset(selected)
                                                }
                                            >
                                                {Object.keys(value).map(
                                                    (contentIndex, index) => {
                                                        let contentValue =
                                                            value[contentIndex];
                                                        if (
                                                            contentIndex ===
                                                            'paths'
                                                        )
                                                            return <></>;
                                                        return (
                                                            <>
                                                                <option
                                                                    value={
                                                                        contentIndex
                                                                    }
                                                                >
                                                                    {typeof contentValue ===
                                                                    'object'
                                                                        ? JSON.stringify(
                                                                              contentIndex
                                                                          )
                                                                        : contentIndex}
                                                                </option>
                                                                {this.makeTextInput(contentIndex)}

                                                            </>
                                                        );
                                                    }

                                                )}
                                            </Form.Select>
                                            {/* <input
											type="text"
											value={this.state.value}
											onChange={e => {
												this.setState({value: e.target.value});
												console.log(this.state.value)
											}}
											placeholder={typeof contentValue === 'object' ? JSON.stringify(this.state.value) : this.state.value}/> */}
                                        </Form.Group>
                                    </Form>
                                    <h4>Content Path Value</h4>
                                    <Form.Group>
                                        <Form.Select
                                            onChange={(selected) =>
                                                this.reset(selected)
                                            }
                                        >
                                            <Form.Label>{value.key}</Form.Label>
                                            {Object.keys(value.paths).map(
                                                (contentIndex, index) => {
                                                    let contentValue =
                                                        value[contentIndex];

                                                    /*ref={e => this.setState({path: e.target.value.content})}*/

                                                    return (
                                                        <>
                                                            <option
                                                                key={index}
                                                                value={
                                                                    contentIndex
                                                                }
                                                            >
                                                                {typeof contentValue ===
                                                                'object'
                                                                    ? JSON.stringify(
                                                                          contentIndex
                                                                      )
                                                                    : contentIndex}
                                                            </option>
                                                        </>
                                                    );
                                                }
                                            )}
                                        </Form.Select>
                                        {this.makeTextInput()}
                                        {/* <input
											type="text"
											value={this.state.value}
											onChange={e => {
												this.setState({contentValue: e.target.value, value: e.target.value});
												console.log(value)
											}}
											placeholder={typeof contentValue === 'object' ? JSON.stringify(this.state.value) : this.state.value}/> */}
                                    </Form.Group>
                                    <button
                                        onClick={() => {
                                            this.setState({
                                                setIsOpen: true,
                                                showSaveModal: true,
                                            });
                                            console.log(this.state.setIsOpen);
                                        }}
                                        className="btn btn-success"
                                    >
                                        Update
                                    </button>
                                    {this.state.setIsOpen && (
                                        <EditPathModal
                                            show={
                                                this.state
                                                    .showFinalizedStickerModal
                                            }
                                            isOpen={this.state.setIsOpen}
                                        />
                                    )}
                                    {/* Let them also delete some content fields */}
                                    <button className="btn btn-danger">
                                        Delete
                                    </button>
                                    {/* {Object.keys(value.paths).map((contentIndex) => {
										let contentValue = value[contentIndex];
										if(contentIndex === 'paths') return <></>;
										return <p>{contentIndex} = <input type="text" placeholder={typeof contentValue === 'object' ? JSON.stringify(contentValue) : contentValue}/></p>
									})} */}
                                </div>
                            </Col>
                        </Row>
                    </>
                );
            });
        };

        return (
            <Container>
                <Row>
                    <Col>
                        <Card body>
                            <Row>
                                <Col className="gx-4">
                                    <img
                                        src={Controller.getPaths(
                                            this.state.pathId
                                        )}
                                        alt="?"
                                        className="img-fluid"
                                    />
                                    <h3>{this.state.path.name}</h3>
                                    <input type="submit" onClick={() => {}} />
                                    {/* Specify which content inside the path we're changing */}
                                </Col>
                                <Col>{renderContentFields(content || {})}</Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }
}

EditPath.url = '/admin/content/edit/:pathId';
EditPath.id = 'EditPath';
EditPath.requirements = {
    requireAdmin: true,
    requireWallet: true,
};

export default EditPath;
