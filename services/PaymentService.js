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

const PaymentService = {
  verifyReceipt: async (receipt) => {
    console.debug("verifyReceipt", receipt);
    // 这里假设 receipt 是有效的，直接返回一个随机生成的交易信息对象
    const amount = Math.floor(Math.random() * 100) + 1;
    const currency = "USD";
    const paymentMethod = "支付宝";
    const transactionId = Math.random().toString(36).substr(2, 10);
    return { amount, currency, paymentMethod, transactionId };
  },
};

module.exports = PaymentService;
