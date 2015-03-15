class AlreadyExists(Exception):
    pass

class NoRights(Exception):
    pass

class EntryNotFound(Exception):
    pass

class LoginFailed(Exception):
    pass

""" Input validation """
class InvalidPageName(Exception):
    pass

class InvalidContent(Exception):
    pass

class InvalidUsername(Exception):
    pass

class InvalidEmail(Exception):
    pass

class InvalidPassword(Exception):
    pass
