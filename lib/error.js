function getPropErrorMessage(prop, pathName, collectionName) {
  if (prop.kind === 'unique') {
    return `Já existe registro com '${pathName}' igual à '${prop.value}'`;
  } else if (prop.kind === 'required') {
    return `'${pathName}' é obrigatório`;
  }
  return prop.message;
}

function resolveErrors(req, err) {
  const messages = [];
  let collectionName = err._message.replace(' validation failed', '');
  let business = null;
  /* eslint-disable */
  business = req.business[collectionName] || {};
  /* eslint-enable */

  collectionName = business.name || collectionName;
  business.properties = business.properties || {};

  for (const key in err.errors) {
    const prop = err.errors[key];
    const pathName = business.properties[prop.path] || prop.path;

    messages.push(getPropErrorMessage(prop, pathName, collectionName));
  }

  return messages;
}

module.exports = { resolveErrors };
