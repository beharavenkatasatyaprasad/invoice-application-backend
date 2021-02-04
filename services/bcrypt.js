const bcrypt = require('bcryptjs');

async function compareHash(pwd, DBpwd) {
    const match = await bcrypt.compare(pwd, DBpwd);
    if(match) {
        return true;
    }
    else{
        return false;
    }
}

async function generateHash(password) {
    let saltRounds = await bcrypt.genSalt(10);
    let hashedPwd = await bcrypt.hash(password, saltRounds)
    return hashedPwd;
}

exports.compareHash = compareHash;
exports.generateHash = generateHash;


// let hash  = await generateHash(myPlaintextPassword)
// console.log(hash)
// let matched = await compareHash(myPlaintextPassword,'$2a$10$Go/YbGbWxFASa1KMTWsOM.07BWF0oIyNKYbXLHQTvDg4Nm68oFpDK')
// console.log(matched)