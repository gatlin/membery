from functools import wraps
from flask import request, _app_ctx_stack
import urllib
import json
from jose import jwt

from config import read_config

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_required = int(read_config('AUTH_REQUIRED'))
        if auth_required == 0:
            return f(*args, **kwargs)

        auth = request.headers.get('Authorization', None)
        if not auth:
            return { 'error': 'Authorization header missing' }, 401

        parts = auth.split()

        if parts[0].lower() != 'bearer':
            return {
                'error': 'Authorization header must start with Bearer'
            }, 401

        elif len(parts) == 1:
            return {
                'error': 'Authorization bearer token not found'
            }, 401

        elif len(parts) > 2:
            return {
                'error': 'Authorization header must be "Bearer <token>"'
            }, 401


        token = parts[1]

        AUTH0_DOMAIN = read_config('AUTH0_DOMAIN')
        API_AUDIENCE = read_config('API_AUDIENCE')

        jsonurl = urllib.urlopen('https://'+AUTH0_DOMAIN+'/.well-known/jwks.json')
        jwks = json.loads(jsonurl.read())
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }

        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=unverified_header['alg'],
                    audience=API_AUDIENCE,
                    issuer='https://'+AUTH0_DOMAIN+'/'
                )
            except jwt.ExpiredSignatureError:
                return { 'error': 'Token expired' }, 401

            except jwt.JWTClaimsError:
                return { 'error': 'Invalid claims' }, 401

            except Exception:
                return { 'error': 'Invalid header' }, 400

            _app_ctx_stack.top.current_user = payload
            return f(*args, **kwargs)

        return { 'error': 'Unable to find appropriate key' }, 400

    return decorated
