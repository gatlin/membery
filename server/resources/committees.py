from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db

class Committees(Resource):
    '''
    Endpoint for manipulating committees

    A committee is this, conceptually:

    {
        "id": <int>,
        "name": <string>
    }

    `name` is a required field for POST / PUT. Technically it's not required for
    PATCH but that would be extremely pointless.
    '''

    def list(self):
        '''
        GET /committees
        '''
        db = get_db()
        cur = db.cursor()
        cur.execute('select id, name from committees')
        committees = [{ 'id': row[0], 'name': row[1] } for row in cur.fetchall()]
        db.commit()
        cur.close()
        return { "error": None, "data": committees }, 200

    def fetch(self, committee_id):
        '''
        GET /committees/<committee_id>

        :param committee_id: Numeric ID of the committee in the database
        '''
        db = get_db()
        cur = db.cursor()
        cur.execute('select id, name from committees where id = %s', (int(committee_id),))
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
            return { 'error': 'Committee not found' }, 404

    def get(self, committee_id=None):
        '''
        Dispatch to either fetch or list.

        :param committee_id: Numeric ID of the committee in the database.
        '''
        if not committee_id:
            return self.list()
        else:
            return self.fetch(committee_id)

    def post(self):
        '''
        POST /committees
        '''
        body = request.get_json()
        if 'name' not in body:
            return { 'error': 'Committee exists with specified name' }, 400

        committee_name = body['name']

        db = get_db()
        cur = db.cursor()
        try:
            cur.execute('insert into committees (name) values (%s)', (committee_name,))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        db.commit()
        cur.close()

        return { 'error': None }, 201

    def put(self, committee_id=None):
        '''
        PUT /committees/<committee_id>

        :param committee_id: Numeric ID of the committee in the database.
        '''
        if not committee_id:
            return { 'error': 'No committee ID specified' }, 400

        body = request.get_json()
        if 'name' not in body:
            return { 'error': 'You must specify a name for the committee'} , 400

        committee_name = body['name']

        db = get_db()
        cur = db.cursor()
        cur.execute('update committees set name = %s where id = %s', (
            committee_name,
            committee_id))
        db.commit()
        cur.close()
        return { 'error': None }, 204

    def patch(self, committee_id=None):
        '''
        PUT /committees/<committee_id>

        :param committee_id: Numeric ID of the committee in the database.
        '''
        if not committee_id:
            return { 'error': 'No committee ID specified' }, 400

        body = request.json()
        if 'name' in body:
            return self.put(committee_id=committee_id)
        else:
            return { 'error': None }, 204

    def delete(self, committee_id=None):
        '''
        DELETE /committees/<committee_id>

        :param committee_id: Numeric ID of the committee in the database.
        '''
        if not committee_id:
            return { 'error': 'No committee ID specified' }, 400

        db = get_db()
        cur = db.cursor()
        cur.execute ('select exists (select 1 from committees where id = %s)', (
            committee_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid committee ID' }, 400

        cur.execute('delete from meetings where committee = %s', (committee_id,))
        cur.execute('delete from committees where id = %s', (committee_id,))
        db.commit()
        cur.close()
        return { 'error': None }, 204
