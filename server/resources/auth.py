from functools import wraps
from flask import request, _request_ctx_stack
from six.moves.urllib.request import urlopen
import json
from jose import jwt
import random
import string
import requests
from datetime import datetime, timedelta

from config import read_config

# /server.py

class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

AUTH0_DOMAIN = read_config('AUTH0_DOMAIN')
AUTH_URL = 'https://%s/' % (AUTH0_DOMAIN,)
AUTH0_CONNECTION = read_config('AUTH0_CONNECTION')
API_AUDIENCE = read_config('API_AUDIENCE')
ADMIN_CLIENT = read_config('AUTH0_ADMIN_CLIENT')
ADMIN_SECRET = read_config('AUTH0_ADMIN_SECRET')
ALGORITHMS = ["RS256"]

def requires_scope(required_scope):
    """Determines if the required scope is present in the access token
    Args:
        required_scope (str): The scope required to access the resource
    """
    #token = get_token_auth_header()
    #unverified_claims = jwt.get_unverified_claims(token)
    auth = _request_ctx_stack.top.current_user
    if auth.get('scope'):
        token_scopes = auth['scope'].split()
        for token_scope in token_scopes:
            if token_scope == required_scope:
                return True
    return False

def get_token_auth_header():
    """Obtains the Access Token from the Authorization Header
    """
    auth = request.headers.get("Authorization", None)
    if not auth:
        auth = request.headers.get('authorization', None)

    if not auth:
        raise AuthError({"code": "authorization_header_missing",
                        "description":
                            "Authorization header is expected"}, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must start with"
                            " Bearer"}, 401)
    elif len(parts) == 1:
        raise AuthError({"code": "invalid_header",
                        "description": "Token not found"}, 401)
    elif len(parts) > 2:
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must be"
                            " Bearer token"}, 401)

    token = parts[1]
    return token

def requires_auth():
    '''
    Decorates Resources with an authorization check.
    :param scopes: Optional list of scopes which are being checked for.
    :return: An authentication decorator which will allow or deny the request
    based on the requested scopes.
    '''
    def decorator(f):
        """Determines if the Access Token is valid
        """
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                token = get_token_auth_header()
            except AuthError, e:
                return { 'error': e.error }, e.status_code

            jsonurl = urlopen("https://"+AUTH0_DOMAIN+"/.well-known/jwks.json")
            jwks = json.loads(jsonurl.read())
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
            if rsa_key:
                try:
                    payload = jwt.decode(
                        token,
                        rsa_key,
                        algorithms=ALGORITHMS,
                        audience=API_AUDIENCE,
                        issuer="https://"+AUTH0_DOMAIN+"/"
                    )
                except jwt.ExpiredSignatureError:
                    raise AuthError({"code": "token_expired",
                                     "description": "token is expired"}, 401)
                except jwt.JWTClaimsError:
                    raise AuthError({"code": "invalid_claims",
                                     "description":
                                     "incorrect claims,"
                                     "please check the audience and issuer"}, 401)
                except Exception:
                    raise AuthError({"code": "invalid_header",
                                     "description":
                                     "Unable to parse authentication"
                                     " token."}, 401)

                _request_ctx_stack.top.current_user = payload
                return f(*args, **kwargs)
            raise AuthError({"code": "invalid_header",
                             "description": "Unable to find appropriate key"}, 401)
        return decorated
    return decorator

PASSWORD_CHARS = string.ascii_letters + string.digits
current_token = {}

def get_auth0_token():
    '''
    :return: The current auth token
    '''
    if not current_token or datetime.now() > current_token['expiry']:
        current_token.update(generate_auth0_token())
    return current_token['token']

def generate_auth0_token():
    '''
    :return: A dictionary containing an auth0 access token and metadata.
    '''
    payload = {'grant_type': "client_credentials",
               'client_id': ADMIN_CLIENT,
               'client_secret': ADMIN_SECRET,
               'audience': AUTH_URL  + 'api/v2/'}
    response = requests.post(AUTH_URL + 'oauth/token', json=payload).json()
    return {'token': response['access_token'],
            'expiry': datetime.now() + timedelta(seconds=response['expires_in'])}

def create_auth0_user(email):
    '''
    Creates a user in our Auth0 database. A member should only be created in our
    system if it is successfully created in Auth0 first.
    '''

    payload = {
        'connection': AUTH0_CONNECTION,
        'email': email,
        'password': ''.join(
            random.SystemRandom().choice(PASSWORD_CHARS) for _ in range(12)),
        'user_metadata': {},
        'email_verified': False,
        'verify_email': False
    }
    headers = {'Authorization': 'Bearer ' + get_auth0_token()}
    r = requests.post(AUTH_URL + 'api/v2/users', json=payload, headers=headers)

    if r.status_code > 299:
        #logger.warning('Failed to create user: {}'.format(r.content))

        try:
            error_response = loads(r.content)
            if error_response['code'] == 'user_exists':
                return None
        except Exception:
            pass

        msg = 'Failed to create user. ' \
              'Received status={} content={}'.format(r.status_code, r.content)
        raise Exception(msg)

    user_id = r.json()['user_id']
    return True
