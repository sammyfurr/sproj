from pymongo import MongoClient, errors
from pprint import pprint
import random

class NoOpenChannelError(Exception):
    """Raised when all channels are in use."""
    pass

class NoMatchingChannelError(Exception):
    """Raised when no pod matches a provided channel"""
    pass

class DuplicateUserError(Exception):
    """Raised when a duplicated username is attempted to be used"""
    pass

class NoMatchingUserError(Exception):
    """Raised when a username isn't registered"""
    pass

class DatabaseController:
    """Provides interface to mongodb database"""
    def __init__(self, url='localhost', port=27017):
        self.client = MongoClient(url, port)
        self.db = self.client.debugger
        self.users = self.db.users
        self.pods = self.db.pods
        self.min_channel = 10000
        self.max_channel = 99999
        self.max_channels = self.max_channel - self.min_channel
        
    # User Methods

    def add_user(self, name):
        """Given a name, attempt to add the user into the database"""
        try:
            return str(self.users.insert_one({'name': name,
                                              'pods': []}).inserted_id)
        except pymongo.DuplicateKeyError:
            raise DuplicateUserError

    def delete_user(self, uid):
        """Given a uid, delete a user"""
        self.pods.update_many({}, {'$pull': {'users': uid}})
        self.users.delete_one({'_id': uid})
        
    def get_userids_by_name(self, names):
        """Given a list of names, retrieve the mongodb ids for the users"""
        users = self.users.find({'name': {'$in': names}}, {"_id": 1})
        if users:
            return [u['_id'] for u in users]
        else:
            return []

    def get_userid_by_name(self, name):
        user = self.users.find_one({'name': name})
        return user['_id']

    def get_users_by_pod(self, pid):
        return self.users.find({"pods": pid})

    # Pod Methods
    
    def add_pod(self, uids=[]):
        """Given a list of uids, creates a pod and returns a channel to use for communicating with the pod"""
        # While there are open channels, try to create a new pod with
        # an open channel.  Obviously in real use there should be a
        # better method for generating channel numbers, but given the
        # number of current users the likelyhood of a collision is
        # extreemly low using 5 digit numbers
        while self.pods.count_documents({'channel': {'$not': {'$eq': None}}}) <= self.max_channels:
            try:
                channel = str(random.randint(self.min_channel, self.max_channel))
                pid = self.pods.insert_one({'channel': channel}).inserted_id
                if uids:
                    self.link_pod_to_users(pid, uids)
                return channel
            except errors.DuplicateKeyError:
                pass
        raise NoOpenChannelError

    def get_pods_by_user(self, uid):
        return self.pods.find({"users": uid})
    
    def get_pod_by_channel(self, channel):
        """Given a channel, return corresponding pod id"""
        try:
            return self.pods.find_one({'channel': channel}, {'_id': 1})['_id']
        except:
            raise NoMatchingChannelError

    def delete_pod(self, pod):
        """Given a pod id, delete a pod"""
        self.users.update_many({}, {'$pull': {'pods': pod}})
        self.pods.delete_one({'_id': pod})

    def link_pod_to_users(self, pod, uids):
        """Given a pod and a list of user ids create a many to many mapping between users and pod"""
        self.users.update_many({'_id': {'$in': uids}},
                               {'$addToSet': {'pods': pod}})
        self.pods.update_one({'_id': pod},
                             {'$addToSet': {'users': {'$each': uids}}})

    def unlink_pod_from_users(self, pod, uids):
        """Given a pod and a list of user ids remove many to many mapping between users and pod"""
        self.users.update_many({'_id': {'$in': uids}},
                               {'$pull': {'pods': pod}})
        self.pods.update_one({'_id': pod},
                             {'$pull': {'users': {'$in': uids}}})
