import socketio

# standard Python
sio = socketio.Client()

@sio.event
def connect():
    print("I'm connected!")
    
@sio.on('rr response')
def on_rr_response(data):
    # print('Recieved rr response:')
    if data['from'] != sio.sid:
#        print ("\033[A                             \033[A")
        print(data['command'])
    print(data['response'], end='')
    print('(rr) ', end='')
    command = input()
    sio.emit('rr command', {'command': command})
    
@sio.event
def connect_error():
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

sio.connect('http://localhost:8000')

# while (command := input('(rr) ')) != 'exit':
#     sio.call('rr command', {'command': command}, timeout=60)

print('(rr) ', end = '')
command = input()
sio.emit('rr command', {'command': command})
sio.wait()
