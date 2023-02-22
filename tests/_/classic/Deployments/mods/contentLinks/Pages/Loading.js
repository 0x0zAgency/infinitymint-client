import React, { Component } from 'react'
import { Modal, Spinner } from 'react-bootstrap'

export default class Loading extends Component {
	render() {
		return (
			<Modal>
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Title>We are loading! Please wait.</Modal.Title>
					</Modal.Header>
				</Modal.Dialog>
				<Modal.Body>
					<p>InfinityMint is currently updating your project. Please be patient :)</p>
					<Spinner animation="border" role="status">
			      <span className="visually-hidden">Loading...</span>
			    </Spinner>
				</Modal.Body>
			</Modal>
		)
	}
}
