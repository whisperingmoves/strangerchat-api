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

const CoinProduct = require("../../models/CoinProduct");

const createCoinProduct = async (req, res, next) => {
  try {
    const { coins, originalPrice, price, currency } = req.body;

    const coinProduct = await CoinProduct.create({
      coins,
      originalPrice,
      price,
      currency,
    });

    res.status(201).json({ id: coinProduct.id });
  } catch (error) {
    next(error);
  }
};

const deleteCoinProducts = async (req, res, next) => {
  try {
    const { ids } = req.query;

    await CoinProduct.deleteMany({ _id: { $in: ids } });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const getCoinProductList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * pageSize;

    const sortQuery = {};
    sortQuery[sort] = order === "asc" ? 1 : -1;

    const [total, coinProducts] = await Promise.all([
      CoinProduct.countDocuments(),
      CoinProduct.find()
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select("-__v")
        .lean(),
    ]);

    const formattedCoinProducts = coinProducts.map((coinProduct) => ({
      id: coinProduct.id,
      coins: coinProduct.coins,
      originalPrice: coinProduct.originalPrice,
      price: coinProduct.price,
      currency: coinProduct.currency,
      createdAt: coinProduct.createdAt,
      updatedAt: coinProduct.updatedAt,
    }));

    res.status(200).json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      items: formattedCoinProducts,
    });
  } catch (error) {
    next(error);
  }
};

const updateCoinProduct = async (req, res, next) => {
  try {
    const { coins, originalPrice, price, currency } = req.body;
    const { productId } = req.params;

    const product = await CoinProduct.findByIdAndUpdate(
      productId,
      { coins, originalPrice, price, currency, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "金币商品不存在" });
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoinProduct,
  deleteCoinProducts,
  getCoinProductList,
  updateCoinProduct,
};
