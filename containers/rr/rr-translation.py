from pprint import pprint
import socketio
import sys

import rrinterface
import record

sio = socketio.Client()
rri = rrinterface.RRInterface()
channel = None
ready = False

print(rri.init_message)

@sio.event
def connect():
    print("I'm connected!")
    
@sio.on('rr command')
def on_rr_command(data):
    print('Recieved rr command:')
    print(data)
    print('Passing command to rr')
    response = rri.write(data['command'])
    print('Emitting...')
    sio.emit('rr response', {'response': response, 'from': data['sid'], 'command': data['command'], 'channel': channel})
    
@sio.event
def connect_error():
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

if __name__ == '__main__':
    channel = sys.argv[1]
    sio.connect('http://rr-host-load-balancer:8000')
    sio.emit('join_channel', {'channel': channel})
