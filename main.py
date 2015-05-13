#!/usr/bin/env python
import datetime
import os
import tornado.ioloop
import tornado.web
from tornado.httpserver import HTTPServer
import json

import database
import config
from custom_exceptions import *

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
        if args[0].get_secure_cookie(config.xsrf_cookie):
            return f(*args, **kwargs)
        else:
            return args[0].redirect('/')
    return wrapper

class LoginHandler(tornado.web.RequestHandler):
    """ Ajax requests cannot handle redirects.
    So login and logout requests need to be submitted
    without ajax. Without this it is not possible to
    have common ajax code for all forms."""
    def get(self):
        self.xsrf_token
        #TODO compile and cache template
        self.render(config.template)

    def post(self):
        try:
            username = self.get_argument('username', '')
            password = self.get_argument('password', '')
            if database.authenticate_user(username, password):
                self.set_secure_cookie(config.xsrf_cookie, username)
                self.redirect('/home')
        except Exception, e:
            self.set_status(400)
            self.redirect('/login-fail')
        except Exception, e:
            internal_error(self, e)

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render(config.template)

    def post(self):
        self.clear_cookie(config.xsrf_cookie)
        self.redirect('/logged-out')

class SignupHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render(config.template)

    def post(self):
        try:
            username = self.get_argument('username', '')
            email = self.get_argument('email', '')
            password = self.get_argument('password', '')
            database.create_user(username, email, password)
            # TODO message account created
            self.set_secure_cookie(config.xsrf_cookie, username)
            self.redirect('/home')
        except InvalidInput, e:
            # TODO custom error message page
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
        self.render(config.template)

class ErrorHandler(tornado.web.ErrorHandler):
    def get(self):
        self.write('An error occurred')

class FaviconHandler (tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        year = 60 * 60 * 24 * 365
        self.set_header('Cache-Control', 'max-age:{0}'.format(year))

""" Ceme code """
class CodeHandler(tornado.web.RequestHandler):
    def get(self, path):
        try:
            code = database.read_page(path)
            self.set_header('X-Robots-Tag', 'noindex')
            if path.endswith('.js'):
                self.set_header('Content-Type', 'application/javascript; charset=UTF-8')
            elif path.endswith('.css'):
                self.set_header('Content-Type', 'text/css; charset=UTF-8')
            else:
                self.set_header('Content-Type', 'text/ceme; charset=UTF-8')
            self.write(code)
        except (EntryNotFound, InvalidInput), e:
            self.set_status(404)
            self.write('Page not found 404')
        except Exception, e:
            internal_error(self, e)

class CreateHandler(tornado.web.RequestHandler):
    def get(self):
        self.xsrf_token
        self.render(config.template)

    def post(self):
        """ redirects after post """
        try:
            content = "'Your page has been created. You can now edit it.'"
            name = self.get_argument('name', '')
            ip = self.request.remote_ip
            username = self.get_secure_cookie(config.xsrf_cookie)
            database.create_page(name, content, ip, username)
            self.set_status(200)
            self.redirect('/' + name)
        except InvalidInput:
            self.set_status(400)
            self.redirect('/invalid-name')
        except AlreadyExists:
            self.redirect('/already-exists')
        except Exception, e:
            internal_error(self, e)

class ApiHandler(tornado.web.RequestHandler):
    def get(self):
        action = self.get_argument('action')
        try:
            if action == 'history':
                name = self.get_argument('name', '')
                limit = self.get_argument('limit', '10')
                offset = self.get_argument('offset', 0)
                self.set_header('Content-Type', 'application/json')
                self.write(database.get_history(name, limit, offset))
            elif action == 'diff':
                name = self.get_argument('name')
                first = self.get_argument('first')
                second = self.get_argument('second')
                self.set_header('Content-Type', 'application/json')
                self.write(database.get_diff(name, first, second))
            elif action == 'search':
                query = self.get_argument('query')
                query = "%" + query + "%"
                self.write(database.search(query))
            elif action == 'user':
                username = self.get_argument('username')
                limit = self.get_argument('limit', 10)
                offset = self.get_argument('offset', 0)
                self.write(database.get_user_profile(username, limit, offset))
            else:
                raise InvalidInput('Invalid action')
        except InvalidInput, e:
            self.set_status(400)
            self.write(str(e))
        except EntryNotFound, e:
            self.set_status(404)
            self.write(str(e))
        except Exception, e:
            internal_error(self, e)

    def post(self):
        action = self.get_argument('action')
        name = self.get_argument('name', '')
        content = self.get_argument('content', '')
        ip = self.request.remote_ip
        username = self.get_secure_cookie(config.xsrf_cookie)
        if action == 'save':
            try:
                database.save_page(name, content, ip, username)
                self.write('The page has been saved successfully')

            except NoRights as e:
                self.set_status(400)
                self.write(str(e))
            except InvalidInput as e:
                self.set_status(400)
                self.write(str(e))
            except Exception, e:
                internal_error(self, e)
        else:
            raise InvalidInput('Invalid action')

settings = {
    'default_handler_class': ErrorHandler,
    'default_handler_args': dict(status_code=404),
    'compress_response': True,
    'debug' : config.debug,
    'cookie_secret' : config.cookie_secret,
    'xsrf_cookies': True
}

class CemeStaticHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        period = 60 * 60 * 24 * 8
        self.set_header('Cache-Control', 'max-age:{0}'.format(period))
        expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=period)
        self.set_header('Expires', expires)
        if self.isCemeFile():
            self.set_header('X-Robots-Tag', 'noindex')

    def get_content_type(self):
        name, extension = os.path.splitext(self.absolute_path)
        if self.isCemeFile():
            return 'text/ceme; charset=UTF-8'
        return super(CemeStaticHandler, self).get_content_type()

    def isCemeFile(self):
        name, extension = os.path.splitext(self.absolute_path)
        return extension and (extension.lower() == '.ceme')

# Urls starting with api are for ajax requests.
application = tornado.web.Application([
    (r'/(favicon.ico)', FaviconHandler, {'path': './assets'},),
    (r'/(robots.txt)', CemeStaticHandler, {'path': './'},),
    (r'/login', LoginHandler),
    (r'/logout', LogoutHandler),
    (r'/create', CreateHandler),
    (r'/sign-up', SignupHandler),
    (r'/api', ApiHandler),
    (r'/code/(.*)', CodeHandler),
    (r'/assets/(.*)', CemeStaticHandler, {'path': './assets'},),
    (r'/(.*)', MainHandler),
    ], **settings)

if __name__ == '__main__':
    print 'Ceme Server running on port %s' % config.port
    if config.ssl:
        server = HTTPServer(application, ssl_options = {
            'certfile': os.path.join('certs/localhost.crt'),
            'keyfile': os.path.join('certs/localhost.key'),
            })
        server.listen(config.port)
    else:
        application.listen(config.port)
    tornado.ioloop.IOLoop.instance().start()
