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

const { expect } = require("chai");
const { it, describe } = require("mocha");
const ErrorMonitoringService = require("../../services/ErrorMonitorService");
const ErrorMonitor = require("../../models/ErrorMonitor");

describe("ErrorMonitoringService", () => {
  describe("monitorError", () => {
    it("should create an error log and save it to the database", async () => {
      const service = new ErrorMonitoringService();
      const error = new Error("Test error");

      const appStartTime = new Date();
      service.setAppStartTime(appStartTime);

      await service.monitorError(error);

      const savedError = await ErrorMonitor.findOne({
        errorMessage: "Test error",
      }).sort({ createdAt: -1 });

      expect(savedError).to.exist;
      expect(savedError.projectName).to.be.a("string");
      expect(savedError.appVersion).to.be.a("string");
      expect(savedError.errorMessage).to.equal("Test error");
      expect(savedError.stackTrace).to.equal(error.stack);
      expect(savedError.ipAddress).to.be.a("string");
      expect(savedError.runtimeName).to.be.a("string");
      expect(savedError.runtimeVersion).to.be.a("string");
      expect(savedError.appStartTime).to.eql(appStartTime);
      expect(savedError.appMemory).to.be.a("number");
      expect(savedError.browserName).to.be.a("string");
      expect(savedError.browserVersion).to.be.a("string");
      expect(savedError.locale).to.be.a("string");
      expect(savedError.timezone).to.be.a("string");
      expect(savedError.operatingSystemName).to.be.a("string");
      expect(savedError.operatingSystemVersion).to.be.a("string");
      expect(savedError.occurredFile).to.be.a("string");
      expect(savedError.occurredLine).to.be.a("number");
      expect(savedError.occurredFunction).to.be.a("string");
    });
  });
});
