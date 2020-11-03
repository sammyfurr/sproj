import React from 'react';
import socketIOClient from "socket.io-client";
import './App.css';

async function post_request (url, data) {
    const response = await fetch(url, {
	method: 'POST',
	body: JSON.stringify(data),
	headers: new Headers({
	    "content-type": "application/json"
	})
    }).then(res => res.json());
    return response;
}

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

class LoginForm extends React.Component {
   constructor(props) {
	super(props);
	this.state = {name: ''};
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
   }

    handleChange(event) {
	this.setState({name: event.target.value});
    }

    handleSubmit(event) {
	console.log(this.state.name);
	post_request('/login', {name: this.state.name}).then(data => {
	    console.log(data);
	    if (data.name != null){
		this.props.onLogin(data.name);
	    }
	});
	event.preventDefault();
    }

    render() {
	return (
	    <form onSubmit={this.handleSubmit}>
	      <label>
		Login:
		<input type="text" value={this.state.name} onChange={this.handleChange} />
	      </label>
	      <input type="submit" value="login" />
	    </form>
	);
    }
}

class ChannelForm extends React.Component {
   constructor(props) {
	super(props);
	this.state = {channel: ''};
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
   }

    handleChange(event) {
	this.setState({channel: event.target.value});
    }

    handleSubmit(event) {
	console.log(this.state.channel);
	post_request('/channel', {channel: this.state.channel}).then(data => {
	    console.log(data);
	    if (data.channel != null){
		this.props.onChannel(data.channel);
	    }
	});
	event.preventDefault();
    }

    render() {
	return (
	    <form onSubmit={this.handleSubmit}>
	      <label>
		Channel:
		<input type="text" value={this.state.channel} onChange={this.handleChange} />
	      </label>
	      <input type="submit" value="channel" />
	    </form>
	);
    }
}

function LogoutButton(props) {
    return (
	<button onClick={props.onClick}>
	  Logout
	</button>
    );
}

class Debugger extends React.Component {
    constructor(props) {
	super(props);
	this.state = {user: '',
		      channel: ''};
	this.onLogin = this.onLogin.bind(this);
	this.onLogout = this.onLogout.bind(this);
	this.onChannel = this.onChannel.bind(this);
    }

    onLogin(name) {
	this.setState({user: name})
    }

    onLogout() {
	this.setState({user: ''})
    }

    onChannel(c) {
	this.setState({channel: c})
    }

    render() {
	const isLoggedIn = !(this.state.user === '');
	let login;
	if (isLoggedIn) {
	    login = <div><span>{this.state.user}</span><LogoutButton onClick={this.onLogout}/></div>;
	}
	else {
	    login = <LoginForm onLogin={this.onLogin}/>	    
	}

	const channelSet = (this.state.channel !== '' && isLoggedIn);
	let channel;
	if (channelSet) {
	    channel = <span>{this.state.channel}</span>
	}
	else {
	    channel = <ChannelForm onChannel={this.onChannel}/>
	}
	return (
	    <div>
	      {login}
	      {channel}
	    </div>
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

export default function App() {
    return (
	<>
	  <RRForm socket={socket}/>
	  <Debugger/>
	</>
    )
}
