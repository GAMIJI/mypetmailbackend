const generateOtp = async (length) => {
  const otp = Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();
  return otp;
};

export default generateOtp;