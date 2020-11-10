import sanic
import socketio
from podmanager import TranslationPodManager

sio = socketio.AsyncServer(async_mode='sanic')
app = sanic.Sanic(name='controller')
sio.attach(app)
tpm = TranslationPodManager(url='165.227.252.45', port=27017)

# Receives a username from server requesting a pod be created
# Returns a channel id that corresponds to the pod
@sio.on('pod_create')
async def on_pod_create(sid, data):
    channel = await tpm.create_pod(data['names'])
    await sio.emit('pod_created', {'names': data['names'], 'channel': channel}, to=sid)

@sio.on('pod_delete')
async def on_pod_delete(sid, data):
    await tpm.delete_pod(data['channel'])
    await sio.emit('pod_deleted', {'channel': data['channel']})
        
@sio.event
async def connect(sid, environ):
    print('connect ', sid)

@sio.event
async def disconnect(sid):
    print('disconnect ', sid)

app.run(port='8001')
