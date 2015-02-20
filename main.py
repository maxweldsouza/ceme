import os
import tornado.ioloop
import tornado.web

settings = {
    'debug' : True,
    'cookie_secret' : 'asdfn034uih4usygfp89dghu23780tghdsfgbshx'
}

def authenticate(email, password):
    if email == 'maxellusionist@gmail.com' and password == 'm4a1ak47':
        return True

class MainHandler(tornado.web.RequestHandler):
    def get(self, path):
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

class CodeHandler(tornado.web.RequestHandler):
    def get(self, path):
        fullpath = './assets/code/' + path
        if self.get_secure_cookie('fidmsig'):
            file = open(fullpath, 'r')
            self.write(file.read())
        else:
            file = open('./assets/code/login.ceme', 'r')
            self.write(file.read())

application = tornado.web.Application([
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
    (r"/assets/code/(.*)", CodeHandler),
    (r"/assets/(.*)",tornado.web.StaticFileHandler, {"path": "./assets"},),
    (r"/(.*)", MainHandler),
    ], **settings)

if __name__ == "__main__":
    application.listen(8001)
    tornado.ioloop.IOLoop.instance().start()
