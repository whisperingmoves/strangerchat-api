const uploadPosts = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '请选择文件上传' });
        }

        const image = req.file;
        const fileName = image.filename;

        // 保存图片到本地或者其他处理逻辑
        // const targetPath = path.join(config.imageUploadPath, fileName);
        // image.mv(targetPath);

        const url = '/uploads/posts/' + fileName;

        res.json({ url });

    } catch (err) {
        next(err); // 将错误传递给下一个中间件或错误处理中间件进行处理
    }
};

module.exports = {
    uploadPosts
}
