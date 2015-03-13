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

DbConn = DatabaseConnection()

def date_handler(obj):
        return obj.isoformat() if hasattr(obj, 'isoformat') else obj

def create_page(name, content, ip, group, userid):
    cur = DbConn.connect()
    if (name == ''):
        raise InvalidPageName('Page name is empty')
    cur.execute('SELECT page_iscurrent from pages where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    exists = cur.fetchone()
    if (exists):
        db.rollback()
        raise AlreadyExists('This page already exists')
    else:
        cur.execute('INSERT INTO pages (page_name, page_content, page_group, page_userid, page_ip, page_iscurrent) VALUES (%s, %s, %s, %s, %s, 1) ', (name, content, group, userid, ip))
        db.commit()
    DbConn.disconnect()

def save_page(name, content, ip, group, userid):
    cur = DbConn.connect()
    if (name == ''):
        raise InvalidPageName('Page name is empty')
    cur.execute('SELECT page_iscurrent from pages where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    exists = cur.fetchone()
    if (exists):
        cur.execute('UPDATE pages SET page_iscurrent = 0 where page_name = %s AND page_iscurrent = 1 limit 1', (name,))
    cur.execute('INSERT INTO pages (page_name, page_content, page_group, page_userid, page_ip, page_iscurrent) VALUES (%s, %s, %s, %s, %s, 1) ', (name, content, group, userid, ip))
    db.commit()
    DbConn.disconnect()

def read_page(name):
    cur = DbConn.connect()
    cur.execute('SELECT page_content FROM pages WHERE page_name = %s AND page_iscurrent = 1', (name,))
    page = cur.fetchone()
    if page:
        DbConn.disconnect()
        return page[0]
    else:
        DbConn.disconnect()
        raise EntryNotFound('this entry was not found')

def get_history(name, limit):
    cur = DbConn.connect()
    cur.execute('SELECT page_id, page_userid, page_timestamp FROM pages WHERE page_name = %s LIMIT %s', (name, int(limit)))
    entries = cur.fetchall()
    arr = []
    for entry in entries:
        somedict = { "id": entry[0], "user": entry[1], "timestamp": entry[2], }
        arr.append(somedict)
    DbConn.disconnect()
    return json.dumps(arr, default=date_handler)

def get_diff(name, first, second):
    cur = DbConn.connect()
    cur.execute('SELECT page_content, page_timestamp FROM pages WHERE page_name = %s AND page_id = %s', (name, first))
    fst = cur.fetchone()
    cur.execute('SELECT page_content, page_timestamp FROM pages WHERE page_name = %s AND page_id = %s', (name, second))
    snd = cur.fetchone()
    somedict = [{ "id": fst[0], "timestamp": fst[1] },{ "id": snd[0], "timestamp": snd[1] }]
    DbConn.disconnect()
    return json.dumps(somedict, default=date_handler)
