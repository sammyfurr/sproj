import React from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import XTerm, {Terminal} from 'react-xterm';
import 'xterm/css/xterm.css';

async function post_request (url, data) {
    // Send a post request to the server, which will forward it to our
    // Flask API handler
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
    // Standin form to test communication with RR pods.
    constructor(props) {
	super(props);
	this.state = {value: ''};
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    handleChange(event) {
	this.setState({value: event.target.value});
    }

    handleSubmit(event) {
	this.props.socket.emit('rr command', {'command': this.state.value, 'channel': this.props.channel})
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
    // Sends a login api request.  As of right now, users who don't
    // exist are automatically created... and you don't need a
    // password...
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
		Login or Register:
		<input type="text" value={this.state.name} onChange={this.handleChange} />
	      </label>
	      <input type="submit" value="login/register" />
	    </form>
	);
    }
}

class ChannelForm extends React.Component {
    // Sends a channel api request to connect to an rr debug session
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
	// If successful, associates the currently logged in user with
	// a pod server side and sets the channel to begin sending
	// socket messages
	post_request('/channel', {channel: this.state.channel, name: this.props.name}).then(data => {
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
		Session ID:
		<input type="text" value={this.state.channel} onChange={this.handleChange} />
	      </label>
	      <input type="submit" value="join" />
	    </form>
	);
    }
}

class RRTerm extends React.Component {

    constructor(props) {
	super(props);
	this.state = {command: '', /*history: [], historyIndex: 0*/};
	this.inputRef=React.createRef();
	this.term = null;
	this.runTerminal = this.runTerminal.bind(this);
	this.updateCommand = this.updateCommand.bind(this);
	this.sendCommand = this.sendCommand.bind(this);
	// this.historyPrevious = this.historyPrevious.bind(this);
	// this.historyAdd = this.historyAdd.bind(this);
    }

    componentDidMount() {
	this.term = this.inputRef.current.getTerminal();
        this.runTerminal();
    }
    
    componentWillUnmount() {
        this.inputRef.current?.componentWillUnmount();
    }

    // historyPrevious() {
    // 	let i = this.state.historyIndex;
    // 	let h = this.state.history;
    // 	return (h, i) => {
    // 	    if(h !== [] && (h.length - i) > 0){
    // 		this.setState({historyIndex: h -1})
    // 		return h[h.length - i - 1];
    // 	    }
    // 	    return false;
    // 	};
    // }

    // historyAdd(n) {
    // 	const h = this.state.history;
    // 	((h, n) => {
    // 	    this.setState({history: h + n});
    // 	})(h, n);
    // 	console.log(this.state.history);
    // }

    updateCommand(c, n) {
    	if(n === 'delete'){
    	    this.setState({command: c.slice(0, -1)});
    	} else{
    	    this.setState({command: c + n});
    	}
    }

    sendCommand(c) {
	// Update command history index
	// this.setState({historyIndex: -1});
	this.props.socket.emit('rr command', {'command': c, 'channel': this.props.channel});
    }

    runTerminal() {
	const prompt = '(rr) ';
	const prompt_length = prompt.length;
	this.term.prompt = () => {
	    this.term.write('\r\n' + prompt);
	}

	this.term.clear = () => {
	    const toclear = this.term.buffers._activeBuffer.x - prompt_length;
	    this.term.write('\b \b'.repeat(toclear));
	    this.setState({command: ''});
	}
	
	this.term.writeln('Welcome to Collab RR');
	this.term.prompt();

	this.props.socket.on('rr response', (data) => {
	    if(data['from'] !== this.props.socket.id){
		// If the command originated from a different client, display it.
		this.term.disableStdin = true;
		this.term.clear();
//		this.historyAdd(data['command']);
		this.term.write(data['command']);
	    };
	    this.term.writeln('');
	    data['response'].split(/\n+/).forEach((l) => {
		this.term.writeln(l);
	    });
	    console.log(data['response']);
	    this.term.prompt();
	    this.term.disableStdin = false;
	});

	this.term.on('key', (key, ev) => {
	    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
//	    console.log(ev.keyCode);
	    if (ev.keyCode === 13) {
		// Newline
		this.term.disableStdin = true;
		const c = this.state.command;
//		this.historyAdd(c)
		this.sendCommand(c);
		this.setState({command: ''});
	    } else if (ev.keyCode === 8) {
		// Backspace
		// Do not delete the prompt
		if (this.term.buffers._activeBuffer.x > prompt_length) {
		    this.term.write('\b \b');
		    this.updateCommand(this.state.command, 'delete');
		}
	    } else if (ev.keyCode === 38) {
		// Up Arrow
		// let previous = this.historyPrevious();
		// if(previous){
		//     this.term.disableStdin = true;
		//     this.term.clear();
		//     this.term.write(previous);
		//     this.term.disableStdin = false;
//		}
	    } else if (ev.keyCode === 40) {
		// Down Arrow
	    } else if (printable) {
		this.term.write(key);
		this.updateCommand(this.state.command, key);
	    }
	});

	this.term.on('paste', (data, ev) => {
	    this.term.write(data);
	});
    }

