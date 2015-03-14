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
def validate_name(name):
    if name == '':
        raise InvalidPageName('Page name is empty')

def validate_content(content):
    if content == '':
        raise Exception('Page is empty')
    if '\t' in content:
        raise Exception('Tabs are not allowed in code')

USER_RE = re.compile('^[a-zA-Z._]+$')
def validate_userid(userid):
    if not len(userid) > 4:
        raise Exception('Username should be more than 4 characters')
    if not USER_RE.match(userid):
        raise Exception('Username has invalid characters')
    chars = ['.', '_']
    # TODO map reduce StartsWith

EMAIL_RE = re.compile('[^@]+@[^@]+\.[^@]+')
def validate_email(email):
    if not EMAIL_RE.match(email):
        raise Exception('Invalid email')

def validate_password(password):
    if not re.search(r'/d', password):
        raise Exception('Password should contain atleast one digit')
    if len(password) < 10:
        raise Exception('Password needs to be atleast 10 characters')
    if len(password) > 128:
        raise Exception('Password cannot be greater than 128 characters')

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

""" Database Handlers """
def create_page(name, content, ip, group, userid):
    validate_name(name)
    validate_content(content)
    exists = db.get_one('SELECT page_timestamp FROM pages'
            ' WHERE page_name = %s limit 1', (name,))
    if (exists):
        raise AlreadyExists('This page already exists')
    else:
        db.put('INSERT INTO pages '
                '(page_name, page_content, page_group, page_userid, page_ip)'
                ' VALUES (%s, %s, %s, %s, %s) ',
                (name, content, group, userid, ip))

def save_page(name, content, ip, group, userid):
    validate_name(name)
    validate_content(content)
    exists = db.get_one('SELECT page_timestamp from pages where page_name = %s limit 1', (name,))
    db.put('INSERT INTO pages (page_name, page_content, page_group, page_userid, page_ip)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (name, content, group, userid, ip))

def read_page(name):
    validate_name(name)
    page = db.get_one('SELECT page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC LIMIT 1', (name,))
    if page:
        return page[0]
    else:
        raise EntryNotFound('this entry was not found')

def create_user(userid, email, password):
    validate_userid(userid)
    validate_email(email)
    validate_password(password)

    userid = db.get_one('SELECT user_id FROM users'
            ' WHERE user_id = %s', (userid,))

    salt = generate_salt()
    hash = hash_password(password, salt)
    # add to database
    pass

def get_history(name, limit):
    validate_name(name)
    entries = db.get_all('SELECT page_id, page_userid, page_timestamp FROM pages'
            ' WHERE page_name = %s LIMIT %s', (name, int(limit)))
    arr = []
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
    somedict = [{ "id": fst[0], "content": fst[1], "timestamp": fst[2] },{ "id": snd[0], "content": snd[1], "timestamp": snd[2] }]
    return json.dumps(somedict, default=date_handler)
