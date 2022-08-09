const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwttoken");
const sendEmail = require("../utils/sendEmail")
const crtpto = require("crypto");



// Register a User

exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "This is a sample id",
      url: "profilepicurl",
    },
  });

  sendToken(user, 201, res);
});

// Login User

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // checing if user have given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout User

exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // get reset password token

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});


// Reset Password

exports.resetPassword = catchAsyncError(async (req, res, next) => {

  // creating token hash
  const resetPasswordToken = crtpto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire:{$gt:Date.now()}
    });

    if (!user) {
      return next(new ErrorHandler("Reset password token is invalid or has been expired", 400));
    }

    if(req.body.password!==req.body.confirmPassword){
      return next(new ErrorHandler("Password didn't match with confirm password", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
});  


// Get User Details

exports.getUserDetails = catchAsyncError(async(req,res,next)=>{

  const user = await User.findById(req.user.id);

  res.status(200).json({
    success:true,
    user
  });
});


// Update User Password

exports.updatePassword = catchAsyncError(async(req,res,next)=>{

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if(!isPasswordMatched){
    return next(new ErrorHandler("Old Password is incorrect",400));
  }   

  if(req.body.newPassword !== req.body.confirmPassword){
    return next(new ErrorHandler("Password doesn't Matched", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user,200,res);

  res.status(200).json({
    success:true,
    user
  });
});


// Update User Profile

exports.updateProfile = catchAsyncError(async(req,res,next)=>{

  const newUserData={
    name:req.body.name,
    email:req.body.email
  }

  // we will add cloudinary later 

  const user = User.findOneAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
  });

  res.status(200).json({
    success:true,
  });
  
});


// Get all Users

exports.getAllUsers = catchAsyncError(async(req,res,next)=>{
  
  const users = await User.find();

  res.status(200).json({
    success:true,
    users
  })
});


// Get Single Users (Admin)

exports.getSingleUser = catchAsyncError(async(req,res,next)=>{
  
  const user = await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`User not exsist with id: ${req.params.id}`));
  }

  res.status(200).json({
    success:true,
    user
  })
});



// Update User Role --Admin

exports.updateUserRole = catchAsyncError(async(req,res,next)=>{

  const newUserData={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role
  }

  // we will add cloudinary later

  const user = await User.findOneAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
  });

  res.status(200).json({
    success:true,
  });
  
});



// Delete User --Admin

exports.deleteUser = catchAsyncError(async(req,res,next)=>{

  // we will remove cloudinary later
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User not exsist with id: ${req.params.id}`));
  }

  await user.remove();
  res.status(200).json({
    success:true,
  });
  
});


