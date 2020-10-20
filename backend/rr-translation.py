from pygdbmi.gdbcontroller import GdbController
from pprint import pprint
import socketio

class RRInterface:
    def __init__(self, session=None):
        self.gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])
        self.init_message = self.console_output(self.get_rr_response())
        self.timeline = []

    def exited(self, response):
        # Unsure if this will always be the second to last message, works for now.
        return response[-2]['message'] == 'thread-group-exited'

    def end(self, response):
        last = response[-1]['message']
        return last == 'stopped' or last == 'done'

    def get_rr_response(self):
        return self.gdbmi.get_gdb_response()

    def get_full_rr_response(self, command):
        response = self.gdbmi.write(command)
        while(not(self.end(response) or self.exited(response))):
            response.extend(self.get_rr_response())
        return response

    def console_output(self, response):
        output = []
        for r in response:
            if r['type'] == 'console' or r['type'] == 'output':
                output.append(r['payload'])
        return ''.join(output).replace("\\n", "\n").replace("\\t", "\t")
    
    def write(self, command):
        self.timeline.append(command)
        return self.console_output(self.get_full_rr_response(command))

# Start gdb process
#gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])

sio = socketio.Client()
rri = RRInterface()

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
    sio.emit('rr response', {'response': response, 'from': data['sid'], 'command': data['command']})
    
    
@sio.event
def connect_error():
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

sio.connect('http://localhost:8000')

# while (command := input('(rr) ')) != 'exit':
#     print(rri.write(command))

# print(rri.timeline)

# rri2 = RRInterface()
# print(rri2.init_message)

# for command in rri.timeline:
#     print('(rr) ' + command)
#     print(rri2.write(command))
