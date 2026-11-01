const Post = require("../../Database/Models/Post");

const Quote = require("../../Database/Models/Quote");
const QuoteRetweet = require("../../Database/Models/QuoteRetweet");

const createQuote = async (req, res) => {
  const { postId, body } = req.body;

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
      userQuote: req.userId,
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
    if (!quoteId) {
      throw new Error("Invalid ID");
    }
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (String(quote.userQuote) !== req.userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await QuoteRetweet.deleteMany({ quoteIdDelete: quoteId });

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
