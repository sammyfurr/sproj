import eventlet
import socketio
import time

sio = socketio.Server(cors_allowed_origins='http://localhost:3000', sync_mode='eventlet')
app = socketio.WSGIApp(sio)

@sio.on('rr command')
def on_rr_command(sid, data):
    print('Received rr command:')
    data['sid'] = sid
    print(data)
    print('Emitting...')
    sio.emit('rr command', data)

@sio.on('rr response')
def on_rr_response(sid, data):
    print('Recieved rr response:')
    print(data)
    print('Emitting...')
    sio.emit('rr response', data)

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
