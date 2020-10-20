import React from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from "socket.io-client";
import './index.css';

// function Clock(props) {
//     return (
// 	<div>
// 	  <h1>Hello, world!</h1>
// 	  <h2>It is {props.date.toLocaleTimeString()}.</h2>
// 	</div>
//     );
// }

// class Clock extends React.Component {
//     constructor(props) {
// 	super(props);
// 	this.state = {date: new Date()};
//     }

//     componentDidMount() {
// 	this.timerID = setInterval(
// 	    () => this.tick(),
// 	    1000
// 	);
//     }

//     componentWillUnmount() {
// 	clearInterval(this.timerID);
//     }

//     tick() {
// 	this.setState({
// 	    date: new Date()
// 	});
//     }
    
//     render() {
// 	return (
// 	    <div>
//  	      <h1>Hello, world!</h1>
// 	      <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
// 	    </div>
// 	);
//     }
// }

// ReactDOM.render(
//     <Clock />,
//     document.getElementById('root')
// );

// function UserGreeting(props) {
//   return <h1>Welcome back!</h1>;
// }

// function GuestGreeting(props) {
//   return <h1>Please sign up.</h1>;
// }

// function Greeting(props) {
//     const isLoggedIn = props.isLoggedIn;
//     if (isLoggedIn) {
// 	return <UserGreeting />;
//     }
//     return <GuestGreeting />;
// }

// ReactDOM.render(
//     <Greeting isLoggedIn={false} />,
//     document.getElementById('root')
// );

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

const socket = socketIOClient('http://localhost:8000');

socket.on('rr response', (data) => {
    if(data['from'] !== socket.id){
	console.log(data['command'])
    };
    console.log(data['response']);
});

ReactDOM.render(
    <RRForm socket={socket}/>,
    document.getElementById('root')
);


