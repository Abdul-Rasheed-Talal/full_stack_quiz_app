import express from 'express'
import 'dotenv/config';

const app = express()
const port = process.env.port
console.log(port);


app.get('/' , (req , res)=>{
    res.send('server running')
});

app.listen(port , ()=>{
    console.log(`Listening on port ${port}`);
})
