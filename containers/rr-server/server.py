import eventlet
import socketio
import time

sio = socketio.Server(cors_allowed_origins='*', sync_mode='eventlet')
app = socketio.WSGIApp(sio)

@sio.on('join_channel')
def join_channel(sid, data):
    sio.enter_room(sid, data['channel'])

@sio.on('rr_command')
def on_rr_command(sid, data):
    data['sid'] = sid
    try:
        sio.emit('rr_command', data, room=data['channel'])
    except:
        # If there's an error with the data or the channel, there's
        # not much we can do
        pass

@sio.on('rr_response')
def on_rr_response(sid, data):
        sio.emit('rr_response', data, room=data['channel'])

@sio.event
def connect(sid, environ):
    print('Connect: ', sid)

@sio.event
def disconnect(sid):
    print('Disconnect: ', sid)

eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
