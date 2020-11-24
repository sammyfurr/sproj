import React from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import XTerm, {Terminal} from 'react-xterm';
import 'xterm/css/xterm.css';
import MonacoEditor from 'react-monaco-editor';
import WebFont from 'webfontloader';

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
	post_request('/login', {name: this.state.name}).then(data => {
	    if (data.name != null){
		// Call the onLogin function provided by Debugger to
		// actually log the user in
		this.props.onLogin(data.name);
	    } else if (data.error != null){
		alert('Error: ' + data.error);
	    }
	});
	event.preventDefault();
    }

    render() {
	return (
	    <form className='simple-form' onSubmit={this.handleSubmit}>
	      <label>Login or Register:</label>
	      <div className='simple-submit'>
		<input type="text" value={this.state.name} onChange={this.handleChange}/>
		<button type="submit"><i className="material-icons">arrow_forward_ios</i></button>
	      </div>
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
	// If successful, associates the currently logged in user with
	// a pod server side and sets the channel to begin sending
	// socket messages
	post_request('/channel', {channel: this.state.channel, name: this.props.name}).then(data => {
	    if (data.channel != null){
		// Call the onChannel function provided by Debugger to
		// set the channel
		this.props.onChannel(data.channel);
	    } else if (data.error != null){
		alert('Error joining session: ' + data.error);
	    }
	});
	event.preventDefault();
    }

    render() {
	return (
	    <form className='simple-form' onSubmit={this.handleSubmit}>
	      <label>Session ID:</label>
	      <div className='simple-submit'>
		<input type="text" value={this.state.channel} onChange={this.handleChange} />
		<button type="submit"><i className="material-icons">arrow_forward_ios</i></button>
	      </div>
	    </form>
	);
    }
}

class RRTerm extends React.Component {
    // This class contains two main components: a view of the source
    // code (using Monaco) and a terminal interface to RR (using
    // Xterm.js)
    
    constructor(props) {
	super(props);
	// command: current command to send to rr
	// name: name of the source file
	// linum: current line number in source file
	// code: source code in current source file
	this.state = {command: '',
		      name: 'Type a command to load source file.',
		      linum: 0,
		      code: '// No source loaded.'};

	// setup ref for Xterm.js
	this.inputRef = React.createRef();
	this.term = null;
	this.runTerminal = this.runTerminal.bind(this);
	this.updateCommand = this.updateCommand.bind(this);
	this.sendCommand = this.sendCommand.bind(this);
	this.updateSource = this.updateSource.bind(this);
    }

    componentDidMount() {
	// Start the terminal when the component mounts
	this.term = this.inputRef.current.getTerminal();
        this.runTerminal();
    }
    
    componentWillUnmount() {
        this.inputRef.current?.componentWillUnmount();
    }

    updateCommand(c, n) {
	// Updates state to change the command.
    	if(n === 'delete'){
    	    this.setState({command: c.slice(0, -1)});
    	} else{
    	    this.setState({command: c + n});
    	}
    }

    sendCommand(c) {
	// Sends the command to rr using the socket defined in
	// Debugger
	this.props.socket.emit('rr_command', {'command': c, 'channel': this.props.channel});
    }

    updateSource(s) {
	// Since support for linums isn't quite there, this doesn't
	// have a noticable effect on the user side unless the code
	// has changed.  Code changes when the debugger enters a new
	// file.
	if(s.file_name == null){
	    this.setState({linum: parseInt(s.current_line)});
	} else {
	    this.setState({name: s.file_name,
			   linum: parseInt(s.current_line),
			   code: s.contents});
	}
    }

