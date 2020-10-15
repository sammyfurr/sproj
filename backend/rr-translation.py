from pygdbmi.gdbcontroller import GdbController
from pprint import pprint


class RRInterface:
    def __init__(self, session=None):
        self.gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])
        self.init_message = self.console_output(self.get_rr_response())
        self.timeline = []

    def end(self, response):
        last = response[-1]['message']
        return last == 'stopped' or last == 'done'

    def get_rr_response(self):
        return self.gdbmi.get_gdb_response()

    def get_full_rr_response(self, command):
        response = self.gdbmi.write(command)
        while(not self.end(response)):
            response.extend(self.get_rr_response())
        return response

    def console_output(self, response):
        output = []
        for r in response:
            if r['type'] == 'console':
                output.append(r['payload'])
        return ''.join(output).replace("\\n", "\n")
    
    def write(self, command):
        self.timeline.append(command)
        return self.console_output(self.get_full_rr_response(command))

# Start gdb process
#gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])

rri = RRInterface()
print(rri.init_message)

while (command := input('(rr) ')) != 'exit':
    print(rri.write(command))

print(rri.timeline)

rri2 = RRInterface()
print(rri2.init_message)

for command in rri.timeline:
    print('(rr) ' + command)
    print(rri2.write(command))
