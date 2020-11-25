import database

class NoMatchingUserError(Exception):
    """Raised when a username isn't registered"""
    pass

class UserManager:
    """Strictly for managing users (auth, creation, deletion, etc).  Pod
    and user synchronization are handled by TranslationPodManager.
    """
    
    def __init__(self, url='localhost', port=27017):
        self.dbc = database.DatabaseController(url, port)

    def get_user(self, name):
        """Given a name, return a userid"""
        try:
            uid = self.dbc.get_userid_by_name(name)
            return uid
        except TypeError:
            raise NoMatchingUserError

    def add_user(self, name):
        """Given a name, attempt to add the user into the database"""
        self.dbc.add_user(name)


    def delete_user(self, name):
        """Given a name, delete a user"""
        self.dbc.delete_user(self.dbc.get_userids_by_name([name])[0])
