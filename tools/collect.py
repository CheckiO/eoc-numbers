#!/usr/bin/env python3

import os
from json import load, dumps

data = {}

from settings import FOLDER_SPLITTED

for root, dirs, files in os.walk(FOLDER_SPLITTED):
    for filename in files:
        if not filename.endswith('json'):
            continue
        key = filename.split('.')[0]
        if key not in data:
            data[key] = []
        data[key] += load(open(os.path.join(root, filename)))

print(dumps(data))
