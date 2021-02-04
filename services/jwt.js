const jwt = require('jsonwebtoken');

async function encodeToken(email) {
    let token = jwt.sign({
        email: email
    },
    'satyasecret', {
        expiresIn: "1h",
    }); 
    return token;
}

async function decodeToken(token) {
    let decoded = jwt.verify(token,'satyasecret');
    if(decoded){
        return decoded;
    }else{
        return false;
    }
}

exports.encodeToken = encodeToken;
exports.decodeToken = decodeToken;

// let email = 'xyz@gmail.com'
// let token =await encodeToken(email)
// console.log(token);
// let decoded = await decodeToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdHlhcHJhc2FkYmVoYXJhQGdtYWlsLmNvbSIsImlhdCI6MTYxMjQ1ODc0MywiZXhwIjoxNjEyNDYyMzQzfQ.VUXe6TAbJdjVy6tSvqP5PLz5p9PxjfUWMCXkcsFo0go')
// console.log(decoded);