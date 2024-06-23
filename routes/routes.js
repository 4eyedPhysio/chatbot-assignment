const {Router} = require(`express`);// to bring out the router function from express

// now we have to name our routes and assign it to the router
const routes = Router();

routes.get(`/`, (req,res)=>{
  res.render(`index`)
});


module.exports= routes;


