const validator=require('validator');
const validate=(data)=>{
const mandatoryField=['firstName','lastName','email','password'];
 const IsAllowed=mandatoryField.every((k)=>Object.keys(data).includes(k));
    if(!IsAllowed)
        throw new Error("Some Field Missing");
    //email validate
     if(!validator.isEmail(data.email))
        throw new Error("Invaild Email");
    //password validate
    if(!validator.isStrongPassword(data.password))
        throw new Error("Week Password");
    //minimum-maximum length validate
      if (data.firstName.length < 2 || data.firstName.length > 50) {
    throw new Error("First name length must be between 2 and 50");
  }

  if (data.lastName.length < 2 || data.lastName.length > 50) {
    throw new Error("Last name length must be between 2 and 50");
  }

}
module.exports=validate;