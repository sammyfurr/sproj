import Head from 'next/head'
import React from 'react';
import ReactDOM from 'react-dom';

import socketIOClient from "socket.io-client";
import styles from '../styles/Home.module.css'

class RRForm extends React.Component {
    constructor(props) {
	super(props);
	this.state = {value: ''};
	this.socket = props.socket;
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    handleChange(event) {
	this.setState({value: event.target.value});
    }

    handleSubmit(event) {
	this.socket.emit('rr command', {'command': this.state.value})
	event.preventDefault();
    }

    render() {
	return (
	    <form onSubmit={this.handleSubmit}>
	      <label>
		Command:
		<input type="text" value={this.state.value} onChange={this.handleChange} />
	      </label>
	      <input type="submit" value="send" />
	    </form>
	);
    }
}

const socket = socketIOClient('http://157.230.64.84:8000');

socket.on('rr response', (data) => {
    if(data['from'] !== socket.id){
	console.log(data['command'])
    };
    console.log(data['response']);
});

export default function Home() {
  return (
	  <RRForm socket={socket}/>
  )
}
