import React, { Component } from 'react';
import { Col, Row, Container, Card, Button, Form } from 'react-bootstrap';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import {
    loadPath,
    waitSetState,
    unpackColours,
} from 'infinitymint-client/dist/src/classic/helpers';
import Loading from '../../../../Components/Loading';
import { Redirect } from 'react-router-dom';
import GasMachine from '../../../../Components/GasMachine';

const Config = Controller.getConfig();
class SelectiveMint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fakeToken: {
                names: [],
                previewId: 0,
                colours: [],
                mintData: {},
                name: Controller.getDescription().token,
                pathId: 0,
                pathSize: 0,
                assets: [],
                owner: Controller.accounts[0],
            },
            loadingReason:
                'We are downloading all of the InfinityMint paths from IPFS...',
            stickers: [],
            loading: false,
            paths: [],
            error: undefined,
            mintDataValue: '',
            isReady: false,
            location: '',
        };
    }

    async mint(pathId) {
        this.setState({
            loadingReason: 'Minting your InfinityMint token...',
            loading: true,
        });

        let tokenId = await Controller.callMethod(
            Controller.accounts[0],
            'InfinityMintApi',
            'totalMints'
        );
        tokenId = parseInt(tokenId.toString());
        await Controller.sendMethod(
            Controller.accounts[0],
            'Mod_SelectiveMint',
            'mint',
            {
                filter: {
                    sender: Controller.accounts[0],
                },
                parameters: [pathId, [], 0x0],
                gasPrice: Config.getGasPrices().fast,
            },
            !Controller.isAdmin
                ? Controller.web3.utils.toWei(
                      String(Controller.getContractValue('getPrice')),
                      'ether'
                  )
                : 0
        );
        // Redirect
        await waitSetState(this, {
            showOverlay: false,
            success: true,
            loading: false,
            location: `/view/${tokenId + 1}`,
        });
    }

    async componentDidMount() {
        const project = Controller.getProjectSettings();

        if (project.paths !== undefined) {
            let vals = Object.values(project.paths);
            for (let i = 0; i < vals.length; i++) {
                await loadPath(project, i);
            }

            this.setState({
                // Remove default fro mthe paths
                paths: Object.keys(project.paths)
                    .filter((key) => key !== 'default')
                    .map((key) => project.paths[key]),
            });
        }

        this.setState({
            isReady: true,
        });
    }

    render() {
        if (this.state.location !== '') {
            return <Redirect to={this.state.location} />;
        }

        return (
            <>
                {this.state.isReady && !this.state.loading ? (
                    <Container className="mt-4">
                        <p className="header-text textGold text-center">
                            Choose your own!
                        </p>
                        <Row>
                            <Col>
                                <GasMachine />
                            </Col>
                        </Row>
                        <Card className="mt-4 pt-2 pb-2">
                            <Row className="mx-2">
                                {this.state.paths.map((path, index) => (
                                    <>
                                        <Col lg={4}>
                                            <Card>
                                                <Card.Body>
                                                    <Card.Title>
                                                        {path.name}
                                                    </Card.Title>
                                                    <Card.Text>
                                                        {path.description}
                                                    </Card.Text>
                                                    <img
                                                        alt={path.name}
                                                        className="img-fluid w-100"
                                                        src={path.paths.data}
                                                    ></img>
                                                    <div className="d-grid mt-4">
                                                        <Button
                                                            variant="primary"
                                                            onClick={async () => {
                                                                await this.mint(
                                                                    index
                                                                );
                                                            }}
                                                        >
                                                            Mint this one!
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </>
                                ))}
                            </Row>
                        </Card>
                    </Container>
                ) : (
                    <Loading
                        showLoadingBar={true}
                        loadingReason={this.state.loadingReason}
                    />
                )}
                <br />
                <br />
                <br />
            </>
        );
    }
}

SelectiveMint.url = '/selectivemint';
SelectiveMint.id = 'SelectiveMint';
SelectiveMint.settings = {};
export default SelectiveMint;
