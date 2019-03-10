import os

def read_config(key, default=None):
    '''
    Maybe this will be more sophisticated in the future?
    '''
    return os.environ.get(key, default)
