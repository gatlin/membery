FROM tiangolo/uwsgi-nginx-flask:python2.7

RUN mkdir -p /app
COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r ./requirements.txt

COPY ./ /app
WORKDIR /
