const BaseComponent = require('@kumori/component').BaseComponent;
const http = require('@kumori/http-message');
const express = require('express');
const path = require('path');

class Component extends BaseComponent {

  constructor
    (runtime
    ,role
    ,iid
    ,incnum
    ,localData
    ,resources
    ,parameters
    ,dependencies
    ,offerings
    ) {
      super(runtime, role, iid, incnum, localData, resources, parameters, dependencies, offerings);
      this.httpChannel = offerings.endpoint;
  }

  run () {
    super.run();
    let app = express();
    app.use(express.static(path.join(__dirname, '..', 'static')));
    const server = http.createServer(app);
    server.listen(this.httpChannel);
  }
}
module.exports = Component;
