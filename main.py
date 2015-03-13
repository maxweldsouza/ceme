import os
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
import json
import database
from custom_exceptions import *

xsrf_cookie = 'sodfksoihasg'

# TODO list
#name not empty
#fork
#default groups etc
#history

# diff
# set as current
# should you have "." in symbol names
# refactor database conection
# login logout
# hidden editor
# registration
# admin section
# embed
# infinite loop protection
# error messages
# ip bans

# authentication
def restricted(f):
    def wrapper(*args, **kwargs):
        if args[0].get_secure_cookie(xsrf_cookie):
            return f(*args, **kwargs)
        else:
            return args[0].redirect('/')
    return wrapper

def authenticate(userid, password):
    if userid == 'maxweldsouza' and password == 'u1tbf0s1tw':
        return True
    else:
        return False

class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        userid = self.get_argument('userid', '')
        password = self.get_argument('password', '')
        if authenticate(userid, password):
            self.set_secure_cookie(xsrf_cookie, userid)
            self.redirect('/home')
        else:
            self.redirect('/login-fail')

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        self.clear_cookie(xsrf_cookie)
        self.redirect('/logged-out')

# user permissions
class UserHandler(tornado.web.RequestHandler):
    def get(self):
        # get info
        # change info
        pass

# use the @restricted decorator

class MainHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

class ErrorHandler(tornado.web.ErrorHandler):
    def get(self):
        self.write('An error occurred');\

# ceme code
class CodeHandler(tornado.web.RequestHandler):
    # TODO no connection to database
    def get(self, path):
        try:
            code = database.read_page(path)
            self.set_header("X-Robots-Tag", "noindex")
            self.write(code)
        except EntryNotFound:
            file = open('./assets/code/empty.ceme', 'r')
            self.set_status(404)
            self.write(file.read())

class CreateHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        # this redirects after the post
        try:
            content = "'Your page has been created. You can now edit it.'"
            name = self.get_argument('name', '')
            ip = self.request.remote_ip
            group = 1
            userid = ''
            database.create_page(name, content, ip, group, userid)
            self.redirect('/' + name)
        except InvalidPageName, e:
            self.set_status(400)
            self.redirect('/invalid-name' + name)
        except AlreadyExists:
            self.redirect('/already-exits')

class SaveHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

    def post(self):
        # this uses an ajax post
        try:
            name = self.get_argument('name', '')
            content = self.get_argument('content', '')
            ip = self.request.remote_ip
            group = 1
            userid = ''
            database.save_page(name, content, ip, group, userid)
            self.write('The page has been saved successfully')

        except InvalidPageName, e:
            self.set_status(400)
            self.write(str(e))
        except Exception, e:
            print e
            self.set_status(500)
            self.write('An internal error occurred.')

class HistoryHandler(tornado.web.RequestHandler):
    def get(self, path):
        name = self.get_argument("name")
        limit = self.get_argument("limit", "20")
        self.set_header("Content-Type", "application/json")
        self.write(database.get_history(name, limit))

class DiffHandler(tornado.web.RequestHandler):
    def get(self, path):
        name = self.get_argument("name")
        first = self.get_argument("first")
        second = self.get_argument("second")
        self.set_header("Content-Type", "application/json")
        self.write(database.get_diff(name, first, second))

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
    (r"/save-new", CreateHandler),
    (r"/save", SaveHandler),
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
    server.listen(8443)
    tornado.ioloop.IOLoop.instance().start()
