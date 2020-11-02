import socketio
import asyncio

# standard Python
sio = socketio.Client()

@sio.event
def connect():
    print("I'm connected!")
    
@sio.on('pod_created')
def on_pod_created(data):
    print(data)

@sio.on('pod_delete')
def on_pod_deleted(data):
    print(data)
    
@sio.event
def connect_error():
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

sio.connect('http://localhost:8001')

# while (command := input('(rr) ')) != 'exit':
#     sio.call('rr command', {'command': command}, timeout=60)

# sio.emit('pod_create', {'names': ['sari', 'sammy']})
sio.emit('pod_delete', {'channel': '77562'})
# sio.emit('pod_delete', {'channel': '39640'})
sio.wait()
