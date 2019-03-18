from flask import request
from flask_restful import reqparse, abort, Resource
from db import get_db
from datetime import datetime
from auth import requires_auth, requires_scope

def from_row(row):
    return {
        'id': row[0],
        'committee': row[1],
        'name': row[2],
        'start_time': row[3].strftime('%Y-%m-%dT%H:%M:%SZ'),
        'end_time': row[4].strftime('%Y-%m-%dT%H:%M:%SZ')
    }

class Meetings(Resource):
    '''
    Endpoint for manipulating meetings

    A meeting is this, conceptually:

    {
        "id": <int>,
        "committee": <int>,
        "name": <string>,
        "start_time": <timestamp>,
        "end_time": <timestamp>
    }

    '''

    method_decorators = [ requires_auth() ]

    def list(self):
        '''
        GET /meetings
        '''
        db = get_db()
        cur = db.cursor()

        cur.execute('select id, committee, name, start_time, end_time from meetings')
        meetings = [from_row(row) for row in cur.fetchall()]
        db.commit()
        cur.close()
        return { "error": None, "data": meetings }, 200

    def fetch(self, meeting_id):
        '''
        GET /meetings/<meeting_id>

        :param meeting_id: Numeric ID of the meeting in the database
        '''
        db = get_db()
        cur = db.cursor()
        cur.execute('select id, committee, name, start_time, end_time from meetings where id = %s', (int(meeting_id),))
        row = cur.fetchone()

        db.commit()
        cur.close()

        if row:
            return {
                "error": None,
                "data": from_row(row)
            }, 200
        else:
            return { 'error': 'Meeting not found' }, 404

    def get(self, meeting_id=None):
        '''
        Dispatch to either fetch or list.

        :param meeting_id: Numeric ID of the meeting in the database.
        '''
        if not meeting_id:
            return self.list()
        else:
            return self.fetch(meeting_id)

    def post(self):
        '''
        POST /meetings
        '''
        body = request.get_json()

        required_keys = [ 'committee', 'name', 'start_time', 'end_time' ]
        missing_keys = filter(lambda rk: rk not in body, required_keys)

        if len(missing_keys):
            return {
                'error': 'Missing required fields',
                'fields': missing_keys
            }, 400

        db = get_db()
        cur = db.cursor()
        try:
            q = '''
            insert into meetings (committee, name, start_time, end_time)
            values (%s, %s, %s, %s) returning id
            '''
            cur.execute(q, (
                body['committee'],
                body['name'],
                body['start_time'],
                body['end_time'],))
        except psycopg2.IntegrityError, e:
            cur.close()
            return { 'error': str(e) }, 500

        body['id'] = cur.fetchone()[0]

        db.commit()
        cur.close()

        return { 'error': None, 'data': body }, 201

    def put(self, meeting_id=None):
        '''
        PUT /meetings/<meeting_id>

        :param meeting_id: Numeric ID of the meeting in the database.
        '''
        if not meeting_id:
            return { 'error': 'No meeting ID specified' }, 400

        body = request.get_json()

        required_keys = [ 'committee', 'name', 'start_time', 'end_time' ]
        missing_keys = filter(lambda rk: rk not in body, required_keys)

        if len(missing_keys):
            return {
                'error': 'Missing required fields',
                'fields': missing_keys
            }, 400

        db = get_db()
        cur = db.cursor()
        q = '''
        update meetings
        set committee = %s,
            name = %s,
            start_time = %s,
            end_time = %s
        where id = %s
        '''
        cur.execute(q, (
            body['committee'],
            body['name'],
            body['start_time'],
            body['end_time'],
            int(meeting_id)
        ))

        db.commit()
        cur.close()
        return { 'error': None }, 204

    def patch(self, meeting_id=None):
        '''
        PUT /meetings/<meeting_id>

        :param meeting_id: Numeric ID of the meeting in the database.
        '''
        if not meeting_id:
            return { 'error': 'No meeting ID specified' }, 400

        body = request.json()

        query_tmpl = '''
        update meetings set ({}) = %s where id = %s
        '''
        query = query_tmpl.format(', '.join(body.keys()),)
        params = (tuple(body.values()), meeting_id)

        db = get_db()
        cur = db.cursor()

        cur.execute('select exists (select 1 from meetings where id = %s)',
                    (meeting_id,))
        db.commit()
        exists = cur.fetchone()[0]
        if not exists:
            cur.close()
            return { 'error': 'Invalid meeting ID' }, 400

        try:
            cur.execute(query, params)
        except Exception, e:
            cur.close()
            db.commit()
            return { 'error': str(e) }, 500

        db.commit()
        cur.close()
        return { 'error': None }, 204

    def delete(self, meeting_id=None):
        '''
        DELETE /meetings/<meeting_id>

        :param meeting_id: Numeric ID of the meeting in the database.
        '''
        if not meeting_id:
            return { 'error': 'No meeting ID specified' }, 400

        db = get_db()
        cur = db.cursor()
        cur.execute ('select exists (select 1 from meetings where id = %s)', (
            meeting_id,))
        exists = cur.fetchone()[0]
        if not exists:
            return { 'error': 'Invalid meeting ID' }, 400

        cur.execute('delete from meetings where id = %s', (meeting_id,))
        db.commit()
        cur.close()
        return { 'error': None }, 204
