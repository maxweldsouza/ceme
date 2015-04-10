import MySQLdb
import json
import hashlib, uuid
import re

import settings
from custom_exceptions import *

class DatabaseConnection:
    def connect(self):
        try:
            self.connection = MySQLdb.connect(host=settings.db_host,
                    user=settings.db_user,
                    passwd=settings.db_password,
                    db=settings.db_name)

            self.cur = self.connection.cursor()
            return self.cur
        except Exception, e:
            raise

    def disconnect(self):
        self.connection.close()
        self.cur.close()

    def get_one(self, qry, tpl):
        try:
            cur = self.connect()
            cur.execute(qry, tpl)
            result = cur.fetchone()
            self.disconnect()
            # unpack tuple if it has only
            # one element
            print result
            if len(result) == 1:
                result = result[0]
            return result
        except Exception, e:
            raise

    def get_all(self, qry, tpl):
        try:
            cur = self.connect()
            cur.execute(qry, tpl)
            result = cur.fetchall()
            self.disconnect()
            return result
        except Exception, e:
            raise

    def put(self, qry, tpl):
        try:
            cur = self.connect()
            cur.execute(qry, tpl)
            self.connection.commit()
            self.disconnect()
        except Exception, e:
            raise

db = DatabaseConnection()

def date_handler(obj):
        return obj.isoformat() if hasattr(obj, 'isoformat') else obj

def generate_salt():
    return uuid.uuid4().hex

def hash_password(password, salt):
    return hashlib.sha512(password + salt).hexdigest()

""" Validation """
# TODO make someone read rfc3986 and fix this
def validate_name(name):
    reg = re.compile('^[a-zA-Z0-9-]+$')
    if name == '':
        raise InvalidInput('Page name is empty')
    if not reg.match(name):
        raise InvalidInput('Page name is invalid')

def validate_content(content):
    content = content.replace('\r\n', '\n')
    content = content.replace('\r', '\n')
    if content == '':
        raise InvalidInput('Page is empty')
    if '\t' in content:
        raise InvalidInput('Tabs are not allowed in code')
    if '\r' in content:
        raise Exception('Carraige return in content')
    return content

def validate_username(username):
    reg = re.compile('^[a-zA-Z]+[a-zA-Z_]+[a-zA-Z]+$')
    if not len(username) > 4:
        raise InvalidInput('Username should be more than 4 characters')
    if not reg.match(username):
        raise InvalidInput('Username has invalid characters')

def validate_email(email):
    reg = re.compile('[^@]+@[^@]+\.[^@]+')
    if not reg.match(email):
        raise InvalidInput('Invalid email')

def validate_password(password):
    if not re.search(r'/d', password):
        raise InvalidInput('Password should contain atleast one digit')
    if len(password) < 10:
        raise InvalidInput('Password needs to be atleast 10 characters')
    if len(password) > 128:
        raise InvalidInput('Password cannot be greater than 128 characters')

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

""" Users """
def create_user(username, email, password):
    validate_username(username)
    validate_email(email)
    validate_password(password)

    exists = db.get_one('SELECT user_name FROM users'
            ' WHERE user_name = %s', (username,))
    if exists:
        raise InvalidInput('This username already exists')

    salt = generate_salt()
    hash = hash_password(password, salt)
    db.put('INSERT INTO users (user_name, user_hash, user_salt, user_email, user_group)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (username, hash, salt, email, settings.default_level))

def authenticate_user(username, password):
    salt = db.get_one('SELECT user_salt FROM users'
            ' WHERE user_name = %s', (username,))
    if not salt:
        raise LoginFailed()
    hash = hash_password(password, salt)
    dbhash = db.get_one('SELECT user_hash FROM users'
            ' WHERE user_name = %s', (username,))
    if hash != dbhash:
        raise LoginFailed('Incorrect details')
    return True

""" Pages """
def create_page(name, content, ip, username):
    validate_name(name)
    content = validate_content(content)
    if not username:
        username = ''

    exists = db.get_one('SELECT page_timestamp FROM pages'
            ' WHERE page_name = %s limit 1', (name,))
    if (exists):
        raise AlreadyExists('This page already exists')
    else:
        db.put('INSERT INTO pages '
                '(page_name, page_content, page_group, page_username, page_ip)'
                ' VALUES (%s, %s, %s, %s, %s) ',
                (name, content, settings.default_level, username, ip))

def save_page(name, content, ip, username):
    validate_name(name)
    content = validate_content(content)
    if not username:
        username = ''

    user_group = db.get_one('SELECT user_group FROM users'
            ' WHERE user_name = %s', (username,))
    page_group, old_content = db.get_one('SELECT page_group, page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC LIMIT 1', (name,))
    if page_group:
        page_group = int(page_group)
    if user_group:
        user_group = int(user_group)
    else:
        user_group = 0

    if content == old_content:
        raise InvalidInput("No changes to save")
    if user_group < page_group:
        raise NoRights('User level %d is lower than page level %d' % (user_group, page_group))
    db.put('INSERT INTO pages (page_name, page_content, page_group, page_username, page_ip)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (name, content, settings.default_level, username, ip))

def read_page(name):
    validate_name(name)
    page = db.get_one('SELECT page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC LIMIT 1', (name,))
    if not page:
        raise EntryNotFound('this entry was not found')
    return page

def get_history(name, limit):
    validate_name(name)
    entries = db.get_all('SELECT page_id, page_username, page_timestamp FROM pages'
            ' WHERE page_name = %s LIMIT %s', (name, int(limit)))
    arr = []
    if not entries:
        raise EntryNotFound
    for entry in entries:
        somedict = { "id": entry[0], "user": entry[1], "timestamp": entry[2], }
        arr.append(somedict)
    return json.dumps(arr, default=date_handler)

def get_diff(name, first, second):
    validate_name(name)
    fst = db.get_one('SELECT page_id, page_content, page_timestamp FROM pages'
            ' WHERE page_name = %s AND page_id = %s', (name, first))
    snd = db.get_one('SELECT page_id, page_content, page_timestamp FROM pages'
            ' WHERE page_name = %s AND page_id = %s', (name, second))
    if fst and snd:
        somedict = [{ "id": fst[0], "content": fst[1], "timestamp": fst[2] },{ "id": snd[0], "content": snd[1], "timestamp": snd[2] }]
        return json.dumps(somedict, default=date_handler)
    else:
        raise Exception('Invalid input parameters')
