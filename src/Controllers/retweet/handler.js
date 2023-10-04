const Post = require("../../Database/Models/Post");
const Quote = require("../../Database/Models/Quote");
const QuoteRetweet = require("../../Database/Models/QuoteRetweet");
const Retweet = require("../../Database/Models/Retweet");

const retweetPost = async (req, res) => {
  const { postId, userRetweet } = req.body;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json("Post doesnot exist");
    }
    const retweet = new Retweet({
      postId,
      userRetweet,
      postIdDelete: postId,
    });

    await retweet.save();

    post.retweets.push(userRetweet);
    await post.save();

    res.status(200).json(retweet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

const deleteRetweet = async (req, res) => {
  const { postId, userRetweet } = req.query;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const postRetweet = await Post.findById(postId);

    if (!postRetweet) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedRetweetIds = postRetweet.retweets.filter(
      (retweet) => retweet.toString() !== userRetweet
    );

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { retweets: updatedRetweetIds },
      { new: true }
    );

    // Remove notification logic goes here if needed

    if (!updatedPost) {
      res.status(400).json("Error updating post");
    }
    const deleteRetweet = await Retweet.deleteOne({
      postId: postId,
      userRetweet: userRetweet,
    });

    res.status(200).json("Retweet Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

const retweetQuote = async (req, res) => {
  const { postId, userQuoteRetweet } = req.body;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const quote = await Quote.findById(postId);
    if (!quote) {
      return res.status(400).json("Quote doesnot exist");
    }
    const retweet = new QuoteRetweet({
      quoteId:postId,
      userQuoteRetweet,
      quoteIdDelete: postId,
    });

    await retweet.save();

    quote.retweets.push(userQuoteRetweet);
    await quote.save();

    res.status(200).json(retweet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

const deleteRetweetQuote = async (req, res) => {
  const { postId, userQuoteRetweet } = req.query;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const quoteRetweet = await Quote.findById(postId);
    if (!quoteRetweet) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const updatedRetweetIds = quoteRetweet.retweets.filter(
      (retweet) => retweet.toString() !== userQuoteRetweet
    );

    const updatedQuote = await Quote.findByIdAndUpdate(
      postId,
      { retweets: updatedRetweetIds },
      { new: true }
    );

    // Remove notification logic goes here if needed

    if (!updatedQuote) {
      res.status(400).json("Error updating Quote");
    }
    const deleteRetweet = await QuoteRetweet.deleteOne({
      postId: postId,
      userQuoteRetweet: userQuoteRetweet,
    });

    res.status(200).json("Quote Retweet Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

module.exports = {
  retweetPost,
  deleteRetweet,
  retweetQuote,
  deleteRetweetQuote,
};
