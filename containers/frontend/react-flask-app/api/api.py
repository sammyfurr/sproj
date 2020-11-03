import database
from flask import Flask, request

dbc = database.DatabaseController(url='165.227.252.45', port=27017)

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    try:
        name = request.get_json()['name']
        print(name)
        user = dbc.get_userids_by_name([name])
        print(user)
        if user == []:
            return {'name': None}
        return {'name': name}
    except:
        return {'error': 'Internal Error'}

@app.route('/channel', methods=['POST'])
def channel():
    try:
        channel = request.get_json()['channel']
        print(channel)
        dbc.get_pod_by_channel(channel)
        return {'channel': channel}
    except:
        return {'error': 'Internal Error'}
