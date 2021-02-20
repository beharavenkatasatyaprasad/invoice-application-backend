const jwt = require('jsonwebtoken');

async function encodeToken(email) {
    let token = jwt.sign({
        email: email
    },
    'bhargavsecret', {
        expiresIn: '365d'
    }); 
    return token;
}

async function encodeData(email,endpoint) {
    let token = jwt.sign({
        email: email,
        endpoint: endpoint
    },
    'bhargavsecret', {
        expiresIn: '365d'
    }); 
    return token;
}

async function decodeToken(token) {
    let decoded = jwt.verify(token,'bhargavsecret');
    if(decoded){
        return decoded;
    }else{
        return false;
    }
}

exports.encodeToken = encodeToken;
exports.decodeToken = decodeToken;
exports.encodeData = encodeData;

// let email = 'xyz@gmail.com'
// let token =await encodeToken(email)
// console.log(token);
// let decoded = await decodeToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdHlhcHJhc2FkYmVoYXJhQGdtYWlsLmNvbSIsImlhdCI6MTYxMjQ1ODc0MywiZXhwIjoxNjEyNDYyMzQzfQ.VUXe6TAbJdjVy6tSvqP5PLz5p9PxjfUWMCXkcsFo0go')
// console.log(decoded);