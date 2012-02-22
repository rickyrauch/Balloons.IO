
/*
 * Restrict paths
 */

exports.restrict = function(req, res, next){
  req.authenticate(['oauth'], function(error, authenticated){ 
    if(authenticated){
      next();
    }
    else{
      res.redirect('/');
    }
  });
};
