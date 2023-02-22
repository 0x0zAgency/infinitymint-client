import React, { Component } from "react";
import {
    loadToken,
    loadStickers,
    waitSetState,
} from "infinitymint-client/dist/src/classic/helpers";
import {
    Card,
    Container,
    Row,
    Col,
    Button,
    Alert,
    Form,
} from "react-bootstrap";
import Controller from "infinitymint-client/dist/src/classic/controller";
import Resources from "infinitymint-client/dist/src/classic/resources";
import { connectWallet } from "infinitymint-client/dist/src/classic/helpers";
import StorageController from "infinitymint-client/dist/src/classic/storageController";
import NavigationLink from "../../../../Components/NavigationLink";
import Loading from "../../../../Components/Loading";
import Token from "../../../../Components/Token";

class ViewContent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            tokenData: {},
            token: {
                pathSize: 13,
                colours: [],
            },
            selectedContentKey: "3d",
            isValid: true,
            error: undefined,
        };
    }

    async componentDidMount() {
        try {
            await loadStickers(this);
            await loadToken(this);

            if (this.state.token.owner !== Controller.accounts[0])
                throw new Error("must be owner of token");
        } catch (error) {
            Controller.log("[😞] Error", "error");
            Controller.log(error);
            this.setState({
                isValid: false,
            });
        }
    }

    render() {
        let contentKeys = [];
        let tracksNames = [];
        let content = {};
        if (this.state.isValid) {
            content =
                Controller.getPathSettings(this.state.token.pathId).content ||
                {};
            contentKeys = Object.keys(content);
        }

        let selected = content[this.state.selectedContentKey];

        return (
            <>
                {!this.state.isValid || this.state.loading ? (
                    <Container>
                        {this.state.loading ? (
                            <Loading />
                        ) : (
                            <Row className="mt-4">
                                <Col className="text-center text-white">
                                    {!Controller.isWalletValid ? (
                                        <div className="d-grid mt-2 gap-2 text-center">
                                            <Alert variant="danger">
                                                <h3>
                                                    Sorry to put a stop to your
                                                    travels....
                                                </h3>
                                                You need to connect your web3
                                                wallet in order to view a{" "}
                                                {Resources.projectToken().toLowerCase()}
                                            </Alert>
                                            <Button
                                                onClick={() => {
                                                    window.open(
                                                        Controller.getCollectionURL(
                                                            this.state.tokenId
                                                        )
                                                    );
                                                }}
                                                variant="succes`s"
                                            >
                                                View Token On Opensea
                                            </Button>
                                            <Button
                                                variant="dark"
                                                className="ms-2"
                                                onClick={async () => {
                                                    await connectWallet();
                                                }}
                                            >
                                                Connect Wallet
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="display-2">
                                                <span className="badge bg-danger">
                                                    Invalid Token
                                                </span>
                                            </h1>
                                            <p className="fs-5">
                                                It might be loading or this{" "}
                                                {Resources.projectToken()}{" "}
                                                straight up might not exist.
                                            </p>
                                            <div className="d-grid mt-2 gap-2">
                                                <Button
                                                    variant="light"
                                                    size="lg"
                                                    onClick={async () => {
                                                        try {
                                                            delete StorageController
                                                                .values.tokens[
                                                                this.state
                                                                    .tokenId
                                                            ];
                                                            StorageController.saveData();

                                                            this.setState({
                                                                token: {
                                                                    pathSize: 0,
                                                                    colours: [],
                                                                    stickers:
                                                                        [],
                                                                },
                                                                error: null,
                                                                loading: true,
                                                                isValid: false,
                                                            });

                                                            await this.componentDidMount();
                                                        } catch (error) {
                                                            this.setError(
                                                                error
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {
                                                        Resources.$.UI.Action
                                                            .Refresh
                                                    }
                                                </Button>
                                                <NavigationLink
                                                    location="/mint"
                                                    text={
                                                        Resources.$.UI.Action
                                                            .MintToken
                                                    }
                                                />
                                                <NavigationLink
                                                    location={"/mytokens"}
                                                    text={
                                                        Resources.$.UI.Action
                                                            .MyTokens
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        )}
                    </Container>
                ) : (
                    <Container className="mt-4">
                        <Row>
                            <Col>
                                <h1 className="display-1 force-white mb-4 mt-3 text-center">
                                    <span className="nikeboiAltText text-white">
                                        ♾Links
                                    </span>
                                </h1>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col className="gap-2" lg={6}>
                                <Card
                                    Body
                                    hidden={
                                        this.state.selectedContentKey !== "3d"
                                    }
                                >
                                    <Container fluid className="d-grid">
                                        <Row>
                                            <Token
                                                theToken={this.state.token}
                                                className="p-0 m-0"
                                                settings={{
                                                    selectable3D: true,
                                                    disableFloor3D: true,
                                                    downsampleRate3D: 1.1,
                                                    lightIntensity3D: 100,
                                                    lightColour3D: 0xffffff,
                                                    useFresh: true,
                                                    renderOnUpdate: true,
                                                    ambientLightIntensity3D: 50,
                                                    ambientLightColour3D: 0xffffff,
                                                    cameraFOV: 62,
                                                    drawContextKey:
                                                        selected.type ===
                                                            "png" ||
                                                        selected.type ===
                                                            "jpeg" ||
                                                        selected.type ===
                                                            "jpg" ||
                                                        selected.type === "svg"
                                                            ? this.state
                                                                  .selectedContentKey
                                                            : false,
                                                    cameraPositionY: 5,
                                                    meshRotation3D: {
                                                        x: -12,
                                                        y: 0,
                                                        z: 0,
                                                    },
                                                    enableThreeJS:
                                                        this.state
                                                            .selectedContentKey ===
                                                        "3d"
                                                            ? true
                                                            : false,
                                                    hidePathName: true,
                                                    hideTokenId: true,
                                                    hideModBadges: true,
                                                    hideLinkBadges: true,
                                                    hideDescription: true,
                                                }}
                                            />
                                        </Row>
                                    </Container>
                                </Card>
                                {selected !== undefined &&
                                this.state.selectedContentKey !== "3d" ? (
                                    <Card body className="h-100">
                                        <p>{selected.fileName}</p>

                                        <></>
                                        <div className="d-grid">
                                            {selected.type === "mp3" ||
                                            selected.type === "wav" ? (
                                                <>
                                                    <audio
                                                        controls
                                                        style={{
                                                            backgroundImage:
                                                                "url('https://pbs.twimg.com/profile_banners/970869459253542913/1666243248/1500x500')",
                                                        }}
                                                    >
                                                        <source
                                                            src={
                                                                selected.paths
                                                                    .localStorage
                                                                    ? selected
                                                                          .paths
                                                                          .data
                                                                    : selected
                                                                          .paths
                                                                          .ipfsURL
                                                            }
                                                            type="audio/mpeg"
                                                        />
                                                        Your browser does not
                                                        support the audio
                                                        element.
                                                    </audio>
                                                </>
                                            ) : selected.type === "svg" ? (
                                                <iframe
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                    src={selected.paths.data}
                                                >
                                                    {selected.paths.data}
                                                </iframe>
                                            ) : (
                                                <img
                                                    alt="some"
                                                    src={
                                                        selected.paths
                                                            .localStorage
                                                            ? selected.paths
                                                                  .data
                                                            : selected.paths
                                                                  .ipfsURL
                                                    }
                                                    className="mx-auto img-fluid"
                                                ></img>
                                            )}
                                        </div>
                                    </Card>
                                ) : (
                                    <></>
                                )}
                            </Col>
                            <Col lg={6}>
                                <Card Body className="">
                                    <Card.Subtitle className="p-4 border-bottom border-1 mt-1 mb-0 fs-2">
                                        ♾ Content
                                    </Card.Subtitle>
                                    <Row className="mt-4">
                                        <Col>
                                            <Form.Group className="p-2">
                                                <Form.Select
                                                    onChange={(e) => {
                                                        waitSetState(this, {
                                                            loading: true,
                                                        }).then(() => {
                                                            this.setState(
                                                                {
                                                                    selectedContentKey:
                                                                        e.target
                                                                            .value,
                                                                },
                                                                () => {
                                                                    this.setState(
                                                                        {
                                                                            loading: false,
                                                                        }
                                                                    );
                                                                }
                                                            );
                                                        });
                                                    }}
                                                >
                                                    {contentKeys.map((key) => (
                                                        <option
                                                            value={key}
                                                            selected={
                                                                this.state
                                                                    .selectedContentKey ===
                                                                key
                                                            }
                                                        >
                                                            {key}{" "}
                                                            {tracksNames[
                                                                key
                                                            ] !== undefined
                                                                ? tracksNames[
                                                                      key
                                                                  ]
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    {selected !== undefined ? (
                                        <Row>
                                            <Col>
                                                <Card
                                                    body
                                                    className="bg-dark p-2 m-2"
                                                >
                                                    <p className="fs-2 text-white">
                                                        {
                                                            this.state
                                                                .selectedContentKey
                                                        }
                                                        <span className="badge bg-light ms-2">
                                                            media
                                                        </span>
                                                    </p>
                                                    <p className="text-white">
                                                        {tracksNames[
                                                            this.state
                                                                .selectedContentKey
                                                        ] !== undefined
                                                            ? tracksNames[
                                                                  this.state
                                                                      .selectedContentKey
                                                              ]
                                                            : ""}
                                                    </p>
                                                </Card>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Row>
                                            <Col>
                                                <Alert
                                                    className="text-center"
                                                    variant="warning"
                                                >
                                                    Invalid Content Key
                                                </Alert>
                                            </Col>
                                        </Row>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <div className="d-grid gap-2">
                                    <NavigationLink
                                        location={"/view/" + this.state.tokenId}
                                        variant="dark"
                                        size="lg"
                                        text={Resources.$.UI.Action.Back}
                                    />
                                    <NavigationLink
                                        location={"/mytokens"}
                                        variant="dark"
                                        size="lg"
                                        text={
                                            "All " +
                                            Resources.$.UI.Action.MyTokens
                                        }
                                    />
                                    <NavigationLink
                                        location={"/gallery"}
                                        variant="dark"
                                        size="lg"
                                        text={Resources.$.UI.Action.AllTokens}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Container>
                )}
                <br />
                <br />
                <br />
                <br />
            </>
        );
    }
}

ViewContent.url = "/view/:tokenId/content";
ViewContent.id = "ViewContent";
ViewContent.requirements = {
    requireWallet: true,
};

export default ViewContent;
