const generateMessage = (username, message) => {
  return {
    username,
    message,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
};
