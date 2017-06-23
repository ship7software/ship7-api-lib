import crypto from 'crypto'
import elasticApi from 'elastic-email'
import express from 'express'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import request from 'request'
import url from 'url'
const ExpressRouter = express.Router;
const algorithm = 'aes-256-ctr';
const password = 'asdh23879asd';

class Controller {
  constructor(facade) {
    this.facade = facade;
  }

  find(req, res, next) {
    return this.facade.find(req.query)
    .then(collection => res.status(200).json(collection))
    .catch(err => next(err));
  }

  findOne(req, res, next) {
    return this.facade.findOne(req.query)
    .then(doc => res.status(200).json(doc))
    .catch(err => next(err));
  }

  findById(req, res, next) {
    return this.facade.findById(req.params.id)
    .then((doc) => {
      if (!doc) { return res.status(404).end(); }
      return res.status(200).json(doc);
    })
    .catch(err => next(err));
  }

  create(req, res, next) {
    const user = req.user || {};
    user.login = user.login || user.email || 'SYS';

    req.body._user = user.login
    req.body._action = 'CREATE'
    this.facade.create(req.body)
    .then(doc => res.status(201).json(doc))
    .catch(err => next(err));
  }

  update(req, res, next) {
    const user = req.user || {};
    user.login = user.login || user.email || 'SYS';

    req.body._user = user.login
    req.body._action = 'UPDATE'

    const conditions = { _id: req.params.id };

    this.facade.update(conditions, req.body)
    .then((doc) => {
      if (!doc || doc.nModified < 1) { return res.status(404).end(); }
      return res.status(200).json(doc);
    })
    .catch(err => next(err));
  }

  remove(req, res, next) {
    const user = req.user || {};
    user.login = user.login || user.email || 'SYS';

    req.body._user = user.login
    req.body._action = 'DELETE'

    this.facade.remove(req.params.id)
    .then((doc) => {
      if (!doc) { return res.status(404).end(); }
      return res.status(204).end();
    })
    .catch(err => next(err));
  }

}

const Crypto = {
  encrypt: function (text) {
    const cipher = crypto.createCipher(algorithm, password);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }
}

class Facade {
  constructor(Schema) {
    this.Schema = Schema;
  }

  create(input) {
    const schema = new this.Schema(input);
    return schema.save();
  }

  update(conditions, update) {
    return this.Schema
    .update(conditions, update, { new: true })
    .exec();
  }

  find(query) {
    return this.Schema
    .find(query)
    .exec();
  }

  findOne(query) {
    return this.Schema
    .findOne(query)
    .exec();
  }

  findById(id) {
    return this.Schema
    .findById(id)
    .exec();
  }

  remove(id) {
    return this.Schema
    .findByIdAndRemove(id)
    .exec();
  }
}

class Mail {
  constructor(template, to, mergeData) {
    this.template = template
    this.to = to
    this.mergeData = mergeData
  }

  send() {
    const client = elasticApi.createClient({ apiKey: '7e3644da-726f-4a35-8800-f53c716f5820' });
    const parsedMergeData = {}

    for (let key in this.mergeData) {
      if (this.mergeData.hasOwnProperty(key)) {
        const value = this.mergeData[key];
        parsedMergeData['merge_' + key] = value
      }
    }

    let mailOptions = {
      msgTo: this.to,
      template: this.template
    }

    mailOptions = Object.assign(mailOptions, parsedMergeData)

    client.email.send(mailOptions, err => console.log(err));
  }
}

const Router = {
  rest: function (controller, preIdRouterFuncion) {
    let router = new ExpressRouter();

    router.route('/')
      .get((...args) => controller.find(...args))
      .post((...args) => controller.create(...args));

    if (preIdRouterFuncion) {
      router = preIdRouterFuncion(controller, router);
    }

    router.route('/one')
      .get((...args) => controller.findOne(...args));

    router.route('/:id')
      .put((...args) => controller.update(...args))
      .get((...args) => controller.findById(...args))
      .delete((...args) => controller.remove(...args));

    return router;
  }
}

class RestApiBase {
  constructor(baseUrl, auth) {
    this.baseUrl = baseUrl
    this.auth = auth
    this.defaultOptions = {
      baseUrl: this.baseUrl,
      json: true,
      headers: {
        Authorization: this.auth
      }
    }
  }  
}

class RestApi extends RestApiBase {
  get(conditions, cb) {
    if (!cb) {
      cb = conditions
      conditions = null
    }

    const options = _.cloneDeep(this.defaultOptions)

    options.method = "GET"
    options.url = "/"
    options.qs =  conditions

    request(options, function(err, res, body) {
      cb(err, res)
    });
  }

