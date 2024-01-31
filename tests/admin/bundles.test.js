// Copyright (C) 2024  whisperingmoves(舞动轻语) <whisperingmoves@126.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const chai = require("chai");
const chaiHttp = require("chai-http");
const { it, describe, beforeEach, before } = require("mocha");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const {
  generateRandomUsername,
  generateStrongPassword,
} = require("../../utils/authUtils");
const bcrypt = require("bcrypt");
const AdminUser = require("../../models/AdminUser");
const Bundle = require("../../models/Bundle");
const { expect } = require("chai");

chai.use(chaiHttp);
chai.should();

describe("Bundles Admin API", () => {
  let url = "test.bundle";
  let publishBundleToken;
  let adminToken;

  beforeEach(async () => {
    // 生成发布Bundle专用 JWT Token
    publishBundleToken = jwt.sign(
      { publishBundleKey: config.publishBundleKey },
      config.jwtPublishBundleSecret
    );

    // 生成随机的用户名
    const username = generateRandomUsername();

    // 生成高强度密码
    const password = generateStrongPassword();

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash(password, config.saltRounds);
    const adminUser = new AdminUser({
      username: username,
      password: hashedPassword,
    });
    await adminUser.save();

    // 生成管理员用户登录 JWT Token
    adminToken = jwt.sign({ adminId: adminUser.id }, config.jwtAdminSecret);
  });

  describe("POST /admin/bundles/{bundleId}/online", () => {
    it("should bring a bundle online", (done) => {
      chai
        .request(app)
        .post("/bundles/publish")
        .set("Authorization", `Bearer ${publishBundleToken}`) // 使用 JWT 认证
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
            .post(`/admin/bundles/${bundleId}/online`)
            .set("Authorization", `Bearer ${adminToken}`) // 使用 JWT 认证
            .then((res) => {
              res.should.have.status(200);

              // 尝试未授权访问
              chai
                .request(app)
                .post(`/admin/bundles/${bundleId}/online`)
                .then((res) => {
                  res.should.have.status(401);
                  done();
                })
                .catch((err) => {
                  done(err);
                });
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

  describe("POST /admin/bundles", () => {
    it("should create a new bundle", (done) => {
      const newBundle = {
        url,
        version: "1.0.0",
        online: 1,
      };

      chai
        .request(app)
        .post("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newBundle)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("id");
          done();
        });
    });
  });

  describe("DELETE /admin/bundles", () => {
    let bundleIds;

    before((done) => {
      const newBundle1 = {
        url,
        version: "1.0.0",
        online: 0,
      };

      const newBundle2 = {
        url,
        version: "2.0.0",
        online: 0,
      };

      chai
        .request(app)
        .post("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newBundle1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          const bundleId1 = res.body.id;

          chai
            .request(app)
            .post("/admin/bundles")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newBundle2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              const bundleId2 = res.body.id;

              bundleIds = [bundleId1, bundleId2];
              done();
            });
        });
    });

    it("should delete bundles", (done) => {
      chai
        .request(app)
        .delete("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ ids: bundleIds })
        .end((err, res) => {
          expect(res).to.have.status(204);

          // 验证删除是否成功
          Bundle.find({ _id: { $in: bundleIds } }, (err, bundles) => {
            expect(bundles).to.have.lengthOf(0);
            done();
          });
        });
    });
  });

  describe("GET /admin/bundles", () => {
    before((done) => {
      const newBundle1 = {
        url: "test.bundle1",
        version: "1.0.0",
        online: 1,
      };

      const newBundle2 = {
        url: "test.bundle2",
        version: "2.0.0",
        online: 0,
      };

      chai
        .request(app)
        .post("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newBundle1)
        .end((err, res) => {
          expect(res).to.have.status(201);

          chai
            .request(app)
            .post("/admin/bundles")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newBundle2)
            .end((err, res) => {
              expect(res).to.have.status(201);
              done();
            });
        });
    });

    it("should get a paginated list of bundles", (done) => {
      const page = 1;
      const pageSize = 10;

      chai
        .request(app)
        .get("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page, pageSize })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("page", page);
          expect(res.body).to.have.property("pageSize", pageSize);
          expect(res.body).to.have.property("items").to.be.an("array");
          done();
        });
    });

    it("should filter bundles by keyword", (done) => {
      const keyword = "test.bundle1";

      chai
        .request(app)
        .get("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ keyword })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");
          expect(res.body.items).to.have.lengthOf.above(0);
          expect(res.body.items[0].url).to.equal(keyword);
          done();
        });
    });

    it("should sort bundles by version in ascending order", (done) => {
      const sort = "version";
      const order = "asc";

      chai
        .request(app)
        .get("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ sort, order })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.items).to.be.an("array");

          const sortedItems = res.body.items.slice(0); // Create a copy of the items array
          sortedItems.sort((a, b) => a.version.localeCompare(b.version));

          expect(res.body.items).to.deep.equal(sortedItems);
          done();
        });
    });
  });

  describe("PUT /admin/bundles/:bundleId", () => {
    let bundleId;

    before((done) => {
      // 新增Bundle
      const newBundle = {
        url: "test.bundle1",
        version: "1.0.0",
        online: 0,
      };

      chai
        .request(app)
        .post("/admin/bundles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newBundle)
        .end((err, res) => {
          expect(res).to.have.status(201);
          bundleId = res.body.id; // 保存新增Bundle的ID
          done();
        });
    });

    it("should update a bundle", (done) => {
      const updatedBundle = {
        url: "test.bundle2",
        version: "2.0.0",
        online: 1,
      };

      chai
        .request(app)
        .put(`/admin/bundles/${bundleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedBundle)
        .end((err, res) => {
          expect(res).to.have.status(200);

          // 验证修改是否生效
          Bundle.findById(bundleId, (err, bundle) => {
            expect(bundle.url).to.equal(updatedBundle.url);
            expect(bundle.version).to.equal(updatedBundle.version);
            expect(bundle.online).to.equal(updatedBundle.online);
            done();
          });
        });
    });
  });
});
