from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db
from auth import requires_auth, requires_scope

class Permissions(Resource):
    '''
    Endpoint for managing available permissions.
    '''

    method_decorators = [ requires_auth() ]

    def get(self):
        '''
        GET /permissions
        '''

        db = get_db()
        cur = db.cursor()
        cur.execute('select name from permissions');
        permissions = [{ 'name': row[0] } for row in cur.fetchall()]
        db.commit()
        cur.close()
        return { "error": None, "data": permissions }

    def post(self):
        '''
        POST /permissions
        '''

        body = request.get_json()
        if 'name' not in body:
            return { 'error': 'Permissions must have a `name` field.' }

        perm_name = body['name']

        db = get_db()
        cur = db.cursor()
        try:
            cur.execute('insert into permissions (name) values (%s)', (
                perm_name,
            ))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()
        cur.close()

        return { 'error': None, 'data': body }, 201

    def delete(self, perm=None):
        if not perm:
            return { 'error': 'You must specify a permission by name' }, 400

        db = get_db()
        cur = db.cursor()

        cur.execute('delete from roles_perms where permission = %s', (
            perm,
        ))
        db.commit()

        cur.execute('delete from permissions where name = %s', (perm,))
        db.commit()
        cur.close()

        return { 'error': None }, 204

class Roles(Resource):
    '''
    Endpoint for managing roles (sets of permissions).


    {
        "id": <int>,
        "name": <string>,
        "description": <string>,
        "permissions": [<string:permission name>]
    }

    Only `name` is required for POST/PUT.
    '''

    method_decorators = [ requires_auth() ]

    def get(self, role_id=None):
        if not role_id:
            return self.list()
        else:
            return self.fetch(role_id)

    def list(self):
        db = get_db()
        cur = db.cursor()

        cur.execute('select id, name, description from roles')
        roles = [{
            'id': row[0],
            'name': row[1],
            'description': row[2]
        } for row in cur.fetchall()]
        db.commit()

        # now also fetch permissions
        q = '''
        select permission from roles_perms where role = %s
        '''
        for role in roles:
            cur.execute(q, (role['id'],))
            role['permissions'] = [ row[0] for row in cur.fetchall() ]
            db.commit()

        cur.close()

        return { 'error': None, 'data': roles }, 200

    def fetch(self, role_id):
        db = get_db()
        cur = db.cursor()

        cur.execute('select exists (select 1 from roles where id = %s)', (
            str(role_id),
        ))
        exists = cur.fetchone()[0]
        db.commit()

        if not exists:
            return { 'error': 'Role does not exist.' }, 400

        cur.execute('select id, name, description from roles where id = %s', (
            str(role_id),
        ))

        role_data = cur.fetchone()

        db.commit()

        # Now to get those permissions
        cur.execute('select permission from roles_perms where role = %s', (
            str(role_id),
        ))

        perms = [{ 'name': row[0] } for row in cur.fetchall()]
        db.commit()
        cur.close()

        return {
            'error': None,
            'data': {
                'id': role_data[0],
                'name': role_data[1],
                'description': role_data[2],
                'permissions': perms
            }
        }, 200

    def verify_perms_exist(self, perms, db, cur):
        perm_exists_q = '''
        select exists (select 1 from permissions where name = %s)
        '''
        missing = []
        for perm in perms:
            cur.execute(perm_exists_q, (perm,))
            if not cur.fetchone()[0]:
                missing.append(perm)
            db.commit()

        return missing

    def post(self):
        body = request.get_json()
        if 'name' not in body:
            return { 'error': '`name` field missing from payload.' }, 400

        role_name = body['name']
        role_description = body.get('description', None)
        role_perms = body.get('permissions', [])

        db = get_db()
        cur = db.cursor()

        missing = self.verify_perms_exist(role_perms, db, cur)
        if len(missing):
            return {
                'error': 'Permissions do not exist',
                'permissions': missing
            }, 400

        # All the permissions exist. Create the role.

        role_create_q = '''
        insert into roles (name, description) values (%s, %s) returning id
        '''
        try:
            cur.execute(role_create_q, (role_name, role_description))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        role_id = cur.fetchone()[0]

        db.commit()

        # Now associate it with its permissions
        role_perm_q = '''
        insert into roles_perms (role, permission) values (%s, %s)
        '''
        for perm in role_perms:
            try:
                cur.execute(role_perm_q, (role_id, perm))
            except psycopg2.IntegrityError, e:
                cur.close()
                return { 'error': str(e) }, 500

        body['id'] = role_id
        db.commit()
        cur.close()

        return { 'error': None, 'data': body }, 201

    def put(self, role_id=None):
        if not role_id:
            return { 'error': 'Invalid/missing role_id in URL' }, 400

        body = request.get_json()

        if 'name' not in body:
            return { 'error': 'Role must have a name' }, 400

        role_name = body['name']
        role_description = body.get('description', None)
        role_perms = body.get('permissions', [])

        db = get_db()
        cur = db.cursor()

        # Step 0: Verify permissions exist
        missing = self.verify_perms_exist(role_perms, db, cur)
        if len(missing):
            return {
                'error': 'Permissions do not exist',
                'permissions': missing
            }, 400

        # Step 1: Update name / description
        role_exists_q = 'select exists (select 1 from roles where id = %s)'
        cur.execute(role_exists_q, (role_id,))
        if not cur.fetchone()[0]:
            return { 'error': 'No role with id %d' % (role_id,) }, 400

        role_update_q = '''
        update roles set name = %s, description = %s where id = %s
        '''

        try:
            cur.execute(role_update_q, (role_name, role_description, role_id))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()

        # Step 2: Update the permissions
        update_perms_err = self.update_role_perms(role_id, role_perms, db, cur)
        if update_perms_err:
            return { 'error': str(update_perms_err) }, 500

        cur.close()
        return { 'error': None, 'data': body }, 204

    def update_role_perms(self, role_id, perms, db, cur):
        perm_rm_q = '''
        delete from roles_perms where role = %s
        '''
        try:
            cur.execute(perm_rm_q, (role_id,))
        except psycopg2.IntegrityError, e:
            return e

        db.commit()

        perm_q = '''
        insert into roles_perms (role, permission) values (%s, %s)
        '''
        for perm in perms:
            try:
                cur.execute(perm_q, (role_id, perm))
            except psycopg2.IntegrityError, e:
                cur.close()
                return e

            # Success
            db.commit()

        return None

    def patch(self, role_id=None):
        if not role_id:
            return { 'error': 'Invalid/missing role_id in URL' }, 400

        body = request.get_json()
        role_name = body.get('name', None)
        role_description = body.get('description', None)
        role_perms = body.get('permissions', None)

        db = get_db()
        cur = db.cursor()

        if role_perms:
            missing = self.verify_perms_exist(role_perms, db, cur)
            if len(missing):
                return {
                    'error': 'Permissions do not exist',
                    'permissions': missing
                }, 400

        update_perms_err = self.update_role_perms(role_id, role_perms, db, cur)
        if update_perms_err:
            return { 'error': str(update_perms_err) }, 500

        if role_name:
            try:
                cur.execute('update roles set name = %s where id = %s', (
                    role_name,
                    role_id
                ))
            except psycopg2.IntegrityError, e:
                cur.close()
                return { 'error': str(e) }, 500

            db.commit()

        if role_description:
            try:
                cur.execute('update roles set description = %s where id = %s', (
                    role_name,
                    role_id
                ))
            except psycopg2.IntegrityError, e:
                cur.close()
                return { 'error': str(e) }, 500

            db.commit()

        cur.close()

        return { 'error': None, 'data': body }, 204

    def delete(self, role_id=None):
        if not role_id:
            return { 'error': 'Please specify a role ID' }, 400

        db = get_db()
        cur = db.cursor()

        try:
            cur.execute('delete from roles_perms where role = %s', (role_id,))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()

        try:
            cur.execute('delete from roles where id = %s', (role_id,))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()

        cur.close()

        return { 'error': None }, 204