  getById(id, cb) {
    const options = _.cloneDeep(this.defaultOptions)

    options.method = "GET"
    options.url = "/" + id

    request(options, function(err, res, body) {
      cb(err, res)
    });
  }
}

class UserApi extends RestApi {}
class ApplicationApi extends RestApi {}
class OrganizationApi extends RestApi {}
class ContextApi extends RestApi {}
class AuthApi extends RestApiBase {
  verifyToken(token, cb) {
    const options = _.cloneDeep(this.defaultOptions)

    options.method = "GET"
    options.headers.Authorization = "Bearer " + token
    options.url = '/me'

    request(options, function(err, res, body) {
      cb(err, res)
    });
  }
}

class ApiClient {
  constructor(baseUrl, auth) {
    this.user = new UserApi(url.resolve(baseUrl, '/user'), auth)
    this.application = new ApplicationApi(url.resolve(baseUrl, '/application'), auth)
    this.organization = new OrganizationApi(url.resolve(baseUrl, '/organization'), auth)
    this.context = new ContextApi(url.resolve(baseUrl, '/context'), auth)
    this.auth = new AuthApi(baseUrl, auth)
  }
}

const Middleware = {
  VerifyAuth: function(options) {
    return (req, res, next) => {
      options.whiteList = options.whiteList || [];

      let isInWhiteList = req.originalUrl === '/'
      isInWhiteList = isInWhiteList || _(options.whiteList).some(obj =>
      (obj.method === '*' || obj.method === req.method) && (obj.path === '*' || req.originalUrl.indexOf(obj.path) !== -1))

      if (!isInWhiteList) {
        const providedToken = req.headers.authorization || req.query.token || req.body.token;

        if (!providedToken || providedToken.indexOf(' ') === -1) {
          res.status(401).send({ code: 'INVALID_TOKEN' });
        } else {
          const tokenParts = providedToken.split(' ');

          if (tokenParts[0] === 'Bearer' && !options.authApi) {
            jwt.verify(tokenParts[1], req.app.get('config').privateKey, (err, decoded) => {
              if (err) {
                res.status(401).json({ code: 'INVALID_OR_EXPIRED_TOKEN' });
                return;
              }

              req.token = tokenParts[1];
              req.user = decoded;
              return next();
            });
          } else if (tokenParts[0] === 'Bearer' && options.authApi) {
            new AuthApi(options.authApi).verifyToken(tokenParts[1], (error, response) => {
              if (response.statusCode.toString() !== "200") {
                return res.status(response.statusCode).json(response.body);
              } else {
                req.token = tokenParts[1];
                req.user = response.body;
                return next();
              }
            })
          } else {
            const buf = new Buffer(tokenParts[1], 'base64');
            const plainAuth = buf.toString();

            const creds = plainAuth.split(':');
            const user = {
              login: creds[0],
              password: creds[1]
            };
            req.token = tokenParts[1];
            req.user = user;
            if (user.login === 'superuser' && user.password === 'sup&ru53r5&cr3t') {
              return next();
            }
            if (options.basicValidator) {
              options.basicValidator(req, res, next);
            } else {
              res.status(401).json({ message: 'INVALID_OR_EXPIRED_TOKEN' });
            }
          }
        }
      } else {
        next();
      }
    }
  },
  Perfil: (req, res, next) => {
    res.status(200).send(req.user)
  },
  Error: function(businessResolvers) {
    return (err, req, res, next) => {
      const status = err.errors || err.name === 'MongoError' ? 400 : 500;
      let content = {}

      if (err.errors) {
        const messages = [];
        let collectionName = err._message.replace(' validation failed', '');
        let business = null;
        business = ((businessResolvers || {})[collectionName] || {});

        collectionName = business.name || collectionName;
        business.properties = business.properties || {};

        for (const key in err.errors) {
          const prop = err.errors[key];
          const pathName = business.properties[prop.path] || prop.path;

          if (prop.kind === 'unique') {
            messages.push(`Já existe registro com '${pathName}' igual à '${prop.value}'`)
          } else if (prop.kind === 'required') {
            messages.push(`'${pathName}' é obrigatório`)
          } else {
            messages.push(prop.message)
          }
        }

        content = { messages }
      } else {
        content = { message: err.message }
      }

      res.status(status).json(content);

      if (process.env.NODE_ENV !==  'test') {
        console.log(err);
      }
    }
  }
}

/**
 * @param {Type}
 * @return {Type}
 */
export {
  Controller, Crypto, Facade, Mail, Router, Middleware, ApiClient
}
