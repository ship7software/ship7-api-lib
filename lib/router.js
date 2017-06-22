const Router = require('express').Router;

module.exports.rest = (controller, preIdRouterFuncion) => {
  let router = new Router();

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
};
