import React, { PureComponent } from "react";
import Controller from "infinitymint-client/dist/src/classic/controller";
import { Container, Row, Card, Button } from "react-bootstrap";
import Loading from "../../../../Components/Loading";
import { loadPath } from "infinitymint-client/dist/src/classic/helpers";

class Edit extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            allPaths: {},
            loadingReason:
                "We are downloading all of the InfinityMint paths from IPFS...",
            loading: "false",
        };
    }

    async componentDidMount() {
        const project = Controller.getProjectSettings();
        this.setState({ loading: true });

        await Promise.all(
            Object.values(project.paths).map(async (path) => {
                await loadPath(project, path.pathId);
            })
        );

        this.setState({ allPaths: project.paths });
        this.setState({ loading: false });
    }

    render() {
        return (
            <Container>
                <h1 className="text-white bg-info p-4 my-2">
                    Edit Token Content
                </h1>
                <hr />
                {this.state.loading ? (
                    <Loading />
                ) : (
                    <Row>
                        {Object.values(this.state.allPaths).map((path) => {
                            return (
                                <Card
                                    style={{ width: "18rem" }}
                                    className="g-2"
                                >
                                    <Card.Img
                                        variant="top"
                                        src={Controller.getPaths(path.pathId)}
                                        alt="?"
                                    />
                                    <Card.Body>
                                        <Button
                                            variant="primary"
                                            onClick={async () => {
                                                window.location.href =
                                                    "/admin/content/edit/" +
                                                    path.pathId;
                                            }}
                                        >
                                            Edit path of {path.name}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </Row>
                )}
            </Container>
        );
    }
}

Edit.url = "/admin/content/edit";
Edit.id = "Edit";
Edit.requirements = {
    requireAdmin: true,
    requireWallet: true,
};

export default Edit;
