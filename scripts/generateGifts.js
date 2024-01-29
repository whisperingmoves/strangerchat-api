const config = require("../config");
const mongoose = require("mongoose");
const Gift = require("../models/Gift");

const gifts = [
  {
    image: "public/gifts/rose.png",
    name: "rose",
    value: 1,
  },
  {
    image: "public/gifts/heart_cake.png",
    name: "heart cake",
    value: 10,
  },
  {
    image: "public/gifts/heart_balloon.png",
    name: "heart balloon",
    value: 15,
  },
  {
    image: "public/gifts/birthday_cake.png",
    name: "birthday cake",
    value: 20,
  },
  {
    image: "public/gifts/gift_pack.png",
    name: "gift pack",
    value: 20,
  },
  {
    image: "public/gifts/jasmine.png",
    name: "jasmine",
    value: 25,
  },
  {
    image: "public/gifts/puppy.png",
    name: "puppy",
    value: 30,
  },
  {
    image: "public/gifts/gold_ring.png",
    name: "gold ring",
    value: 100,
  },
];

const generateGifts = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建礼物记录
    for (let i = 0; i < gifts.length; i++) {
      const gift = new Gift({
        image: gifts[i].image,
        name: gifts[i].name,
        value: gifts[i].value,
      });
      await gift.save();
    }

    // 断开数据库连接
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error generating gifts:", error);
    throw error;
  }
};

generateGifts()
  .then(() => {
    console.log("Gifts created successfully!");
  })
  .catch((error) => {
    console.error("Failed to generate gifts:", error);
  });
