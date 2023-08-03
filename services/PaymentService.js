const PaymentService = {
    verifyReceipt: async (receipt) => {
        // 这里假设 receipt 是有效的，直接返回一个随机生成的交易信息对象
        const amount = Math.floor(Math.random() * 100) + 1;
        const currency = 'USD';
        const paymentMethod = '支付宝';
        const transactionId = Math.random().toString(36).substr(2, 10);
        return { amount, currency, paymentMethod, transactionId };
    },
};

module.exports = PaymentService;
