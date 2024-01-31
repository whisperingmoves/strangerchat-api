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
const { it, beforeEach, describe } = require("mocha");
const app = require("../../app");
const rateLimiterMiddleware = require("../../middlewares/rateLimiter"); // 导入中间件

chai.use(chaiHttp);
chai.should();

describe("Rate Limiter Middleware", () => {
  beforeEach(async () => {
    // 在每个测试之前重置速率限制器状态
    // 这可以确保每个测试都从一个干净的状态开始
    // 以避免前一个测试的状态干扰当前测试
    rateLimiterMiddleware.reset(); // 直接调用中间件的 reset 方法
  });

  describe("GET /health", () => {
    it("should allow access when rate limit is not exceeded", (done) => {
      chai
        .request(app)
        .get("/health")
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should return 429 when rate limit is exceeded", (done) => {
      for (let i = 0; i < 10; i++) {
        chai
          .request(app)
          .get("/health")
          .end((err, res) => {
            res.should.have.status(200);
          });
      }

      // 第 11 个请求将超过速率限制
      chai
        .request(app)
        .get("/health")
        .end((err, res) => {
          res.should.have.status(429);
          done();
        });
    });
  });
});
