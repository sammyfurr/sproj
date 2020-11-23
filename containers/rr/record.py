import subprocess
import re

class Recorder:
    def __init__(self, gcc_command):
        # Strip out 'gcc' and tell gcc to output messages in JSON
        self.gcc_args = '-fdiagnostics-format=json ' + gcc_command.strip()[3:].strip()
        self.program_name = self.parse()

    def parse(self):
        try:
            # Match either '-o program_name' or '-output program_name'
            return re.search('((?<=-o)\s+\S+|(?<=-output)\s+\S+)',
                             self.gcc_args).group().strip()
        except:
            # If there's no match, use default output name
            return 'a.out'

    def build(self):
        p = subprocess.Popen(['gcc'] + self.gcc_args.split(' '),
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
        stdout, stderr = p.communicate()
        return [stdout, stderr]

    def record(self):
        p = subprocess.Popen(['rr', 'record', './' + self.program_name],
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
        stdout, stderr = p.communicate()
        return [stdout, stderr]


if __name__ == '__main__':
    d = Recorder('gcc -g -Wall -o test test.c')
    print(d.gcc_args, d.parse())
    print(d.build())
    print(d.record())
