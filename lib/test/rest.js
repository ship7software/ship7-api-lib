let chai = require('chai')
let chaiHttp = require('chai-http')
let expect = chai.expect
chai.use(chaiHttp)

module.exports = (server, configuration, auth) => {
  describe(configuration.name, () => {
    let token = null;
    let inserted = null;
    let valid = configuration.create.valid;
    let unique = configuration.create.unique;
    let invalid = configuration.create.invalid;           
    let update = configuration.update;
    let first = null;

    before('Dado que eu estou logado com um usuário válido', (done) => {
      chai.request(server).post('/auth').set('X-Application', 'hair').send(auth).end((err, res) => {
        expect(res.status).eq(200);
        expect(res.body).to.have.property('token');
        token = 'Bearer ' + res.body.token;
        done();
      })
    })
    describe('Listando [/GET]', () => {
      it('Deve receber com sucesso uma lista de itens', (done) => {
        chai.request(server).get(configuration.route).set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(200);
          expect(res.body).a('array').and.length(configuration.totalItems);
          first = res.body[0];
          done();
        });
      });  
      it('Deve retornar 500 quando buscar por id invalido', (done) => {
        chai.request(server).get(configuration.route + '/a').set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(500);
          done();
        });
      });
      it('Deve retornar 404 quando buscar por id valido porem inexistente', (done) => {
        chai.request(server).get(configuration.route + '/' + '5945ecb00000000000000000').set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(404);
          done();
        });
      });
      it('Deve retornar com sucesso o primeiro item pelo id', (done) => {
        chai.request(server).get(configuration.route + '/' + first._id).set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(200);
          done();
        });
      });
      it('Deve retornar com sucesso um item', (done) => {
        chai.request(server).get(configuration.route + '/one?' + configuration.one).set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(200);
          done();
        });
      });
    });
    describe('Inserindo [/POST]', () => {
      it('Deve receber erro 400 por falta de campos obrigatorios', (done) =>{
        chai.request(server).post(configuration.route)
          .set('X-Application', 'hair')
          .send(invalid)
          .set('Authorization', token).end((err, res) => {
            expect(res.status).eq(400);
            done();
        });
      });
      it('Deve receber erro 400 por quebra de unicidade', (done) =>{
        chai.request(server).post(configuration.route)
          .set('X-Application', 'hair')
          .send(unique)
          .set('Authorization', token).end((err, res) => {
            expect(res.status).eq(400);
            done();
        });
      }); 
      it('Deve ser inserido com sucesso', (done) =>{
        chai.request(server).post(configuration.route)
          .set('X-Application', 'hair')
          .send(valid)
          .set('Authorization', token).end((err, res) => {
            expect(res.status).eq(201);
            inserted = res.body;
            done();
        });
      });
    });
    describe('Atualizando [/PUT]', () => { 
      it('Deve retornar 404 quando tentar atualizar por id valido porem inexistente', (done) => {
        chai.request(server).put(configuration.route + '/5945ecb00000000000000000').set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(404);
          done();
        });
      });
      it('Deve ser atualizado com sucesso', (done) => {
        chai.request(server).put(configuration.route + '/' + inserted._id)
          .set('X-Application', 'hair')
          .send(update)
          .set('Authorization', token).end((err, res) => {
            expect(res.status).eq(200);
            expect(res.body.nModified).eq(1);
            done();
        });
      });
    });
    describe('Excluindo contas [/DELETE]', () => {
      it('Deve retornar 404 quando tentar excluir por id valido porem inexistente', (done) => {
        chai.request(server).delete(configuration.route + '/5945ecb00000000000000000').set('X-Application', 'hair').set('Authorization', token).end((err, res) => {
          expect(res.status).eq(404);
          done();
        });
      });
      it('Deve ser removido com sucesso', (done) => {
        chai.request(server).delete(configuration.route + '/' + inserted._id)
          .set('X-Application', 'hair')
          .set('Authorization', token).end((err, res) => {
            expect(res.status).eq(204);
            done();
        });
      });
    });
  });
};