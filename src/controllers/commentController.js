const db = require("../models");

const commentController = {
    async getComments(req, res) {
        const comments = await db.Comment.findAll({
            where: { courseId: req.params.courseId },
            include: [{ model: db.User, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: comments });
    },

    async createComment(req, res) {
        const comment = await db.Comment.create({
            content: req.body.content,
            userId: req.user.id,
            courseId: req.params.courseId
        });
        res.json({ success: true, data: comment });
    }
};

module.exports = commentController;