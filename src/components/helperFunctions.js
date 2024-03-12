const paramsCheck = (list, req) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i] in req === false) {
      return `${list[i]} is required...`;
    }
  }
  for (let i = 0; i < list.length; i++) {
    if (req[list[i]] === "") {
      return `${list[i]} cannot be empty...`;
    }
  }
  return true;
};

module.exports = paramsCheck;
