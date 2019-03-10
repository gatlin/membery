from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db

class Roles(Resource):
    '''
    Endpoint for manipulating user roles

    A role is this, conceptually:

    {
        "id": <int>,
        "name": <string>
    }

    `name` is a required field for POST / PUT. Technically it's not required for
    PATCH but that would be extremely pointless.
    '''

    def list(self):
        '''
        GET /roles
        '''
        db = get_db()
        cur = db.cursor()
        cur.execute('select id, name from roles')
        roles = [{ 'id': row[0], 'name': row[1] } for row in cur.fetchall()]
        db.commit()
        cur.close()
        return { "error": None, "data": roles }, 200

    def fetch(self, role_id):
        '''
        GET /roles/<role_id>

        :param role_id: Numeric ID of the role in the database
        '''
        db = get_db()
        cur = db.cursor()
        cur.execute('select id, name from roles where id = %s', (int(role_id),))
        row = cur.fetchone()

        db.commit()
        cur.close()

        if row:
            return {
                "error": None,
                "data": {
                    "id": row[0],
                    "name": row[1]
                }
            }, 200
        else:
            return { 'error': 'Role not found' }, 404

    def get(self, role_id=None):
        '''
        Dispatch to either fetch or list.

        :param role_id: Numeric ID of the role in the database.
        '''
        if not role_id:
            return self.list()
        else:
            return self.fetch(role_id)

    def post(self):
        '''
        POST /roles
        '''
        body = request.get_json()
        if 'name' not in body:
            return { 'error': 'Role exists with specified name' }, 400

        role_name = body['name']

        db = get_db()
        cur = db.cursor()
        try:
            cur.execute('insert into roles (name) values (%s)', (role_name,))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()
        cur.close()

        return { 'error': None }, 201

    def put(self, role_id=None):
        '''
        PUT /roles/<role_id>

        :param role_id: Numeric ID of the role in the database.
        '''
        if not role_id:
            return { 'error': 'No role ID specified' }, 400

        body = request.get_json()
        if 'name' not in body:
            return { 'error': 'You must specify a name for the role'} , 400

        role_name = body['name']

        db = get_db()
        cur = db.cursor()
        cur.execute('update roles set name = %s where id = %s', (
            role_name,
            role_id))
        db.commit()
        cur.close()
        return { 'error': None }, 204

    def patch(self, role_id=None):
        '''
        PUT /roles/<role_id>

        :param role_id: Numeric ID of the role in the database.
        '''
        if not role_id:
            return { 'error': 'No role ID specified' }, 400

        body = request.json()
        if 'name' in body:
            return self.put(role_id=role_id)
        else:
            return { 'error': None }, 204

    def delete(self, role_id=None):
        '''
        DELETE /roles/<role_id>

        :param role_id: Numeric ID of the role in the database.
        '''
        if not role_id:
            return { 'error': 'No role ID specified' }, 400

        db = get_db()
        cur = db.cursor()
        cur.execute ('select exists (select 1 from roles where id = %s)', (
            role_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid role ID' }, 400

        cur.execute('delete from roles where id = %s', (role_id,))
        db.commit()
        cur.close()
        return { 'error': None }, 204
