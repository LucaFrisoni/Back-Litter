const Post = require("../../Database/Models/Post");
const Retweet = require("../../Database/Models/Retweet");
const Quote = require("../../Database/Models/Quote");

const createQuote = async (req, res) => {
  const { postId, userQuote, body } = req.body;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json("Post doesnot exist");
    }
    const quote = new Quote({
      body,
      postId,
      userQuote,
      postIdDelete: postId,
    });

    await quote.save();

    res.status(200).json(quote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error Creating Quote" });
  }
};
const deleteQuote = async (req, res) => {
  const { quoteId } = req.query;

  try {
    const deleteQuote = await Quote.deleteOne({
      _id: quoteId,
    });

    res.status(200).json("Quote Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

module.exports = { createQuote, deleteQuote };
