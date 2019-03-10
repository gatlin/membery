import os

from flask import g, current_app, Flask, request
from flask_restful import reqparse, abort, Api, Resource
import psycopg2
import json
import resources

def make_error(msg, status_code=400):
    return { 'error': msg }, status_code

api_prefix = '/api/v1'

def create_app():
    app = Flask(__name__)
    api = Api(app)

    with app.app_context():
        api.add_resource(resources.roles.Roles,
                         api_prefix + '/roles',
                         api_prefix + '/roles/',
                         api_prefix + '/roles/<role_id>')
        api.add_resource(resources.members.Members,
                         api_prefix + '/members',
                         api_prefix + '/members/',
                         api_prefix + '/members/<member_id>')
        api.add_resource(resources.committees.Committees,
                         api_prefix + '/committees',
                         api_prefix + '/committees/',
                         api_prefix + '/committees/<committee_id>')
        api.add_resource(resources.meetings.Meetings,
                         api_prefix + '/meetings',
                         api_prefix + '/meetings/',
                         api_prefix + '/meetings/<meeting_id>')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=read_config('HTTP_PORT'))