    runTerminal() {

	// Prompt for the terminal.  Set to mimic rr's prompt.
	const prompt = '(rr) ';
	const prompt_length = prompt.length;
	this.term.prompt = () => {
	    this.term.write('\r\n' + prompt);
	}

	// Clears the current command from the terminal.  When another
	// user types a command, we want to get rid of the current
	// command so that it doesn't look odd when we recieve output.
	this.term.clear = () => {
	    const toclear = this.term.buffers._activeBuffer.x - prompt_length;
	    this.term.write('\b \b'.repeat(toclear));
	    this.setState({command: ''});
	}

	// Opening statement.
	this.term.writeln('Welcome to Collab RR');
	this.term.prompt();

	// Register a new response handler with the socket defined in
	// Debugger.  
	this.props.socket.on('rr_response', (data) => {
	    if(data.from !== this.props.socket.id){
		// If the command originated from a different client,
		// display it.  Disable input so the user doesn't mess
		// up the output.
		this.term.disableStdin = true;
		this.term.clear();
		this.term.write(data.command);
	    };
	    // Write a newline, but no prompt
	    this.term.writeln('');
	    // Write each line of the output to the terminal
	    data.response.output.split(/\n+/).forEach((l) => {
		this.term.writeln(l);
	    });
	    this.term.prompt();
	    // Re-enable input.  See above and below where it is
	    // disabled.
	    this.term.disableStdin = false;
	    // If an error has occured, there wont be any new
	    // information about the location in the source file.
	    if(data.response.source != null) {
		this.updateSource(data.response.source);
	    }
	});

	this.term.on('key', (key, ev) => {
	    // There's no support right now for control sequences.
	    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
	    if (ev.key === 'Enter') {
		// Newline
		// Disable input while we wait for the response from rr
		this.term.disableStdin = true;
		const c = this.state.command;
		this.sendCommand(c);
		this.setState({command: ''});
	    } else if (ev.key === 'Backspace') {
		// Backspace
		// Do not delete the prompt
		if (this.term.buffers._activeBuffer.x > prompt_length) {
		    this.term.write('\b \b');
		    this.updateCommand(this.state.command, 'delete');
		}
	    } else if (ev.key === 'ArrowUp') {
		// Up Arrow
		// No support for history yet.
	    } else if (ev.key === 'ArrowDown') {
		// Down Arrow
		// No support for history yet.		
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

	// Settings for Monaco, which we are using to view the source
	// code
	const code = this.state.code;
	const name = this.state.name;
	const options = {readOnly: true,
			automaticLayout: true};
	
        return (
	    <div className='rr-term'>
	      <div className='source-view'>
		<span className='title'>{name}</span>
		<MonacoEditor
		  language='c'
		  theme='vs-dark'
		  value={code}
		  options={options} />
	      </div>
	      <div>
		<span className='title'>rr</span>
		<XTerm ref={this.inputRef} />
	      </div>
	    </div>
        );
    }
}

function LogoutButton(props) {
    return (
	<button onClick={props.onClick}>
	  <i className='material-icons'>close</i>
	</button>
    );
}

function NewDebugButton(props) {
    // Creates a new debug session
    const program = props.program
    return (
	<button onClick={() => {props.onClick(program)}}>
	  <span>{program}</span>
	</button>
    );
}

function DeleteButton(props) {
    // Deletes a session<->user association.  It would be good to add
    // some indication when the user is the final user associated with
    // the session pod.  Right now, it appears to hang as the pod is
    // deleted.
    const pod = props.pod;
    let icon = <i className='material-icons'>close</i>;
    return (
	<button onClick={() => {props.onClick(pod)}}>
	  {icon}
	</button>
    );
}

function PodList(props) {
    // Creates the list of currently active debug sessions.
    const pods = props.pods;
    const listItems = pods.map((pod) => <li key={pod}>{pod}<DeleteButton onClick={props.onClick} pod={pod}/></li>);
    return (
	<ul>{listItems}</ul>
    );
}

class Debugger extends React.Component {
    // The highest level component, which contains the socket and
    // methods to communicate with the api.
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
	this.onDelete = this.onDelete.bind(this);
    }

    onLogin(name) {
	this.setState({user: name})
	// Retrieve a list of pods the user is associated with
	post_request('/pods', {name: this.state.user}).then(data => {
	    if(data.active != null) {
		// Since we can't pull pods out of storage yet, only
		// show active ones
		this.setState({pods: data.active});
	    } else if (data.error != null) {
		alert('Error fetching list of active pods: ' + data.error);
	    }
	});
    }

    onLogout() {
	this.setState({user: '', channel: '', pods: []});
    }

    onNew(p) {
	// Associates the user with the new session server-side and
	// sets the channel here
	post_request('/new', {name: this.state.user, program: p}).then(data => {
	    if (data.channel != null) {
		this.setState({channel: data.channel});
		this.socket.emit('join_channel', {'channel': this.state.channel});
	    }
	});
    }

    onChannel(c) {
	this.setState({channel: c});
	this.socket.emit('join_channel', {'channel': this.state.channel});
    }

    onDelete(c) {
	// Delete a pod.
	post_request('/delete', {name: this.state.user, channel: c}).then(data => {
	    if (data.deleted != null) {
		const pods = this.state.pods;
		this.setState({pods: pods.filter((x) => x !== c)});
	    } else if (data.error != null) {
		alert('Error deleting pod: ' + data.error);
	    }
	});
    }

    render() {
	// If the user isn't logged in, display a login form.  If they
	// are, display a logout button.
	const isLoggedIn = !(this.state.user === '');
	let login;
	let user;
	if (isLoggedIn) {
	    user = (
		<div className='user'>
		  <span>{this.state.user}</span>
		  <LogoutButton onClick={this.onLogout}/>
		</div>
	    );
	} else {
	    login = <LoginForm onLogin={this.onLogin}/>;
	}

	const channelSet = this.state.channel !== '';
	// Channel to use with socket, identifies session pod.
	let channel;
	// Button to create a new pod.
	let newButton;
	if (channelSet) {
	    channel = (
		<div>
		  <span className='title'>Session ID: </span>
		  <span>{this.state.channel}</span>
		</div>
	    );
	} else if (isLoggedIn) {
	    channel = <ChannelForm name={this.state.user} onChannel={this.onChannel}/>;

	    // Currently, users have three test programs to choose from.
	    newButton = (
		<div>
		  <span className='title'>New Debug Session:</span>
		  <div className='new-session'>
		    <NewDebugButton onClick={this.onNew} program={'cat'}/>
		  </div>
		  <div className='new-session'>
		    <NewDebugButton onClick={this.onNew} program={'stack_smash'}/>
		  </div>
		  <div className='new-session'>
		    <NewDebugButton onClick={this.onNew} program={'threads'}/>
		  </div>
		</div>
	    );
	}

	// If the user has active session pods, display them.
	const hasPods = this.state.pods.length > 0;
	let pods;
	if (hasPods && !channelSet) {
	    pods = (
		<div>
		  <span className='title'>Running Debug Sessions:</span>
		  <PodList pods={this.state.pods} onClick={this.onDelete}/>
		</div>
	    );
	}

	// Class name for configuration container.  We want this to
	// shrink when debugging begins.
	let configContainer = 'config-container';

	let rrterm;
	
	// If everything is set, display debugger.
	if (isLoggedIn && channelSet) {
	    configContainer += '-small';
	    rrterm = <RRTerm channel={this.state.channel} socket={this.socket} />;
	}

	return (
	    <div>
	      <div className='user-container'>
		{user}
	      </div>
	      <div className={configContainer}>
		{login}
		<div className='channel-container'>
		  {newButton}
		  {channel}
		  {pods}
		</div>
	      </div>
	      <div className='term-container'>
		{rrterm}
	      </div>
	    </div>
	);
    }
}

export default function App() {

    // Load fonts using WebFont.
    WebFont.load({
	google: {
	    families: ['Inter:300,400,700', 'sans-serif', 'Material+Icons']
	}
    });
    
    return (
	<>
	  <Debugger/>
	</>
    )
}
