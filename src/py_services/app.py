from flask import Flask
from flask_cors import CORS
from mock_api import api

app = Flask(__name__)
CORS(app)
app.register_blueprint(api)

if __name__ == '__main__':
    port = 5000
    app.run(port=port, debug=True)
