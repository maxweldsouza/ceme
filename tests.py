import urllib2, urllib
from custom_exceptions import *
import requests

url = 'https://localhost:8443'

r = requests.get(url, verify=False)
cookie = r.cookies['_xsrf']

def test(path, status):
    try:
        response = urllib2.urlopen(url + path)
        if response.getcode() == status:
            print 'passed'
    except urllib2.HTTPError, e:
        if e.code == status:
            print 'passed',
        else:
            print 'failed', e.code,
        print e.read()

def testpost(path, values, status):
    r = requests.post(url + path, data=values, verify=False)
    if r.status_code == status:
        print 'passed'
    else:
        print 'failed', r.status_code,

""" history """
# good requests
test('/api/history?name=create', 200)
test('/api/history?name=login', 200)

# bad requests
test('/api/history', 400)
test('/api/history?sfd=sfd', 400)
test('/api/history?name=sodenotexist', 404)
test('/api/history?name=*&*#%^*)(', 400)

""" authentication """
testpost('/login'
        , {'username': '', 'password': ''}, 200)
