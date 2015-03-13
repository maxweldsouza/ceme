import MySQLdb
import json
from custom_exceptions import *

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
        cur = self.connect()
        cur.execute(qry, tpl)
        result = cur.fetchone()
        self.disconnect()
        return result

    def get_all(self, qry, tpl):
        cur = self.connect()
        cur.execute(qry, tpl)
        result = cur.fetchall()
        self.disconnect()
        return result

    def put(self, qry, tpl):
        cur = self.connect()
        cur.execute(qry, tpl)
        self.connection.commit()
        self.disconnect()

db = DatabaseConnection()

def date_handler(obj):
        return obj.isoformat() if hasattr(obj, 'isoformat') else obj

def create_page(name, content, ip, group, userid):
    if (name == ''):
        raise InvalidPageName('Page name is empty')
    db.query_one('SELECT page_iscurrent from pages where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    if (exists):
        raise AlreadyExists('This page already exists')
    else:
        db.put('INSERT INTO pages (page_name, page_content, page_group, page_userid, page_ip, page_iscurrent) VALUES (%s, %s, %s, %s, %s, 1) ', (name, content, group, userid, ip))

def save_page(name, content, ip, group, userid):
    if (name == ''):
        raise InvalidPageName('Page name is empty')
    exists = db.get_one('SELECT page_iscurrent from pages where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    if (exists):
        db.put('UPDATE pages SET page_iscurrent = 0 where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    db.put('INSERT INTO pages (page_name, page_content, page_group, page_userid, page_ip, page_iscurrent) VALUES (%s, %s, %s, %s, %s, 1) ', (name, content, group, userid, ip))

def read_page(name):
    page = db.get_one('SELECT page_content FROM pages WHERE page_name = %s AND page_iscurrent = 1', (name,))
    if page:
        return page[0]
    else:
        raise EntryNotFound('this entry was not found')

def get_history(name, limit):
    entries = db.get_all('SELECT page_id, page_userid, page_timestamp FROM pages WHERE page_name = %s LIMIT %s', (name, int(limit)))
    arr = []
    for entry in entries:
        somedict = { "id": entry[0], "user": entry[1], "timestamp": entry[2], }
        arr.append(somedict)
    return json.dumps(arr, default=date_handler)

def get_diff(name, first, second):
    fst = db.get_one('SELECT page_content, page_timestamp FROM pages WHERE page_name = %s AND page_id = %s', (name, first))
    snd = db.get_one('SELECT page_content, page_timestamp FROM pages WHERE page_name = %s AND page_id = %s', (name, second))
    somedict = [{ "id": fst[0], "timestamp": fst[1] },{ "id": snd[0], "timestamp": snd[1] }]
    return json.dumps(somedict, default=date_handler)
