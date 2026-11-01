// Fields of a user that are safe and sufficient to show next to a tweet or comment.
const PUBLIC_USER_FIELDS = "name username profileImage";

// What anyone can see on a profile
const PROFILE_FIELDS =
  "name username bio profileImage coverImage createdAt followingIds posts";

// What a user can see about their own account
const ACCOUNT_FIELDS = "-hashedPassword";

module.exports = { PUBLIC_USER_FIELDS, PROFILE_FIELDS, ACCOUNT_FIELDS };
