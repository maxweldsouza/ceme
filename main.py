import os
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
import json
import database
from custom_exceptions import *

# Install Instructions
# set xsrf cookie name
xsrf_cookie = 'sodfksoihasg'

# set whether to use ssl server
ssl = False

# set port
port = 8443

# Meta
# error handling
# secure authentication

# TODO list
#name not empty
#fork
#default groups etc
#history
#remove is current
#no tabs allowed
#refactor database conection
#login logout
#break query strings to multiple lines
#password tip, passphrase
#registration
#signup errors
#invalid input

# diff save
# error messages
# accessibility
# change email or password
# hidden editor
# admin section
# ip bans
# infinite loop protection
# embed
# should you have "." in symbol names
#  username already registered

def internal_error(self, e):
    print e
    self.set_status(500)
    self.write('An internal error occurred.')

""" authentication """
def restricted(f):
    """ @ restricted decorator
    allows only authenticated users
    to have access """
    # TODO use user groups for this
    def wrapper(*args, **kwargs):
        if args[0].get_secure_cookie(xsrf_cookie):
            return f(*args, **kwargs)
        else:
            return args[0].redirect('/')
    return wrapper

class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        try:
            username = self.get_argument('username', '')
            password = self.get_argument('password', '')
            if database.authenticate_user(username, password):
                self.set_secure_cookie(xsrf_cookie, username)
                self.redirect('/home')
        except Exception, e:
            self.redirect('/login-fail')
        except Exception, e:
            internal_error(self, e)

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        self.clear_cookie(xsrf_cookie)
        self.redirect('/home')

class SignupHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        try:
            username = self.get_argument('username', '')
            email = self.get_argument('email', '')
            password = self.get_argument('password', '')
            database.create_user(username, email, password)
            # TODO message account created
            self.set_secure_cookie(xsrf_cookie, username)
            self.redirect('/home')
        except InvalidUsername, e:
            # TODO custom error message page
            self.write(str(e))
        except InvalidPassword, e:
            self.write(str(e))
        except InvalidEmail, e:
            self.write(str(e))
        except Exception, e:
            internal_error(self, e)

# user permissions
class UserHandler(tornado.web.RequestHandler):
    def get(self):
        # get info
        # change info
        pass

class MainHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

class ErrorHandler(tornado.web.ErrorHandler):
    def get(self):
        self.write('An error occurred')

def ceme_file(self, path):
    try:
        code = database.read_page(path)
        self.set_header("X-Robots-Tag", "noindex")
        self.set_header("Content-Type", "text/plain; charset=UTF-8")
        self.write(code)
    except EntryNotFound:
        self.set_status(404)
        self.write('404: No such page exists')
    except Exception, e:
        internal_error(self, e)

""" Ceme code """
class CodeHandler(tornado.web.RequestHandler):
    def get(self, path):
        ceme_file(self, path)

class CreateHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        """ redirects after post """
        try:
            content = "'Your page has been created. You can now edit it.'"
            name = self.get_argument('name', '')
            ip = self.request.remote_ip
            group = 1
            username = ''
            database.create_page(name, content, ip, group, username)
            self.set_status(200)
            self.redirect('/' + name)
        except InvalidPageName:
            self.set_status(400)
            self.redirect('/invalid-name')
        except AlreadyExists:
            self.redirect('/already-exists')
        except Exception, e:
            internal_error(self, e)

class SaveHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        """ post using ajax """
        try:
            name = self.get_argument('name', '')
            content = self.get_argument('content', '')
            ip = self.request.remote_ip
            group = 1
            username = ''
            database.save_page(name, content, ip, group, username)
            self.write('The page has been saved successfully')

        except (InvalidPageName, InvalidContent) as e:
            self.set_status(400)
            self.write(str(e))
            print str(e)
        except Exception, e:
            internal_error(self, e)

class HistoryHandler(tornado.web.RequestHandler):
    def get(self, path):
        try:
            name = self.get_argument("name", '')
            limit = self.get_argument("limit", "20")
            self.set_header("Content-Type", "application/json")
            self.write(database.get_history(name, limit))
        except InvalidPageName, e:
            self.set_status(400)
            self.write(str(e))
        except EntryNotFound, e:
            self.set_status(404)
            self.write(str(e))
        except Exception, e:
            internal_error(self, e)

class DiffHandler(tornado.web.RequestHandler):
    def get(self, path):
        try:
            name = self.get_argument("name")
            first = self.get_argument("first")
            second = self.get_argument("second")
            self.set_header("Content-Type", "application/json")
            self.write(database.get_diff(name, first, second))
        except Exception, e:
            internal_error(self, e)

settings = {
    'default_handler_class': ErrorHandler,
    'default_handler_args': dict(status_code=404),
    'compress_response': True,
    'debug' : True,
    'cookie_secret' : 'asdfn034uih4usygfp89dghu23780tghdsfgbshx',
    'xsrf_cookies': True
}

application = tornado.web.Application([
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
    (r"/create", CreateHandler),
    (r"/sign-up", SignupHandler),
    (r"/api/save", SaveHandler),
    (r"/api/history(.*)", HistoryHandler),
    (r"/api/diff(.*)", DiffHandler),
    (r"/code/(.*)", CodeHandler),
    (r"/assets/(.*)",tornado.web.StaticFileHandler, {"path": "./assets"},),
    (r"/(.*)", MainHandler),
    ], **settings)

if __name__ == "__main__":
    server = HTTPServer(application, ssl_options = {
        'certfile': os.path.join('certs/localhost.crt'),
        'keyfile': os.path.join('certs/localhost.key'),
        })
    if ssl:
        server.listen(port)
    else:
        application.listen(port)
    tornado.ioloop.IOLoop.instance().start()
