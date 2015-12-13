#!/usr/bin/env python3

import os
from json import load, dump

from settings import FOLDER_SPLITTED

data_config = load(open(FOLDER_SPLITTED + 'config.json'))
for item in data_config['buildings'].keys():
    try:
        os.mkdir(FOLDER_SPLITTED + item)
    except OSError:
        pass

data = load(open('collected.json'))


def split_by_slug(key):
    global data
    slugs = {}
    for item in data[key]:
        slugs.setdefault(item['BUILDING_SLUG'], []).append(item)

    for slug, slug_data in slugs.items():
        try:
            dump(slug_data, open(FOLDER_SPLITTED + slug + '/' + key + '.json', 'w'),
                 indent=1, sort_keys=True)
        except FileNotFoundError:
            pass

split_by_slug('building_count')
split_by_slug('building_level_requirement')

import pdb
pdb.set_trace()