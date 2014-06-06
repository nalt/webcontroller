#!/usr/bin/python

import errno
import os
import string
import urllib
import json

print("Content-Type:text/html;charset=iso-8859-1\n\n");

try:
    os.makedirs("./saves")
except OSError as exception:
    if exception.errno != errno.EEXIST:
        raise

result = os.listdir("./saves/");
for a in range(0, len(result)):
  if string.find(result[a], ".json") != -1:
    os.remove(str("./saves/")+result[a]);


query = os.environ['QUERY_STRING'];
query = string.replace(query ,'JSON=', '');

url = urllib.unquote(query)
obj = json.loads(url);

#print(json.dumps(obj, ensure_ascii=False));
#print(json.loads(json.dumps(obj, ensure_ascii=False)))

for k,v in obj.items():
  path = str("./saves/") + v['desktop']+'_'+ str(v['stamp']) +'.json';
  print path;
  f = open(path, 'w');
  f.write(json.dumps(v, ensure_ascii=False));
  f.close();    

#fileee = open("save.txt", "w");
#fileee.write(query);
#fileee.close();
