const elasticApi = require('elastic-email');
const fs = require('fs');
const mustache = require('mustache');

module.exports = {
  send: (from, to, subject, content, data, config) => {
    const client = elasticApi.createClient(config.mail.elastic);

    const template = content.toString();
    const html = mustache.render(template, data);

    const mailOptions = {
      from,
      msgTo: to,
      subject,
      bodyHtml: html
    };

    client.email.send(mailOptions, err => console.log(err));
  }
};
