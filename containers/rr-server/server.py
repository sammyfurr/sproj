import eventlet
import socketio
import time

sio = socketio.Server(cors_allowed_origins='*', sync_mode='eventlet')
app = socketio.WSGIApp(sio)

@sio.on('join_channel')
def join_channel(sid, data):
    sio.enter_room(sid, data['channel'])

@sio.on('rr command')
def on_rr_command(sid, data):
    print('Received rr command:')
    data['sid'] = sid
    print(data)
    print('Emitting...')
    sio.emit('rr command', data, room=data['channel'])

@sio.on('rr response')
def on_rr_response(sid, data):
    print('Recieved rr response:')
    print(data)
    print('Emitting...')
    sio.emit('rr response', data, room=data['channel'])

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
