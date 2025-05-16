export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
    let message = "Something went wrong";
  
    switch (statusCode) {
      case 400:
        message = err.message || "Bad Request";
        break;
      case 401:
        message = err.message || "Unauthorized";
        break;
      case 403:
        message = err.message || "Forbidden";
        break;
      case 404:
        message = err.message || "Not Found";
        break;
      case 409:
        message = err.message || "Conflict";
        break;
      case 500:
      default:
        message = err.message || "Internal Server Error";
        break;
    }
  
    res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  };
  