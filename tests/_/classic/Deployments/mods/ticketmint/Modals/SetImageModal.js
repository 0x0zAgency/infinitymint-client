import React, { Component, useEffect, useRef, useState } from "react";
import { Modal, Form, Button, Col, Row, Alert, Card } from "react-bootstrap";
import StorageController from "infinitymint-client/dist/src/classic/storageController";
import Loading from "../../../../Components/Loading";
import Box from "../../../../Components/Box";
import ipfsController from "infinitymint-client/dist/src/classic/ipfsController";

export default function SetImageModal({
    show,
    onHide,
    currentKey,
    onSetImage,
    savedValues,
}) {
    const web3StorageApiKey = useRef(null);
    const [loaded, setLoaded] = useState(true);
    const [hasWeb3StorageKey, setHasWeb3StorageKey] = useState(
        StorageController.getGlobalPreference("web3StorageApiKey") !==
            undefined &&
            StorageController.getGlobalPreference("web3StorageApiKey") !== null
    );

    const uploadToIPFS = async (blob, ext) => {
        ipfsController.createInstance(
            StorageController.getGlobalPreference("web3StorageApiKey")
        );
        let cid = await ipfsController.uploadFile(currentKey + "." + ext, blob);
        setLoaded(true);
        onSetImage(
            currentKey,
            "https://dweb.link/ipfs/" + cid + "/" + currentKey + "." + ext
        );
    };

    return (
        <Modal size="xl" show={show} onHide={onHide}>
            <Modal.Body>
                {!loaded ? (
                    <Loading disableMargin={true}></Loading>
                ) : (
                    <>
                        <Row>{/** do error box */}</Row>
                        <Row className="justify-content-center mb-2">
                            <Col lg={8}>
                                {hasWeb3StorageKey ? (
                                    <Form.Group
                                        className="mt-2 text-center"
                                        controlId="formSVGFile"
                                    >
                                        <Form.Label className="fs-3">
                                            📁 Upload an Image/Vector/Movie/Song
                                        </Form.Label>
                                        <Form.Control
                                            size="lg"
                                            type="file"
                                            className="m-2"
                                            onChange={(e) => {
                                                setLoaded(false);

                                                const fileReader =
                                                    new FileReader();
                                                fileReader.addEventListener(
                                                    "load",
                                                    () => {
                                                        uploadToIPFS(
                                                            fileReader.result,
                                                            e.target.files[0].name
                                                                ?.split(".")
                                                                ?.pop() || "bin"
                                                        ).catch((error) => {
                                                            console.error(
                                                                error
                                                            );
                                                        });
                                                    }
                                                );

                                                fileReader.readAsArrayBuffer(
                                                    e.target.files[0]
                                                );
                                            }}
                                        />
                                    </Form.Group>
                                ) : (
                                    <div className="d-grid gy-2 gap-2">
                                        <p className="display-5 zombieTextRed  text-white">
                                            🛸 IPFS - InterPlanetary File System
                                        </p>
                                        <Row>
                                            <Col>
                                                <div className="d-grid gap-2 mx-2 mb-2">
                                                    <Button
                                                        size="lg"
                                                        variant="success"
                                                        onClick={() => {
                                                            window.open(
                                                                "https://web3.storage"
                                                            );
                                                        }}
                                                    >
                                                        Get 'Web3.storage' API
                                                        Key{" "}
                                                        <span className="badge bg-dark">
                                                            External Site
                                                        </span>
                                                    </Button>

                                                    <Form.Control
                                                        type="text"
                                                        size="md"
                                                        placeholder="web3.storage API Key"
                                                        ref={web3StorageApiKey}
                                                    />
                                                    <Button
                                                        variant="success"
                                                        onClick={() => {
                                                            if (
                                                                web3StorageApiKey
                                                                    ?.current
                                                                    ?.value
                                                                    ?.length ===
                                                                0
                                                            )
                                                                return;

                                                            StorageController.setGlobalPreference(
                                                                "web3StorageApiKey",
                                                                web3StorageApiKey
                                                                    .current
                                                                    ?.value
                                                            );
                                                            StorageController.saveData();
                                                            setHasWeb3StorageKey(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>

                                                <Box tag={"😍"}>
                                                    Dont panic! All you need to
                                                    do is click the 'Get
                                                    Web3.Storage Api Key' token
                                                    and create an account
                                                    completely for free. Once
                                                    you have an account you can
                                                    then go to your account
                                                    settings and create a new
                                                    API token and then you can
                                                    simply paste it into the
                                                    web3.storagekey box!
                                                </Box>
                                                <Box
                                                    tag={"📟"}
                                                    className="mt-2"
                                                >
                                                    {" "}
                                                    We use <b>ipfs</b> to store
                                                    your tokens apperance and
                                                    information forever. IPFS is
                                                    a decentralized file
                                                    solution similar to Google
                                                    Drive or Dropbox and is{" "}
                                                    <b>free to use.</b>
                                                </Box>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}
