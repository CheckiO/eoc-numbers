from jinja2 import FileSystemLoader
from jinja2.environment import Environment

env = Environment()
env.loader = FileSystemLoader('.')
tmpl = env.get_template('balance/main.json')

print(tmpl.render())