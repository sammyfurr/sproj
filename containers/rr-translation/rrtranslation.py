from pygdbmi.gdbcontroller import GdbController
from pprint import pprint
import socketio
import traceback
import sys
import re

class DissallowedError(Exception):
    """Raised when the user tries to execute a banned command."""
    pass

class RRInterface:
    def __init__(self, session=None):
        self.gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])
        self.init_message = self.console_output(self.get_rr_response())
        
        # Disable hardware watchpoints
        # self.gdbmi.write('set can-use-hw-watchpoints 0')
        self.timeline = []

    def command_forbidden(self, command):
        # Allowing shell commands is a security risk, useless for the
        # purpose of the application, and annoying to handle.
        # Hardware watchpoints must stay disabled since too many users
        # overwhelms the capability of the CPU
        return command == 'shell' # or re.search('(set can-use-hw-watchpoints.*)', command) != None
        
    def exited(self, response):
        return len(response) > 2 and response[-2]['message'] == 'thread-group-exited'

    def end(self, response):
        last = response[-1]['message']
        return len(response) == 1 or last == 'stopped' or last == 'done' or last == 'error' or last == 'running'

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
            if r['type'] == 'console':
                output.append(r['payload'])
            if r['type'] == 'output':
                output.append(r['payload'] + '\n')
            if r['message'] == 'error':
                output.append(r['payload']['msg'])
        return ''.join(output).replace('\\n', '\n').replace('\\t', '\t')
    
    def write(self, command):
        if self.command_forbidden(command):
            raise DissallowedError
        self.timeline.append(command)
        return self.console_output(self.get_full_rr_response(command))

    def source(self):
        f = self.get_full_rr_response('-file-list-exec-source-file')[0]['payload']
        return {'file': f['file'],
                'line': f['line'],
                'path': f['fullname']}

sio = socketio.Client()
rri = RRInterface()

channel = None
current_source = ''

def read_source(path):
    with open(path, 'r') as f:
        text = f.read()
        return text

@sio.event
def connect():
    print("Connected.")
    
@sio.on('rr_command')
def on_rr_command(data):

    body = {'from': data['sid'],
            'command': data['command'],
            'channel': channel}
    
    try:
        response = {'output': rri.write(data['command'])}
        # Get the current source file.
        s = rri.source()
        if s['path'] == current_source:
            # If the source file is the same, just send the current
            # line number
            response['source'] = {'file_name': None,
                                  'current_line': s['line'],
                                  'contents': None}
        else:
            # If it's different, read the contents of the file, and
            # send that along with the file name and line number
            try:
                text = read_source(s['path'])
                current_source = s['path']
                response['source'] = {'file_name': s['file'],
                                      'current_line': s['line'],
                                      'contents': text}
            except:
                response['source'] = {'file_name': None,
                                      'current_line': '0',
                                      'contents': None}
        body['response'] = response
    except DissallowedError:
        body['response'] = {'output': 'Dissalowed command: "' + data['command'] + '". Try "help".'}
    except:
        body['response'] = {'output': 'Internal Error', 'error': traceback.format_exc()}

    sio.emit('rr_response', body)

        
@sio.event
def connect_error():
    print("Connection failed.")

@sio.event
def disconnect():
    print("Disconnected.")

if __name__ == '__main__':
    channel = sys.argv[1]
    current_source = ''
    sio.connect('http://rr-host-load-balancer:8000')
    sio.emit('join_channel', {'channel': channel})
