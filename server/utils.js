const isServicer = (url) => {
  const params = new URLSearchParams(url.split("?")?.[1]);
  const isServicer = params.get("isClient");
  return isServicer === "true";
};

module.exports = {
  isServicer,
};
