from flask import Flask, request
import podmanager
import usermanager
import database

tpm = podmanager.TranslationPodManager(url='mongodb://database-load-balancer', port=27017)
um = usermanager.UserManager(url='mongodb://database-load-balancer', port=27017)
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
                return {'error': 'User already exists.'}
        return {'name': name}
    except:
        return {'error': 'Internal Error'}

@app.route('/channel', methods=['POST'])
def channel():
    try:
        channel = request.get_json()['channel']
        name = request.get_json()['name']
        try:
            tpm.link_pod_to_users(channel, [name])
            return {'channel': channel}
        except database.NoMatchingChannelError:
            return {'error': 'There is no open session with id: "' + channel + '".'}
    except:
        return {'error': 'Internal Error'}

@app.route('/pods', methods=['POST'])
def pods():
    try:
        user = request.get_json()['name']
        pods = tpm.get_pods_by_user(user)
        return pods
    except:
        return {'error': 'Internal Error'}

@app.route('/new', methods=['POST'])
def new():
    try:
        name = request.get_json()['name']
        program = request.get_json()['program']
        channel = tpm.create_pod([name], program)
        return {'channel': channel}
    except:
        return {'error': 'Internal Error'}

@app.route('/delete', methods=['POST'])
def delete():
    try:
        name = request.get_json()['name']
        channel = request.get_json()['channel']
        users = tpm.get_users_by_pod(channel)
        if len(users) <= 1:
            tpm.delete_pod(channel)
        else:
            tpm.unlink_pod_from_users(channel, [name])
        return {'deleted': True}
    except:
        return {'error': 'Internal Error'}

@app.route('/examples', methods=['POST'])
def examples():
    try:
        examples = tpm.get_examples()
        return {'examples': list(examples.keys())}
    except:
        return {'error': 'Internal Error'}
