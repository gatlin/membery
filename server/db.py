from flask import g
import psycopg2
from config import read_config

def get_db():
    '''
    Return (and create, if necessary) a global database handle.
    '''
    if 'db' not in g:
        g.db = psycopg2.connect(
            dbname=read_config('POSTGRES_DB'),
            user=read_config('POSTGRES_USER'),
            password=read_config('POSTGRES_PASSWORD'),
            host=read_config('POSTGRES_HOST'))
    return g.db
