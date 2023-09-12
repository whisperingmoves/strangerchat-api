const GiftHistory = require("../models/GiftHistory");
const GiftNotification = require("../models/GiftNotification");
const pushUnreadNotificationsCount = require("../sockets/pushUnreadNotificationsCount");
const pushCoinBalance = require("../sockets/pushCoinBalance");

const sendGift = async (
  sender,
  receiver,
  gift,
  quantity,
  io,
  userIdSocketMap
) => {
  // 创建礼物历史记录
  const giftHistory = new GiftHistory({
    sender: sender.id,
    receiver: receiver.id,
    gift: gift.id,
    quantity: quantity,
  });
  await giftHistory.save();

  // 更新赠送礼物的用户的金币余额
  sender.coinBalance -= gift.value * quantity;
  await sender.save();

  // 更新接收礼物的用户的礼物统计信息
  receiver.giftsReceived += quantity;
  await receiver.save();

  // 创建礼物类通知
  const notification = new GiftNotification({
    toUser: receiver.id,
    user: sender.id,
    giftQuantity: quantity,
    giftName: gift.name,
  });
  await notification.save();

  await pushUnreadNotificationsCount(io, userIdSocketMap, receiver.id);

  // 推送用户金币余额
  pushCoinBalance(io, userIdSocketMap, sender.id, sender.coinBalance).then();
};

module.exports = {
  sendGift,
};
