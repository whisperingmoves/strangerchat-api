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

const ErrorMonitor = require("../../models/ErrorMonitor");

const getErrorMonitorList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order || "desc";
    const projectName = req.query.projectName || "";
    const appVersion = req.query.appVersion || "";
    const keyword = req.query.keyword || "";

    const query = {};

    if (projectName) {
      query.projectName = projectName;
    }

    if (appVersion) {
      query.appVersion = appVersion;
    }

    if (keyword) {
      query.$or = [
        { errorMessage: { $regex: keyword, $options: "i" } },
        { stackTrace: { $regex: keyword, $options: "i" } },
      ];
    }

    let totalCount = await ErrorMonitor.countDocuments(query);

    let errorMonitors = await ErrorMonitor.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(pageSize)
      .lean();

    errorMonitors = errorMonitors.map((errorMonitor) => ({
      id: errorMonitor._id,
      projectName: errorMonitor.projectName,
      errorMessage: errorMonitor.errorMessage,
      stackTrace: errorMonitor.stackTrace,
      createdAt: errorMonitor.createdAt,
      appVersion: errorMonitor.appVersion,
      ipAddress: errorMonitor.ipAddress,
      runtimeName: errorMonitor.runtimeName,
      runtimeVersion: errorMonitor.runtimeVersion,
      appStartTime: errorMonitor.appStartTime,
      appMemory: errorMonitor.appMemory,
      browserName: errorMonitor.browserName,
      browserVersion: errorMonitor.browserVersion,
      locale: errorMonitor.locale,
      timezone: errorMonitor.timezone,
      operatingSystemName: errorMonitor.operatingSystemName,
      operatingSystemVersion: errorMonitor.operatingSystemVersion,
      occurredFile: errorMonitor.occurredFile,
      occurredLine: errorMonitor.occurredLine,
      occurredFunction: errorMonitor.occurredFunction,
    }));

    const response = {
      page,
      pageSize,
      total: totalCount,
      items: errorMonitors,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getErrorMonitorList,
};
