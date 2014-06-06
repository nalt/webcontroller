#!/bin/bash
cd `dirname $0`
cd client
python -m CGIHTTPServer $1
