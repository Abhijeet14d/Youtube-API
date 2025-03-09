const jwt = require('jsonwebtoken');

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token){
            return res.status(401).json({msg: 'Unauthorized access'});
        }

        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedUser;
        next();
    } catch (error) {
        res.status(500).json({msg: 'Unauthorized access', error: error.message});
    }
};

module.exports = checkAuth;