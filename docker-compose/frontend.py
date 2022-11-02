from flask import Flask
from flask import request

app = Flask(__name__)

@app.route("/")
def hello():
  id = request.args.get("id")
  return "Mensaje insertado con id: {0}".format(id)
