from flask import Flask, request
import podmanager
import usermanager
import database

tpm = podmanager.TranslationPodManager(url='165.227.252.45', port=27017)
um = usermanager.UserManager(url='165.227.252.45', port=27017)
app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    try:
        name = request.get_json()['name']
        if len(name) < 1:
            return {'error': 'name_error'}
        try:
            user = um.get_user(name)
        except usermanager.NoMatchingUserError:
            try:
                um.add_user(name)
            except database.DuplicateUserError:
                # This isn't redundant, the user could have been added
                # by a different instance of api.py in between our
                # initial get_user and add_user
                return {'error': 'user_exists'}
        return {'name': name}
    except:
        return {'error': 'internal_error'}

@app.route('/channel', methods=['POST'])
def channel():
    try:
        channel = request.get_json()['channel']
        name = request.get_json()['name']
        try:
            tpm.link_pod_to_users(channel, [name])
            return {'channel': channel}
        except database.NoMatchingChannelError:
            return {'error': 'channel_error'}
    except:
        return {'error': 'internal_error'}

@app.route('/pods', methods=['POST'])
def pods():
    try:
        user = request.get_json()['name']
        pods = tpm.get_pods_by_user(user)
        return pods
    except:
        return {'error': 'internal_error'}

@app.route('/new', methods=['POST'])
def new():
    name = request.get_json()['name']
    channel = tpm.create_pod([name])
    return {'channel': channel}
