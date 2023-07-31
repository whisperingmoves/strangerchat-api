const Verification = require('../models/Verification');
const { generateVerifyCode, jwtSecret } = require('../config');
const User = require('../models/User')
const jwt = require("jsonwebtoken");

const sendVerificationCode = async (req, res) => {
    const mobile = req.body.mobile;

    // 检查手机号格式是否正确
    if (!mobile) return res.status(400).json({message: '手机号格式错误'});

    // 生成验证码
    const code = generateVerifyCode();

    // 保存验证码
    await Verification.create({ mobile, code });

    if (process.env.NODE_ENV === 'test') {
        // 测试环境
        res.json({
            code // 返回生成的验证码
        });
    } else {
        // 发送验证码到手机上
        sendMessage(mobile, code);

        res.sendStatus(200);
    }
}

const verifyVerificationCode = async (req, res) => {
    const { mobile, code, longitude, latitude } = req.body;

    // 校验验证码
    const verification = await Verification.findOne({ mobile, code });
    if (!verification) return res.status(400).json({ message: '验证码错误' });

    // 获取用户信息
    const user = await User.findOne({ mobile });

    if (user) {
        // 用户存在
        const token = jwt.sign({ userId: user.id }, jwtSecret);

        // 保存地理位置
        if (longitude && latitude) {
            user.location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
            await user.save();
        }

        // 返回响应
        res.json({ token, ...user.toObject(), userId: user.id });
    } else {
        // 用户不存在
        res.status(201).json({});
    }
}

function checkMobile(mobile) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(mobile);
}

function sendMessage(mobile, code) {
    console.log('向' + mobile + '发送短信验证码' + code);
}

module.exports = { sendVerificationCode, verifyVerificationCode };
