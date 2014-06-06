#!/usr/bin/python

import os
import string
import json
import urllib

print("Content-Type:text/html;charset=iso-8859-1\n\r");

try:
  #get the paths of the save files
  result = os.listdir("./saves/");
  match = [];
  counter = 0;
  for a in range(0, len(result)):
    if string.find(result[a], ".json") != -1:
      match.append(result[a]);
  #print the content of the save files as a valid JSON-Object   
  print("{")    
  for a in range(0, len(match)):
    f = open(str("./saves/")+str(match[a]), 'r');
    if(a != 0):
      print(",");
    print(str(a)+":"+f.read());
    f.close();
  print("}");  

#if save folder does not exist, return empty object
except OSError as exception:
    print("{}")
