import json,sys,urllib.request
url='http://127.0.0.1:8000/generate'
data={'players':[{'name':'A','position':'Forward','level':'Advanced'},{'name':'B','position':'Goalkeeper','level':'Intermediate'},{'name':'C','position':'Defender','level':'Beginner'},{'name':'D','position':'Midfielder','level':'Intermediate'}],'teamCount':2,'teamSize':3}
req=urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode())
except Exception as e:
    print('ERROR', e)
    sys.exit(1)
