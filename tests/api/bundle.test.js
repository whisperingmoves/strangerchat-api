const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe } = require("mocha");
const app = require("../../app");

chai.use(chaiHttp);
chai.should();

describe("Bundle API", () => {
  let url = "test.bundle";

  describe("POST /bundles/publish", () => {
    it("should publish a bundle and return bundleId", (done) => {
      chai
        .request(app)
        .post("/bundles/publish")
        .send({
          url,
          version: "1.0.0",
        })
        .then((res) => {
          res.should.have.status(200);

          res.body.should.have.property("bundleId");
          res.body.bundleId.should.be.a("string");

          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("POST /bundles/{bundleId}/online", () => {
    it("should bring a bundle online", (done) => {
      chai
        .request(app)
        .post("/bundles/publish")
        .send({
          url,
          version: "1.0.0",
        })
        .then((res) => {
          res.should.have.status(200);

          res.body.should.have.property("bundleId");
          res.body.bundleId.should.be.a("string");

          const bundleId = res.body.bundleId;

          chai
            .request(app)
            .post(`/bundles/${bundleId}/online`)
            .then((res) => {
              res.should.have.status(200);
              done();
            })
            .catch((err) => {
              done(err);
            });
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  describe("GET /bundles/refresh", () => {
    it("should return the URL of the latest online bundle", (done) => {
      chai
        .request(app)
        .get("/bundles/refresh")
        .then((res) => {
          res.should.have.status(200);

          res.body.should.have.property("url");
          res.body.url.should.be.a("string");

          res.body.url.should.be.equal(url);

          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});
