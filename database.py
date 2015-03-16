import MySQLdb
import json
from custom_exceptions import *
import hashlib, uuid
import re

class DatabaseConnection:
    def connect(self):
        try:
            self.connection = MySQLdb.connect(host="localhost",
                    user="root",
                    passwd="dttmw5d",
                    db="cemeio")

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
PGNM_RE = re.compile('^[a-zA-Z0-9-]+$')
def validate_name(name):
    if name == '':
        raise InvalidPageName('Page name is empty')
    if not PGNM_RE.match(name):
        raise InvalidPageName('Page name is invalid')

def validate_content(content):
    if content == '':
        raise InvalidContent('Page is empty')
    if '\t' in content:
        raise InvalidContent('Tabs are not allowed in code')

USER_RE = re.compile('^[a-zA-Z]+[a-zA-Z_]+[a-zA-Z]+$')
def validate_username(username):
    if not len(username) > 4:
        raise InvalidUsername('Username should be more than 4 characters')
    if not USER_RE.match(username):
        raise InvalidUsername('Username has invalid characters')
    chars = ['.', '_']
    # TODO map reduce StartsWith

EMAIL_RE = re.compile('[^@]+@[^@]+\.[^@]+')
def validate_email(email):
    if not EMAIL_RE.match(email):
        raise InvalidEmail('Invalid email')

def validate_password(password):
    return True
    if not re.search(r'/d', password):
        raise InvalidPassword('Password should contain atleast one digit')
    if len(password) < 10:
        raise InvalidPassword('Password needs to be atleast 10 characters')
    if len(password) > 128:
        raise InvalidPassword('Password cannot be greater than 128 characters')

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
        raise InvalidUsername('This username already exists')

    salt = generate_salt()
    hash = hash_password(password, salt)
    group = 1
    db.put('INSERT INTO users (user_name, user_hash, user_salt, user_email, user_group)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (username, hash, salt, email, group))

def authenticate_user(username, password):
    validate_username(username)
    validate_password(password)
    salt = db.get_one('SELECT user_salt FROM users'
            ' WHERE user_name = %s', (username,))
    if not salt:
        raise LoginFailed()
    salt = salt[0]
    hash = hash_password(password, salt)
    dbhash = db.get_one('SELECT user_hash FROM users'
            ' WHERE user_name = %s', (username,))
    dbhash = dbhash[0]
    if hash != dbhash:
        raise LoginFailed()
    return True

""" Pages """
def create_page(name, content, ip, group, username):
    validate_name(name)
    validate_content(content)
    exists = db.get_one('SELECT page_timestamp FROM pages'
            ' WHERE page_name = %s limit 1', (name,))
    if (exists):
        raise AlreadyExists('This page already exists')
    else:
        db.put('INSERT INTO pages '
                '(page_name, page_content, page_group, page_username, page_ip)'
                ' VALUES (%s, %s, %s, %s, %s) ',
                (name, content, group, username, ip))

def save_page(name, content, ip, group, username):
    validate_name(name)
    validate_content(content)
    exists = db.get_one('SELECT page_timestamp from pages where page_name = %s limit 1', (name,))
    db.put('INSERT INTO pages (page_name, page_content, page_group, page_username, page_ip)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (name, content, group, username, ip))

def read_page(name):
    validate_name(name)
    page = db.get_one('SELECT page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC LIMIT 1', (name,))
    if page:
        return page[0]
    else:
        raise EntryNotFound('this entry was not found')

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
