import os
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
import json
import database

xsrf_cookie = 'sodfksoihasg'

# authentication
def restricted(f):
    def wrapper(*args, **kwargs):
        if args[0].get_secure_cookie(xsrf_cookie):
            return f(*args, **kwargs)
        else:
            return args[0].redirect('/')
    return wrapper

def authenticate(email, password):
    if email == 'maxellusionist@gmail.com' and password == 'tsi0ffo5':
        return True
    elif email == 'chrisleeds18@gmail.com' and password == 'tsi0ffo5':
        return True

class LoginHandler(tornado.web.RequestHandler):
    def post(self):
        email = self.get_argument('email', '')
        password = self.get_argument('password', '')
        if authenticate(email, password):
            self.set_secure_cookie(xsrf_cookie, 'maxwel')
            self.redirect('/home')
        else:
            self.redirect('/login-fail')

class LogoutHandler(tornado.web.RequestHandler):
    def post(self):
        self.clear_cookie(xsrf_cookie)
        self.redirect('/logged-out')

# use the @restricted decorator

class MainHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.xsrf_token
        self.render("index.html")

class ErrorHandler(tornado.web.ErrorHandler):
    def get(self):
        self.write('An error occurred');\

# ceme code
class CreateHandler(tornado.web.ErrorHandler):
    pass

class CodeHandler(tornado.web.RequestHandler):
    def get(self, path):
        self.set_status(200)
        #if self.get_secure_cookie(xsrf_cookie):
        code = database.read_page(path)
        self.write(code)

class SaveHandler(tornado.web.RequestHandler):
    def post(self):
        content = self.get_argument('content', '')
        name = self.get_argument('name', '')
        database.save_page(name, content, 1, '', '')
        self.write('The page has been saved successfully')

class DeleteHandler(tornado.web.RequestHandler):
    pass

class HistoryHandler(tornado.web.RequestHandler):
    pass

class DiffHandler(tornado.web.RequestHandler):
    pass

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
    (r"/save", SaveHandler),
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
