from pygdbmi.gdbcontroller import GdbController
from pprint import pprint

# Start gdb process
gdbmi = GdbController(command=["rr", "replay", "--", "--nx", "--quiet", "--interpreter=mi2"])
response = gdbmi.write('-break-insert main')
response = gdbmi.write('-exec-run')
response = gdbmi.write('-exec-continue')
pprint(response)
