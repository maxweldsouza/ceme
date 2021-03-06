import hashlib, uuid
import re

import config
import dbhelper
from custom_exceptions import *

db = dbhelper.DatabaseConnection(host=config.db_host,
                    user=config.db_user,
                    passwd=config.db_password,
                    db=config.db_name)
json_output = dbhelper.json_output

def generate_salt():
    return uuid.uuid4().hex

def hash_password(password, salt):
    return hashlib.sha512(password + salt).hexdigest()

""" Validation """
# TODO make someone read rfc3986 and fix this
def validate_name(name):
    reg = re.compile('^[a-zA-Z0-9-\.]+$')
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

def validate_limit(limit):
    limit = int(limit)
    if limit < 1 or limit > 20:
        raise InvalidInput('Limit can be between 1 and 20')

def validate_offset(offset):
    try:
        offset = int(offset)
        if offset < 0:
            raise InvalidInput('Offset value can only be any positive integer')
        elif offset > 1000:
            raise InvalidInput('Offset cannot be greater than 1000')
    except Exception, e:
        raise InvalidInput('Offset value can only be any positive integer')

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
            , (username, hash, salt, email, config.default_level))

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
            ' WHERE page_name = %s', (name,))
    if (exists):
        raise AlreadyExists('This page already exists')
    else:
        db.put('INSERT INTO pages '
                '(page_name, page_content, page_group, page_username, page_ip)'
                ' VALUES (%s, %s, %s, %s, %s) ',
                (name, content, config.default_level, username, ip))

def save_page(name, content, ip, username):
    validate_name(name)
    if not username:
        username = ''

    user_group = db.get_one('SELECT user_group FROM users'
            ' WHERE user_name = %s', (username,))
    page_group, old_content = db.get_one('SELECT page_group, page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC', (name,))
    if page_group:
        page_group = int(page_group)
    if user_group:
        user_group = int(user_group)
    else:
        user_group = 0

    if user_group < page_group:
        if user_group is 0:
            raise NoRights('This page can only be edited by authenticated users of level %d and above.' % (page_group,))
        raise NoRights('You are a level %d user and the page is level %d' % (user_group, page_group))

    # check user level before validating content
    # to save one query
    content = validate_content(content)
    if content == old_content:
        raise InvalidInput("No changes to save")
    db.put('INSERT INTO pages (page_name, page_content, page_group, page_username, page_ip)'
            ' VALUES (%s, %s, %s, %s, %s) '
            , (name, content, config.default_level, username, ip))

def read_page(name):
    validate_name(name)
    page = db.get_one('SELECT page_content FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC', (name,))
    if not page:
        raise EntryNotFound('this entry was not found')
    return page

def get_history(name, limit, offset):
    validate_name(name)
    validate_limit(limit)
    validate_offset(offset)
    entries = db.get_all('SELECT page_id, page_username, page_timestamp FROM pages'
            ' WHERE page_name = %s ORDER BY page_timestamp DESC LIMIT %s OFFSET %s', (name, int(limit), int(offset)))
    arr = []
    if not entries:
        raise EntryNotFound('No more pages to show')
    for entry in entries:
        tmpobj = { "id": entry[0], "user": entry[1], "timestamp": entry[2], }
        arr.append(tmpobj)
    return json_output(arr)

def get_diff(name, first, second):
    validate_name(name)
    fst = db.get_one('SELECT page_id, page_content, page_timestamp FROM pages'
            ' WHERE page_name = %s AND page_id = %s', (name, first))
    snd = db.get_one('SELECT page_id, page_content, page_timestamp FROM pages'
            ' WHERE page_name = %s AND page_id = %s', (name, second))
    if fst and snd:
        tmpobj = [{ "id": fst[0], "content": fst[1], "timestamp": fst[2] },{ "id": snd[0], "content": snd[1], "timestamp": snd[2] }]
        return json_output(tmpobj)
    else:
        raise InvalidInput('Page with the given id or name does not exist')

def get_user_profile(username, limit, offset):
    validate_username(username)
    validate_limit(limit)
    validate_offset(offset)
    entries = db.get_all('SELECT page_id, page_name, page_timestamp FROM pages'
            ' WHERE page_username = %s ORDER BY page_timestamp DESC LIMIT %s OFFSET %s',
            (username, int(limit), int(offset)))
    arr = []
    if not entries:
        raise EntryNotFound('No more entries to show')
    for entry in entries:
        tmpobj = { "id": entry[0], "page": entry[1], "timestamp": entry[2], }
        arr.append(tmpobj)
    return json_output(arr)

def search(query):
    entries = db.get_all('SELECT DISTINCT page_name FROM pages'
            ' WHERE page_content LIKE %s LIMIT 10', (query, ))
    arr = []
    if not entries:
        raise EntryNotFound('No results found')
    for entry in entries:
        tmpobj = { "name": entry[0] }
        arr.append(tmpobj)
    return json_output(arr)
