const config = require("../config");
const mongoose = require("mongoose");
const CoinProduct = require("../models/CoinProduct");

const coinProducts = [
  {
    coins: 36,
    price: 6,
    currency: "USD",
  },
  {
    coins: 216,
    originalPrice: 36,
    price: 32,
    currency: "USD",
  },
  {
    coins: 108,
    price: 18,
    currency: "USD",
  },
  {
    coins: 576,
    originalPrice: 96,
    price: 80,
    currency: "USD",
  },
  {
    coins: 2500,
    originalPrice: 330,
    price: 330,
    currency: "USD",
  },
  {
    coins: 5500,
    originalPrice: 916,
    price: 670,
    currency: "USD",
  },
  {
    coins: 25000,
    originalPrice: 4166,
    price: 3970,
    currency: "USD",
  },
];

const generateCoinProducts = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建金币商品记录
    for (let i = 0; i < coinProducts.length; i++) {
      const coinProduct = new CoinProduct({
        coins: coinProducts[i].coins,
        price: coinProducts[i].price,
        currency: coinProducts[i].currency,
      });
      if (coinProducts[i].originalPrice) {
        coinProduct.originalPrice = coinProducts[i].originalPrice;
      }
      await coinProduct.save();
    }

    // 断开数据库连接
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error generating coinProducts:", error);
    throw error;
  }
};

generateCoinProducts()
  .then(() => {
    console.log("CoinProducts created successfully!");
  })
  .catch((error) => {
    console.error("Failed to generate coinProducts:", error);
  });
