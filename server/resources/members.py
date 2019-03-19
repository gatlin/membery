from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db
import psycopg2
import json
from auth import requires_auth, requires_scope, create_auth0_user

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
        "roles": [<id:role ID>]
    }

    Creating a member requires only:
    - first_name
    - last_name

    Everything but the timestamps is expected in a PUT request.
    '''

    method_decorators = [ requires_auth() ]

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
        db.commit()

        members = [self.from_row(row) for row in cur.fetchall()]

        q = '''
        select role from members_roles where member = %s
        '''
        for member in members:
            cur.execute(q, (member['id'],))
            member['roles'] = [ row[0] for row in cur.fetchall() ]
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

        db.commit()

        if row:
            member_obj = self.from_row(row)
            cur.execute('select role from members_roles where member = %s', (
                member_id,
            ))
            member_obj['roles'] = [row[0] for row in cur.fetchall()]
            db.commit()
            cur.close()
            return { 'error': None, 'data': member_obj }, 200
        else:
            cur.close()
            return { 'error': 'No member found with given ID' }, 404

    def get(self, member_id=None, payload=None):
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

        required_keys = [ 'first_name', 'last_name', 'email' ]
        missing_keys = filter(lambda rk: rk not in body,
                              required_keys)
        if len(missing_keys):
            return { 'error': 'Missing keys', 'keys': missing_keys }, 400

        first_name = body['first_name']
        last_name = body['last_name']
        email = body['email']
        active = body.get('active', False)
        notes = body.get('notes', None)

        # first create an auth0 user
        try:
            create_auth0_user(email)
        except Exception, e:
            return { 'error': str(e) }, 500

        query = '''
        insert into members (first_name, last_name, active, email, notes)
        values (%s, %s, %s, %s, %s) returning id
        '''

        db = get_db()
        cur = db.cursor()

        try:
            cur.execute(query, (first_name, last_name, active, email, notes))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        body['id'] = cur.fetchone()[0]
        body['active'] = active

        db.commit()
        cur.close()
        return { 'error': None, 'data': body }, 201

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
                          'email', 'notes' ]
        missing_keys = filter(lambda rk: rk not in body, required_keys)
        if len(missing_keys):
            return {
                'error': 'Missing fields',
                'fields': missing_keys
            }, 400

        member_roles = body.get('roles', [])

        query = '''
        update members set first_name = %s, last_name = %s,
        active = %s, email = %s, notes = %s, updated = now()
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
                body['notes'],
                member_id))
        except Exception, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()

        # Now update those roles
        role_update_err = self.update_roles(member_id,member_roles, db, cur)
        if role_update_err:
            return { 'error': str(role_update_err) }, 500

        cur.close()

        return { 'error': None }, 204

    def update_roles(self, member_id, roles, db, cur):
        role_rm_q = '''
        delete from members_roles where member = %s
        '''
        try:
            cur.execute(role_rm_q, (member_id,))
        except psycopg2.IntegrityError, e:
            return e

        db.commit()

        role_q = '''
        insert into members_roles (member, role) values (%s, %s)
        '''
        for role in roles:
            try:
                cur.execute(role_q, (member_id, role))
            except psycopg2.IntegrityError, e:
                cur.close()
                return e

            # Success
            db.commit()

        return None

    def patch(self, member_id=None):
        '''
        PATCH /members/<member_id>

        Updates whichever member fields are sent in the payload.

        :param member_id: Numeric ID of the member from the database.
        '''

        if not member_id:
            return { 'error': 'No member ID specified' }, 400

        body = request.get_json()

        member_roles = body.get('roles', None)
        body.pop('roles')

        query_tmpl = '''
        update members set ({}) = %s where id = %s
        '''
        query = query_tmpl.format(', '.join(body.keys()),)
        params = (tuple(body.values()),member_id)

        db = get_db()
        cur = db.cursor()

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

        # Now update roles
        role_update_err = self.update_roles(member_id, member_roles, db, cur)
        if role_update_err:
            return { 'error': str(role_update_err) }, 500

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
        cur.execute('select exists (select 1 from members where id = %s)', (
            member_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid member ID' }, 400

        # Delete its roles
        cur.execute('delete from members_roles where member = %s', (member_id,))
        db.commit()

        cur.execute('delete from members where id = %s', (member_id,))
        db.commit()
        cur.close()

        return { 'error': None }, 204
