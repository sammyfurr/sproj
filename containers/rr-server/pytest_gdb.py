from pygdbmi.gdbcontroller import GdbController
from pprint import pprint

# Start gdb process
gdbmi = GdbController(gdb_args =["--interpreter=mi2"])
print(gdbmi.get_subprocess_cmd())  # print actual command run as subprocess
response = gdbmi.write('-break-insert main')
response = gdbmi.write('-exec-run')
response = gdbmi.write('-exec-continue')
pprint(response)
