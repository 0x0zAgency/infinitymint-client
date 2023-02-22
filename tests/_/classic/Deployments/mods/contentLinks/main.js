import Controller from "infinitymint-client/dist/src/classic/controller";
import { Button, Card, Alert } from "react-bootstrap";
import NavigationLink from "../../../Components/NavigationLink";

const ContentLinks = {
    getViewTokenSidebarChildren: async ({ token }) => {
        let path = Controller.getPathSettings(token.pathId);
        return (
            <>
                <Card
                    body
                    className="bg-light"
                    hidden={
                        token.owner !== Controller.accounts[0] ||
                        (path.content !== undefined &&
                            Object.keys(path.content).filter(
                                (key) => key.indexOf("track") !== -1
                            ).length === 0)
                    }
                >
                    <p className="text-center display-5">🎧club.eth</p>
                    <p className="text-center">
                        This token comes bundled with a streamable ep/album
                    </p>
                    <div className="d-grid">
                        <NavigationLink
                            location={"/view/" + token.tokenId + "/audio"}
                            text={"Listen"}
                            size="md"
                            variant="primary"
                        />
                    </div>
                </Card>
                <Card
                    body
                    className="bg-light"
                    hidden={token.owner !== Controller.accounts[0]}
                >
                    <p className="text-center display-5">♾Links</p>
                    <p className="text-center">
                        This token has some cool content attached to it!
                    </p>
                    <div className="d-grid">
                        <NavigationLink
                            location={"/view/" + token.tokenId + "/content"}
                            text={"View ♾Content"}
                            size="md"
                            variant="primary"
                        />
                    </div>
                </Card>
            </>
        );
    },

    onLink: async (link) => {},
    /**
     *
     * @param {Controller} param0
     */
    initialize: async () => {},
};

export default ContentLinks;
