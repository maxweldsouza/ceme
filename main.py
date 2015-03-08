import os
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
import json

def restricted(f):
    def wrapper(*args, **kwargs):
        if args[0].get_secure_cookie('fidmsig'):
            return f(*args, **kwargs)
        else:
            return args[0].redirect('/')
    return wrapper

def authenticate(email, password):
    if email == 'maxellusionist@gmail.com' and password == 'tsi0ffo5':
        return True
    elif email == 'chrisleeds18@gmail.com' and password == 'tsi0ffo5':
        return True

class MainHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

class LoginHandler(tornado.web.RequestHandler):
    def post(self):
        email = self.get_argument('email', '')
        password = self.get_argument('password', '')
        if authenticate(email, password):
            self.set_secure_cookie('fidmsig', 'maxwel')
            self.redirect('/home')
        else:
            self.redirect('/login-fail')

class LogoutHandler(tornado.web.RequestHandler):
    def post(self):
        self.clear_cookie('fidmsig')
        self.redirect('/logged-out')

# use the @restricted decorator

class DemoHandler(tornado.web.RequestHandler):
    def get(self, path):
        fullpath = './assets/code/' + path
        #if self.get_secure_cookie('fidmsig'):
        file = open(fullpath, 'r')
        self.write(file.read())

class ErrorHandler(tornado.web.ErrorHandler):
    def get(self):
        self.write('An error occurred');\

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
    (r"/assets/code/(.*)", DemoHandler),
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
