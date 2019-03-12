import os

from flask import g, current_app, Flask, request, _request_ctx_stack
from flask_restful import reqparse, abort, Api, Resource
import psycopg2
import json
import resources
from functools import wraps
from flask_cors import CORS

from resources.auth import requires_auth

def make_error(msg, status_code=400):
    return { 'error': msg }, status_code

api_prefix = '/api/v1'

class UserData(Resource):

    method_decorators = [ requires_auth() ]
    def get(self, *args, **kwargs):
        return {
            'error': None,
            'data': {
                'app_ctx': json.dumps(_request_ctx_stack.top.current_user,
    default=str),
                'token_data': json.dumps(kwargs, default=str)
            }
        }, 200

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

        api.add_resource(UserData, api_prefix + '/user-data')
    CORS(app)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=read_config('HTTP_PORT'))
