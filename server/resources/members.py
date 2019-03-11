from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db
import psycopg2
import json
from auth import requires_auth

class Members(Resource):
    '''
    Membership endpoints

    A member record is this, conceptually:

    {
        "id": <int>,
        "first_name": <string>,
        "last_name": <string>,
        "active": <boolean>,
        "email": <string | null>,
        "notes": <string | null>,
        "created": <timestamp>,
        "updated": <timestamp>,
        "roles": [<int:role ID>]
    }

    Creating a member requires only:
    - first_name
    - last_name

    Everything but the timestamps is expected in a PUT request.
    '''

    method_decorators = [ requires_auth ]

    def from_row(self, row):
        '''
        Helper for converting a database result row into a dict that we actually
        want to manipulate.

        :param row: a list of fields for a particular member row
        :return: a friendlier dict
        '''
        return {
            "id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "active": row[3],
            "notes": row[4],
            "email": row[5],
        }

    def roles_for_member(self, cur, member_id):
        return []

    def list(self):
        '''
        GET /members
        '''
        db = get_db()
        cur = db.cursor()
        query = '''
        select id, first_name, last_name, active,
               notes, email, created, updated
        from members
        '''
        cur.execute(query)

        def add_roles(member_obj):
            cur.execute('select role from members_roles where member = %s', (
                member_obj['id'],))
            member_obj['roles'] = list(cur.fetchall())
            return member_obj

        members = [add_roles(self.from_row(row)) for row in cur.fetchall()]

        db.commit()
        cur.close()

        return { 'error': None, 'data': members }, 200

    def fetch(self, member_id):
        '''
        GET /members/<member_id>
        '''
        db = get_db()
        cur = db.cursor()
        query = '''
        select id, first_name, last_name, active,
               notes, email, created, updated
        from members where id = %s
        '''
        cur.execute(query, (member_id,))
        row = cur.fetchone()

        cur.execute('select role from members_roles where member = %s', (member_id,))
        roles = list(cur.fetchall())

        db.commit()
        cur.close()

        if row:
            member_obj = self.from_row(row)
            member_obj['roles'] = roles
            return { 'error': None, 'data': member_obj }, 200
        else:
            return { 'error': 'No member found with given ID' }, 404

    def get(self, member_id=None):
        '''
        Dispatch our two varieties of GET request

        :param member_id: Numeric ID of the member in our database
        :return: either the results of fetch or list
        '''
        if member_id:
            return self.fetch(member_id)
        else:
            return self.list()

    def post(self):
        '''
        POST /members
        '''
        body = request.get_json()

        required_keys = [ 'first_name', 'last_name' ]
        missing_keys = filter(lambda rk: rk not in body,
                              required_keys)
        if len(missing_keys):
            return { 'error': 'Missing keys', 'keys': missing_keys }, 400

        first_name = body['first_name']
        last_name = body['last_name']
        email = body.get('email', None)
        active = body.get('active', False)
        notes = body.get('notes', None)
        roles = body.get('roles', None)

        query = '''
        insert into members (first_name, last_name, active, email, notes)
        values (%s, %s, %s, %s, %s)
        '''

        db = get_db()
        cur = db.cursor()

        try:
            cur.execute(query, (first_name, last_name, active, email, notes))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        # Now deal with roles

        db.commit()
        cur.close()
        return { 'error': None }, 201

    def put(self, member_id=None):
        '''
        PUT /members/<member_id>

        The top level docstring for this class enumerates the required fields
        for a PUT request.

        :param member_id: Numeric ID of the member in our database
        '''
        if not member_id:
            return { 'error': 'No member ID specified' }, 400

        body = request.get_json()
        required_keys = [ 'first_name', 'last_name', 'active',
                          'email', 'notes', 'roles' ]
        missing_keys = filter(lambda rk: rk not in body, required_keys)
        if len(missing_keys):
            return {
                'error': 'Missing fields',
                'fields': missing_keys
            }, 400

        query = '''
        update members set first_name = %s and last_name = %s
        and active = %s and email = %s updated = now()
        where id = %s
        '''
        db = get_db()
        cur = db.cursor()

        cur.execute(
            'select exists (select 1 from members where id = %s)',
            (member_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid member ID' }, 400

        try:
            cur.execute(query, (
                body['first_name'],
                body['last_name'],
                body['active'],
                body['email'],
                member_id))
        except Exception, e:
            cur.close()
            return { 'error': str(e) }, 500

        # TODO update roles as well
        roles = body.get('roles', None)
        if roles is not None:
            cur.execute('delete from members_roles where member = %s',
                        (member_id,))
            for role in roles:
                q = '''
                insert into members_roles (member, role)
                values (%s, %s)
                '''
                cur.execute(q, (member_id, role))

        db.commit()
        cur.close()

        return { 'error': None }, 204

    def patch(self, member_id=None):
        '''
        PATCH /members/<member_id>

        Updates whichever member fields are sent in the payload.

        :param member_id: Numeric ID of the member from the database.
        '''
        if not member_id:
            return { 'error': 'No member ID specified' }, 400

        body = request.get_json()
        roles = body.pop('roles', None)

        query_tmpl = '''
        update members set ({}) = %s where id = %s
        '''
        query = query_tmpl.format(', '.join(body.keys()),)
        params = (tuple(body.values()),member_id)

        db = get_db()
        cur = db.cursor()

        if roles is not None:
            cur.execute('delete from members_roles where member = %s',
                        (member_id,))
            for role in roles:
                q = '''
                insert into members_roles (member, role)
                values (%s, %s)
                '''
                cur.execute(q, (member_id, role))

        # we popped `roles` out of `body` so if nothing else remains we're
        # square.
        if len(body.keys()) == 0:
            db.commit()
            cur.close()
            return { 'error': None }, 204

        cur.execute(
            'select exists (select 1 from members where id = %s)',
            (member_id,))
        exists = cur.fetchone()[0]
        if not exists:
            cur.close()
            db.commit()
            return { 'error': 'Invalid member ID' }, 400

        try:
            cur.execute(query, params)
        except Exception, e:
            cur.close()
            return { 'error': str(e) }, 500


        db.commit()
        cur.close()
        return { 'error': None }, 204

    def delete(self, member_id=None):
        '''
        DELETE /members/<member_id>

        :param member_id: Numeric ID of the member from the database.
        '''
        if not member_id:
            return { 'error': 'No member ID specified' }, 400

        db = get_db()
        cur = db.cursor()
        cur.execute('select exists (select 1 from members where id = %s', (
            member_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid member ID' }, 400

        cur.execute('delete from members_roles where member = %s', (member_id,))
        cur.execute('delete from members where id = %s', (member_id,))
        db.commit()
        cur.close()
        return { 'error': None }, 204
