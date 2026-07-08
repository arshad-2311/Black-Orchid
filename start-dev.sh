#!/bin/bash
cd /home/z/my-project
exec /home/z/my-project/node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
