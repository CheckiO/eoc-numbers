#!/usr/bin/env python3

import os
from json import load, dump

from settings import FOLDER_SPLITTED, FOLDER_OTHER_SPLITTED

data_config = load(open('../config.json'))
for item in list(data_config['buildings'].keys()) + list(data_config['units'].keys()):
    try:
        os.mkdir(FOLDER_SPLITTED + item)
    except OSError:
        pass


def sort_dump(slug_data):
    return sorted(slug_data, key=lambda a: (a.get('LEVEL') or a.get('BUILDING_LEVEL') or
                                            a.get('building_level') or
                                            a.get('REQUIRED_BUILDING_LEVEL') or
                                            a.get('UNIT_LEVEL') or
                                            a.get('MISSION_SLUG') or
                                            a.get('SLUG') or
                                            a.get('step')))


def dump_sorted(slug_data, filename):
    sorder_data = sort_dump(slug_data)
    try:
        dump(sorder_data, open(FOLDER_SPLITTED + filename + '.json', 'w'),
             indent=1, sort_keys=True)
        print(filename)
        return []
    except FileNotFoundError:
        return slug_data

data = load(open('collected.json'))


def dont_split(key):
    dump_sorted(sort_dump(data[key]), key)


def split_by_slug(key):
    global data
    slugs = {}
    for item in data[key]:
        slugs.setdefault((
            item.get('OBJECT_SLUG') or item.get('building_slug') or
            item.get('SLUG') or item.get('UNIT_SLUG') or item.get('BUILDING_SLUG')
        ), []).append(item)

    unsplited_data = []
    for slug, slug_data in slugs.items():
        unsplited_data += dump_sorted(slug_data, slug + '/' + key)

    if unsplited_data:
        dump_sorted(unsplited_data, key)


split_by_slug('building_count')
split_by_slug('building_level_requirement')
split_by_slug('production')
split_by_slug('production_improvement')
split_by_slug('defence_improvement')
split_by_slug('craft_improvement')
split_by_slug('storage_improvement')
split_by_slug('vault_improvement')
split_by_slug('building_level')
split_by_slug('mission_building_level')
split_by_slug('command_center')
split_by_slug('craft')
split_by_slug('vault')
split_by_slug('storage')
split_by_slug('defence')
split_by_slug('laboratory')

split_by_slug('unit_level_requirement')
split_by_slug('unit_level')
split_by_slug('laboratory_research')

dont_split('missions')
dont_split('stages')
dont_split('building')
dont_split('unit')
dont_split('experience_levels')
dont_split('improvement')
dont_split('building_category')