    render() {
        return (
            <XTerm ref={this.inputRef}
                   addons={['fit', 'fullscreen', 'search']}
                   style={{
                       overflow: 'hidden',
                       position: 'relative',
                       width: '100%',
                       height: '100%'
                   }}/>
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

function NewDebugButton(props) {
    // Creates a new debug session
    return (
	<button onClick={props.onClick}>
	  New
	</button>
    );
}

function PodList(props) {
    const pods = props.pods;
    const listItems = pods.map((pod) => <li key={pod}>{pod}</li>);
    return (
	<ul>{listItems}</ul>
    );
}

class Debugger extends React.Component {
    constructor(props) {
	super(props);
	this.state = {user: '',
		      channel: '',
		      pods: []};
	
	this.socket = socketIOClient('http://157.230.64.84:8000');
	
	this.onLogin = this.onLogin.bind(this);
	this.onLogout = this.onLogout.bind(this);
	this.onChannel = this.onChannel.bind(this);
	this.onNew = this.onNew.bind(this);
    }

    onLogin(name) {
	this.setState({user: name})
	// Retrieve a list of pods the user is associated with
	post_request('/pods', {name: this.state.user}).then(data => {
	    if(data.active != null){
		// Since we can't pull pods out of storage yet, only
		// show active ones
		this.setState({pods: data.active});
	    }
	});
    }

    onLogout() {
	this.setState({user: '', channel: '', pods: []});
    }

    onNew() {
	// Associates the user with the new session server-side and
	// sets the channel here
	console.log(this.state.user)
	post_request('/new', {name: this.state.user}).then(data => {
	    console.log(data);
	    if (data.channel != null){
		this.setState({channel: data.channel});
		this.socket.emit('join_channel', {'channel': this.state.channel});
	    }
	});
    }

    onChannel(c) {
	this.setState({channel: c});
	this.socket.emit('join_channel', {'channel': this.state.channel});
    }

    render() {
	const isLoggedIn = !(this.state.user === '');
	let login;
	if (isLoggedIn) {
	    login = <div><span>{this.state.user}</span><LogoutButton onClick={this.onLogout}/></div>;
	}
	else {
	    login = <LoginForm onLogin={this.onLogin}/>;
	}

	const channelSet = this.state.channel !== '';
	// Channel to use with socket, identifies pod
	let channel;
	// Button to create a new pod
	let newButton;
	if (channelSet) {
	    channel = <span>{this.state.channel}</span>;
	}
	else if (isLoggedIn) {
	    channel = <ChannelForm name={this.state.user} onChannel={this.onChannel}/>;
	    newButton = <NewDebugButton onClick={this.onNew}/>;
	}

	const hasPods = this.state.pods !== [];
	let pods;
	if (hasPods && !channelSet) {
	    pods = <PodList pods={this.state.pods}/>;
	}

	let rrterm;
	if (isLoggedIn && channelSet) {
	    rrterm = <RRTerm channel={this.state.channel} socket={this.socket}/>;
	}
	
	return (
	    <div>
	      {login}
	      {channel}
	      {newButton}
	      {pods}
	      {rrterm}
	    </div>
	);
    }
}

export default function App() {
    return (
	<>
	  <Debugger/>
	</>
    )
}
